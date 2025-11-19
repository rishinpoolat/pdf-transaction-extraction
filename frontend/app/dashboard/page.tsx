import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { PdfUploadSection } from "@/components/pdf/pdf-upload-section";
import { TransactionsView } from "@/components/transactions/transactions-view";

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
        <div className="space-y-6">
          {/* PDF Upload Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Upload PDF
            </h2>
            <p className="text-gray-600 mb-4">
              Upload a Tamil property transaction PDF to extract and translate transaction details
            </p>
            <PdfUploadSection />
          </div>

          {/* Transactions View */}
          <TransactionsView />
        </div>
      </main>
    </div>
  );
}
