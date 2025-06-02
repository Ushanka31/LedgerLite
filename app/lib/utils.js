import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import currencySymbolMap from 'currency-symbol-map';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(amount, currency = 'NGN') {
  const symbol = currencySymbolMap(currency) || currency;
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${symbol}${formatted}`;
}

// Format date
export function formatDate(date, format = 'medium') {
  const d = new Date(date);
  
  if (format === 'medium') {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  }
  
  if (format === 'long') {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  }
  
  if (format === 'input') {
    return d.toISOString().split('T')[0];
  }
  
  return d.toLocaleDateString('en-NG');
}

// Generate invoice number
export function generateInvoiceNumber(lastNumber = 0) {
  const year = new Date().getFullYear();
  const nextNumber = (lastNumber + 1).toString().padStart(5, '0');
  return `INV-${year}-${nextNumber}`;
}

// Generate reference number
export function generateReference(prefix = 'REF') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

// Calculate VAT
export function calculateVAT(amount, rate = 7.5, inclusive = false) {
  if (inclusive) {
    const vatAmount = amount - (amount / (1 + rate / 100));
    return {
      amount: amount - vatAmount,
      vatAmount,
      total: amount,
    };
  } else {
    const vatAmount = amount * (rate / 100);
    return {
      amount,
      vatAmount,
      total: amount + vatAmount,
    };
  }
}

// Format phone number
export function formatPhoneNumber(phone, countryCode = '+234') {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Remove country code if present
  const withoutCountry = cleaned.startsWith('234') ? cleaned.slice(3) : cleaned;
  
  // Remove leading zero if present
  const number = withoutCountry.startsWith('0') ? withoutCountry.slice(1) : withoutCountry;
  
  // Format as +234 XXX XXXX XXXX
  if (number.length === 10) {
    return `${countryCode} ${number.slice(0, 3)} ${number.slice(3, 7)} ${number.slice(7)}`;
  }
  
  return `${countryCode}${number}`;
}

// Validate Nigerian phone number
export function validatePhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '');
  const pattern = /^(234|0)?[789][01]\d{8}$/;
  return pattern.test(cleaned);
}

// Generate OTP
export function generateOTP(length = 6) {
  return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
}

// Get financial year dates
export function getFinancialYearDates(startMonth = 1, year = new Date().getFullYear()) {
  const startDate = new Date(year, startMonth - 1, 1);
  const endDate = new Date(year + 1, startMonth - 1, 0);
  
  return {
    startDate,
    endDate,
    year: `${year}/${year + 1}`,
  };
}

// Get date range for reports
export function getDateRange(period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        startDate: today,
        endDate: today,
      };
    
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: yesterday,
        endDate: yesterday,
      };
    
    case 'last7days':
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      return {
        startDate: last7,
        endDate: today,
      };
    
    case 'last30days':
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 30);
      return {
        startDate: last30,
        endDate: today,
      };
    
    case 'thisMonth':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    
    case 'lastMonth':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    
    case 'thisYear':
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31),
      };
    
    default:
      return {
        startDate: today,
        endDate: today,
      };
  }
}

// Check if user has permission
export function hasPermission(user, permission) {
  if (user.role === 'owner') return true;
  
  const permissions = user.permissions || [];
  return permissions.includes(permission);
}

// Export permissions
export const PERMISSIONS = {
  // Transactions
  CREATE_JOURNAL: 'create_journal',
  EDIT_JOURNAL: 'edit_journal',
  DELETE_JOURNAL: 'delete_journal',
  
  // Invoicing
  CREATE_INVOICE: 'create_invoice',
  EDIT_INVOICE: 'edit_invoice',
  DELETE_INVOICE: 'delete_invoice',
  
  // Expenses
  CREATE_EXPENSE: 'create_expense',
  EDIT_EXPENSE: 'edit_expense',
  DELETE_EXPENSE: 'delete_expense',
  
  // Reports
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  
  // Settings
  MANAGE_COMPANY: 'manage_company',
  MANAGE_USERS: 'manage_users',
  MANAGE_ACCOUNTS: 'manage_accounts',
};

// Default permissions for staff
export const DEFAULT_STAFF_PERMISSIONS = [
  PERMISSIONS.CREATE_JOURNAL,
  PERMISSIONS.CREATE_INVOICE,
  PERMISSIONS.CREATE_EXPENSE,
  PERMISSIONS.VIEW_REPORTS,
]; 