'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import axiosInstance from '@/lib/axios';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      // Call logout endpoint to blacklist token
      await axiosInstance.post('/auth/logout');

      // Show success toast
      toast.success('Logged out successfully!');

      // Clear local state
      logout();

      // Redirect to login
      setTimeout(() => {
        router.push('/login');
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Clearing session anyway.');

      // Clear local state regardless of API response
      logout();
      router.push('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                PDF Transaction Extraction
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.name} ({user.email})
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome, {user.name}!
              </h2>
              <p className="text-gray-600 mb-8">
                You are successfully authenticated.
              </p>

              {/* User Info Card */}
              <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  User Information
                </h3>
                <div className="space-y-3 text-left">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">ID:</span>
                    <span className="text-gray-900">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Name:</span>
                    <span className="text-gray-900">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Email:</span>
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Placeholder for Future Features */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Coming Soon
                </h3>
                <div className="bg-gray-100 rounded-lg p-6">
                  <p className="text-gray-600">
                    PDF upload and transaction extraction features will be
                    available here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
