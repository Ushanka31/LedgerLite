import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { getCurrentContext, getContextCompanyId, isPersonalContext } from '@/app/lib/context';
import { db } from '@/app/lib/db';
import { journalEntries, journalLines, accounts } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCategoryById } from '@/app/lib/personalCategories';

export async function POST(request) {
  try {
    const user = await requireAuth();
    const context = await getCurrentContext();
    
    // Ensure we're in personal context
    if (!isPersonalContext(context)) {
      return NextResponse.json(
        { error: 'Personal expenses can only be added in personal context' },
        { status: 400 }
      );
    }

    const requestData = await request.json();
    const { amount, description, date, category, vendor, paymentMethod, recurring, frequency } = requestData;

    if (!amount || !description || !date || !category) {
      return NextResponse.json(
        { error: 'Amount, description, date, and category are required' },
        { status: 400 }
      );
    }

    const companyId = getContextCompanyId(context);
    const categoryInfo = getCategoryById(category, 'expense');
    
    if (!categoryInfo) {
      return NextResponse.json(
        { error: 'Invalid expense category' },
        { status: 400 }
      );
    }

    // Find or create necessary accounts for personal context
    const personalAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.companyId, companyId));

    // Get payment account based on payment method
    let paymentAccountCode = 'P-1001'; // Default to cash
    let paymentAccountName = 'Personal Cash';
    
    if (paymentMethod === 'card' || paymentMethod === 'bank_transfer') {
      paymentAccountCode = 'P-1002';
      paymentAccountName = 'Personal Bank Account';
    }

    let paymentAccount = personalAccounts.find(acc => acc.code === paymentAccountCode);
    if (!paymentAccount) {
      const [newAccount] = await db
        .insert(accounts)
        .values({
          companyId,
          code: paymentAccountCode,
          name: paymentAccountName,
          type: 'asset',
          category: paymentMethod === 'cash' ? 'cash' : 'bank',
        })
        .returning();
      paymentAccount = newAccount;
    }

    // Create personal expense account for this category if doesn't exist
    const expenseAccountCode = `P-5${category.substring(0, 3).toUpperCase()}`;
    let expenseAccount = personalAccounts.find(acc => acc.code === expenseAccountCode);
    
    if (!expenseAccount) {
      const [newAccount] = await db
        .insert(accounts)
        .values({
          companyId,
          code: expenseAccountCode,
          name: `Personal ${categoryInfo.name}`,
          type: 'expense',
          category: 'personal_expense',
        })
        .returning();
      expenseAccount = newAccount;
    }

    // Create journal entry
    const entryDate = new Date(date);
    const reference = `PE-${Date.now()}`;
    const vendorText = vendor ? ` at ${vendor}` : '';
    const narration = `${categoryInfo.icon} ${categoryInfo.name}: ${description}${vendorText}${recurring ? ` (${frequency})` : ''}`;

    const [journalEntry] = await db
      .insert(journalEntries)
      .values({
        companyId,
        entryDate,
        reference,
        narration,
        createdBy: user.id,
        status: 'posted',
      })
      .returning();

    // Create journal lines (double-entry)
    await db.insert(journalLines).values([
      {
        journalEntryId: journalEntry.id,
        accountId: expenseAccount.id,
        debit: amount.toString(),
        credit: '0',
        description: categoryInfo.name,
      },
      {
        journalEntryId: journalEntry.id,
        accountId: paymentAccount.id,
        debit: '0',
        credit: amount.toString(),
        description: `Payment via ${paymentMethod}`,
      },
    ]);

    const transaction = {
      id: journalEntry.id,
      amount,
      description,
      category: categoryInfo.name,
      categoryIcon: categoryInfo.icon,
      categoryGroup: categoryInfo.group,
      vendor,
      paymentMethod,
      date: entryDate.toISOString(),
      type: 'expense',
      reference,
      status: 'posted',
      recurring,
      frequency: recurring ? frequency : null,
    };

    return NextResponse.json({
      success: true,
      message: 'Personal expense recorded successfully',
      transaction,
    });
  } catch (error) {
    console.error('Personal expense creation error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to record personal expense' },
      { status: 500 }
    );
  }
} 