import { db } from './db/index.js';
import { users, accounts, companies } from './db/schema.js';
import { eq } from 'drizzle-orm';

const PERSONAL_COMPANY_ID = '00000000-0000-0000-0000-000000000000';

// Personal account templates
const PERSONAL_ACCOUNT_TEMPLATES = [
  // Asset accounts
  { code: 'P-1001', name: 'Personal Cash', type: 'asset', category: 'cash' },
  { code: 'P-1002', name: 'Personal Bank Account', type: 'asset', category: 'bank' },
  { code: 'P-1003', name: 'Personal Savings', type: 'asset', category: 'bank' },
  { code: 'P-1004', name: 'Personal Investments', type: 'asset', category: 'investments' },
  
  // Liability accounts
  { code: 'P-2001', name: 'Personal Credit Card', type: 'liability', category: 'credit_card' },
  { code: 'P-2002', name: 'Personal Loans', type: 'liability', category: 'loans' },
  
  // Income accounts (will be created dynamically based on categories used)
  { code: 'P-4001', name: 'Personal Salary Income', type: 'revenue', category: 'personal_income' },
  { code: 'P-4002', name: 'Personal Other Income', type: 'revenue', category: 'personal_income' },
  
  // Expense accounts (will be created dynamically based on categories used)
  { code: 'P-5001', name: 'Personal Living Expenses', type: 'expense', category: 'personal_expense' },
  { code: 'P-5002', name: 'Personal Transportation', type: 'expense', category: 'personal_expense' },
  { code: 'P-5003', name: 'Personal Food & Dining', type: 'expense', category: 'personal_expense' },
  { code: 'P-5004', name: 'Personal Healthcare', type: 'expense', category: 'personal_expense' },
  { code: 'P-5005', name: 'Personal Entertainment', type: 'expense', category: 'personal_expense' },
  { code: 'P-5006', name: 'Personal Other Expenses', type: 'expense', category: 'personal_expense' },
  
  // Equity account
  { code: 'P-3001', name: 'Personal Net Worth', type: 'equity', category: 'equity' },
];

export async function initializePersonalAccountsForAllUsers() {
  try {
    console.log('Starting personal accounts initialization...');
    
    // First, check if the special personal company record exists
    const existingPersonalCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.id, PERSONAL_COMPANY_ID))
      .limit(1);
    
    if (existingPersonalCompany.length === 0) {
      console.log('Creating special personal company record...');
      
      // Get the first user to use as the owner of the personal company
      const firstUser = await db.select().from(users).limit(1);
      if (firstUser.length === 0) {
        throw new Error('No users found in the system. Cannot create personal company.');
      }
      
      // Create the special company record for personal accounts
      await db.insert(companies).values({
        id: PERSONAL_COMPANY_ID,
        ownerId: firstUser[0].id,
        name: 'Personal Finance System',
        currency: 'USD',
        currencySymbol: '$',
        financialYearStart: 1,
      });
      
      console.log('Created special personal company record');
    }
    
    // Check if personal accounts already exist
    const existingPersonalAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.companyId, PERSONAL_COMPANY_ID))
      .limit(1);
    
    if (existingPersonalAccounts.length === 0) {
      console.log('Creating personal account templates...');
      
      // Create the base personal accounts
      await db.insert(accounts).values(
        PERSONAL_ACCOUNT_TEMPLATES.map(template => ({
          ...template,
          companyId: PERSONAL_COMPANY_ID,
          isActive: true,
        }))
      );
      
      console.log(`Created ${PERSONAL_ACCOUNT_TEMPLATES.length} personal account templates`);
    } else {
      console.log('Personal accounts already initialized');
    }
    
    return { success: true, message: 'Personal accounts initialized successfully' };
  } catch (error) {
    console.error('Error initializing personal accounts:', error);
    return { success: false, error: error.message };
  }
}

// Function to ensure personal accounts exist when a user first switches to personal context
export async function ensurePersonalAccountsExist() {
  try {
    const existingAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.companyId, PERSONAL_COMPANY_ID));
    
    if (existingAccounts.length === 0) {
      return await initializePersonalAccountsForAllUsers();
    }
    
    return { success: true, message: 'Personal accounts already exist' };
  } catch (error) {
    console.error('Error ensuring personal accounts:', error);
    return { success: false, error: error.message };
  }
} 