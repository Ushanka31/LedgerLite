# Personal Finance Implementation Guide

## Overview

Your LedgerLite application now supports both personal finance tracking and business accounting, allowing users to manage their complete financial life in one place.

## Key Features Implemented

### 1. Context Switching
- **Personal Context**: Track personal income, expenses, budgets, and savings
- **Business Context**: Manage business accounting, invoices, and customers
- Users can seamlessly switch between contexts using the context switcher in the navigation bar

### 2. Personal Finance Features

#### Income Tracking
- Multiple income categories (Salary, Freelance, Investments, etc.)
- Recurring income support
- Icons and visual categorization

#### Expense Tracking
- Comprehensive expense categories organized by groups:
  - Housing (Rent, Mortgage, Utilities, Maintenance)
  - Transportation (Fuel, Public Transport, Car Maintenance)
  - Food & Dining (Groceries, Restaurants, Coffee)
  - Personal Care (Healthcare, Pharmacy, Clothing)
  - Lifestyle (Entertainment, Subscriptions, Hobbies)
  - Financial (Insurance, Loans, Savings, Investments)
  - Others (Education, Gifts, Charity)
- Payment method tracking
- Vendor/merchant information
- Recurring expense support

#### Budget Management
- Set monthly income and allocate budgets per category
- Three preset budget templates:
  - Conservative (20% savings focus)
  - Moderate (10% balanced approach)
  - Aggressive (30% savings maximization)
- Visual budget vs actual tracking
- Percentage-based or amount-based budgeting

#### Personal Dashboard
- Financial summary cards:
  - Total Income
  - Total Expenses
  - Net Savings
  - Budget Status
- Expense breakdown by category (Doughnut chart)
- Budget vs Actual visualization
- Recent transactions list
- Savings rate calculation

### 3. Data Privacy & Security
- Complete separation between personal and business data
- Personal data uses a special company ID (`00000000-0000-0000-0000-000000000000`)
- Context-aware API endpoints ensure data isolation
- Users can only access their own personal data

## Getting Started

### 1. Initialize Personal Accounts (One-time setup)

**Option A: Via Web Interface (Recommended)**
1. Navigate to: `/setup/initialize-personal`
2. Click "Initialize Personal Finance"
3. Wait for confirmation
4. You'll be redirected to the dashboard

**Option B: Via API**
You can also make a POST request to `/api/personal/initialize` if you prefer.

This creates the necessary account structures for personal finance tracking.

### 2. User Guide

#### Switching Contexts
1. Click the context switcher button in the navigation bar (shows current context)
2. Select "Personal Finances" or any business account
3. The dashboard and available features will update based on context

#### Adding Personal Income
1. In personal context, click "Add Income" from Quick Actions
2. Enter amount, select category, and provide description
3. Optionally mark as recurring with frequency
4. Click "Add Income" to save

#### Adding Personal Expenses
1. In personal context, click "Add Expense" from Quick Actions
2. Enter amount and select from categorized expense types
3. Add vendor/merchant information (optional)
4. Select payment method
5. Optionally mark as recurring
6. Click "Add Expense" to save

#### Setting Up Budget
1. In personal context, click "Set Budget" from Quick Actions
2. Enter your monthly income
3. Choose a budget template or create custom allocations
4. Adjust amounts or percentages per category
5. Click "Save Budget" to activate

#### Viewing Personal Dashboard
- The dashboard automatically shows personal finance view when in personal context
- View income vs expenses trends
- Monitor budget adherence
- Track savings rate
- Review recent transactions

## Technical Implementation Details

### Database Structure
- Uses existing database schema without modifications
- Personal transactions stored with special company ID
- Budget data stored as JSON in journal entries with `BUDGET-` prefix
- Personal accounts use `P-` prefix (e.g., P-1001 for Personal Cash)

### API Endpoints
- `/api/context` - Get/switch between personal and business contexts
- `/api/personal/income` - Add personal income transactions
- `/api/personal/expense` - Add personal expense transactions
- `/api/personal/budget` - Get/save personal budgets
- `/api/personal/initialize` - Initialize personal accounts

### File Structure
```
app/
├── lib/
│   ├── context.js              # Context management
│   ├── personalCategories.js   # Income/expense categories
│   ├── initializePersonalAccounts.js
│   └── db/personalBudgetSchema.js
├── api/
│   ├── context/route.js
│   └── personal/
│       ├── income/route.js
│       ├── expense/route.js
│       ├── budget/route.js
│       └── initialize/route.js
└── components/
    ├── dashboard/
    │   └── ContextSwitcher.jsx
    └── personal/
        ├── AddPersonalIncomeModal.jsx
        ├── AddPersonalExpenseModal.jsx
        ├── PersonalBudgetModal.jsx
        └── PersonalDashboard.jsx
```

## Best Practices

1. **Regular Updates**: Keep your budget updated as your financial situation changes
2. **Categorization**: Use appropriate categories for accurate tracking and reporting
3. **Recurring Transactions**: Set up recurring items to save time
4. **Review Regularly**: Check your personal dashboard weekly to stay on track
5. **Separate Contexts**: Keep personal and business finances clearly separated

## Future Enhancements

The following features can be added in future updates:
- Financial goals tracking
- Bill reminders and notifications
- Investment portfolio tracking
- Detailed financial reports and analytics
- Data export for tax purposes
- Mobile app support
- Bank account integration

## Troubleshooting

### Personal accounts not showing
- Run the initialization script: `node scripts/initialize-personal-accounts.js`
- Ensure you're in personal context (check context switcher)

### Transactions not appearing
- Verify you're in the correct context
- Check date range filter
- Refresh the page

### Budget not saving
- Ensure total income is entered
- At least one category must have a budget amount
- Check browser console for errors

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify all required fields are filled
3. Try refreshing the page
4. Clear browser cache if issues persist 