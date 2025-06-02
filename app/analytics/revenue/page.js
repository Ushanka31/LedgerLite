'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import Link from 'next/link';
import EnhancedNavbar from '@/app/components/dashboard/EnhancedNavbar';
import DateRangeSelector from '@/app/components/dashboard/DateRangeSelector';
import ProfileSettingsModal from '@/app/components/modals/ProfileSettingsModal';
import CompanySettingsModal from '@/app/components/modals/CompanySettingsModal';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function RevenueAnalyticsPage() {
  const [selectedDateRange, setSelectedDateRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [growth, setGrowth] = useState(0);
  const [averageOrder, setAverageOrder] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);

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
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  // Fetch revenue data
  useEffect(() => {
    fetchRevenueData();
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
        return { start: startOfWeek, end: new Date() };
      
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfMonth, end: new Date() };
      
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return { start: quarterStart, end: new Date() };
      
      case 'year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYear, end: new Date() };
      
      case 'ytd':
        const startOfYearYTD = new Date(now.getFullYear(), 0, 1);
        return { start: startOfYearYTD, end: new Date() };
      
      case 'all':
        return { start: null, end: null };
      
      case 'custom':
        if (customDateRange?.start && customDateRange?.end) {
          const start = new Date(customDateRange.start);
          const end = new Date(customDateRange.end);
          end.setHours(23, 59, 59, 999);
          return {
            start,
            end
          };
        }
        return { start: null, end: null };
      
      default:
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date() };
    }
  };

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      let startDate, endDate;
      
      if (selectedDateRange === 'custom' && customDateRange?.start && customDateRange?.end) {
        startDate = new Date(customDateRange.start);
        endDate = new Date(customDateRange.end);
      } else {
        const { start, end } = getDateRange(selectedDateRange);
        startDate = start;
        endDate = end;
      }

      // For API, only send custom dates if they're actually custom
      let queryParams = { period: selectedDateRange };
      if (selectedDateRange === 'custom' && customDateRange?.start && customDateRange?.end) {
        queryParams.startDate = startDate.toISOString();
        queryParams.endDate = endDate.toISOString();
      }

      const params = new URLSearchParams(queryParams);
      const response = await fetch(`/api/analytics/revenue?${params}`);
      const data = await response.json();

      if (data.success) {
        setChartData(data.chartData);
        setTotalRevenue(data.totalRevenue);
        setGrowth(data.growth);
        setAverageOrder(data.averageOrder);
        setTotalTransactions(data.totalTransactions);
      } else {
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
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

  const chartConfig = {
    labels: chartData.map(item => item.label),
    datasets: [
      {
        label: 'Revenue',
        data: chartData.map(item => item.value),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
        borderColor: 'rgba(148, 163, 184, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            return `Revenue: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          borderColor: 'rgba(148, 163, 184, 0.2)',
        },
        ticks: {
          color: '#64748b',
          font: {
            size: 12,
          },
          callback: function(value) {
            return formatCurrency(value);
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    if (growth < 0) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    );
  };

  const getPeriodDisplayName = (period) => {
    const names = {
      'today': 'Today',
      'week': 'This Week',
      'month': 'This Month',
      'quarter': 'This Quarter',
      'year': 'This Year',
      'ytd': 'Year to Date',
      'all': 'All Time',
      'custom': 'Custom Range'
    };
    if (period === 'custom' && customDateRange?.start && customDateRange?.end) {
      const startDate = new Date(customDateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endDate = new Date(customDateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startDate} - ${endDate}`;
    }
    return names[period] || 'This Month';
  };

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range);
    if (range !== 'custom') {
      setCustomDateRange(null);
    }
  };

  const handleCustomDateChange = (dateRange) => {
    setCustomDateRange(dateRange);
    setSelectedDateRange('custom');
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
                <h1 className="text-3xl font-bold text-dark">Revenue Analytics</h1>
              </div>
              <p className="text-medium">
                Detailed insights into your revenue performance and trends.
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <span>Showing</span>
                <span className="font-medium text-slate-800">{getPeriodDisplayName(selectedDateRange)}</span>
              </div>
            </div>
            
            {/* DateRangeSelector Component */}
            <DateRangeSelector 
              selected={selectedDateRange}
              onSelect={handleDateRangeChange}
              customDateRange={customDateRange}
              onCustomDateChange={handleCustomDateChange}
            />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-dark">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Growth Rate</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-dark">{Math.abs(growth).toFixed(1)}%</p>
                    <div className={`flex items-center ${getGrowthColor(growth)}`}>
                      {getGrowthIcon(growth)}
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Average Order</p>
                  <p className="text-2xl font-bold text-dark">{formatCurrency(averageOrder)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Sales</p>
                  <p className="text-2xl font-bold text-dark">{totalTransactions}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark">Revenue Trend</h2>
              <div className="text-sm text-slate-600">
                {getPeriodDisplayName(selectedDateRange)}
              </div>
            </div>
            
            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="flex items-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                  Loading chart data...
                </div>
              </div>
            ) : chartData.length > 0 ? (
              <div className="h-96">
                <Line data={chartConfig} options={chartOptions} />
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-slate-500">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg font-medium mb-2">No Revenue Data Yet</p>
                <p className="text-center">Start making sales to see your revenue analytics here.</p>
              </div>
            )}
          </div>

          {/* Detailed Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Breakdown */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-dark mb-4">Revenue Insights</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Peak Revenue Day</span>
                  <span className="font-medium text-dark">
                    {chartData.length > 0 
                      ? chartData.reduce((max, item) => item.value > max.value ? item : max, chartData[0])?.label || 'N/A'
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Average Daily Revenue</span>
                  <span className="font-medium text-dark">
                    {chartData.length > 0 
                      ? formatCurrency(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length)
                      : formatCurrency(0)
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Revenue Consistency</span>
                  <span className="font-medium text-dark">
                    {chartData.length > 0 && totalRevenue > 0 ? 'Good' : 'Building'}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-dark mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Revenue per Transaction</span>
                  <span className="font-medium text-dark">{formatCurrency(averageOrder)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Growth Trend</span>
                  <span className={`font-medium ${getGrowthColor(growth)}`}>
                    {growth > 0 ? 'Increasing' : growth < 0 ? 'Decreasing' : 'Stable'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Period Performance</span>
                  <span className="font-medium text-dark">
                    {totalTransactions > 0 ? 'Active' : 'Getting Started'}
                  </span>
                </div>
              </div>
            </div>
          </div>
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