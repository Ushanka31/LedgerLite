'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedNavbar from '@/app/components/dashboard/EnhancedNavbar';

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
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

  // Fetch all activities (transactions + invoices)
  useEffect(() => {
    fetchActivities();
  }, [dateFilter]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // Fetch transactions and invoices in parallel
      const [transactionsResponse, invoicesResponse] = await Promise.all([
        fetch('/api/transactions?limit=100'),
        fetch('/api/invoices?limit=100')
      ]);

      const transactionsResult = await transactionsResponse.json();
      const invoicesResult = await invoicesResponse.json();

      let allActivities = [];

      // Transform transactions into activities
      if (transactionsResult.success) {
        const transactionActivities = transactionsResult.transactions.map(transaction => ({
          id: `transaction-${transaction.id}`,
          type: transaction.type === 'income' ? 'payment_received' : 'expense_added',
          title: transaction.type === 'income' ? 'Payment received' : 'Expense recorded',
          description: transaction.description || `${transaction.type} transaction`,
          amount: formatCurrency(transaction.amount),
          timestamp: transaction.createdAt,
          reference: transaction.reference,
          category: transaction.category || 'General',
          avatar: getAvatarFromDescription(transaction.description),
          avatarColor: transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500',
          icon: transaction.type === 'income' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          ),
          iconColor: transaction.type === 'income' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50',
        }));
        allActivities = [...allActivities, ...transactionActivities];
      }

      // Transform invoices into activities
      if (invoicesResult.success) {
        const invoiceActivities = invoicesResult.invoices.map(invoice => ({
          id: `invoice-${invoice.id}`,
          type: 'invoice_created',
          title: 'Invoice created',
          description: `Invoice ${invoice.invoiceNumber} for ${invoice.customerName}`,
          amount: formatCurrency(parseFloat(invoice.totalAmount)),
          timestamp: invoice.createdAt,
          reference: invoice.invoiceNumber,
          category: 'Invoicing',
          status: invoice.status,
          avatar: getAvatarFromName(invoice.customerName),
          avatarColor: 'bg-blue-500',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          iconColor: 'text-blue-600 bg-blue-50',
        }));
        allActivities = [...allActivities, ...invoiceActivities];
      }

      // Sort all activities by timestamp (newest first)
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply date filter
      const filteredActivities = filterByDate(allActivities, dateFilter);
      
      setActivities(filteredActivities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
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

  const getAvatarFromDescription = (description) => {
    if (!description) return '??';
    const words = description.split(' ');
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  };

  const getAvatarFromName = (name) => {
    if (!name) return '??';
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const filterByDate = (activities, dateFilter) => {
    if (dateFilter === 'all') return activities;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return activities.filter(activity => {
          const activityDate = new Date(activity.timestamp);
          return activityDate >= today;
        });
      
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return activities.filter(activity => {
          const activityDate = new Date(activity.timestamp);
          return activityDate >= weekAgo;
        });
      
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        return activities.filter(activity => {
          const activityDate = new Date(activity.timestamp);
          return activityDate >= monthAgo;
        });
      
      default:
        return activities;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleActivityClick = (activity) => {
    switch (activity.type) {
      case 'invoice_created':
        // Navigate to invoices page for now
        router.push('/invoices');
        break;
      case 'payment_received':
        router.push('/transactions');
        break;
      case 'expense_added':
        router.push('/expenses');
        break;
      default:
        console.log('Activity clicked:', activity);
    }
  };

  // Filter activities based on type filter
  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === filter);

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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Activity Log</h1>
                <p className="text-slate-600 mt-1">
                  Track all your business activities in one place
                </p>
              </div>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="glass-button-light"
              >
                ← Back to Dashboard
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="glass-input py-2 text-sm"
                >
                  <option value="all">All Activities</option>
                  <option value="invoice_created">Invoices</option>
                  <option value="payment_received">Payments</option>
                  <option value="expense_added">Expenses</option>
                </select>
                
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="glass-input py-2 text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              
              <div className="text-sm text-slate-600 flex items-center">
                {loading ? 'Loading...' : `${filteredActivities.length} activities`}
              </div>
            </div>
          </div>

          {/* Activity List */}
          <div className="glass-card">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading activities...</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-600 font-medium">No activities found</p>
                <p className="text-sm text-slate-500 mt-1">
                  {filter === 'all' 
                    ? 'Start by creating an invoice or recording a transaction'
                    : `No ${filter.replace('_', ' ')} activities for this period`
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    onClick={() => handleActivityClick(activity)}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl ${activity.iconColor} flex items-center justify-center flex-shrink-0`}>
                        {activity.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-slate-800 group-hover:text-slate-900">
                              {activity.title}
                            </h4>
                            <p className="text-sm text-slate-600 truncate">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-slate-500">
                                {formatTimestamp(activity.timestamp)}
                              </span>
                              {activity.reference && (
                                <>
                                  <span className="text-xs text-slate-400">•</span>
                                  <span className="text-xs text-slate-500 font-mono">
                                    {activity.reference}
                                  </span>
                                </>
                              )}
                              {activity.status && (
                                <>
                                  <span className="text-xs text-slate-400">•</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    activity.status === 'sent' ? 'bg-green-100 text-green-700' :
                                    activity.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {activity.status}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Amount and Avatar */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-sm font-semibold text-slate-800">
                              {activity.amount}
                            </span>
                            <div className={`w-8 h-8 ${activity.avatarColor} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
                              {activity.avatar}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 