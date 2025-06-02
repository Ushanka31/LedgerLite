'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  taxNumber: z.string().optional().or(z.literal('')),
  currency: z.enum(['NGN', 'USD', 'EUR', 'GBP']),
});

export default function CompanySettingsModal({ isOpen, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [company, setCompany] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Nuclear cleanup states
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [nuclearLoading, setNuclearLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue
  } = useForm({
    resolver: zodResolver(companySchema),
    mode: 'onChange'
  });

  // Fetch company data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCompanyData();
    }
  }, [isOpen]);

  // Populate form with company data
  useEffect(() => {
    if (company && isOpen) {
      setValue('name', company.name || '');
      setValue('email', company.email || '');
      setValue('phone', company.phone || '');
      setValue('address', company.address || '');
      setValue('website', company.website || '');
      setValue('taxNumber', company.taxNumber || '');
      setValue('currency', company.currency || 'NGN');
    }
  }, [company, isOpen, setValue]);

  const fetchCompanyData = async () => {
    setFetchLoading(true);
    setError('');

    try {
      const response = await fetch('/api/company');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch company data');
      }

      setCompany(result.company);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/company/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update company');
      }

      setSuccess('Company updated successfully!');
      setCompany(result.company);
      
      // Call onUpdate callback
      if (onUpdate) {
        onUpdate(result.company);
      }

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    reset();
    onClose();
  };

  const handleNuclearCleanup = async () => {
    const confirmed = window.confirm(
      '🚨 COMPLETE BUSINESS RESET 🚨\n\n' +
      'This will PERMANENTLY DELETE ALL your business data:\n\n' +
      '• All invoices and invoice items\n' +
      '• All revenue and sales records\n' +
      '• All expense records\n' +
      '• All journal entries\n' +
      '• All financial history\n' +
      '• All payment records\n' +
      '• All business activity\n\n' +
      'Only your company profile and account will remain.\n\n' +
      'This cannot be undone. Continue?'
    );
    
    if (!confirmed) return;
    
    const secondConfirmation = window.confirm(
      'FINAL WARNING!\n\n' +
      'You are about to permanently delete ALL your business data.\n' +
      'This action is irreversible.\n\n' +
      'Type "RESET MY DATA" in the next prompt to confirm.'
    );
    
    if (!secondConfirmation) return;
    
    const finalConfirmation = window.prompt(
      'Type exactly "RESET MY DATA" to confirm the complete data reset:'
    );
    
    if (finalConfirmation !== 'RESET MY DATA') {
      alert('Data reset cancelled.');
      return;
    }
    
    setNuclearLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/analytics/revenue/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'nuclear_cleanup'
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset data');
      }
      
      setSuccess('✅ Complete business reset successful! All data including invoices has been permanently deleted. Your account is completely fresh!');
      
      // Close modal after delay
      setTimeout(() => {
        onClose();
        setSuccess('');
        // Optionally redirect to dashboard
        window.location.href = '/dashboard';
      }, 3000);
      
    } catch (err) {
      setError('Failed to reset data: ' + err.message);
    } finally {
      setNuclearLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        <div className="inline-block align-bottom glass-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Company Settings</h3>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {success}
              </div>
            )}

            {fetchLoading ? (
              <div className="py-8 text-center">
                <div className="inline-flex items-center">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading company data...
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="glass-input w-full"
                    placeholder="Enter company name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company Email
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="glass-input w-full"
                    placeholder="company@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="glass-input w-full"
                    placeholder="08012345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Address
                  </label>
                  <textarea
                    {...register('address')}
                    className="glass-input w-full"
                    rows={3}
                    placeholder="Enter company address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    {...register('website')}
                    className="glass-input w-full"
                    placeholder="https://www.company.com"
                  />
                  {errors.website && (
                    <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tax ID/Number
                  </label>
                  <input
                    type="text"
                    {...register('taxNumber')}
                    className="glass-input w-full"
                    placeholder="Enter tax identification number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Default Currency *
                  </label>
                  <select
                    {...register('currency')}
                    className="glass-input w-full"
                  >
                    <option value="NGN">Nigerian Naira (NGN)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 glass-button-light"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isValid || loading}
                    className="flex-1 glass-button-primary disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      'Update Company'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Danger Zone */}
            <div className="mt-8 pt-6 border-t border-red-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-red-700">Danger Zone</h4>
                  <p className="text-sm text-red-600">Irreversible and destructive actions</p>
                </div>
                <button
                  onClick={() => setShowDangerZone(!showDangerZone)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  {showDangerZone ? 'Hide' : 'Show'} Danger Zone
                </button>
              </div>

              {showDangerZone && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="mb-4">
                    <h5 className="font-semibold text-red-800 mb-2">Reset All Data</h5>
                    <p className="text-sm text-red-700 mb-3">
                      This will permanently delete all your business data including invoices, sales, expenses, 
                      journal entries, and financial history. Everything will be completely removed. 
                      Only your company profile and account will remain intact.
                    </p>
                    <p className="text-xs text-red-600 mb-4">
                      <strong>⚠️ Warning:</strong> This action cannot be undone. Please ensure you have 
                      exported any data you wish to keep before proceeding.
                    </p>
                  </div>

                  <button
                    onClick={handleNuclearCleanup}
                    disabled={loading || nuclearLoading || fetchLoading}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {nuclearLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Resetting All Data...
                      </div>
                    ) : (
                      '🚨 Reset All Data - Start Fresh'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 