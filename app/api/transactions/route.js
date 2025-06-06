import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { getCurrentContext, getContextCompanyId, isPersonalContext } from '@/app/lib/context';
import { db } from '@/app/lib/db';
import { journalEntries, journalLines, accounts, customers } from '@/app/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function POST(request) {
  try {
    const user = await requireAuth();
    
    if (!user.companyId) {
      return NextResponse.json(
        { error: 'Company setup required' },
        { status: 400 }
      );
    }

    const requestData = await request.json();
    const { amount, description, date, type = 'income', category } = requestData;

    if (!amount || !description || !date) {
      return NextResponse.json(
        { error: 'Amount, description, and date are required' },
        { status: 400 }
      );
    }

    // Find necessary accounts
    const companyAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.companyId, user.companyId));

    let cashAccount = companyAccounts.find(acc => acc.category === 'cash' || acc.name.toLowerCase().includes('cash'));

    // Create default cash account if it doesn't exist
    if (!cashAccount) {
      const [newCashAccount] = await db
        .insert(accounts)
        .values({
          companyId: user.companyId,
          code: '1001',
          name: 'Cash on Hand',
          type: 'asset',
          category: 'cash',
        })
        .returning();
      cashAccount = newCashAccount;
    }

    let journalEntry;
    let transaction;

    if (type === 'income') {
      // Handle sales/income transactions
      const { customer } = requestData;
      
      if (!customer) {
        return NextResponse.json(
          { error: 'Customer is required for income transactions' },
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
            eq(customers.name, customer)
          )
        )
        .limit(1);

      if (customerRecord.length === 0) {
        // Create new customer
        const [newCustomer] = await db
          .insert(customers)
          .values({
            companyId: user.companyId,
            name: customer,
          })
          .returning();
        customerRecord = [newCustomer];
      }

      // Find or create sales account
      let salesAccount = companyAccounts.find(acc => acc.category === 'sales' || acc.name.toLowerCase().includes('sales'));
      
      if (!salesAccount) {
        const [newSalesAccount] = await db
          .insert(accounts)
          .values({
            companyId: user.companyId,
            code: '4001',
            name: 'Sales Revenue',
            type: 'revenue',
            category: 'sales',
          })
          .returning();
        salesAccount = newSalesAccount;
      }

      // Create journal entry for sale
      const entryDate = new Date(date);
      const reference = `SALE-${Date.now()}`;
      const narrationWithCategory = category 
        ? `Sale to ${customer}: ${description} [${category}]`
        : `Sale to ${customer}: ${description}`;

      [journalEntry] = await db
        .insert(journalEntries)
        .values({
          companyId: user.companyId,
          entryDate,
          reference,
          narration: narrationWithCategory,
          createdBy: user.id,
          status: 'posted',
        })
        .returning();

      // Create journal lines (double-entry for sale)
      await db.insert(journalLines).values([
        {
          journalEntryId: journalEntry.id,
          accountId: cashAccount.id,
          debit: amount.toString(),
          credit: '0',
          description: `Cash received from ${customer}`,
        },
        {
          journalEntryId: journalEntry.id,
          accountId: salesAccount.id,
          debit: '0',
          credit: amount.toString(),
          description: `Sales revenue: ${description}`,
        },
      ]);

      transaction = {
        id: journalEntry.id,
        amount,
        description,
        customer: customerRecord[0].name,
        category: category || null,
        date: entryDate.toISOString(),
        type: 'income',
        reference,
        status: 'posted',
      };

    } else if (type === 'expense') {
      // Handle expense transactions
      const { vendor } = requestData;
      
      if (!vendor) {
        return NextResponse.json(
          { error: 'Vendor is required for expense transactions' },
          { status: 400 }
        );
      }

      // Find or create expense account
      let expenseAccount = companyAccounts.find(acc => acc.category === 'expense' || acc.type === 'expense');
      
      if (!expenseAccount) {
        const [newExpenseAccount] = await db
          .insert(accounts)
          .values({
            companyId: user.companyId,
            code: '5001',
            name: 'General Expenses',
            type: 'expense',
            category: 'expense',
          })
          .returning();
        expenseAccount = newExpenseAccount;
      }

      // Create journal entry for expense
      const entryDate = new Date(date);
      const reference = `EXP-${Date.now()}`;
      const narrationWithCategory = category 
        ? `Expense to ${vendor}: ${description} [${category}]`
        : `Expense to ${vendor}: ${description}`;

      [journalEntry] = await db
        .insert(journalEntries)
        .values({
          companyId: user.companyId,
          entryDate,
          reference,
          narration: narrationWithCategory,
          createdBy: user.id,
          status: 'posted',
        })
        .returning();

      // Create journal lines (double-entry for expense)
      // Debit: Expense Account (increases expense)
      // Credit: Cash Account (decreases cash)
      await db.insert(journalLines).values([
        {
          journalEntryId: journalEntry.id,
          accountId: expenseAccount.id,
          debit: amount.toString(),
          credit: '0',
          description: `Expense: ${description}`,
        },
        {
          journalEntryId: journalEntry.id,
          accountId: cashAccount.id,
          debit: '0',
          credit: amount.toString(),
          description: `Cash paid to ${vendor}`,
        },
      ]);

      transaction = {
        id: journalEntry.id,
        amount,
        description,
        vendor,
        category: category || 'General',
        date: entryDate.toISOString(),
        type: 'expense',
        reference,
        status: 'posted',
      };

    } else {
      return NextResponse.json(
        { error: 'Invalid transaction type. Must be "income" or "expense"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${type === 'income' ? 'Sale' : 'Expense'} recorded successfully`,
      transaction,
    });
  } catch (error) {
    console.error('Transaction creation error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to record transaction' },
      { status: 500 }
    );
  }
}

// GET transactions for dashboard
export async function GET(request) {
  try {
    const user = await requireAuth();
    const context = await getCurrentContext();
    const companyId = getContextCompanyId(context);
    
    // In personal context, we use the special personal company ID
    // In business context, we need a real company ID
    if (!isPersonalContext(context) && !user.companyId) {
      return NextResponse.json(
        { error: 'Company setup required' },
        { status: 400 }
      );
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'income' or 'expense'
    const limit = parseInt(searchParams.get('limit') || '10');

    // Optimized query: Get transaction data efficiently
    const results = await db
      .select({
        entryId: journalEntries.id,
        entryDate: journalEntries.entryDate,
        reference: journalEntries.reference,
        narration: journalEntries.narration,
        status: journalEntries.status,
        createdAt: journalEntries.createdAt,
        accountId: journalLines.accountId,
        debit: journalLines.debit,
        credit: journalLines.credit,
        description: journalLines.description,
        accountName: accounts.name,
        accountType: accounts.type,
        accountCategory: accounts.category,
      })
      .from(journalEntries)
      .innerJoin(journalLines, eq(journalLines.journalEntryId, journalEntries.id))
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .where(eq(journalEntries.companyId, companyId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(Math.min(limit * 3, 1500)); // Cap at reasonable number to prevent massive queries

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        transactions: [],
        total: 0,
      });
    }

    // Group results by journal entry and process
    const entriesMap = new Map();
    
    results.forEach(row => {
      const entryId = row.entryId;
      
      if (!entriesMap.has(entryId)) {
        entriesMap.set(entryId, {
          id: row.entryId,
          entryDate: row.entryDate,
          reference: row.reference,
          narration: row.narration,
          status: row.status,
          createdAt: row.createdAt,
          lines: []
        });
      }
      
      entriesMap.get(entryId).lines.push({
        accountId: row.accountId,
        debit: row.debit,
        credit: row.credit,
        description: row.description,
        accountName: row.accountName,
        accountType: row.accountType,
        accountCategory: row.accountCategory,
      });
    });

    // Convert to transactions array and determine type/amount
    const transactions = [];
    
    for (const [entryId, entry] of entriesMap) {
      const lines = entry.lines;
      
      // Determine transaction type and amount
      const revenueLines = lines.filter(line => line.accountType === 'revenue');
      const expenseLines = lines.filter(line => line.accountType === 'expense');
      const assetLines = lines.filter(line => line.accountType === 'asset');
      
      let transactionType = 'other';
      let amount = 0;
      
      if (revenueLines.length > 0) {
        // This is a sale (credit to revenue)
        transactionType = 'income';
        amount = parseFloat(revenueLines[0].credit);
      } else if (expenseLines.length > 0) {
        // This is an expense (debit to expense account)
        transactionType = 'expense';
        amount = parseFloat(expenseLines[0].debit);
      } else if (assetLines.some(line => parseFloat(line.credit) > 0)) {
        // Legacy: This might be an expense (credit to asset/cash)
        transactionType = 'expense';
        amount = assetLines.find(line => parseFloat(line.credit) > 0)?.credit || 0;
        amount = parseFloat(amount);
      }

      // Filter by type if specified
      if (type && transactionType !== type) continue;

      // Extract category from narration for expenses
      let extractedCategory = null;
      let cleanDescription = entry.narration;
      
      if (transactionType === 'expense') {
        const categoryMatch = entry.narration.match(/\[([^\]]+)\]/);
        extractedCategory = categoryMatch ? categoryMatch[1] : 'General';
        
        // Clean description by removing vendor prefix and category suffix
        cleanDescription = entry.narration
          .replace(/^Expense to [^:]+:\s*/, '') // Remove "Expense to vendor: " prefix
          .replace(/\s*\[[^\]]+\]$/, ''); // Remove " [category]" suffix
      } else if (transactionType === 'income') {
        // Clean description by removing customer prefix
        cleanDescription = entry.narration
          .replace(/^Sale to [^:]+:\s*/, ''); // Remove "Sale to customer: " prefix
      }

      transactions.push({
        id: entry.id,
        amount,
        description: cleanDescription,
        date: entry.entryDate instanceof Date ? entry.entryDate.toISOString() : new Date(entry.entryDate).toISOString(),
        createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : new Date(entry.createdAt).toISOString(),
        type: transactionType,
        reference: entry.reference,
        status: entry.status,
        category: extractedCategory,
        lines,
      });
    }

    // Sort by creation date (newest first) and limit results
    const limitedTransactions = transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      transactions: limitedTransactions,
      total: limitedTransactions.length,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
} 