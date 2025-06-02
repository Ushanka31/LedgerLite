import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { db } from '@/app/lib/db';
import { invoices, invoiceItems, customers, journalEntries, journalLines, accounts } from '@/app/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET single invoice
export async function GET(request, { params }) {
  try {
    const user = await requireAuth();
    
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Company setup required' },
        { status: 400 }
      );
    }

    const { id } = params;

    // Query invoice with customer data and items
    const [invoice] = await db
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
        notes: invoices.notes,
        customerName: customers.name,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(
        and(
          eq(invoices.id, id),
          eq(invoices.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Get invoice items
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    return NextResponse.json({
      success: true,
      invoice: {
        ...invoice,
        items
      }
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

// PATCH update invoice (mainly for status changes)
export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth();
    
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Company setup required' },
        { status: 400 }
      );
    }

    const { id } = params;
    const { status, notes } = await request.json();

    // Validate status
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if invoice exists and belongs to user's company
    const [existingInvoice] = await db
      .select({
        id: invoices.id,
        status: invoices.status,
        invoiceNumber: invoices.invoiceNumber,
        invoiceDate: invoices.invoiceDate,
        subtotal: invoices.subtotal,
        vatAmount: invoices.vatAmount,
        totalAmount: invoices.totalAmount,
        customerId: invoices.customerId,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.id, id),
          eq(invoices.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Special handling for payment - record revenue when marked as paid
    if (status === 'paid' && existingInvoice.status !== 'paid') {
      // Get customer name for journal entries
      const [customer] = await db
        .select({ name: customers.name })
        .from(customers)
        .where(eq(customers.id, existingInvoice.customerId))
        .limit(1);

      const customerName = customer?.name || 'Customer';

      // Set paid amount to total amount when marked as paid
      updateData.paidAmount = existingInvoice.totalAmount;

      // Create revenue recognition journal entries
      const companyAccounts = await db
        .select()
        .from(accounts)
        .where(eq(accounts.companyId, user.companyId));

      // Find required accounts
      let cashAccount = companyAccounts.find(acc => 
        acc.type === 'asset' && (acc.category === 'cash' || acc.name.toLowerCase().includes('cash'))
      );
      let accountsReceivable = companyAccounts.find(acc => 
        acc.type === 'asset' && (acc.category === 'receivable' || acc.name.toLowerCase().includes('receivable'))
      );
      let salesAccount = companyAccounts.find(acc => 
        acc.category === 'sales' || acc.name.toLowerCase().includes('sales')
      );
      let deferredRevenueAccount = companyAccounts.find(acc => 
        acc.category === 'deferred_revenue' || acc.name.toLowerCase().includes('deferred revenue')
      );

      // Create default accounts if they don't exist
      if (!cashAccount) {
        const [newAccount] = await db
          .insert(accounts)
          .values({
            companyId: user.companyId,
            code: '1100',
            name: 'Cash',
            type: 'asset',
            category: 'cash',
          })
          .returning();
        cashAccount = newAccount;
      }

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

      if (!salesAccount) {
        const [newAccount] = await db
          .insert(accounts)
          .values({
            companyId: user.companyId,
            code: '4001',
            name: 'Sales Revenue',
            type: 'revenue',
            category: 'sales',
          })
          .returning();
        salesAccount = newAccount;
      }

      // Create journal entry for payment receipt and revenue recognition
      const [paymentJournalEntry] = await db
        .insert(journalEntries)
        .values({
          companyId: user.companyId,
          entryDate: new Date(existingInvoice.invoiceDate),
          reference: `PAY-${existingInvoice.invoiceNumber}`,
          narration: `Payment received for invoice ${existingInvoice.invoiceNumber} from ${customerName}`,
          createdBy: user.id,
          status: 'posted',
        })
        .returning();

      // Create journal lines for payment and revenue recognition
      const journalLinesData = [
        // Cash received (debit)
        {
          journalEntryId: paymentJournalEntry.id,
          accountId: cashAccount.id,
          debit: existingInvoice.totalAmount,
          credit: '0',
          description: `Cash received for invoice ${existingInvoice.invoiceNumber}`,
        },
        // Clear A/R (credit)
        {
          journalEntryId: paymentJournalEntry.id,
          accountId: accountsReceivable.id,
          debit: '0',
          credit: existingInvoice.totalAmount,
          description: `Clear A/R for invoice ${existingInvoice.invoiceNumber}`,
        },
      ];

      // If we have deferred revenue, convert it to actual revenue
      if (deferredRevenueAccount) {
        journalLinesData.push(
          // Clear deferred revenue (debit)
          {
            journalEntryId: paymentJournalEntry.id,
            accountId: deferredRevenueAccount.id,
            debit: existingInvoice.subtotal,
            credit: '0',
            description: `Convert deferred revenue to sales revenue for invoice ${existingInvoice.invoiceNumber}`,
          },
          // Record sales revenue (credit)
          {
            journalEntryId: paymentJournalEntry.id,
            accountId: salesAccount.id,
            debit: '0',
            credit: existingInvoice.subtotal,
            description: `Sales revenue from ${customerName} (invoice ${existingInvoice.invoiceNumber})`,
          }
        );
      } else {
        // If no deferred revenue account, directly record revenue (fallback)
        journalLinesData.push({
          journalEntryId: paymentJournalEntry.id,
          accountId: salesAccount.id,
          debit: '0',
          credit: existingInvoice.subtotal,
          description: `Sales revenue from ${customerName} (invoice ${existingInvoice.invoiceNumber})`,
        });
      }

      await db.insert(journalLines).values(journalLinesData);
    }

    // Update invoice
    const [updatedInvoice] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Invoice ${status === 'paid' ? 'marked as paid and revenue recorded' : status ? 'status updated' : 'updated'} successfully`,
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

// DELETE invoice
export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth();
    
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Company setup required' },
        { status: 400 }
      );
    }

    const { id } = params;

    // Check if invoice exists and belongs to user's company
    const [existingInvoice] = await db
      .select({
        id: invoices.id,
        status: invoices.status,
        invoiceNumber: invoices.invoiceNumber,
        subtotal: invoices.subtotal,
        vatAmount: invoices.vatAmount,
        totalAmount: invoices.totalAmount,
        customerId: invoices.customerId,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.id, id),
          eq(invoices.companyId, user.companyId)
        )
      )
      .limit(1);

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // If invoice is paid, we need to reverse the revenue entries
    if (existingInvoice.status === 'paid') {
      // Get customer name for journal entries
      const [customer] = await db
        .select({ name: customers.name })
        .from(customers)
        .where(eq(customers.id, existingInvoice.customerId))
        .limit(1);

      const customerName = customer?.name || 'Customer';

      // Get company accounts for reversal entries
      const companyAccounts = await db
        .select()
        .from(accounts)
        .where(eq(accounts.companyId, user.companyId));

      let cashAccount = companyAccounts.find(acc => 
        acc.type === 'asset' && (acc.category === 'cash' || acc.name.toLowerCase().includes('cash'))
      );
      let accountsReceivable = companyAccounts.find(acc => 
        acc.type === 'asset' && (acc.category === 'receivable' || acc.name.toLowerCase().includes('receivable'))
      );
      let salesAccount = companyAccounts.find(acc => 
        acc.category === 'sales' || acc.name.toLowerCase().includes('sales')
      );

      if (cashAccount && salesAccount) {
        // Create reversal journal entry
        const [reversalJournalEntry] = await db
          .insert(journalEntries)
          .values({
            companyId: user.companyId,
            entryDate: new Date(existingInvoice.invoiceDate),
            reference: `DEL-${existingInvoice.invoiceNumber}`,
            narration: `Reversal for deleted invoice ${existingInvoice.invoiceNumber} from ${customerName}`,
            createdBy: user.id,
            status: 'posted',
          })
          .returning();

        // Create reversal journal lines
        const reversalLines = [
          // Reverse cash (credit cash to remove it)
          {
            journalEntryId: reversalJournalEntry.id,
            accountId: cashAccount.id,
            debit: '0',
            credit: existingInvoice.totalAmount,
            description: `Reverse cash for deleted invoice ${existingInvoice.invoiceNumber}`,
          },
          // Reverse sales revenue (debit sales to remove revenue)
          {
            journalEntryId: reversalJournalEntry.id,
            accountId: salesAccount.id,
            debit: existingInvoice.subtotal,
            credit: '0',
            description: `Reverse sales revenue for deleted invoice ${existingInvoice.invoiceNumber}`,
          },
        ];

        // Add A/R if needed (to balance the entry if there's a difference)
        if (accountsReceivable && parseFloat(existingInvoice.vatAmount) > 0) {
          reversalLines.push({
            journalEntryId: reversalJournalEntry.id,
            accountId: accountsReceivable.id,
            debit: existingInvoice.vatAmount,
            credit: '0',
            description: `Reverse VAT for deleted invoice ${existingInvoice.invoiceNumber}`,
          });
        }

        await db.insert(journalLines).values(reversalLines);
      }
    }

    // Delete related invoice items first
    await db
      .delete(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    // Delete related journal entries and lines
    const relatedJournalEntries = await db
      .select({ id: journalEntries.id })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.companyId, user.companyId),
          eq(journalEntries.reference, existingInvoice.invoiceNumber)
        )
      );

    for (const entry of relatedJournalEntries) {
      await db
        .delete(journalLines)
        .where(eq(journalLines.journalEntryId, entry.id));
      
      await db
        .delete(journalEntries)
        .where(eq(journalEntries.id, entry.id));
    }

    // Delete the invoice
    await db
      .delete(invoices)
      .where(eq(invoices.id, id));

    return NextResponse.json({
      success: true,
      message: `Invoice ${existingInvoice.invoiceNumber} deleted successfully${existingInvoice.status === 'paid' ? ' and revenue reversed' : ''}`,
    });

  } catch (error) {
    console.error('Delete invoice error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
} 