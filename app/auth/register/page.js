import RegisterForm from '@/app/components/auth/RegisterForm';
import LogoutButton from '@/app/components/auth/LogoutButton';

export const metadata = {
  title: 'Register - LedgerLite',
  description: 'Create a new LedgerLite account',
};

export default function RegisterPage() {
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
          <h1 className="text-4xl font-bold text-dark mb-3">Create Account</h1>
          <p className="text-medium text-lg">Register with LedgerLite</p>
        </div>
      </div>

      {/* Register Form */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm />
        <div className="mt-6 text-center">
          <p className="text-sm text-light">
            Already have an account?{' '}
            <a href="/auth/login" className="text-medium hover:text-dark underline underline-offset-4">Login</a>
          </p>
        </div>
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