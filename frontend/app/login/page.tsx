import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-800 via-indigo-900 to-indigo-1000 p-12 flex-col justify-between text-white">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-2xl font-semibold">Extract</span>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <h1 className="text-5xl font-bold leading-tight">
            PDF
            <br />
            Transaction
            <br />
            Extraction
          </h1>
          <p className="text-lg text-indigo-100 max-w-md">
            Process financial documents
          </p>

          {/* Stats */}
        </div>

        {/* Footer */}
        <div className="text-indigo-200 text-sm">
          © 2025 Extract. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-indigo-900">Welcome Back</h2>
            <p className="mt-2 text-base text-gray-500">
              Sign in to your account to continue
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
