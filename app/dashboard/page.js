'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedNavbar from '@/app/components/dashboard/EnhancedNavbar';
import DateRangeSelector from '@/app/components/dashboard/DateRangeSelector';
import MetricCard from '@/app/components/dashboard/MetricCard';
import QuickActions from '@/app/components/dashboard/QuickActions';
import OnboardingChecklist from '@/app/components/dashboard/OnboardingChecklist';
import RecentActivity from '@/app/components/dashboard/RecentActivity';
import AddSaleModal from '@/app/components/sales/AddSaleModal';
import AddExpenseModal from '@/app/components/expenses/AddExpenseModal';
import AddInvoiceModal from '@/app/components/invoices/AddInvoiceModal';
import ProfileSettingsModal from '@/app/components/modals/ProfileSettingsModal';
import CompanySettingsModal from '@/app/components/modals/CompanySettingsModal';
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
  Filler,
} from 'chart.js';

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

export default function DashboardPage() {
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [customDateRange, setCustomDateRange] = useState(null);
  const [user, setUser] = useState({});
  const [setupProgress, setSetupProgress] = useState(100); // Setup completed - hide progress ring
  const [syncStatus, setSyncStatus] = useState('synced');
  const [lastSync, setLastSync] = useState('now');
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [metrics, setMetrics] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [outstandingInvoicesCount, setOutstandingInvoicesCount] = useState(0);
  const [lineChartData, setLineChartData] = useState({ labels: [], datasets: [] });

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
          // If user fetch fails, they might not be authenticated
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

  // Fetch transactions and calculate metrics
  useEffect(() => {
    const fetchData = async () => {
      // Fetch both data sources in parallel
      await Promise.all([
        fetchTransactions(),
        fetchOutstandingInvoices()
      ]);
      
      // Note: calculateMetrics will be called by the other useEffect 
      // when transactions and outstandingInvoicesCount states update
    };
    
    fetchData();
  }, [selectedDateRange, customDateRange]);

  // Recalculate metrics whenever transactions or outstandingInvoicesCount changes
  useEffect(() => {
    // Only calculate if we have loaded data (avoid initial empty calculation)
    if (!loading) {
      const updateMetrics = async () => {
        await calculateMetrics(transactions, outstandingInvoicesCount);
      };
      updateMetrics();
    }
  }, [transactions, outstandingInvoicesCount, loading]);

  // Calculate date range based on selection
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
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return {
          start: startOfWeek,
          end: endOfWeek
        };
      
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return {
          start: startOfMonth,
          end: endOfMonth
        };
      
      case 'ytd':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        return {
          start: startOfYear,
          end: endOfYear
        };
      
      case 'custom':
        if (customDateRange?.start && customDateRange?.end) {
          const start = new Date(customDateRange.start);
          const end = new Date(customDateRange.end);
          end.setHours(23, 59, 59, 999); // Include the entire end day
          return {
            start,
            end
          };
        }
        return {
          start: null,
          end: null
        };
      
      case 'all':
      default:
        return {
          start: null,
          end: null
        };
    }
  };

  // Filter transactions based on date range
  const filterTransactionsByDateRange = (transactions, range) => {
    if (range === 'all') {
      return transactions; // Return all transactions
    }
    
    const { start, end } = getDateRange(range);
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= start && transactionDate <= end;
    });
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Fetch all transactions (we'll filter client-side)
      const response = await fetch('/api/transactions?limit=1000');
      const result = await response.json();
      
      if (result.success) {
        const allTransactions = result.transactions;
        // Filter transactions based on selected date range
        const filteredTransactions = filterTransactionsByDateRange(allTransactions, selectedDateRange);
        
        setTransactions(filteredTransactions);
        
        // Calculate line chart data using all transactions (not filtered)
        calculateLineChartData(allTransactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      // Use empty state if fetch fails
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOutstandingInvoices = async () => {
    try {
      const response = await fetch('/api/invoices');
      const result = await response.json();
      
      if (result.success) {
        setOutstandingInvoices(result.outstandingTotal || 0);
        setTotalInvoices(result.totalInvoices || 0);
        
        // Use the count from the API instead of filtering client-side
        const newOutstandingCount = result.outstandingInvoicesCount || 0;
        setOutstandingInvoicesCount(newOutstandingCount);
        
        // Don't call calculateMetrics here - let useEffect handle it
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setOutstandingInvoices(0);
      setTotalInvoices(0);
      setOutstandingInvoicesCount(0);
    }
  };

  const calculateMetrics = async (transactionData, currentOutstandingCount = outstandingInvoicesCount) => {
    // Calculate totals
    const revenue = transactionData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactionData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netProfit = revenue - expenses;

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    // Create metrics with real data
    const newMetrics = [
      {
        title: 'Total Revenue',
        value: revenue > 0 ? formatCurrency(revenue) : '₦0.00',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        ),
        color: 'green',
        sparklineData: [], // TODO: Add sparkline data
        cta: revenue === 0 ? 'Record a sale or mark invoices as paid' : 'View detailed analytics',
        trend: null,
        onCtaClick: () => setShowAddSaleModal(true),
        isClickable: true, // Special flag to indicate this card is clickable
      },
      {
        title: 'Total Expenses',
        value: expenses > 0 ? formatCurrency(expenses) : '₦0.00',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        ),
        color: 'red',
        sparklineData: [],
        cta: expenses === 0 ? 'Record an expense to track costs' : 'View detailed analytics',
        trend: null,
        onCtaClick: () => setShowAddExpenseModal(true),
        isClickable: true, // Special flag to indicate this card is clickable
      },
      {
        title: 'Outstanding Invoices',
        value: currentOutstandingCount > 0 ? `${currentOutstandingCount} invoice${currentOutstandingCount !== 1 ? 's' : ''}` : 'No outstanding invoices',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        color: 'blue',
        sparklineData: [],
        cta: 'View invoices',
        trend: null,
        onCtaClick: () => router.push('/invoices'),
        isClickable: true, // Make this card clickable
      },
      {
        title: 'Net Profit',
        value: netProfit !== 0 ? formatCurrency(netProfit) : '₦0.00',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ),
        color: 'purple',
        sparklineData: [],
        cta: netProfit === 0 ? 'Start tracking to see profit' : 'View detailed analytics',
        trend: null,
        onCtaClick: () => netProfit === 0 ? setShowAddSaleModal(true) : router.push('/analytics/profit'),
        isClickable: true, // Make this card clickable
      },
    ];

    setMetrics(newMetrics);
    
    // Fetch recent invoices and create combined activities
    try {
      const recentInvoices = await fetchRecentInvoices();
      
      // Create invoice activities
      const invoiceActivities = transformInvoicesToActivities(recentInvoices);
      
      // Create transaction activities (only non-invoice transactions)
      const nonInvoiceTransactions = transactionData.filter(t => 
        // Filter out invoice-related journal entries to avoid duplicates
        // Only remove transactions that are specifically invoice references (INV- or company prefix invoices)
        !(t.reference?.match(/^[A-Z]{2,}-\d{4}$/) || t.reference?.startsWith('INV-') || t.reference?.startsWith('PAY-'))
      );
      const transactionActivities = transformTransactionsToActivities(nonInvoiceTransactions);
      
      // Combine and sort all activities by date
      const allActivities = [...invoiceActivities, ...transactionActivities]
        .sort((a, b) => {
          // Extract date from timestamp for proper sorting
          const getDateFromTimestamp = (timestamp) => {
            if (timestamp === 'Just now') return new Date();
            if (timestamp === 'Yesterday') {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              return yesterday;
            }
            // For other timestamps, use current time as approximate (they're already sorted)
            return new Date();
          };
          
          return getDateFromTimestamp(b.timestamp) - getDateFromTimestamp(a.timestamp);
        })
        .slice(0, 5); // Take only the 5 most recent activities
      
      setRecentActivities(allActivities);
    } catch (error) {
      console.error('Error creating activities:', error);
      // Fallback to transaction-only activities
      const activities = transformTransactionsToActivities(transactionData);
      setRecentActivities(activities);
    }

    // Calculate line chart data for the new graph
    calculateLineChartData(transactionData);
  };

  const handleDateRangeChange = (range) => {
    setSelectedDateRange(range);
    // Reset custom date range if switching away from custom
    if (range !== 'custom') {
      setCustomDateRange(null);
    }
    // Data will be refetched and filtered in useEffect
  };

  const handleCustomDateChange = (dateRange) => {
    setCustomDateRange(dateRange);
    // Data will be refetched and filtered in useEffect
  };

  const handleQuickAction = (actionId) => {
    // Handle quick action clicks by opening appropriate modals
    switch (actionId) {
      case 'invoice':
        setShowAddInvoiceModal(true);
        break;
      case 'revenue':
        setShowAddSaleModal(true);
        break;
      case 'expense':
        setShowAddExpenseModal(true);
        break;
      case 'customer':
        // TODO: Implement customer modal or navigate to customers page
        console.log('Add Customer clicked - feature coming soon!');
        // For now, we can show an alert or navigate to a customers page
        alert('Add Customer feature coming soon!');
        break;
      case 'reports':
        // TODO: Implement reports page or modal
        console.log('View Reports clicked - feature coming soon!');
        // For now, we can show an alert or navigate to a reports page  
        alert('Reports feature coming soon!');
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  };

  const handleStepComplete = (stepId) => {
    // Handle onboarding step completion
    setSetupProgress(prev => Math.min(prev + 25, 100));
  };

  const handleMetricClick = (metric) => {
    // Handle metric card clicks for drill-down
    if (metric.title === 'Total Revenue') {
      // Navigate to revenue analytics page
      router.push('/analytics/revenue');
    } else if (metric.title === 'Total Expenses') {
      // Navigate to expenses analytics page
      router.push('/analytics/expenses');
    } else if (metric.title === 'Outstanding Invoices') {
      // Navigate to invoices page
      router.push('/invoices');
    } else if (metric.title === 'Net Profit') {
      // Navigate to net profit analytics page
      router.push('/analytics/profit');
    } else {
      console.log('Metric clicked:', metric);
    }
  };

  const handleSaleSuccess = (transaction) => {
    // Refresh data after successful sale
    fetchTransactions();
    
    // TODO: Show success notification
    console.log('Sale added successfully:', transaction);
  };

  const handleExpenseSuccess = (transaction) => {
    // Refresh data after successful expense
    fetchTransactions();
    
    // TODO: Show success notification
    console.log('Expense added successfully:', transaction);
  };

  const handleInvoiceSuccess = async (invoice) => {
    // Refresh data after successful invoice creation
    await Promise.all([
      fetchTransactions(),
      fetchOutstandingInvoices()
    ]);
    
    // TODO: Show success notification
    console.log('Invoice created successfully:', invoice);
  };

  const handleUserUpdate = (updatedUser) => {
    // Update user state with new data
    setUser(updatedUser);
    console.log('User profile updated:', updatedUser);
  };

  const handleOpenProfileModal = () => {
    setShowProfileModal(true);
  };

  const handleOpenCompanyModal = () => {
    setShowCompanyModal(true);
  };

  // Transform transactions into activity format
  const transformTransactionsToActivities = (transactionData) => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const getTimeAgo = (date) => {
      const now = new Date();
      let transactionDate;
      
      // Handle different date formats that might come from the database
      if (date instanceof Date) {
        transactionDate = date;
      } else if (typeof date === 'string') {
        transactionDate = new Date(date);
      } else {
        return 'Unknown time';
      }
      
      // Check if the date is valid
      if (isNaN(transactionDate.getTime())) {
        return 'Unknown time';
      }
      
      const diffInMilliseconds = now.getTime() - transactionDate.getTime();
      const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      
      // Less than 1 minute - show seconds
      if (diffInSeconds < 60) {
        if (diffInSeconds <= 5) return 'Just now';
        return `${diffInSeconds} second${diffInSeconds > 1 ? 's' : ''} ago`;
      }
      
      // Less than 1 hour - show minutes
      if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      }
      
      // Less than 24 hours - show hours
      if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      }
      
      // Yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (transactionDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
      // More than yesterday - show full date and time
      return transactionDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: transactionDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    const getAvatarInitials = (name) => {
      if (!name) return '??';
      return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    return transactionData
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by creation time, newest first
      .slice(0, 5) // Take only the 5 most recent from filtered data
      .map((transaction, index) => {
        if (transaction.type === 'income') {
          // Check if this is an invoice transaction (only INV- or company prefix invoices)
          if (transaction.reference?.startsWith('INV-') || transaction.reference?.match(/^[A-Z]{2,}-\d{4}$/) || transaction.reference?.startsWith('PAY-')) {
            // This is an invoice payment
            const customerName = transaction.lines?.find(line => 
              line.description?.includes('A/R for invoice'))?.description?.split('invoice ')[1] || 'Customer';
            
            return {
              id: transaction.id,
              type: 'invoice_sent',
              title: 'Invoice created',
              description: `Invoice ${transaction.reference} created`,
              amount: formatCurrency(transaction.amount),
              timestamp: getTimeAgo(transaction.createdAt), // Use creation time
              avatar: getAvatarInitials(customerName),
              avatarColor: 'bg-blue-500',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              iconColor: 'text-blue-600 bg-blue-50',
            };
          } else {
            // Regular sales transaction (including SALE- transactions)
            const customerName = transaction.lines?.find(line => 
              line.description?.includes('received from'))?.description?.split('received from ')[1] || 'Customer';
            
            return {
              id: transaction.id,
              type: 'payment_received',
              title: 'Revenue recorded',
              description: transaction.description || 'Revenue transaction',
              amount: formatCurrency(transaction.amount),
              timestamp: getTimeAgo(transaction.createdAt), // Use creation time
              avatar: getAvatarInitials(customerName),
              avatarColor: 'bg-green-500',
              icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              ),
              iconColor: 'text-green-600 bg-green-50',
            };
          }
        } else if (transaction.type === 'expense') {
          // Expense transactions
          const vendorName = transaction.lines?.find(line => 
            line.description?.includes('paid to'))?.description?.split('paid to ')[1] || 'Vendor';
          
          return {
            id: transaction.id,
            type: 'expense_added',
            title: 'Expense recorded',
            description: transaction.description || 'Expense transaction',
            amount: formatCurrency(transaction.amount),
            timestamp: getTimeAgo(transaction.createdAt), // Use creation time
            avatar: getAvatarInitials(vendorName),
            avatarColor: 'bg-red-500',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            ),
            iconColor: 'text-red-600 bg-red-50',
          };
        }
        
        // Default fallback
        return {
          id: transaction.id,
          type: 'other',
          title: 'Transaction',
          description: transaction.description || 'Other transaction',
          amount: formatCurrency(transaction.amount),
          timestamp: getTimeAgo(transaction.createdAt), // Use creation time
          avatar: '??',
          avatarColor: 'bg-gray-500',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          iconColor: 'text-gray-600 bg-gray-50',
        };
      });
  };

  // Get display name for current date range
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

  // Fetch recent invoices for activity tracking
  const fetchRecentInvoices = async () => {
    try {
      const response = await fetch('/api/invoices?limit=10'); // Get more invoices for activity
      const result = await response.json();
      
      if (result.success) {
        return result.invoices || [];
      }
    } catch (error) {
      console.error('Failed to fetch recent invoices:', error);
    }
    return [];
  };

  // Transform invoices into activity format
  const transformInvoicesToActivities = (invoicesData) => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
      }).format(parseFloat(amount));
    };

    const getTimeAgo = (date) => {
      const now = new Date();
      let activityDate;
      
      if (date instanceof Date) {
        activityDate = date;
      } else if (typeof date === 'string') {
        activityDate = new Date(date);
      } else {
        return 'Unknown time';
      }
      
      if (isNaN(activityDate.getTime())) {
        return 'Unknown time';
      }
      
      const diffInMilliseconds = now.getTime() - activityDate.getTime();
      const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      const diffInHours = Math.floor(diffInMinutes / 60);
      
      if (diffInSeconds < 60) {
        if (diffInSeconds <= 5) return 'Just now';
        return `${diffInSeconds} second${diffInSeconds > 1 ? 's' : ''} ago`;
      }
      
      if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      }
      
      if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      }
      
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (activityDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
      return activityDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: activityDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    const getAvatarInitials = (name) => {
      if (!name) return '??';
      return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
    };

    const getActivityInfo = (invoice) => {
      const baseInfo = {
        id: `invoice-${invoice.id}`,
        amount: formatCurrency(invoice.totalAmount),
        timestamp: getTimeAgo(invoice.createdAt),
        avatar: getAvatarInitials(invoice.customerName),
      };

      switch (invoice.status) {
        case 'draft':
          return {
            ...baseInfo,
            type: 'invoice_draft',
            title: 'Invoice created',
            description: `Draft invoice ${invoice.invoiceNumber} for ${invoice.customerName}`,
            avatarColor: 'bg-yellow-500',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            ),
            iconColor: 'text-yellow-600 bg-yellow-50',
          };
        
        case 'sent':
          return {
            ...baseInfo,
            type: 'invoice_sent',
            title: 'Invoice sent',
            description: `Invoice ${invoice.invoiceNumber} sent to ${invoice.customerName}`,
            avatarColor: 'bg-blue-500',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            ),
            iconColor: 'text-blue-600 bg-blue-50',
          };
        
        case 'paid':
          return {
            ...baseInfo,
            type: 'invoice_paid',
            title: 'Invoice paid',
            description: `Payment received for invoice ${invoice.invoiceNumber}`,
            avatarColor: 'bg-green-500',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            iconColor: 'text-green-600 bg-green-50',
          };
        
        case 'overdue':
          return {
            ...baseInfo,
            type: 'invoice_overdue',
            title: 'Invoice overdue',
            description: `Invoice ${invoice.invoiceNumber} is past due`,
            avatarColor: 'bg-red-500',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            iconColor: 'text-red-600 bg-red-50',
          };
        
        default:
          return {
            ...baseInfo,
            type: 'invoice_created',
            title: 'Invoice created',
            description: `Invoice ${invoice.invoiceNumber} created`,
            avatarColor: 'bg-gray-500',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            iconColor: 'text-gray-600 bg-gray-50',
          };
      }
    };

    return invoicesData.map(invoice => getActivityInfo(invoice));
  };

  // Calculate line chart data for the new graph
  const calculateLineChartData = (transactionData) => {
    const now = new Date();
    const last4MonthsData = [];

    for (let i = 3; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      last4MonthsData.push({
        month: monthName,
        revenue: 0,
        expenses: 0,
        profit: 0,
      });
    }

    transactionData.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      // Check if transaction is within the last 4 months
      const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      if (transactionDate >= fourMonthsAgo) {
        const monthName = transactionDate.toLocaleDateString('en-US', { month: 'short' });
        const monthEntry = last4MonthsData.find(m => m.month === monthName);

        if (monthEntry) {
          if (transaction.type === 'income') {
            monthEntry.revenue += transaction.amount;
          } else if (transaction.type === 'expense') {
            monthEntry.expenses += transaction.amount;
          }
          monthEntry.profit = monthEntry.revenue - monthEntry.expenses;
        }
      }
    });

    setLineChartData({
      labels: last4MonthsData.map(m => m.month),
      datasets: [
        {
          label: 'Revenue',
          data: last4MonthsData.map(m => m.revenue),
          borderColor: '#10B981', // Green
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Expenses',
          data: last4MonthsData.map(m => m.expenses),
          borderColor: '#EF4444', // Red
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Profit',
          data: last4MonthsData.map(m => m.profit),
          borderColor: '#3B82F6', // Blue
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
        },
      ],
    });
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Enhanced Navigation */}
      <EnhancedNavbar 
        user={user}
        setupProgress={setupProgress}
        syncStatus={syncStatus}
        lastSync={lastSync}
        onUserUpdate={handleUserUpdate}
        onOpenProfileModal={handleOpenProfileModal}
        onOpenCompanyModal={handleOpenCompanyModal}
      />

      {/* Main Content */}
      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Date Range Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-dark mb-2">Dashboard</h1>
              <p className="text-medium">
                Welcome back! Here's what's happening with your business.
              </p>
              {/* Period and transaction count indicator */}
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <span>Showing</span>
                <span className="font-medium text-slate-800">{getDateRangeDisplayName(selectedDateRange)}</span>
                {transactions.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-slate-800">{transactions.length}</span>
                    <span>transaction{transactions.length !== 1 ? 's' : ''}</span>
                  </>
                )}
                {loading && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">Loading...</span>
                  </>
                )}
              </div>
            </div>
            
            <DateRangeSelector 
              selected={selectedDateRange}
              onSelect={handleDateRangeChange}
              customDateRange={customDateRange}
              onCustomDateChange={handleCustomDateChange}
            />
          </div>

          {/* Metrics Grid - 2x2 on mobile, 1x4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            {metrics.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                color={metric.color}
                sparklineData={metric.sparklineData}
                cta={metric.cta}
                trend={metric.trend}
                onCtaClick={metric.onCtaClick}
                onClick={() => handleMetricClick(metric)}
                isClickable={metric.isClickable}
              />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column - Quick Actions */}
            <div className="lg:col-span-1 flex">
              <div className="glass-card p-6 w-full flex flex-col">
                <QuickActions onActionClick={handleQuickAction} />
              </div>
            </div>

            {/* Right Column - Recent Activity */}
            <div className="lg:col-span-2 flex">
              <div className="glass-card p-6 w-full">
                <RecentActivity activities={recentActivities} showEmpty={recentActivities.length === 0} />
              </div>
            </div>
          </div>

          {/* Onboarding Checklist (only show if setup incomplete) */}
          {setupProgress < 100 && (
            <div className="mb-8">
              <OnboardingChecklist 
                onStepComplete={handleStepComplete}
              />
            </div>
          )}

          {/* Bottom Section - Additional Cards (for future features) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Trends Line Chart */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Monthly Trends (Last 4 Months)</h3>
              {lineChartData.labels && lineChartData.labels.length > 0 ? (
                <div className="h-64 md:h-72">
                  <Line 
                    data={lineChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            color: '#475569', // slate-600
                            callback: function(value) {
                              if (Math.abs(value) >= 1000000) return '₦' + (value / 1000000) + 'M';
                              if (Math.abs(value) >= 1000) return '₦' + (value / 1000) + 'K';
                              return '₦' + value;
                            }
                          },
                          grid: {
                            color: 'rgba(100, 116, 139, 0.1)', // slate-500 with alpha
                          },
                        },
                        x: {
                          ticks: {
                            color: '#475569', // slate-600
                          },
                          grid: {
                            display: false,
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            color: '#334155', // slate-700
                            boxWidth: 12,
                            padding: 20,
                          }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          titleFont: { size: 14 },
                          bodyFont: { size: 12 },
                          callbacks: {
                            label: function(context) {
                              let label = context.dataset.label || '';
                              if (label) {
                                label += ': ';
                              }
                              if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(context.parsed.y);
                              }
                              return label;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-32 bg-slate-100 rounded-xl flex items-center justify-center">
                  <p className="text-slate-500 text-sm">No data to display for the last 4 months.</p>
                </div>
              )}
            </div>

            {/* Revenue & Invoice Workflow Reminders */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">💡 Revenue Tracking</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-slate-700 font-medium">Revenue Recognition</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Revenue only counts when invoices are marked as "Paid" on the invoices page
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-slate-700 font-medium">Invoice Workflow</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Draft → Send → Mark Paid to complete the revenue cycle
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm text-slate-700 font-medium">Outstanding Invoices</p>
                    <p className="text-xs text-slate-600 mt-1">
                      <button 
                        onClick={() => router.push('/invoices')}
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        View invoices page
                      </button> to manage and mark invoices as paid
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Sale Modal */}
      {showAddSaleModal && (
        <AddSaleModal
          isOpen={showAddSaleModal}
          onClose={() => setShowAddSaleModal(false)}
          onSuccess={handleSaleSuccess}
        />
      )}

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <AddExpenseModal
          isOpen={showAddExpenseModal}
          onClose={() => setShowAddExpenseModal(false)}
          onSuccess={handleExpenseSuccess}
        />
      )}

      {/* Add Invoice Modal */}
      {showAddInvoiceModal && (
        <AddInvoiceModal
          isOpen={showAddInvoiceModal}
          onClose={() => setShowAddInvoiceModal(false)}
          onSuccess={handleInvoiceSuccess}
        />
      )}

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