'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatPhoneNumber } from '@/app/lib/utils';

const detailsSchema = z.object({
  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9]+$/, 'Phone number must contain only digits'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
});

const otpSchema = z.object({
  code: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^[0-9]+$/, 'OTP must contain only digits'),
});

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [userDetails, setUserDetails] = useState({ name: '', email: '' });

  const detailsForm = useForm({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      phoneNumber: '',
      name: '',
      email: '',
    },
  });

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      code: '',
    },
  });

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: data.phoneNumber }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      setPhoneNumber(data.phoneNumber);
      setUserDetails({ name: data.name, email: data.email });

      // Show OTP in development
      if (result.otp) {
        alert(`Development Mode - Your OTP is: ${result.otp}`);
      }

      setStep('otp');
      startCountdown();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (data) => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        phoneNumber,
        code: data.code,
        name: userDetails.name,
        email: userDetails.email,
      };

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify OTP');
      }

      // Redirect based on company setup
      if (!result.user.companyId) {
        router.push('/setup');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      if (result.otp) {
        alert(`Development Mode - Your OTP is: ${result.otp}`);
      }

      startCountdown();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'details') {
    return (
      <div className="glass-card p-8 w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-white/50 to-white/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-dark mb-2">Enter Your Details</h2>
          <p className="text-medium">We'll use this information to create your account</p>
        </div>

        <form onSubmit={detailsForm.handleSubmit(handleSendOTP)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-dark mb-3">Phone Number</label>
            <div className="flex rounded-2xl overflow-hidden">
              <span className="inline-flex items-center px-4 bg-white/50 backdrop-blur-sm border border-white/40 border-r-0 text-slate-600 font-medium">
                +234
              </span>
              <input
                {...detailsForm.register('phoneNumber')}
                type="tel"
                placeholder="8012345678"
                className="flex-1 glass-input border-l-0 rounded-l-none"
                disabled={loading}
              />
            </div>
            {detailsForm.formState.errors.phoneNumber && (
              <p className="mt-2 text-sm text-red-600">
                {detailsForm.formState.errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-3">Name</label>
            <input
              {...detailsForm.register('name')}
              type="text"
              placeholder="John Doe"
              className="w-full glass-input"
              disabled={loading}
            />
            {detailsForm.formState.errors.name && (
              <p className="mt-2 text-sm text-red-600">
                {detailsForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-3">Email <span className="text-light text-xs">(optional)</span></label>
            <input
              {...detailsForm.register('email')}
              type="email"
              placeholder="john@example.com"
              className="w-full glass-input"
              disabled={loading}
            />
            {detailsForm.formState.errors.email && (
              <p className="mt-2 text-sm text-red-600">
                {detailsForm.formState.errors.email.message}
              </p>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/50 backdrop-blur-sm">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin mr-2"></div>
                Sending...
              </div>
            ) : (
              'Send Verification Code'
            )}
          </button>
        </form>
      </div>
    );
  }

  // OTP STEP
  return (
    <div className="glass-card p-8 w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-white/50 to-white/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-dark mb-2">Verify Your Number</h2>
        <p className="text-medium leading-relaxed">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-dark">{formatPhoneNumber(phoneNumber)}</span>
        </p>
      </div>

      <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-dark mb-3">Verification Code</label>
          <input
            {...otpForm.register('code')}
            type="text"
            placeholder="000000"
            maxLength={6}
            className="w-full glass-input text-center text-2xl tracking-[0.5em] font-bold py-4"
            disabled={loading}
          />
          {otpForm.formState.errors.code && (
            <p className="mt-2 text-sm text-red-600">{otpForm.formState.errors.code.message}</p>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/50 backdrop-blur-sm">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full glass-button-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin mr-2"></div>
              Verifying...
            </div>
          ) : (
            'Verify Code'
          )}
        </button>

        <div className="space-y-4">
          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={countdown > 0 || loading}
              className="text-medium hover:text-dark transition-colors duration-300 disabled:text-light disabled:cursor-not-allowed font-medium"
            >
              {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend verification code'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setStep('details');
                setError('');
                otpForm.reset();
              }}
              className="text-light hover:text-medium transition-colors duration-300 text-sm"
            >
              ← Change details
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 