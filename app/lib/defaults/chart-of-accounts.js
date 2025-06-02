export const defaultChartOfAccounts = [
  // Assets
  {
    code: '1000',
    name: 'Assets',
    type: 'asset',
    category: null,
    isHeader: true,
  },
  {
    code: '1100',
    name: 'Current Assets',
    type: 'asset',
    category: null,
    parentCode: '1000',
    isHeader: true,
  },
  {
    code: '1110',
    name: 'Cash',
    type: 'asset',
    category: 'cash',
    parentCode: '1100',
  },
  {
    code: '1120',
    name: 'Bank Accounts',
    type: 'asset',
    category: 'bank',
    parentCode: '1100',
  },
  {
    code: '1130',
    name: 'Accounts Receivable',
    type: 'asset',
    category: null,
    parentCode: '1100',
  },
  {
    code: '1140',
    name: 'Inventory',
    type: 'asset',
    category: null,
    parentCode: '1100',
  },
  {
    code: '1150',
    name: 'VAT Receivable',
    type: 'asset',
    category: 'vat_receivable',
    parentCode: '1100',
  },
  {
    code: '1200',
    name: 'Fixed Assets',
    type: 'asset',
    category: null,
    parentCode: '1000',
    isHeader: true,
  },
  {
    code: '1210',
    name: 'Equipment',
    type: 'asset',
    category: null,
    parentCode: '1200',
  },
  {
    code: '1220',
    name: 'Vehicles',
    type: 'asset',
    category: null,
    parentCode: '1200',
  },
  {
    code: '1230',
    name: 'Furniture & Fixtures',
    type: 'asset',
    category: null,
    parentCode: '1200',
  },

  // Liabilities
  {
    code: '2000',
    name: 'Liabilities',
    type: 'liability',
    category: null,
    isHeader: true,
  },
  {
    code: '2100',
    name: 'Current Liabilities',
    type: 'liability',
    category: null,
    parentCode: '2000',
    isHeader: true,
  },
  {
    code: '2110',
    name: 'Accounts Payable',
    type: 'liability',
    category: null,
    parentCode: '2100',
  },
  {
    code: '2120',
    name: 'VAT Payable',
    type: 'liability',
    category: 'vat_payable',
    parentCode: '2100',
  },
  {
    code: '2130',
    name: 'Salaries Payable',
    type: 'liability',
    category: null,
    parentCode: '2100',
  },
  {
    code: '2140',
    name: 'Income Tax Payable',
    type: 'liability',
    category: null,
    parentCode: '2100',
  },
  {
    code: '2200',
    name: 'Long-term Liabilities',
    type: 'liability',
    category: null,
    parentCode: '2000',
    isHeader: true,
  },
  {
    code: '2210',
    name: 'Bank Loans',
    type: 'liability',
    category: null,
    parentCode: '2200',
  },

  // Equity
  {
    code: '3000',
    name: 'Equity',
    type: 'equity',
    category: null,
    isHeader: true,
  },
  {
    code: '3100',
    name: 'Owner\'s Capital',
    type: 'equity',
    category: null,
    parentCode: '3000',
  },
  {
    code: '3200',
    name: 'Owner\'s Drawings',
    type: 'equity',
    category: null,
    parentCode: '3000',
  },
  {
    code: '3300',
    name: 'Retained Earnings',
    type: 'equity',
    category: null,
    parentCode: '3000',
  },

  // Revenue
  {
    code: '4000',
    name: 'Revenue',
    type: 'revenue',
    category: null,
    isHeader: true,
  },
  {
    code: '4100',
    name: 'Sales Revenue',
    type: 'revenue',
    category: 'sales',
    parentCode: '4000',
  },
  {
    code: '4110',
    name: 'Product Sales',
    type: 'revenue',
    category: 'sales',
    parentCode: '4100',
  },
  {
    code: '4120',
    name: 'Service Revenue',
    type: 'revenue',
    category: 'sales',
    parentCode: '4100',
  },
  {
    code: '4200',
    name: 'Other Income',
    type: 'revenue',
    category: null,
    parentCode: '4000',
  },
  {
    code: '4210',
    name: 'Interest Income',
    type: 'revenue',
    category: null,
    parentCode: '4200',
  },
  {
    code: '4220',
    name: 'Rental Income',
    type: 'revenue',
    category: null,
    parentCode: '4200',
  },

  // Cost of Goods Sold
  {
    code: '5000',
    name: 'Cost of Goods Sold',
    type: 'expense',
    category: 'cogs',
    isHeader: true,
  },
  {
    code: '5100',
    name: 'Purchases',
    type: 'expense',
    category: 'cogs',
    parentCode: '5000',
  },
  {
    code: '5200',
    name: 'Direct Labor',
    type: 'expense',
    category: 'cogs',
    parentCode: '5000',
  },
  {
    code: '5300',
    name: 'Manufacturing Overhead',
    type: 'expense',
    category: 'cogs',
    parentCode: '5000',
  },

  // Operating Expenses
  {
    code: '6000',
    name: 'Operating Expenses',
    type: 'expense',
    category: 'expense',
    isHeader: true,
  },
  {
    code: '6100',
    name: 'Administrative Expenses',
    type: 'expense',
    category: 'expense',
    parentCode: '6000',
    isHeader: true,
  },
  {
    code: '6110',
    name: 'Salaries & Wages',
    type: 'expense',
    category: 'expense',
    parentCode: '6100',
  },
  {
    code: '6120',
    name: 'Rent Expense',
    type: 'expense',
    category: 'expense',
    parentCode: '6100',
  },
  {
    code: '6130',
    name: 'Utilities',
    type: 'expense',
    category: 'expense',
    parentCode: '6100',
  },
  {
    code: '6140',
    name: 'Insurance',
    type: 'expense',
    category: 'expense',
    parentCode: '6100',
  },
  {
    code: '6150',
    name: 'Office Supplies',
    type: 'expense',
    category: 'expense',
    parentCode: '6100',
  },
  {
    code: '6160',
    name: 'Telephone & Internet',
    type: 'expense',
    category: 'expense',
    parentCode: '6100',
  },
  {
    code: '6170',
    name: 'Professional Fees',
    type: 'expense',
    category: 'expense',
    parentCode: '6100',
  },
  {
    code: '6180',
    name: 'Bank Charges',
    type: 'expense',
    category: 'expense',
    parentCode: '6100',
  },
  {
    code: '6200',
    name: 'Marketing & Sales',
    type: 'expense',
    category: 'expense',
    parentCode: '6000',
    isHeader: true,
  },
  {
    code: '6210',
    name: 'Advertising',
    type: 'expense',
    category: 'expense',
    parentCode: '6200',
  },
  {
    code: '6220',
    name: 'Marketing Materials',
    type: 'expense',
    category: 'expense',
    parentCode: '6200',
  },
  {
    code: '6230',
    name: 'Travel & Entertainment',
    type: 'expense',
    category: 'expense',
    parentCode: '6200',
  },
  {
    code: '6300',
    name: 'Vehicle Expenses',
    type: 'expense',
    category: 'expense',
    parentCode: '6000',
    isHeader: true,
  },
  {
    code: '6310',
    name: 'Fuel',
    type: 'expense',
    category: 'expense',
    parentCode: '6300',
  },
  {
    code: '6320',
    name: 'Vehicle Maintenance',
    type: 'expense',
    category: 'expense',
    parentCode: '6300',
  },
  {
    code: '6330',
    name: 'Vehicle Insurance',
    type: 'expense',
    category: 'expense',
    parentCode: '6300',
  },
  {
    code: '6400',
    name: 'Other Expenses',
    type: 'expense',
    category: 'expense',
    parentCode: '6000',
    isHeader: true,
  },
  {
    code: '6410',
    name: 'Depreciation',
    type: 'expense',
    category: 'expense',
    parentCode: '6400',
  },
  {
    code: '6420',
    name: 'Miscellaneous',
    type: 'expense',
    category: 'expense',
    parentCode: '6400',
  },
  {
    code: '6500',
    name: 'Financial Expenses',
    type: 'expense',
    category: 'expense',
    parentCode: '6000',
    isHeader: true,
  },
  {
    code: '6510',
    name: 'Interest Expense',
    type: 'expense',
    category: 'expense',
    parentCode: '6500',
  },
  {
    code: '6520',
    name: 'Exchange Loss',
    type: 'expense',
    category: 'expense',
    parentCode: '6500',
  },
];

// Function to create chart of accounts for a company
export async function createDefaultAccounts(db, companyId) {
  const accounts = [];
  const codeToId = {};
  
  // First pass: create all accounts
  for (const account of defaultChartOfAccounts) {
    const accountData = {
      companyId,
      code: account.code,
      name: account.name,
      type: account.type,
      category: account.category,
      isActive: true,
    };
    
    accounts.push(accountData);
  }
  
  // Insert all accounts
  const insertedAccounts = await db.insert(accountsTable).values(accounts).returning();
  
  // Map codes to IDs
  for (const account of insertedAccounts) {
    codeToId[account.code] = account.id;
  }
  
  // Second pass: update parent relationships
  const updates = [];
  for (let i = 0; i < defaultChartOfAccounts.length; i++) {
    const defaultAccount = defaultChartOfAccounts[i];
    if (defaultAccount.parentCode) {
      const parentId = codeToId[defaultAccount.parentCode];
      const accountId = insertedAccounts[i].id;
      
      updates.push(
        db
          .update(accountsTable)
          .set({ parentId })
          .where(eq(accountsTable.id, accountId))
      );
    }
  }
  
  // Execute all parent updates
  await Promise.all(updates);
  
  return insertedAccounts;
} 