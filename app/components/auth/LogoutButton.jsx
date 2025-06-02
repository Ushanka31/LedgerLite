'use client';

import { useEffect, useState } from 'react';

export default function LogoutButton() {
  const [hasSession, setHasSession] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Check if there's an existing session cookie
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('ledgerlite_session='));
    
    setHasSession(!!sessionCookie);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Clear the session state
      setHasSession(false);
      
      // Reload the page to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Don't show the button if there's no session
  if (!hasSession) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="glass-button-light text-sm px-4 py-2 disabled:opacity-50"
      >
        {isLoggingOut ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin mr-2"></div>
            Logging out...
          </div>
        ) : (
          'Start Fresh Login'
        )}
      </button>
    </div>
  );
} 