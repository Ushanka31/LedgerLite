'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EnhancedNavbar from '@/app/components/dashboard/EnhancedNavbar';
import DateRangeSelector from '@/app/components/dashboard/DateRangeSelector';
import ProfileSettingsModal from '@/app/components/modals/ProfileSettingsModal';
import CompanySettingsModal from '@/app/components/modals/CompanySettingsModal';

export default function ProfitAnalyticsPage() {
  const [selectedDateRange, setSelectedDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [profitData, setProfitData] = useState({
    totalProfit: 0,
    averageMonthlyProfit: 0,
    profitMargin: 0,
    bestMonth: '',
    worstMonth: '',
    monthlyBreakdown: [],
    revenueTotal: 0,
    expenseTotal: 0,
    profitTrend: 'positive'
  });
  const router = useRouter();

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

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

  // Fetch and analyze profit data
  useEffect(() => {
    fetchProfitData();
  }, [selectedDateRange, customDateRange]);

  const getDateRange = (range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        };
      
      case 'week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return { start: startOfWeek, end: endOfWeek };
      
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return { start: startOfMonth, end: endOfMonth };
      
      case 'ytd':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        return { start: startOfYear, end: endOfYear };
      
      case 'custom':
        if (customDateRange?.start && customDateRange?.end) {
          const start = new Date(customDateRange.start);
          const end = new Date(customDateRange.end);
          end.setHours(23, 59, 59, 999);
          return { start, end };
        }
        return { start: null, end: null };
      
      case 'all':
      default:
        return { start: null, end: null };
    }
  };

  const filterTransactionsByDateRange = (transactions, range) => {
    if (range === 'all') return transactions;
    
    const { start, end } = getDateRange(range);
    if (!start || !end) return transactions;
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= start && transactionDate <= end;
    });
  };

  const fetchProfitData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/transactions?limit=1000');
      const result = await response.json();
      
      if (result.success) {
        const allTransactions = result.transactions;
        const filteredTransactions = filterTransactionsByDateRange(allTransactions, selectedDateRange);
        
        setTransactions(filteredTransactions);
        analyzeProfitData(filteredTransactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
      setProfitData({
        totalProfit: 0,
        averageMonthlyProfit: 0,
        profitMargin: 0,
        bestMonth: '',
        worstMonth: '',
        monthlyBreakdown: [],
        revenueTotal: 0,
        expenseTotal: 0,
        profitTrend: 'stable'
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeProfitData = (transactionData) => {
    const revenue = transactionData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactionData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalProfit = revenue - expenses;
    const profitMargin = revenue > 0 ? ((totalProfit / revenue) * 100) : 0;

    // Monthly breakdown analysis
    const monthlyData = {};
    transactionData.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, expenses: 0, profit: 0 };
      }
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].revenue += transaction.amount;
      } else if (transaction.type === 'expense') {
        monthlyData[monthKey].expenses += transaction.amount;
      }
      
      monthlyData[monthKey].profit = monthlyData[monthKey].revenue - monthlyData[monthKey].expenses;
    });

    const monthlyBreakdown = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data,
        monthName: new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Find best and worst months
    let bestMonth = '';
    let worstMonth = '';
    let highestProfit = -Infinity;
    let lowestProfit = Infinity;

    monthlyBreakdown.forEach(month => {
      if (month.profit > highestProfit) {
        highestProfit = month.profit;
        bestMonth = month.monthName;
      }
      if (month.profit < lowestProfit) {
        lowestProfit = month.profit;
        worstMonth = month.monthName;
      }
    });

    // Calculate average monthly profit
    const averageMonthlyProfit = monthlyBreakdown.length > 0 
      ? monthlyBreakdown.reduce((sum, month) => sum + month.profit, 0) / monthlyBreakdown.length
      : 0;

    // Determine profit trend
    let profitTrend = 'stable';
    if (monthlyBreakdown.length >= 2) {
      const recentMonths = monthlyBreakdown.slice(-3);
      const profitChanges = recentMonths.slice(1).map((month, index) => 
        month.profit - recentMonths[index].profit
      );
      const avgChange = profitChanges.reduce((sum, change) => sum + change, 0) / profitChanges.length;
      
      if (avgChange > 0) profitTrend = 'positive';
      else if (avgChange < 0) profitTrend = 'negative';
    }

    setProfitData({
      totalProfit,
      averageMonthlyProfit,
      profitMargin,
      bestMonth: bestMonth || 'N/A',
      worstMonth: worstMonth || 'N/A',
      monthlyBreakdown,
      revenueTotal: revenue,
      expenseTotal: expenses,
      profitTrend
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDisplayName = (range) => {
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

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'positive':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'negative':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  // Modal handlers
  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    console.log('User profile updated:', updatedUser);
  };

  const handleOpenProfileModal = () => {
    setShowProfileModal(true);
  };

  const handleOpenCompanyModal = () => {
    setShowCompanyModal(true);
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Enhanced Navigation */}
      <EnhancedNavbar 
        user={user}
        setupProgress={100}
        syncStatus="synced"
        lastSync="now"
        onUserUpdate={handleUserUpdate}
        onOpenProfileModal={handleOpenProfileModal}
        onOpenCompanyModal={handleOpenCompanyModal}
      />

      {/* Main Content */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/dashboard"
                  className="text-slate-600 hover:text-slate-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-3xl font-bold text-dark">Net Profit Analytics</h1>
              </div>
              <p className="text-medium">
                Comprehensive analysis of your business profitability and financial performance.
              </p>
              {/* Period indicator */}
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <span>Showing</span>
                <span className="font-medium text-slate-800">{getDisplayName(selectedDateRange)}</span>
                {transactions.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-slate-800">{transactions.length}</span>
                    <span>transaction{transactions.length !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Period Selector */}
            <DateRangeSelector 
              selected={selectedDateRange}
              onSelect={setSelectedDateRange}
              customDateRange={customDateRange}
              onCustomDateChange={setCustomDateRange}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-slate-600">Loading profit analytics...</span>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Net Profit */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Net Profit</p>
                      <p className={`text-2xl font-bold ${profitData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profitData.totalProfit)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${profitData.totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <svg className={`w-6 h-6 ${profitData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Profit Margin */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Profit Margin</p>
                      <p className={`text-2xl font-bold ${profitData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitData.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-100">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Average Monthly Profit */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Avg Monthly Profit</p>
                      <p className={`text-2xl font-bold ${profitData.averageMonthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profitData.averageMonthlyProfit)}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Profit Trend */}
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Profit Trend</p>
                      <p className="text-lg font-semibold text-slate-800 capitalize">
                        {profitData.profitTrend}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-slate-100">
                      {getTrendIcon(profitData.profitTrend)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue vs Expenses Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Total Revenue</h3>
                  <p className="text-3xl font-bold text-green-600 mb-2">
                    {formatCurrency(profitData.revenueTotal)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: profitData.revenueTotal + profitData.expenseTotal > 0 
                          ? `${(profitData.revenueTotal / (profitData.revenueTotal + profitData.expenseTotal)) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Total Expenses</h3>
                  <p className="text-3xl font-bold text-red-600 mb-2">
                    {formatCurrency(profitData.expenseTotal)}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ 
                        width: profitData.revenueTotal + profitData.expenseTotal > 0 
                          ? `${(profitData.expenseTotal / (profitData.revenueTotal + profitData.expenseTotal)) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Net Result</h3>
                  <p className={`text-3xl font-bold mb-2 ${profitData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(profitData.totalProfit)}
                  </p>
                  <p className="text-sm text-slate-600">
                    {profitData.totalProfit >= 0 ? 'Profit' : 'Loss'}
                  </p>
                </div>
              </div>

              {/* Monthly Breakdown */}
              {profitData.monthlyBreakdown.length > 0 && (
                <div className="glass-card p-6 mb-8">
                  <h3 className="text-lg font-semibold text-slate-800 mb-6">Monthly Profit Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-slate-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-slate-700">Month</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-700">Revenue</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-700">Expenses</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-700">Net Profit</th>
                          <th className="text-right py-3 px-4 font-medium text-slate-700">Margin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {profitData.monthlyBreakdown.map((month, index) => {
                          const margin = month.revenue > 0 ? ((month.profit / month.revenue) * 100) : 0;
                          return (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium text-slate-800">
                                {month.monthName}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-green-600">
                                {formatCurrency(month.revenue)}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-red-600">
                                {formatCurrency(month.expenses)}
                              </td>
                              <td className={`py-3 px-4 text-right font-bold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(month.profit)}
                              </td>
                              <td className={`py-3 px-4 text-right font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {margin.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Best and Worst Performance */}
              {profitData.bestMonth !== 'N/A' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">Best Performing Month</h3>
                    </div>
                    <p className="text-xl font-bold text-green-600 mb-1">{profitData.bestMonth}</p>
                    <p className="text-sm text-slate-600">Highest net profit in the selected period</p>
                  </div>

                  {profitData.worstMonth !== profitData.bestMonth && (
                    <div className="glass-card p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-full bg-red-100">
                          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-5 5-5-5" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800">Challenging Month</h3>
                      </div>
                      <p className="text-xl font-bold text-red-600 mb-1">{profitData.worstMonth}</p>
                      <p className="text-sm text-slate-600">Lowest net profit in the selected period</p>
                    </div>
                  )}
                </div>
              )}

              {/* No Data State */}
              {transactions.length === 0 && (
                <div className="glass-card p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium mb-2">No profit data for this period</p>
                  <p className="text-sm text-slate-500 mb-4">
                    Start recording revenue and expenses to see profit analytics
                  </p>
                  <Link href="/dashboard" className="glass-button-primary">
                    Go to Dashboard
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUpdate={handleUserUpdate}
      />

      {/* Company Settings Modal */}
      <CompanySettingsModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
      />
    </div>
  );
} 