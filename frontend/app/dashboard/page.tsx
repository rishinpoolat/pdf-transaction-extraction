import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function DashboardPage() {
  // Fetch user data server-side
  const user = await getCurrentUser();

  // Redirect to login if not authenticated (fallback, middleware should handle this)
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
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
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-6 lg:px-8">
        <div className="py-6 px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-none p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome, {user.name}!
              </h2>
              <p className="text-gray-600 mb-8">
                You are successfully authenticated.
              </p>

              {/* User Info Card */}
              <div className="max-w-md mx-auto bg-white shadow-md rounded-none p-6">
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
                <div className="bg-gray-100 rounded-none p-6">
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
