'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedNavbar from '@/app/components/dashboard/EnhancedNavbar';
import DateRangeSelector from '@/app/components/dashboard/DateRangeSelector';

export default function ExpenseAnalyticsPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [user, setUser] = useState({});
  const [analytics, setAnalytics] = useState({
    totalExpenses: 0,
    expenseCount: 0,
    averageExpense: 0,
    topCategories: [],
    monthlyTrend: [],
    recentExpenses: []
  });
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

  // Fetch expenses when date range changes
  useEffect(() => {
    fetchExpenses();
  }, [selectedDateRange, customDateRange]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/transactions?type=expense&limit=1000');
      const result = await response.json();
      
      if (result.success) {
        const allExpenses = result.transactions || [];
        const filteredExpenses = filterExpensesByDateRange(allExpenses, selectedDateRange);
        setExpenses(filteredExpenses);
        calculateAnalytics(filteredExpenses, allExpenses);
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExpensesByDateRange = (expenses, range) => {
    if (range === 'all') return expenses;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= today;
        });
      
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= weekAgo;
        });
      
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        return expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= monthAgo;
        });
      
      case 'ytd':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startOfYear;
        });
      
      case 'custom':
        if (customDateRange?.start && customDateRange?.end) {
          const start = new Date(customDateRange.start);
          const end = new Date(customDateRange.end);
          end.setHours(23, 59, 59, 999); // Include the entire end day
          return expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= start && expenseDate <= end;
          });
        }
        return expenses;
      
      default:
        return expenses;
    }
  };

  const calculateAnalytics = (filteredExpenses, allExpenses) => {
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expenseCount = filteredExpenses.length;
    const averageExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

    // Calculate top categories
    const categoryTotals = {};
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });

    const topCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
        count: filteredExpenses.filter(e => (e.category || 'Uncategorized') === category).length
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Calculate monthly trend (last 6 months)
    const monthlyTrend = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthExpenses = allExpenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthDate && expenseDate < nextMonthDate;
      });
      
      const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      monthlyTrend.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: monthTotal,
        count: monthExpenses.length
      });
    }

    // Get recent expenses (last 5)
    const recentExpenses = filteredExpenses
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    setAnalytics({
      totalExpenses,
      expenseCount,
      averageExpense,
      topCategories,
      monthlyTrend,
      recentExpenses
    });
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDateRangeDisplayName = (range) => {
    if (range === 'custom' && customDateRange?.start && customDateRange?.end) {
      const start = new Date(customDateRange.start);
      const end = new Date(customDateRange.end);
      
      const formatDate = (date) => {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
      };
      
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    
    const names = {
      'today': 'Today',
      'week': 'This Week', 
      'month': 'This Month',
      'ytd': 'Year to Date',
      'all': 'All Time',
      'custom': 'Custom Range'
    };
    return names[range] || 'This Month';
  };

  const getCategoryColor = (index) => {
    const colors = [
      'bg-red-500',
      'bg-orange-500', 
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500'
    ];
    return colors[index % colors.length];
  };

  const handleCustomDateChange = (dateRange) => {
    setCustomDateRange(dateRange);
  };

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range);
    // Reset custom date range if switching away from custom
    if (range !== 'custom') {
      setCustomDateRange(null);
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Expense Analytics</h1>
                <p className="text-slate-600 mt-1">
                  Detailed insights into your business expenses
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <span>Showing</span>
                  <span className="font-medium text-slate-800">{getDateRangeDisplayName(selectedDateRange)}</span>
                  {expenses.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-slate-800">{expenses.length}</span>
                      <span>expense{expenses.length !== 1 ? 's' : ''}</span>
                    </>
                  )}
                  {loading && (
                    <>
                      <span>•</span>
                      <span className="text-red-600">Loading...</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="glass-button-light"
                >
                  ← Dashboard
                </button>
                <DateRangeSelector 
                  selected={selectedDateRange}
                  onSelect={handleDateRangeChange}
                  customDateRange={customDateRange}
                  onCustomDateChange={handleCustomDateChange}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <span className="ml-2 text-slate-600">Loading expense analytics...</span>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="metric-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">Total Expenses</h3>
                  </div>
                  <p className="text-3xl font-bold text-red-600">{formatCurrency(analytics.totalExpenses)}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {analytics.expenseCount} transaction{analytics.expenseCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="metric-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">Average Expense</h3>
                  </div>
                  <p className="text-3xl font-bold text-orange-600">{formatCurrency(analytics.averageExpense)}</p>
                  <p className="text-sm text-slate-500 mt-1">Per transaction</p>
                </div>

                <div className="metric-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">Top Category</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-600">
                    {analytics.topCategories[0]?.category || 'None'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {analytics.topCategories[0] ? formatCurrency(analytics.topCategories[0].amount) : '₦0.00'}
                  </p>
                </div>
              </div>

              {/* Charts and Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Monthly Trend */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Monthly Trend</h3>
                  {analytics.monthlyTrend.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.monthlyTrend.map((month, index) => {
                        const maxAmount = Math.max(...analytics.monthlyTrend.map(m => m.amount));
                        const percentage = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
                        
                        return (
                          <div key={month.month} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-slate-700">{month.month}</span>
                              <span className="text-sm font-semibold text-red-600">{formatCurrency(month.amount)}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-slate-500">{month.count} transaction{month.count !== 1 ? 's' : ''}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p>No expense data available</p>
                    </div>
                  )}
                </div>

                {/* Top Categories */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Categories</h3>
                  {analytics.topCategories.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.topCategories.map((category, index) => (
                        <div key={category.category} className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${getCategoryColor(index)}`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-slate-700 truncate">
                                {category.category}
                              </span>
                              <span className="text-sm font-semibold text-slate-800">
                                {formatCurrency(category.amount)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <div className="w-full bg-slate-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${getCategoryColor(index)} transition-all duration-300`}
                                  style={{ width: `${category.percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-500 whitespace-nowrap">
                                {category.percentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {category.count} transaction{category.count !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p>No categories to display</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Expenses */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Recent Expenses</h3>
                  <button
                    onClick={() => router.push('/expenses')}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    View all expenses →
                  </button>
                </div>
                
                {analytics.recentExpenses.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.recentExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-slate-800 truncate">
                                {expense.description || 'Expense transaction'}
                              </p>
                              <p className="text-sm text-slate-500">
                                {expense.category || 'Uncategorized'} • {formatDate(expense.date)}
                              </p>
                            </div>
                            <span className="font-semibold text-red-600 whitespace-nowrap">
                              -{formatCurrency(expense.amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <p>No recent expenses to display</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 