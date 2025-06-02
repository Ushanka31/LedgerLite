'use client';

import { useEffect } from 'react';

const QUICK_ACTIONS = [
  {
    id: 'invoice',
    label: 'New Invoice',
    shortcut: '⌘I',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-blue-600',
    href: '/invoices/new',
  },
  {
    id: 'revenue',
    label: 'Add Revenue',
    shortcut: '⌘S',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    color: 'text-green-600',
    href: '/revenue/new',
  },
  {
    id: 'expense',
    label: 'Add Expense',
    shortcut: '⌘E',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M12 4v16" />
      </svg>
    ),
    color: 'text-red-600',
    href: '/expenses/new',
  },
  {
    id: 'customer',
    label: 'Add Customer',
    shortcut: '⌘U',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'text-green-600',
    href: '/customers/new',
  },
  {
    id: 'reports',
    label: 'View Reports',
    shortcut: '⌘R',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'text-purple-600',
    href: '/reports',
  },
];

export default function QuickActions({ onActionClick }) {
  // Keyboard shortcuts handler
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.metaKey || event.ctrlKey) {
        const action = QUICK_ACTIONS.find(a => 
          a.shortcut.toLowerCase().includes(event.key.toLowerCase())
        );
        
        if (action) {
          event.preventDefault();
          if (onActionClick) {
            onActionClick(action.id);
          } else {
            // Default navigation
            window.location.href = action.href;
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onActionClick]);

  const handleActionClick = (action) => {
    if (onActionClick) {
      onActionClick(action.id);
    } else {
      window.location.href = action.href;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Quick Actions</h3>
        <span className="text-xs text-slate-500 hidden lg:inline">Use keyboard shortcuts</span>
      </div>
      
      {/* Actions grid - flex grow to fill available space */}
      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-1 gap-3 flex-1">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className="quick-action-btn group p-4 text-left w-full h-full flex items-center gap-3 min-h-[60px]"
            >
              <div className={`${action.color} group-hover:scale-110 transition-transform flex-shrink-0`}>
                {action.icon}
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-800 leading-tight">
                  {action.label}
                </span>
                <span className="kbd text-xs mt-1 opacity-60">
                  {action.shortcut}
                </span>
              </div>
            </button>
          ))}
        </div>
        
        {/* Additional helpful content to fill space */}
        <div className="mt-6 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
            <div>
              <p className="text-xs font-medium text-blue-900 mb-1">Pro Tip</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Use keyboard shortcuts for faster navigation. Press the shown key combinations while holding ⌘ (Mac) or Ctrl (Windows).
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile floating action button for very small screens */}
      <div className="fixed bottom-6 right-6 z-40 block sm:hidden">
        <button 
          onClick={() => handleActionClick(QUICK_ACTIONS[1])}
          className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </button>
      </div>
    </div>
  );
} 