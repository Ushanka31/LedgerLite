// Personal Budget storage using existing database structure
// We'll store budgets as journal entries with a special type

export const BUDGET_REFERENCE_PREFIX = 'BUDGET-';

// Budget data structure stored in journal entry narration field as JSON
// PersonalBudget type definition:
// {
//   userId: string;
//   totalIncome: number;
//   budgetType: 'custom' | 'conservative' | 'moderate' | 'aggressive';
//   period: 'monthly' | 'yearly';
//   budgets: {
//     categoryId: string;
//     amount: number;
//     percentage: number;
//   }[];
//   createdAt: Date;
//   updatedAt: Date;
// }

// Helper to encode/decode budget data
export function encodeBudgetData(budget) {
  return JSON.stringify({
    totalIncome: budget.totalIncome,
    budgetType: budget.budgetType,
    period: budget.period || 'monthly',
    budgets: budget.budgets
  });
}

export function decodeBudgetData(narration) {
  try {
    return JSON.parse(narration);
  } catch (error) {
    console.error('Error decoding budget data:', error);
    return null;
  }
} 