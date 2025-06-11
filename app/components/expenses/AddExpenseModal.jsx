'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const expenseSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(1, 'Description is required'),
  vendor: z.string().min(1, 'Vendor is required'),
  date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
});

// Business expense categories
const EXPENSE_CATEGORIES = [
  { value: 'Salary Payment', label: 'Salary Payment' },
  { value: 'Contractor Payment', label: 'Contractor Payment' },
  { value: 'Employee Benefits', label: 'Employee Benefits' },
  { value: 'Office Supplies', label: 'Office Supplies' },
  { value: 'Travel & Transportation', label: 'Travel & Transportation' },
  { value: 'Utilities', label: 'Utilities (Electricity, Internet, Water)' },
  { value: 'Marketing & Advertising', label: 'Marketing & Advertising' },
  { value: 'Professional Services', label: 'Professional Services (Legal, Accounting)' },
  { value: 'Software & Technology', label: 'Software & Technology' },
  { value: 'Rent & Facilities', label: 'Rent & Facilities' },
  { value: 'Equipment & Maintenance', label: 'Equipment & Maintenance' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Meals & Entertainment', label: 'Meals & Entertainment' },
  { value: 'Other', label: 'Other' },
];

export default function AddExpenseModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: '',
      description: '',
      vendor: '',
      date: new Date().toISOString().split('T')[0], // Today's date
      category: 'Salary Payment', // Default to first category
    },
  });

  const handleSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      // Convert amount to number (remove currency symbols and commas)
      const cleanAmount = parseFloat(data.amount.replace(/[₦,$,]/g, ''));
      
      // Use the selected date but with current time
      const selectedDate = new Date(data.date);
      const currentTime = new Date();
      const transactionDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        currentTime.getHours(),
        currentTime.getMinutes(),
        currentTime.getSeconds(),
        currentTime.getMilliseconds()
      );
      
      const expenseData = {
        ...data,
        amount: cleanAmount,
        type: 'expense',
        date: transactionDate.toISOString(),
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add expense');
      }

      // Success - close modal and call success callback
      form.reset();
      onSuccess?.(result.transaction);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const num = parseFloat(value.replace(/[₦,$,]/g, ''));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    const formatted = formatCurrency(value);
    form.setValue('amount', formatted);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative glass-card p-8 w-full max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-dark">Add Expense</h2>
              <p className="text-medium text-sm mt-1">Record a new expense transaction</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-light hover:text-dark rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Amount *
              </label>
              <input
                {...form.register('amount')}
                type="text"
                placeholder="₦5,000"
                className="w-full glass-input text-right text-xl font-semibold"
                disabled={loading}
                onChange={handleAmountChange}
              />
              {form.formState.errors.amount && (
                <p className="mt-2 text-sm text-red-600">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Description *
              </label>
              <input
                {...form.register('description')}
                type="text"
                placeholder="Office supplies, fuel, rent..."
                className="w-full glass-input"
                disabled={loading}
              />
              {form.formState.errors.description && (
                <p className="mt-2 text-sm text-red-600">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Vendor *
              </label>
              <input
                {...form.register('vendor')}
                type="text"
                placeholder="Vendor or supplier name"
                className="w-full glass-input"
                disabled={loading}
              />
              {form.formState.errors.vendor && (
                <p className="mt-2 text-sm text-red-600">
                  {form.formState.errors.vendor.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Category *
              </label>
              <select
                {...form.register('category')}
                className="w-full glass-input"
                disabled={loading}
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.category && (
                <p className="mt-2 text-sm text-red-600">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Date *
              </label>
              <input
                {...form.register('date')}
                type="date"
                className="w-full glass-input"
                disabled={loading}
              />
              {form.formState.errors.date && (
                <p className="mt-2 text-sm text-red-600">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/50 backdrop-blur-sm">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-2xl font-medium hover:bg-slate-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 glass-button-primary py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin mr-2"></div>
                    Adding...
                  </div>
                ) : (
                  'Add Expense'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 