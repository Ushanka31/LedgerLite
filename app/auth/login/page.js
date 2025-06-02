import PhoneLoginForm from '@/app/components/auth/PhoneLoginForm';
import LogoutButton from '@/app/components/auth/LogoutButton';

export const metadata = {
  title: 'Login - LedgerLite',
  description: 'Login to your LedgerLite account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Logout button for existing sessions */}
      <LogoutButton />
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <h1 className="text-3xl font-bold text-dark float">
              LedgerLite<span className="text-xl align-super">™</span>
            </h1>
          </div>
          <h1 className="text-4xl font-bold text-dark mb-3">Welcome</h1>
          <p className="text-medium text-lg">Sign in or Register with LedgerLite</p>
        </div>
      </div>

      {/* Login Form */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <PhoneLoginForm />
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 text-center text-sm text-light">
        <p>
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-medium hover:text-dark transition-colors duration-300 underline underline-offset-4">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-medium hover:text-dark transition-colors duration-300 underline underline-offset-4">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
} 