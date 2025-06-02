'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedNavbar from '@/app/components/dashboard/EnhancedNavbar';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
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
        setExpenses(result.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
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
                  onClick={() => alert('Add expense feature - use dashboard quick actions for now')}
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
                            onClick={() => alert(`Expense details for ${expense.id} - Feature coming soon!`)}
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
        </div>
      </div>
    </div>
  );
} 