import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { getCurrentContext, getContextCompanyId, isPersonalContext } from '@/app/lib/context';
import { db } from '@/app/lib/db';
import { journalEntries, journalLines, accounts } from '@/app/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCategoryById } from '@/app/lib/personalCategories';

export async function POST(request) {
  try {
    const user = await requireAuth();
    const context = await getCurrentContext();
    
    // Ensure we're in personal context
    if (!isPersonalContext(context)) {
      return NextResponse.json(
        { error: 'Personal income can only be added in personal context' },
        { status: 400 }
      );
    }

    const requestData = await request.json();
    const { amount, description, date, category, recurring, frequency } = requestData;

    if (!amount || !description || !date || !category) {
      return NextResponse.json(
        { error: 'Amount, description, date, and category are required' },
        { status: 400 }
      );
    }

    const companyId = getContextCompanyId(context);
    const categoryInfo = getCategoryById(category, 'income');
    
    if (!categoryInfo) {
      return NextResponse.json(
        { error: 'Invalid income category' },
        { status: 400 }
      );
    }

    // Find or create necessary accounts for personal context
    const personalAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.companyId, companyId));

    // Create personal cash account if doesn't exist
    let cashAccount = personalAccounts.find(acc => acc.code === 'P-1001');
    if (!cashAccount) {
      const [newAccount] = await db
        .insert(accounts)
        .values({
          companyId,
          code: 'P-1001',
          name: 'Personal Cash',
          type: 'asset',
          category: 'cash',
        })
        .returning();
      cashAccount = newAccount;
    }

    // Create personal income account for this category if doesn't exist
    const incomeAccountCode = `P-4${category.substring(0, 3).toUpperCase()}`;
    let incomeAccount = personalAccounts.find(acc => acc.code === incomeAccountCode);
    
    if (!incomeAccount) {
      const [newAccount] = await db
        .insert(accounts)
        .values({
          companyId,
          code: incomeAccountCode,
          name: `Personal ${categoryInfo.name}`,
          type: 'revenue',
          category: 'personal_income',
        })
        .returning();
      incomeAccount = newAccount;
    }

    // Create journal entry
    const entryDate = new Date(date);
    const reference = `PI-${Date.now()}`;
    const narration = `${categoryInfo.icon} ${categoryInfo.name}: ${description}${recurring ? ` (${frequency})` : ''}`;

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
        accountId: cashAccount.id,
        debit: amount.toString(),
        credit: '0',
        description: `Personal income received`,
      },
      {
        journalEntryId: journalEntry.id,
        accountId: incomeAccount.id,
        debit: '0',
        credit: amount.toString(),
        description: categoryInfo.name,
      },
    ]);

    const transaction = {
      id: journalEntry.id,
      amount,
      description,
      category: categoryInfo.name,
      categoryIcon: categoryInfo.icon,
      date: entryDate.toISOString(),
      type: 'income',
      reference,
      status: 'posted',
      recurring,
      frequency: recurring ? frequency : null,
    };

    return NextResponse.json({
      success: true,
      message: 'Personal income recorded successfully',
      transaction,
    });
  } catch (error) {
    console.error('Personal income creation error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to record personal income' },
      { status: 500 }
    );
  }
} 