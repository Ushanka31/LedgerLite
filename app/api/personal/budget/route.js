import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { getCurrentContext, getContextCompanyId, isPersonalContext } from '@/app/lib/context';
import { db } from '@/app/lib/db';
import { journalEntries } from '@/app/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { BUDGET_REFERENCE_PREFIX, encodeBudgetData, decodeBudgetData } from '@/app/lib/db/personalBudgetSchema';

export async function GET(request) {
  try {
    const user = await requireAuth();
    const context = await getCurrentContext();
    
    // Ensure we're in personal context
    if (!isPersonalContext(context)) {
      return NextResponse.json(
        { error: 'Budgets are only available in personal context' },
        { status: 400 }
      );
    }

    const companyId = getContextCompanyId(context);
    
    // Get the latest budget entry
    const [budgetEntry] = await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.companyId, companyId),
          eq(journalEntries.createdBy, user.id),
          eq(journalEntries.status, 'posted')
        )
      )
      .orderBy(desc(journalEntries.createdAt))
      .limit(1);

    if (!budgetEntry || !budgetEntry.reference?.startsWith(BUDGET_REFERENCE_PREFIX)) {
      return NextResponse.json({
        success: true,
        budget: null,
        message: 'No budget found'
      });
    }

    const budgetData = decodeBudgetData(budgetEntry.narration);
    
    if (!budgetData) {
      return NextResponse.json({
        success: true,
        budget: null,
        message: 'Invalid budget data'
      });
    }

    return NextResponse.json({
      success: true,
      budget: {
        id: budgetEntry.id,
        ...budgetData,
        createdAt: budgetEntry.createdAt,
        updatedAt: budgetEntry.updatedAt
      }
    });
  } catch (error) {
    console.error('Get budget error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth();
    const context = await getCurrentContext();
    
    // Ensure we're in personal context
    if (!isPersonalContext(context)) {
      return NextResponse.json(
        { error: 'Budgets can only be created in personal context' },
        { status: 400 }
      );
    }

    const requestData = await request.json();
    const { totalIncome, budgetType, budgets } = requestData;

    if (!totalIncome || !budgetType || !budgets || budgets.length === 0) {
      return NextResponse.json(
        { error: 'Total income, budget type, and budget categories are required' },
        { status: 400 }
      );
    }

    const companyId = getContextCompanyId(context);
    
    // Check if user already has a budget and mark it as void
    const existingBudgets = await db
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.companyId, companyId),
          eq(journalEntries.createdBy, user.id),
          eq(journalEntries.status, 'posted')
        )
      );

    // Mark old budgets as void
    for (const oldBudget of existingBudgets) {
      if (oldBudget.reference?.startsWith(BUDGET_REFERENCE_PREFIX)) {
        await db
          .update(journalEntries)
          .set({ status: 'void' })
          .where(eq(journalEntries.id, oldBudget.id));
      }
    }

    // Create new budget entry
    const budgetData = {
      totalIncome,
      budgetType,
      period: 'monthly',
      budgets
    };

    const reference = `${BUDGET_REFERENCE_PREFIX}${Date.now()}`;
    const narration = encodeBudgetData(budgetData);

    const [budgetEntry] = await db
      .insert(journalEntries)
      .values({
        companyId,
        entryDate: new Date(),
        reference,
        narration,
        createdBy: user.id,
        status: 'posted',
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Budget saved successfully',
      budget: {
        id: budgetEntry.id,
        ...budgetData,
        createdAt: budgetEntry.createdAt,
        updatedAt: budgetEntry.updatedAt
      }
    });
  } catch (error) {
    console.error('Create budget error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save budget' },
      { status: 500 }
    );
  }
} 