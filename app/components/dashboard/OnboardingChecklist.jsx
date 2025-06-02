'use client';

import { useState, useEffect } from 'react';

const ONBOARDING_STEPS = [
  {
    id: 'company',
    title: 'Set up company profile',
    description: 'Add your business details and preferences',
    completed: true, // Assuming this is done since they're on dashboard
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'customer',
    title: 'Add your first customer',
    description: 'Start building your customer database',
    completed: false,
    action: 'Add Customer',
    href: '/customers/new',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'invoice',
    title: 'Create your first invoice',
    description: 'Generate a professional invoice with payment links',
    completed: false,
    action: 'Create Invoice',
    href: '/invoices/new',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'expense',
    title: 'Record a business expense',
    description: 'Track your costs to understand profitability',
    completed: false,
    action: 'Add Expense',
    href: '/expenses/new',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
  },
];

export default function OnboardingChecklist({ 
  steps = ONBOARDING_STEPS, 
  onStepComplete,
  onCollapse 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(
    steps.filter(step => step.completed).map(step => step.id)
  );

  // Calculate progress
  const progress = (completedSteps.length / steps.length) * 100;
  const isComplete = progress === 100;

  // Auto-collapse when complete
  useEffect(() => {
    if (isComplete && !isCollapsed) {
      const timer = setTimeout(() => {
        setIsCollapsed(true);
        if (onCollapse) onCollapse();
      }, 2000); // Auto-collapse after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [isComplete, isCollapsed, onCollapse]);

  const handleStepAction = (step) => {
    if (step.href) {
      window.location.href = step.href;
    }
    if (onStepComplete) {
      onStepComplete(step.id);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (isComplete && isCollapsed) {
    return (
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-slate-800">Setup Complete!</p>
            <p className="text-xs text-slate-600">You're ready to start using LedgerLite</p>
          </div>
        </div>
        <button
          onClick={toggleCollapse}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="p-6 border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Get Started with LedgerLite</h3>
            <p className="text-sm text-slate-600 mt-1">
              Complete these steps to set up your accounting system
            </p>
          </div>
          
          {/* Progress indicator */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">{completedSteps.length}/{steps.length}</p>
              <p className="text-xs text-slate-500">completed</p>
            </div>
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Steps */}
      {!isCollapsed && (
        <div className="p-6 space-y-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            
            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                  isCompleted 
                    ? 'bg-green-50/50 border border-green-200/50' 
                    : 'bg-slate-50/50 border border-slate-200/50 hover:bg-slate-100/50'
                }`}
              >
                {/* Step indicator */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted 
                    ? 'bg-green-600 text-white' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.icon
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${
                    isCompleted ? 'text-green-800 line-through' : 'text-slate-800'
                  }`}>
                    {step.title}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    isCompleted ? 'text-green-600' : 'text-slate-600'
                  }`}>
                    {step.description}
                  </p>
                </div>

                {/* Action button */}
                {!isCompleted && step.action && (
                  <button
                    onClick={() => handleStepAction(step)}
                    className="glass-button-primary text-sm px-4 py-2 hover:shadow-lg"
                  >
                    {step.action}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Toggle button */}
      {!isComplete && (
        <div className="px-6 pb-4">
          <button
            onClick={toggleCollapse}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            {isCollapsed ? 'Show setup checklist' : 'Hide checklist'}
          </button>
        </div>
      )}
    </div>
  );
} 