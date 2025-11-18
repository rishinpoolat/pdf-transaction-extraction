"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAllPdfs, getTransactions, Transaction } from "@/lib/actions/transactions";
import { PdfList } from "@/components/pdf";
import { TransactionsTable } from "./transactions-table";
import { TransactionDetailsModal } from "./transaction-details-modal";

export function TransactionsView() {
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<number | undefined>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Load all PDFs on mount
  useEffect(() => {
    loadPdfs();
  }, []);

  // Load transactions when PDF is selected
  useEffect(() => {
    if (selectedPdfId) {
      loadTransactions(selectedPdfId);
    }
  }, [selectedPdfId]);

  const loadPdfs = async () => {
    try {
      setLoading(true);
      const response = await getAllPdfs();
      if (response.success) {
        setPdfs(response.data);
        // Auto-select first PDF if available
        if (response.data.length > 0 && !selectedPdfId) {
          setSelectedPdfId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load PDFs:", error);
      toast.error("Failed to load PDFs");
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (pdfId: number) => {
    try {
      setLoadingTransactions(true);
      const response = await getTransactions({ pdfId, limit: 1000 });
      if (response.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSelectPdf = (pdfId: number) => {
    setSelectedPdfId(pdfId);
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleCloseModal = () => {
    setSelectedTransaction(null);
  };

  // Refresh data when a new PDF is uploaded
  useEffect(() => {
    const handleRefresh = () => {
      loadPdfs();
    };

    // Listen for custom event from upload component
    window.addEventListener("pdf-uploaded", handleRefresh);
    return () => window.removeEventListener("pdf-uploaded", handleRefresh);
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (pdfs.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No PDFs uploaded</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload a PDF to start extracting transactions
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* PDF List Sidebar */}
        <div className="lg:col-span-1">
          <PdfList
            pdfs={pdfs}
            selectedPdfId={selectedPdfId}
            onSelectPdf={handleSelectPdf}
          />
        </div>

        {/* Transactions Table */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Transactions
                {selectedPdfId && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (PDF #{selectedPdfId})
                  </span>
                )}
              </h2>
              <button
                onClick={loadPdfs}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>

            {loadingTransactions ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading transactions...</span>
              </div>
            ) : (
              <TransactionsTable
                transactions={transactions}
                onViewDetails={handleViewTransaction}
              />
            )}
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={handleCloseModal}
      />
    </>
  );
}
