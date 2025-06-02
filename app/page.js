'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in by checking for session cookie
  useEffect(() => {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('ledgerlite_session='));
    
    setIsLoggedIn(!!sessionCookie);
  }, []);

  const handleLogoClick = () => {
    if (isLoggedIn) {
      // User is logged in - go to dashboard
      router.push('/dashboard');
    } else {
      // User is not logged in - stay on homepage (refresh)
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navigation */}
      <nav className="glass-nav fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <button 
                onClick={handleLogoClick}
                className="text-2xl font-bold text-dark cursor-pointer hover:text-slate-700 transition-colors duration-200"
              >
                LedgerLite<span className="text-lg align-super">™</span>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="glass-button-light"
              >
                Register
              </Link>
              <Link
                href="/auth/login"
                className="glass-button-primary"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="float">
            <h1 className="text-6xl sm:text-7xl font-bold text-dark mb-8 leading-tight">
              Simple <span className="text-gradient-light">Accounting</span>
              <br />
              for Nigerian SMEs
            </h1>
          </div>
          
          <div className="glass-card-subtle max-w-4xl mx-auto p-8 mb-12">
            <p className="text-xl text-medium leading-relaxed">
              LedgerLite is a cloud-based bookkeeping solution designed specifically for small and medium enterprises in Nigeria. 
              Manage your finances with ease, even offline.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/auth/login"
              className="glass-button-primary text-lg px-12 py-4"
            >
              Get Started Free
            </Link>
            <Link
              href="#features"
              className="glass-button-light text-lg px-12 py-4"
            >
              Learn More
            </Link>
          </div>
          
          {/* Floating stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="glass-card-subtle p-6 text-center float" style={{animationDelay: `${index * 0.2}s`}}>
                <div className="text-3xl font-bold text-dark mb-2">{stat.number}</div>
                <div className="text-light">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark mb-6">
              Everything You Need to Manage Your Business Finances
            </h2>
            <div className="w-24 h-1 light-divider mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="feature-card group">
                <div className="text-medium mb-6 group-hover:text-dark transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-dark mb-4">{feature.title}</h3>
                <p className="text-light leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-12">
            <h2 className="text-4xl font-bold text-dark mb-6">
              Ready to Simplify Your Accounting?
            </h2>
            <p className="text-xl text-medium mb-10 leading-relaxed">
              Join thousands of Nigerian businesses already using LedgerLite
            </p>
            <Link
              href="/auth/login"
              className="glass-button-primary text-lg px-12 py-4 inline-block"
            >
              Start Your Free Account
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="glass-nav py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-light">
            <p>&copy; 2024 LedgerLite. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const stats = [
  { number: "500+", label: "Happy Businesses" },
  { number: "₦2.5B+", label: "Transactions Processed" },
  { number: "99.9%", label: "Uptime Guarantee" }
];

const features = [
  {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Phone Number Login',
    description: 'No passwords to remember. Login securely with just your phone number and SMS verification.',
  },
  {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Double-Entry Bookkeeping',
    description: 'Professional accounting with automated journal entries and real-time balance updates.',
  },
  {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: 'Smart Invoicing',
    description: 'Create professional invoices with integrated Paystack payment links and automatic tracking.',
  },
  {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Expense Tracking',
    description: 'Capture expenses on the go with photo receipts and automatic VAT calculations.',
  },
  {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Works Offline',
    description: 'Continue working even without internet. Your data syncs automatically when you reconnect.',
  },
  {
    icon: (
      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Insightful Reports',
    description: 'Real-time dashboard, P&L statements, and comprehensive financial reports at your fingertips.',
  },
];
