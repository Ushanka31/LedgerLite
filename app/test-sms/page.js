'use client';

import { useState } from 'react';

export default function TestSMSPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const checkConfig = async () => {
    try {
      const response = await fetch('/api/test-termii');
      const data = await response.json();
      setResult(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  const sendTestSMS = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-termii', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="glass-card p-8">
          <h1 className="text-2xl font-bold text-dark mb-6">Test Termii SMS Integration</h1>
          
          <div className="mb-6">
            <button
              onClick={checkConfig}
              className="glass-button-secondary px-4 py-2"
            >
              Check Termii Configuration
            </button>
          </div>

          <form onSubmit={sendTestSMS} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Phone Number (with country code)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="2348012345678"
                className="w-full glass-input"
                required
              />
              <p className="mt-1 text-sm text-slate-600">
                Enter full phone number including country code (234 for Nigeria)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !phoneNumber}
              className="glass-button-primary px-6 py-2 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Test SMS'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium mb-2">Result:</p>
              <pre className="text-sm text-green-600 overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Setup Instructions:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Make sure you have TERMII_API_KEY in your .env.local file</li>
              <li>Optionally set TERMII_SENDER_ID (defaults to 'N-Alert')</li>
              <li>Use full phone numbers with country code (e.g., 2348012345678)</li>
              <li>Check the server logs for detailed error messages</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 