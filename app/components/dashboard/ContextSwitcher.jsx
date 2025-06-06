'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContextSwitcher({ currentContext, onContextChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contexts, setContexts] = useState({ hasPersonal: true, businesses: [] });
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch available contexts
  useEffect(() => {
    fetchContexts();
  }, []);

  const fetchContexts = async () => {
    try {
      const response = await fetch('/api/context');
      const result = await response.json();
      
      if (result.success) {
        setContexts(result.available);
      }
    } catch (error) {
      console.error('Failed to fetch contexts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContextSwitch = async (type, companyId = null) => {
    try {
      const response = await fetch('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, companyId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIsOpen(false);
        if (onContextChange) {
          onContextChange(result.context);
        }
        // Refresh the page to reload data in new context
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to switch context:', error);
    }
  };

  const getCurrentDisplayName = () => {
    if (!currentContext) return 'Personal';
    
    if (currentContext.type === 'personal') {
      return (
        <span className="flex items-center gap-2">
          <span className="text-lg">👤</span>
          Personal
        </span>
      );
    }
    
    const business = contexts.businesses.find(b => b.id === currentContext.companyId);
    return (
      <span className="flex items-center gap-2">
        <span className="text-lg">🏢</span>
        {business?.name || 'Business'}
      </span>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-button flex items-center gap-3 px-4 py-2 min-w-[160px]"
        disabled={loading}
      >
        {loading ? (
          <span className="text-slate-600">Loading...</span>
        ) : (
          <>
            <span className="font-medium">{getCurrentDisplayName()}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {isOpen && !loading && (
        <div className="absolute left-0 mt-2 w-64 glass-card-subtle py-2 z-50">
          <div className="px-4 py-2 border-b border-slate-200/50">
            <p className="text-xs font-semibold text-slate-500 uppercase">Switch Context</p>
          </div>
          
          {/* Personal Context */}
          <button
            onClick={() => handleContextSwitch('personal')}
            className={`w-full px-4 py-3 text-left hover:bg-slate-100/50 flex items-center gap-3 transition-colors ${
              currentContext?.type === 'personal' ? 'bg-blue-50/50' : ''
            }`}
          >
            <span className="text-2xl">👤</span>
            <div>
              <p className="font-medium text-sm">Personal Finances</p>
              <p className="text-xs text-slate-600">Track personal income & expenses</p>
            </div>
            {currentContext?.type === 'personal' && (
              <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            )}
          </button>
          
          {/* Business Contexts */}
          {contexts.businesses.length > 0 && (
            <>
              <div className="px-4 py-2 border-t border-slate-200/50">
                <p className="text-xs font-semibold text-slate-500 uppercase">Business Accounts</p>
              </div>
              
              {contexts.businesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => handleContextSwitch('business', business.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-100/50 flex items-center gap-3 transition-colors ${
                    currentContext?.type === 'business' && currentContext?.companyId === business.id 
                      ? 'bg-blue-50/50' 
                      : ''
                  }`}
                >
                  <span className="text-2xl">🏢</span>
                  <div>
                    <p className="font-medium text-sm">{business.name}</p>
                    <p className="text-xs text-slate-600">
                      {business.role === 'owner' ? 'Owner' : 'Staff'}
                    </p>
                  </div>
                  {currentContext?.type === 'business' && currentContext?.companyId === business.id && (
                    <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                </button>
              ))}
            </>
          )}
          
          {/* Create Business Account */}
          <div className="border-t border-slate-200/50 mt-2 pt-2">
            <button
              onClick={() => router.push('/setup')}
              className="w-full px-4 py-3 text-left hover:bg-slate-100/50 flex items-center gap-3 text-blue-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">Create New Business</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 