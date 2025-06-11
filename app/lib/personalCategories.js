// Personal Income Categories
export const personalIncomeCategories = [
  { id: 'salary', name: 'Salary', icon: '💼', color: 'green' },
  { id: 'freelance', name: 'Freelance/Contract', icon: '💻', color: 'blue' },
  { id: 'business_income', name: 'Business Income', icon: '🏢', color: 'purple' },
  { id: 'investments', name: 'Investments', icon: '📈', color: 'indigo' },
  { id: 'rental', name: 'Rental Income', icon: '🏠', color: 'yellow' },
  { id: 'dividends', name: 'Dividends', icon: '💰', color: 'green' },
  { id: 'interest', name: 'Interest', icon: '🏦', color: 'blue' },
  { id: 'gifts', name: 'Gifts/Donations', icon: '🎁', color: 'pink' },
  { id: 'refunds', name: 'Refunds/Reimbursements', icon: '🔄', color: 'gray' },
  { id: 'other_income', name: 'Other Income', icon: '📊', color: 'gray' }
];

// Personal Expense Categories
export const personalExpenseCategories = [
  // Housing
  { id: 'rent', name: 'Rent', icon: '🏠', color: 'red', group: 'Housing' },
  { id: 'mortgage', name: 'Mortgage', icon: '🏡', color: 'red', group: 'Housing' },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: 'orange', group: 'Housing' },
  { id: 'maintenance', name: 'Home Maintenance', icon: '🔧', color: 'orange', group: 'Housing' },
  
  // Transportation
  { id: 'fuel', name: 'Fuel/Gas', icon: '⛽', color: 'purple', group: 'Transportation' },
  { id: 'public_transport', name: 'Public Transport', icon: '🚌', color: 'purple', group: 'Transportation' },
  { id: 'car_maintenance', name: 'Car Maintenance', icon: '🚗', color: 'purple', group: 'Transportation' },
  { id: 'parking', name: 'Parking/Tolls', icon: '🅿️', color: 'purple', group: 'Transportation' },
  
  // Food & Dining
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: 'green', group: 'Food' },
  { id: 'restaurants', name: 'Restaurants/Dining', icon: '🍽️', color: 'green', group: 'Food' },
  { id: 'coffee', name: 'Coffee/Snacks', icon: '☕', color: 'green', group: 'Food' },
  
  // Personal Care
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: 'blue', group: 'Personal' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊', color: 'blue', group: 'Personal' },
  { id: 'personal_care', name: 'Personal Care', icon: '💅', color: 'pink', group: 'Personal' },
  { id: 'clothing', name: 'Clothing', icon: '👔', color: 'pink', group: 'Personal' },
  
  // Entertainment & Lifestyle
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: 'indigo', group: 'Lifestyle' },
  { id: 'subscriptions', name: 'Subscriptions', icon: '📱', color: 'indigo', group: 'Lifestyle' },
  { id: 'hobbies', name: 'Hobbies', icon: '🎨', color: 'indigo', group: 'Lifestyle' },
  { id: 'fitness', name: 'Fitness/Gym', icon: '💪', color: 'indigo', group: 'Lifestyle' },
  
  // Business Operations
  { id: 'salary_payment', name: 'Salary Payment', icon: '💰', color: 'purple', group: 'Business Operations' },
  { id: 'contractor_payment', name: 'Contractor Payment', icon: '🤝', color: 'purple', group: 'Business Operations' },
  { id: 'office_supplies', name: 'Office Supplies', icon: '📎', color: 'purple', group: 'Business Operations' },
  { id: 'business_services', name: 'Business Services', icon: '🔧', color: 'purple', group: 'Business Operations' },
  
  // Financial
  { id: 'insurance', name: 'Insurance', icon: '🛡️', color: 'gray', group: 'Financial' },
  { id: 'loans', name: 'Loan Payments', icon: '🏦', color: 'gray', group: 'Financial' },
  { id: 'savings', name: 'Savings', icon: '💰', color: 'gray', group: 'Financial' },
  { id: 'investments_expense', name: 'Investment', icon: '📊', color: 'gray', group: 'Financial' },
  
  // Others
  { id: 'education', name: 'Education', icon: '📚', color: 'yellow', group: 'Others' },
  { id: 'gifts_given', name: 'Gifts Given', icon: '🎁', color: 'yellow', group: 'Others' },
  { id: 'charity', name: 'Charity/Donations', icon: '❤️', color: 'yellow', group: 'Others' },
  { id: 'other_expense', name: 'Other Expenses', icon: '📌', color: 'gray', group: 'Others' }
];

// Budget presets for personal finance
export const personalBudgetPresets = {
  conservative: {
    housing: 30,        // 30% of income
    transportation: 15, // 15% of income
    food: 12,          // 12% of income
    utilities: 5,      // 5% of income
    insurance: 5,      // 5% of income
    personal: 5,       // 5% of income
    entertainment: 5,  // 5% of income
    savings: 20,       // 20% of income
    other: 3          // 3% of income
  },
  moderate: {
    housing: 35,
    transportation: 20,
    food: 15,
    utilities: 5,
    insurance: 5,
    personal: 7,
    entertainment: 8,
    savings: 10,
    other: 5
  },
  aggressive: {
    housing: 25,
    transportation: 10,
    food: 10,
    utilities: 5,
    insurance: 5,
    personal: 5,
    entertainment: 5,
    savings: 30,
    other: 5
  }
};

// Helper functions
export function getCategoryById(categoryId, type = 'expense') {
  const categories = type === 'income' ? personalIncomeCategories : personalExpenseCategories;
  return categories.find(cat => cat.id === categoryId);
}

export function getCategoriesByGroup(group) {
  return personalExpenseCategories.filter(cat => cat.group === group);
}

export function getAllGroups() {
  const groups = [...new Set(personalExpenseCategories.map(cat => cat.group).filter(Boolean))];
  return groups;
} 