'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const saleSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(1, 'Description is required'),
  customer: z.string().min(1, 'Customer is required'),
  date: z.string().min(1, 'Date is required'),
  category: z.string().default('sales'),
});

export default function AddSaleModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      amount: '',
      description: '',
      customer: '',
      date: new Date().toISOString().split('T')[0], // Today's date
      category: 'sales',
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
      
      const saleData = {
        ...data,
        amount: cleanAmount,
        type: 'income',
        date: transactionDate.toISOString(),
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add sale');
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
              <h2 className="text-2xl font-bold text-dark">Add Sale</h2>
              <p className="text-medium text-sm mt-1">Record a new revenue transaction</p>
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
                placeholder="₦10,000"
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
                placeholder="Product sold, service provided..."
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
                Customer *
              </label>
              <input
                {...form.register('customer')}
                type="text"
                placeholder="Customer name or company"
                className="w-full glass-input"
                disabled={loading}
              />
              {form.formState.errors.customer && (
                <p className="mt-2 text-sm text-red-600">
                  {form.formState.errors.customer.message}
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
                  'Add Sale'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 