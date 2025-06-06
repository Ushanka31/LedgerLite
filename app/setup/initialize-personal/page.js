'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InitializePersonalPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleInitialize = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/personal/initialize', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.message);
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setError(data.error || 'Failed to initialize personal accounts');
      }
    } catch (err) {
      console.error('Initialization error:', err);
      setError('An error occurred during initialization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Initialize Personal Finance</h1>
        
        <div className="space-y-4 text-center">
          <p className="text-slate-600">
            This will set up the personal finance structure for all users in your LedgerLite application.
          </p>
          
          <div className="p-4 bg-blue-50 rounded-lg text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What this does:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Creates personal account structures</li>
              <li>• Enables personal finance tracking</li>
              <li>• Sets up income and expense categories</li>
              <li>• Preserves all existing business data</li>
            </ul>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 text-green-600 rounded-lg">
              <p className="font-semibold">✅ {result}</p>
              <p className="text-sm mt-2">Redirecting to dashboard...</p>
            </div>
          )}

          <button
            onClick={handleInitialize}
            disabled={loading || result}
            className="primary-button w-full"
          >
            {loading ? 'Initializing...' : 'Initialize Personal Finance'}
          </button>

          <button
            onClick={() => router.push('/dashboard')}
            className="glass-button w-full"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 