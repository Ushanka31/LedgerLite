'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Progress Ring Component
function ProgressRing({ progress = 0, size = 32 }) {
  const radius = (size - 4) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative">
      <svg
        className="progress-ring"
        width={size}
        height={size}
      >
        <circle
          className="text-slate-200"
          strokeWidth="2"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="progress-ring-circle text-blue-600"
          strokeWidth="2"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-slate-700">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

// Sync Status Component
function SyncStatus({ status = 'synced', lastSync = 'now' }) {
  const statusConfig = {
    synced: { 
      color: 'synced', 
      text: 'Synced', 
      tooltip: `Last synced ${lastSync}` 
    },
    queued: { 
      color: 'queued', 
      text: 'Syncing...', 
      tooltip: 'Sync in progress' 
    },
    error: { 
      color: 'error', 
      text: 'Sync failed', 
      tooltip: 'Click to retry sync' 
    },
  };

  const config = statusConfig[status];

  return (
    <div className="relative group">
      <div className="flex items-center gap-2 cursor-pointer">
        <div className={`sync-indicator ${config.color}`}></div>
        <span className="text-xs text-slate-600 hidden sm:inline">{config.text}</span>
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {config.tooltip}
      </div>
    </div>
  );
}

// Avatar Dropdown Component
function AvatarDropdown({ user, onLogout, onUserUpdate, onOpenProfileModal, onOpenCompanyModal }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.phoneNumber?.slice(-2) || '??';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm flex items-center justify-center hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 glass-card-subtle py-2 z-50">
          <div className="px-4 py-3 border-b border-slate-200/50">
            <p className="text-sm font-medium text-slate-800">{user?.name || 'User'}</p>
            <p className="text-xs text-slate-600">{user?.phoneNumber}</p>
            {user?.email && (
              <p className="text-xs text-slate-600">{user.email}</p>
            )}
          </div>
          
          <div className="py-1">
            <button 
              onClick={() => {
                setIsOpen(false);
                onOpenProfileModal();
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100/50 flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile Settings
            </button>
            
            <button 
              onClick={() => {
                setIsOpen(false);
                onOpenCompanyModal();
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100/50 flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Company Settings
            </button>
            
            <div className="border-t border-slate-200/50 my-1"></div>
            
            <button 
              onClick={onLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50/50 flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EnhancedNavbar({ 
  user = {}, 
  setupProgress = 0, 
  syncStatus = 'synced',
  lastSync = 'now',
  onLogout,
  onUserUpdate,
  onOpenProfileModal,
  onOpenCompanyModal
}) {
  const showProgress = setupProgress < 100;
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (onLogout) onLogout();
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogoClick = () => {
    // Check if user is logged in (has user data)
    if (user && (user.id || user.phoneNumber || user.name)) {
      // User is logged in - go to dashboard
      router.push('/dashboard');
    } else {
      // User is not logged in - go to homepage
      router.push('/');
    }
  };

  return (
    <nav className="glass-nav fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogoClick}
              className="text-xl font-bold text-dark cursor-pointer hover:text-slate-700 transition-colors duration-200"
            >
              LedgerLite<span className="text-sm align-super">™</span>
            </button>
            
            {/* Setup Progress Ring (only show if setup incomplete) */}
            {showProgress && (
              <div className="hidden sm:flex items-center gap-2">
                <ProgressRing progress={setupProgress} />
                <span className="text-xs text-slate-600">Setup</span>
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Search Bar Placeholder (future enhancement) */}
            <div className="hidden md:block">
              <div className="w-64 glass-input h-8 flex items-center px-3 text-sm text-slate-500">
                Search... ⌘K
              </div>
            </div>

            {/* Sync Status */}
            <SyncStatus status={syncStatus} lastSync={lastSync} />

            {/* Avatar Dropdown */}
            <AvatarDropdown 
              user={user} 
              onLogout={handleLogout} 
              onUserUpdate={onUserUpdate}
              onOpenProfileModal={onOpenProfileModal}
              onOpenCompanyModal={onOpenCompanyModal}
            />
          </div>
        </div>
      </div>
    </nav>
  );
} 