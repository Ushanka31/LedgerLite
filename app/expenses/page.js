'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedNavbar from '@/app/components/dashboard/EnhancedNavbar';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const initialForm = {
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    description: '',
    amount: '',
    category: 'Salary Payment',
  };
  const [formData, setFormData] = useState(initialForm);
  const router = useRouter();

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        const result = await response.json();
        
        if (result.success) {
          setUser(result.user);
        } else {
          console.error('Failed to fetch user:', result.error);
          if (response.status === 401) {
            router.push('/auth/login');
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [router]);

  // Fetch expenses (from transactions)
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/transactions?type=expense&limit=50');
      const result = await response.json();
      
      if (result.success) {
        const sorted = (result.transactions || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        setExpenses(sorted);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '';

    let num;
    if (typeof value === 'number') {
      num = value;
    } else {
      // Treat as string
      const cleaned = value.toString().replace(/[^0-9.]/g, '');
      num = parseFloat(cleaned);
    }

    if (isNaN(num)) return value;

    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Office Supplies': 'bg-blue-100 text-blue-700',
      'Marketing': 'bg-purple-100 text-purple-700',
      'Travel': 'bg-green-100 text-green-700',
      'Utilities': 'bg-orange-100 text-orange-700',
      'Professional Services': 'bg-indigo-100 text-indigo-700',
      'Software': 'bg-pink-100 text-pink-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const categoryOptions = [
    'Salary Payment',
    'Contractor Payment',
    'Employee Benefits',
    'Office Supplies',
    'Travel & Transportation',
    'Utilities (Electricity, Internet, Water)',
    'Marketing & Advertising',
    'Professional Services (Legal, Accounting)',
    'Software & Technology',
    'Rent & Facilities',
    'Equipment & Maintenance',
    'Insurance',
    'Meals & Entertainment',
    'Other',
  ];

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    const formatted = formatCurrency(value);
    setFormData((prev) => ({ ...prev, amount: formatted }));
  };

  const submitNewExpense = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');

    const { vendor, description, amount, date, category } = formData;
    if (!vendor || !description || !amount || !date) {
      setAddError('All fields except category are required');
      setAddLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'expense',
          vendor,
          description,
          amount: parseFloat(amount.replace(/[^0-9.]/g, '')),
          date,
          category,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add expense');
      }

      // Refresh list
      fetchExpenses();
      setShowAddModal(false);
      setFormData(initialForm);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <EnhancedNavbar 
        user={user}
        setupProgress={100}
        syncStatus="synced"
        lastSync="now"
      />

      {/* Main Content */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Expenses</h1>
                <p className="text-slate-600 mt-1">
                  Track and manage all your business expenses
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="glass-button-light"
                >
                  ← Dashboard
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="glass-button-primary"
                >
                  + Add Expense
                </button>
              </div>
            </div>
          </div>

          {/* Expenses List */}
          <div className="glass-card">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading expenses...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium">No expenses recorded</p>
                <p className="text-sm text-slate-500 mt-1">
                  Start recording expenses to track your business costs
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="glass-button-primary mt-4"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Date</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Description</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Category</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Amount</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Reference</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-slate-50">
                        <td className="py-4 px-6 text-slate-600">
                          {formatDate(expense.date)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">
                                {expense.description || 'Expense transaction'}
                              </div>
                              {expense.vendor && (
                                <div className="text-sm text-slate-500">
                                  {expense.vendor}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                            {expense.category || 'General'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-red-600">
                            -{formatCurrency(expense.amount)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {expense.reference && (
                            <span className="text-sm font-mono text-slate-500">
                              {expense.reference}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => setSelectedExpense(expense)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Details Modal */}
          {selectedExpense && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedExpense(null)}
            >
              <div
                className="glass-card w-full max-w-md mx-auto p-6 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 text-xl font-bold"
                  aria-label="Close details"
                >
                  ×
                </button>

                <h2 className="text-2xl font-bold text-slate-800 mb-4">Expense Details</h2>

                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-slate-600 font-medium">Date</dt>
                    <dd className="text-slate-800">{formatDate(selectedExpense.date)}</dd>
                  </div>

                  <div className="flex justify-between">
                    <dt className="text-slate-600 font-medium">Description</dt>
                    <dd className="text-slate-800 text-right max-w-[60%] break-words">{selectedExpense.description || '—'}</dd>
                  </div>

                  {selectedExpense.vendor && (
                    <div className="flex justify-between">
                      <dt className="text-slate-600 font-medium">Vendor</dt>
                      <dd className="text-slate-800">{selectedExpense.vendor}</dd>
                    </div>
                  )}

                  {selectedExpense.category && (
                    <div className="flex justify-between">
                      <dt className="text-slate-600 font-medium">Category</dt>
                      <dd className="text-slate-800">{selectedExpense.category}</dd>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <dt className="text-slate-600 font-medium">Amount</dt>
                    <dd className="text-red-600 font-semibold">-{formatCurrency(selectedExpense.amount)}</dd>
                  </div>

                  {selectedExpense.reference && (
                    <div className="flex justify-between">
                      <dt className="text-slate-600 font-medium">Reference</dt>
                      <dd className="text-slate-800 font-mono">{selectedExpense.reference}</dd>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <dt className="text-slate-600 font-medium">Status</dt>
                    <dd className="text-slate-800 capitalize">{selectedExpense.status || 'posted'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Add Expense Modal */}
          {showAddModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            >
              <div
                className="glass-card w-full max-w-md mx-auto p-6 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 text-xl font-bold"
                  aria-label="Close add modal"
                >
                  ×
                </button>

                <h2 className="text-2xl font-bold text-slate-800 mb-4">Add Expense</h2>

                <form onSubmit={submitNewExpense} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleAddChange}
                      className="glass-input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
                    <input
                      type="text"
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleAddChange}
                      className="glass-input w-full"
                      placeholder="Vendor name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleAddChange}
                      className="glass-input w-full"
                      placeholder="Expense description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (NGN)</label>
                    <input
                      type="text"
                      name="amount"
                      value={formData.amount}
                      onChange={handleAmountChange}
                      className="glass-input w-full"
                      placeholder="₦5,000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleAddChange}
                      className="glass-input w-full"
                    >
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {addError && (
                    <p className="text-sm text-red-600">{addError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={addLoading}
                    className="w-full glass-button-primary py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addLoading ? 'Saving…' : 'Save Expense'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 