'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const setupSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  businessType: z.string().optional(),
  businessAddress: z.string().optional(),
  businessEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  businessPhone: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().default('NGN'),
});

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      companyName: '',
      businessType: '',
      businessAddress: '',
      businessEmail: '',
      businessPhone: '',
      taxId: '',
      currency: 'NGN',
    },
  });

  const handleSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/company/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to setup company');
      }

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-2xl mb-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <h1 className="text-3xl font-bold text-dark float">
              LedgerLite<span className="text-xl align-super">™</span>
            </h1>
          </div>
          <h1 className="text-4xl font-bold text-dark mb-3">Welcome to LedgerLite!</h1>
          <p className="text-medium text-lg">Let's set up your company profile to get started</p>
        </div>
      </div>

      {/* Setup Form */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="glass-card p-8">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark mb-3">
                  Company Name *
                </label>
                <input
                  {...form.register('companyName')}
                  type="text"
                  placeholder="Your Company Ltd"
                  className="w-full glass-input"
                  disabled={loading}
                />
                {form.formState.errors.companyName && (
                  <p className="mt-2 text-sm text-red-600">
                    {form.formState.errors.companyName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-3">
                  Business Type
                </label>
                <select {...form.register('businessType')} className="w-full glass-input" disabled={loading}>
                  <option value="">Select business type</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="services">Services</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-3">
                Business Address
              </label>
              <textarea
                {...form.register('businessAddress')}
                placeholder="Enter your business address"
                rows={3}
                className="w-full glass-input"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark mb-3">
                  Business Email
                </label>
                <input
                  {...form.register('businessEmail')}
                  type="email"
                  placeholder="business@example.com"
                  className="w-full glass-input"
                  disabled={loading}
                />
                {form.formState.errors.businessEmail && (
                  <p className="mt-2 text-sm text-red-600">
                    {form.formState.errors.businessEmail.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-3">
                  Business Phone
                </label>
                <input
                  {...form.register('businessPhone')}
                  type="tel"
                  placeholder="Business phone number"
                  className="w-full glass-input"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark mb-3">
                  Tax ID (Optional)
                </label>
                <input
                  {...form.register('taxId')}
                  type="text"
                  placeholder="Tax identification number"
                  className="w-full glass-input"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark mb-3">
                  Currency
                </label>
                <select {...form.register('currency')} className="w-full glass-input" disabled={loading}>
                  <option value="NGN">Nigerian Naira (₦)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/50 backdrop-blur-sm">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full glass-button-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin mr-2"></div>
                    Setting up your company...
                  </div>
                ) : (
                  'Complete Setup & Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 text-center text-sm text-light">
        <p>
          You can update these details later in your settings
        </p>
      </div>
    </div>
  );
} 