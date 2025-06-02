'use client';

import { useState, useEffect } from 'react';

// Mock activity data - in real app, this would come from props or API
const MOCK_ACTIVITIES = [
  {
    id: 1,
    type: 'invoice_sent',
    title: 'Invoice sent to Kintela Ltd',
    description: 'Invoice #INV-001 for web development services',
    amount: '₦150,000',
    timestamp: '2 minutes ago',
    avatar: 'KL',
    avatarColor: 'bg-blue-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
    iconColor: 'text-blue-600 bg-blue-50',
  },
  {
    id: 2,
    type: 'expense_added',
    title: 'Expense recorded',
    description: 'Office supplies purchase from Shoprite',
    amount: '₦25,400',
    timestamp: '1 hour ago',
    avatar: 'OS',
    avatarColor: 'bg-red-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    ),
    iconColor: 'text-red-600 bg-red-50',
  },
  {
    id: 3,
    type: 'payment_received',
    title: 'Payment received',
    description: 'Invoice #INV-002 paid by Dangote Group',
    amount: '₦500,000',
    timestamp: '3 hours ago',
    avatar: 'DG',
    avatarColor: 'bg-green-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    iconColor: 'text-green-600 bg-green-50',
  },
  {
    id: 4,
    type: 'customer_added',
    title: 'New customer added',
    description: 'Added MTN Nigeria to customer database',
    amount: null,
    timestamp: '1 day ago',
    avatar: 'MTN',
    avatarColor: 'bg-yellow-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    iconColor: 'text-yellow-600 bg-yellow-50',
  },
  {
    id: 5,
    type: 'expense_added',
    title: 'Expense recorded',
    description: 'Internet subscription payment',
    amount: '₦15,000',
    timestamp: '2 days ago',
    avatar: 'IS',
    avatarColor: 'bg-purple-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    ),
    iconColor: 'text-purple-600 bg-purple-50',
  },
];

const EMPTY_STATE_TIPS = [
  "Add your first customer to start tracking relationships",
  "Create an invoice to begin generating revenue",
  "Record an expense to understand your costs",
  "Set up recurring transactions for regular payments",
  "Import data from a CSV to back-fill your history",
];

export default function RecentActivity({ activities = [], showEmpty = true }) {
  // Use mock data if no activities provided (for demo)
  const displayActivities = activities.length > 0 ? activities.slice(0, 5) : (showEmpty ? [] : MOCK_ACTIVITIES);
  const [currentTip, setCurrentTip] = useState(0);

  // Rotate tips every 5 seconds
  useEffect(() => {
    if (displayActivities.length === 0) {
      const interval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % EMPTY_STATE_TIPS.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [displayActivities.length]);

  const handleViewAll = () => {
    // Navigate to full activity log
    window.location.href = '/activity';
  };

  const handleActivityClick = (activity) => {
    // Navigate to appropriate detail page based on activity type
    switch (activity.type) {
      case 'invoice_sent':
      case 'invoice_created':
        // Extract invoice number from description or reference
        const invoiceMatch = activity.description?.match(/(?:Invoice\s+#?|INV-?)(\d+)/i);
        if (invoiceMatch) {
          window.location.href = `/invoices/${invoiceMatch[1]}`;
        } else {
          window.location.href = '/invoices';
        }
        break;
      
      case 'payment_received':
        // For payment received, try to extract invoice info or go to transactions
        const paymentInvoiceMatch = activity.description?.match(/(?:Invoice\s+#?|INV-?)(\d+)/i);
        if (paymentInvoiceMatch) {
          window.location.href = `/invoices/${paymentInvoiceMatch[1]}`;
        } else {
          window.location.href = '/transactions';
        }
        break;
      
      case 'expense_added':
        // Navigate to expense details or expenses list
        window.location.href = '/expenses';
        break;
      
      case 'customer_added':
        // Navigate to customers page
        window.location.href = '/customers';
        break;
      
      default:
        // Default to activity page
        window.location.href = '/activity';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
        {displayActivities.length > 0 && (
          <button
            onClick={handleViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            View all →
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayActivities.length === 0 ? (
          // Empty state with rotating tips
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="space-y-2">
              <p className="text-slate-600 font-medium">No activity yet</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto transition-all duration-500">
                💡 {EMPTY_STATE_TIPS[currentTip]}
              </p>
            </div>
          </div>
        ) : (
          // Activity list
          displayActivities.map((activity, index) => (
            <div
              key={activity.id}
              onClick={() => handleActivityClick(activity)}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/50 hover:bg-white/70 transition-colors cursor-pointer group"
            >
              {/* Activity icon */}
              <div className={`w-10 h-10 rounded-xl ${activity.iconColor} flex items-center justify-center flex-shrink-0`}>
                {activity.icon}
              </div>

              {/* Activity content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 truncate group-hover:text-slate-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-slate-600 truncate">
                      {activity.description}
                    </p>
                  </div>
                  
                  {/* Amount and avatar */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {activity.amount && (
                      <span className="text-sm font-semibold text-slate-800">
                        {activity.amount}
                      </span>
                    )}
                    
                    {/* Customer/Entity avatar */}
                    <div className={`w-8 h-8 ${activity.avatarColor} rounded-full flex items-center justify-center text-white text-xs font-semibold`}>
                      {activity.avatar}
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-slate-500 mt-1">
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick action when empty */}
      {displayActivities.length === 0 && (
        <div className="pt-4 border-t border-slate-200/50">
          <div className="grid grid-cols-2 gap-3">
            <button className="quick-action-btn">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium">Add Customer</span>
            </button>
            
            <button className="quick-action-btn">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium">Create Invoice</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 