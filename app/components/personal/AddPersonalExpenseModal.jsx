'use client';

import { useState } from 'react';
import { personalExpenseCategories, getAllGroups } from '@/app/lib/personalCategories';

export default function AddPersonalExpenseModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash', // cash, card, bank_transfer
    vendor: '',
    recurring: false,
    frequency: 'monthly',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const groups = getAllGroups();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/personal/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result.transaction);
        handleClose();
      } else {
        setError(result.error || 'Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      vendor: '',
      recurring: false,
      frequency: 'monthly',
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200/50 sticky top-0 bg-white/95 backdrop-blur-sm">
          <h2 className="text-xl font-semibold">Add Personal Expense</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Amount (₦)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="glass-input w-full"
                placeholder="0.00"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="glass-input w-full"
                required
              >
                <option value="">Select category</option>
                {groups.map((group) => (
                  <optgroup key={group} label={group}>
                    {personalExpenseCategories
                      .filter(cat => cat.group === group)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="glass-input w-full"
                placeholder="e.g., Weekly groceries, Electric bill"
                required
              />
            </div>

            {/* Vendor/Merchant */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vendor/Merchant (Optional)
              </label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="glass-input w-full"
                placeholder="e.g., Shoprite, AEDC"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="glass-input w-full"
                required
              >
                <option value="cash">Cash</option>
                <option value="card">Debit/Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="glass-input w-full"
                required
              />
            </div>

            {/* Recurring Expense */}
            <div className="border-t border-slate-200/50 pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700">
                  This is a recurring expense
                </span>
              </label>
            </div>

            {/* Frequency (if recurring) */}
            {formData.recurring && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="glass-input w-full"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="glass-button flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button flex-1"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 