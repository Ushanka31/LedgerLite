import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { invoices, invoiceItems, customers, journalEntries, journalLines, accounts, companies } from '@/app/lib/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';

export async function POST(request) {
  try {
    const user = await requireAuth();
    
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Company setup required' },
        { status: 400 }
      );
    }

    const { customerName, dueDate, notes, items, subtotal, vatAmount, totalAmount, invoiceDate } = await request.json();

    if (!customerName || !dueDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer name, due date, and items are required' },
        { status: 400 }
      );
    }

    // Find or create customer
    let customerRecord = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.companyId, user.companyId),
          eq(customers.name, customerName)
        )
      )
      .limit(1);

    if (customerRecord.length === 0) {
      // Create new customer
      const [newCustomer] = await db
        .insert(customers)
        .values({
          companyId: user.companyId,
          name: customerName,
        })
        .returning();
      customerRecord = [newCustomer];
    }

    // Generate invoice number with company prefix
    // First, get the company name for the prefix
    const [company] = await db
      .select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, user.companyId))
      .limit(1);
    
    // Generate company prefix (first 3 letters, uppercase)
    const companyPrefix = company?.name
      ? company.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase()
      : 'INV'; // Fallback to INV if no company name
    
    const existingInvoices = await db
      .select({ invoiceNumber: invoices.invoiceNumber })
      .from(invoices)
      .where(eq(invoices.companyId, user.companyId))
      .orderBy(desc(invoices.createdAt))
      .limit(1);

    let invoiceNumber;
    if (existingInvoices.length > 0) {
      // Extract number from existing invoice (works with both old INV- and new company prefixes)
      const lastInvoiceNumber = existingInvoices[0].invoiceNumber;
      const numberPart = lastInvoiceNumber.split('-')[1] || '0';
      const lastNumber = parseInt(numberPart);
      invoiceNumber = `${companyPrefix}-${String(lastNumber + 1).padStart(4, '0')}`;
    } else {
      invoiceNumber = `${companyPrefix}-0001`;
    }

    // Create invoice
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        companyId: user.companyId,
        customerId: customerRecord[0].id,
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        status: 'draft',
        subtotal: subtotal.toString(),
        vatAmount: vatAmount.toString(),
        totalAmount: totalAmount.toString(),
        notes,
        createdBy: user.id,
      })
      .returning();

    // Create invoice items
    const invoiceItemsData = items.map(item => ({
      invoiceId: newInvoice.id,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      vatRate: '7.5', // Nigeria standard VAT rate
      amount: (item.quantity * item.unitPrice).toString(),
    }));

    await db.insert(invoiceItems).values(invoiceItemsData);

    // Create accounting entries (A/R only - revenue recorded when paid)
    const companyAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.companyId, user.companyId));

    let accountsReceivable = companyAccounts.find(acc => 
      acc.type === 'asset' && (acc.category === 'receivable' || acc.name.toLowerCase().includes('receivable'))
    );
    let deferredRevenueAccount = companyAccounts.find(acc => 
      acc.category === 'deferred_revenue' || acc.name.toLowerCase().includes('deferred revenue')
    );
    let vatPayableAccount = companyAccounts.find(acc => 
      acc.category === 'vat_payable' || acc.name.toLowerCase().includes('vat payable')
    );

    // Create default accounts if they don't exist
    if (!accountsReceivable) {
      const [newAccount] = await db
        .insert(accounts)
        .values({
          companyId: user.companyId,
          code: '1200',
          name: 'Accounts Receivable',
          type: 'asset',
          category: 'receivable',
        })
        .returning();
      accountsReceivable = newAccount;
    }

    if (!deferredRevenueAccount) {
      const [newAccount] = await db
        .insert(accounts)
        .values({
          companyId: user.companyId,
          code: '2400',
          name: 'Deferred Revenue',
          type: 'liability',
          category: 'deferred_revenue',
        })
        .returning();
      deferredRevenueAccount = newAccount;
    }

    if (!vatPayableAccount) {
      const [newAccount] = await db
        .insert(accounts)
        .values({
          companyId: user.companyId,
          code: '2300',
          name: 'VAT Payable',
          type: 'liability',
          category: 'vat_payable',
        })
        .returning();
      vatPayableAccount = newAccount;
    }

    // Create journal entry for invoice (A/R only - no revenue yet)
    const reference = `${invoiceNumber}`;
    const [journalEntry] = await db
      .insert(journalEntries)
      .values({
        companyId: user.companyId,
        entryDate: new Date(invoiceDate),
        reference,
        narration: `Invoice ${invoiceNumber} for ${customerName} (A/R only)`,
        createdBy: user.id,
        status: 'posted',
      })
      .returning();

    // Create journal lines (A/R and Deferred Revenue only)
    await db.insert(journalLines).values([
      {
        journalEntryId: journalEntry.id,
        accountId: accountsReceivable.id,
        debit: totalAmount.toString(),
        credit: '0',
        description: `A/R for invoice ${invoiceNumber}`,
      },
      {
        journalEntryId: journalEntry.id,
        accountId: deferredRevenueAccount.id,
        debit: '0',
        credit: subtotal.toString(),
        description: `Deferred revenue from ${customerName} (invoice ${invoiceNumber})`,
      },
      {
        journalEntryId: journalEntry.id,
        accountId: vatPayableAccount.id,
        debit: '0',
        credit: vatAmount.toString(),
        description: `VAT on invoice ${invoiceNumber}`,
      },
    ]);

    return NextResponse.json({
      success: true,
      message: 'Invoice created successfully',
      invoice: {
        id: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        customerName,
        totalAmount,
        status: newInvoice.status,
        invoiceDate: newInvoice.invoiceDate,
        dueDate: newInvoice.dueDate,
      },
    });
  } catch (error) {
    console.error('Invoice creation error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

// GET invoices for dashboard
export async function GET(request) {
  try {
    const user = await requireAuth();
    
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Company setup required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query conditions
    let whereCondition = eq(invoices.companyId, user.companyId);
    if (status) {
      whereCondition = and(whereCondition, eq(invoices.status, status));
    }

    // Query invoices with customer data
    const invoiceList = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        subtotal: invoices.subtotal,
        vatAmount: invoices.vatAmount,
        totalAmount: invoices.totalAmount,
        paidAmount: invoices.paidAmount,
        customerName: customers.name,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(whereCondition)
      .orderBy(desc(invoices.createdAt))
      .limit(limit);

    // Calculate outstanding invoices total (sent invoices only for monetary value)
    const outstandingInvoices = await db
      .select({
        totalAmount: invoices.totalAmount,
        paidAmount: invoices.paidAmount,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, user.companyId),
          eq(invoices.status, 'sent')
        )
      );

    const outstandingTotal = outstandingInvoices.reduce((sum, invoice) => {
      const total = parseFloat(invoice.totalAmount);
      const paid = parseFloat(invoice.paidAmount);
      return sum + (total - paid);
    }, 0);

    // Get total invoice count for dashboard
    const totalInvoicesCount = await db
      .select({
        count: invoices.id,
      })
      .from(invoices)
      .where(eq(invoices.companyId, user.companyId));

    // Get outstanding invoices count (draft + sent)
    const outstandingInvoicesCount = await db
      .select({
        count: invoices.id,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, user.companyId),
          or(
            eq(invoices.status, 'draft'),
            eq(invoices.status, 'sent')
          )
        )
      );

    return NextResponse.json({
      success: true,
      invoices: invoiceList,
      outstandingTotal,
      totalInvoices: totalInvoicesCount.length,
      outstandingInvoicesCount: outstandingInvoicesCount.length,
      total: invoiceList.length,
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
} 