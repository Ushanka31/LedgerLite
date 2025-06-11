'use client';

import { useState, useEffect } from 'react';

// Business expense categories (matching AddExpenseModal)
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

export default function ExpenseDetailsModal({ isOpen, onClose, expense, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    vendor: '',
    date: '',
    category: '',
  });

  // Pre-fill form when expense data changes
  useEffect(() => {
    if (expense && isOpen) {
      const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: 'NGN',
          minimumFractionDigits: 0,
        }).format(amount);
      };

      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      setFormData({
        amount: formatAmount(expense.amount),
        description: expense.description || '',
        vendor: expense.vendor || '',
        date: formatDate(expense.date),
        category: expense.category || 'Office Supplies',
      });
    }
  }, [expense, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Convert amount to number (remove currency symbols and commas)
      const cleanAmount = parseFloat(formData.amount.replace(/[₦,$,]/g, ''));
      
      // Use the selected date but with current time
      const selectedDate = new Date(formData.date);
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
        ...formData,
        amount: cleanAmount,
        type: 'expense',
        date: transactionDate.toISOString(),
      };

      const response = await fetch(`/api/transactions/${expense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update expense');
      }

      // Success - close modal and call success callback
      setIsEditing(false);
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
    setFormData({ ...formData, amount: formatted });
  };

  const handleClose = () => {
    setIsEditing(false);
    setError('');
    onClose();
  };

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative glass-card p-8 w-full max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {isEditing ? 'Edit Expense' : 'Expense Details'}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {isEditing ? 'Update expense information' : 'View expense details'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Form/Details */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Amount
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.amount}
                  onChange={handleAmountChange}
                  placeholder="₦5,000"
                  className="w-full glass-input text-right text-xl font-semibold"
                  disabled={loading}
                  required
                />
              ) : (
                <div className="w-full glass-input text-right text-xl font-semibold bg-gray-50">
                  {formatCurrency(expense.amount.toString())}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Office supplies, fuel, rent..."
                  className="w-full glass-input"
                  disabled={loading}
                  required
                />
              ) : (
                <div className="w-full glass-input bg-gray-50">
                  {expense.description}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vendor
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Vendor or supplier name"
                  className="w-full glass-input"
                  disabled={loading}
                  required
                />
              ) : (
                <div className="w-full glass-input bg-gray-50">
                  {expense.vendor || 'Not specified'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              {isEditing ? (
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full glass-input"
                  disabled={loading}
                  required
                >
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full glass-input bg-gray-50">
                  {expense.category || 'General'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full glass-input"
                  disabled={loading}
                  required
                />
              ) : (
                <div className="w-full glass-input bg-gray-50">
                  {new Date(expense.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
            </div>

            {/* Reference (read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Reference
              </label>
              <div className="w-full glass-input bg-gray-50 font-mono text-sm">
                {expense.reference || 'N/A'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 glass-button"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 primary-button"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Expense'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 glass-button"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 primary-button"
                  >
                    Edit Expense
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 