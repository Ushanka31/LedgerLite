'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedNavbar from '@/app/components/dashboard/EnhancedNavbar';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
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

  // Fetch transactions
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/transactions?limit=100');
      const result = await response.json();
      
      if (result.success) {
        setTransactions(result.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type) => {
    return type === 'income' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-red-100 text-red-700';
  };

  const getTypeIcon = (type) => {
    return type === 'income' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    );
  };

  // Filter transactions based on type filter
  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(transaction => transaction.type === filter);

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
                <h1 className="text-3xl font-bold text-slate-800">Transactions</h1>
                <p className="text-slate-600 mt-1">
                  View all your business transactions in one place
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
                  onClick={() => alert('Add transaction feature - use dashboard quick actions for now')}
                  className="glass-button-primary"
                >
                  + Add Transaction
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="glass-input py-2 text-sm"
              >
                <option value="all">All Transactions</option>
                <option value="income">Income Only</option>
                <option value="expense">Expenses Only</option>
              </select>
              
              <div className="text-sm text-slate-600 flex items-center px-3">
                {loading ? 'Loading...' : `${filteredTransactions.length} transactions`}
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="glass-card">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading transactions...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium">No transactions found</p>
                <p className="text-sm text-slate-500 mt-1">
                  {filter === 'all' 
                    ? 'Start by adding income or expense transactions'
                    : `No ${filter} transactions recorded yet`
                  }
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
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Type</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Category</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Amount</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Reference</th>
                      <th className="text-left py-4 px-6 font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50">
                        <td className="py-4 px-6 text-slate-600">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                              transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                              {getTypeIcon(transaction.type)}
                            </div>
                            <div>
                              <div className="font-medium text-slate-800">
                                {transaction.description || `${transaction.type} transaction`}
                              </div>
                              {transaction.vendor && (
                                <div className="text-sm text-slate-500">
                                  {transaction.vendor}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(transaction.type)}`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-slate-600">
                            {transaction.category || 'General'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {transaction.reference && (
                            <span className="text-sm font-mono text-slate-500">
                              {transaction.reference}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => alert(`Transaction details for ${transaction.id} - Feature coming soon!`)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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