import { pgTable, serial, text, timestamp, integer, decimal, boolean, jsonb, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phoneNumber: text('phone_number').notNull().unique(),
  countryCode: text('country_code').notNull().default('+234'),
  role: text('role').notNull().default('owner'), // owner, staff
  name: text('name'),
  email: text('email'),
  companyId: uuid('company_id').references(() => companies.id),
  lastLoginAt: timestamp('last_login_at'),
  deviceTokens: jsonb('device_tokens').default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    phoneIdx: index('phone_idx').on(table.phoneNumber),
  };
});

// Companies table
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  currency: text('currency').notNull().default('NGN'),
  currencySymbol: text('currency_symbol').notNull().default('₦'),
  financialYearStart: integer('financial_year_start').notNull().default(1), // Month (1-12)
  phoneNumber: text('phone_number'),
  email: text('email'),
  address: text('address'),
  taxNumber: text('tax_number'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Company Users (many-to-many)
export const companyUsers = pgTable('company_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  role: text('role').notNull().default('staff'), // owner, staff
  permissions: jsonb('permissions').default([]),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
}, (table) => {
  return {
    uniqueUserCompany: uniqueIndex('unique_user_company').on(table.companyId, table.userId),
  };
});

// Chart of Accounts
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  code: text('code').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // asset, liability, equity, revenue, expense
  category: text('category'), // sales, cogs, expense, bank, cash, vat_payable, vat_receivable
  parentId: uuid('parent_id').references(() => accounts.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    companyCodeIdx: uniqueIndex('company_code_idx').on(table.companyId, table.code),
  };
});

// Journal Entries
export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  entryDate: timestamp('entry_date').notNull(),
  reference: text('reference'),
  narration: text('narration').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  status: text('status').notNull().default('posted'), // draft, posted, void
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    companyDateIdx: index('company_date_idx').on(table.companyId, table.entryDate),
  };
});

// Journal Entry Lines
export const journalLines = pgTable('journal_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  journalEntryId: uuid('journal_entry_id').notNull().references(() => journalEntries.id),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  debit: decimal('debit', { precision: 15, scale: 2 }).notNull().default('0'),
  credit: decimal('credit', { precision: 15, scale: 2 }).notNull().default('0'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    journalAccountIdx: index('journal_account_idx').on(table.journalEntryId, table.accountId),
  };
});

// Customers
export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  email: text('email'),
  phoneNumber: text('phone_number'),
  address: text('address'),
  taxNumber: text('tax_number'),
  balance: decimal('balance', { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    companyNameIdx: index('company_name_idx').on(table.companyId, table.name),
  };
});

// Invoices
export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  invoiceNumber: text('invoice_number').notNull(),
  invoiceDate: timestamp('invoice_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: text('status').notNull().default('draft'), // draft, sent, paid, overdue, cancelled
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull().default('0'),
  vatAmount: decimal('vat_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  paidAmount: decimal('paid_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  notes: text('notes'),
  paystackReference: text('paystack_reference'),
  paystackPaymentUrl: text('paystack_payment_url'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    companyNumberIdx: uniqueIndex('company_number_idx').on(table.companyId, table.invoiceNumber),
    statusIdx: index('status_idx').on(table.status),
  };
});

// Invoice Items
export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  description: text('description').notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
  vatRate: decimal('vat_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  accountId: uuid('account_id').references(() => accounts.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Expenses
export const expenses = pgTable('expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  vatAmount: decimal('vat_amount', { precision: 15, scale: 2 }).notNull().default('0'),
  vatInclusive: boolean('vat_inclusive').notNull().default(false),
  accountId: uuid('account_id').notNull().references(() => accounts.id),
  paymentAccountId: uuid('payment_account_id').notNull().references(() => accounts.id),
  receiptUrl: text('receipt_url'),
  vendor: text('vendor'),
  reference: text('reference'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    companyDateIdx: index('expense_company_date_idx').on(table.companyId, table.date),
  };
});

// Auth Sessions
export const authSessions = pgTable('auth_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  deviceToken: text('device_token').notNull().unique(),
  deviceInfo: jsonb('device_info'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    userIdx: index('user_idx').on(table.userId),
    tokenIdx: index('token_idx').on(table.deviceToken),
  };
});

// OTP Codes
export const otpCodes = pgTable('otp_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  phoneNumber: text('phone_number').notNull(),
  code: text('code').notNull(),
  attempts: integer('attempts').notNull().default(0),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    phoneIdx: index('otp_phone_idx').on(table.phoneNumber),
    codeIdx: index('otp_code_idx').on(table.code),
  };
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  companies: many(companies),
  companyUsers: many(companyUsers),
  journalEntries: many(journalEntries),
  invoices: many(invoices),
  expenses: many(expenses),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, {
    fields: [companies.ownerId],
    references: [users.id],
  }),
  companyUsers: many(companyUsers),
  accounts: many(accounts),
  journalEntries: many(journalEntries),
  customers: many(customers),
  invoices: many(invoices),
  expenses: many(expenses),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [accounts.companyId],
    references: [companies.id],
  }),
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
  }),
  children: many(accounts),
  journalLines: many(journalLines),
  expenses: many(expenses),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  company: one(companies, {
    fields: [journalEntries.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [journalEntries.createdBy],
    references: [users.id],
  }),
  lines: many(journalLines),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  createdBy: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
})); 