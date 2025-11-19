"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getAllPdfs, getTransactions, Transaction } from "@/lib/actions/transactions";
import { PdfList, PdfViewer } from "@/components/pdf";
import { TransactionsTable } from "./transactions-table";
import { TransactionDetailsModal } from "./transaction-details-modal";

interface PdfItem {
  id: number;
  filename: string;
  originalName: string;
  processingStatus: string;
  totalPages: number;
  totalTransactions: number;
  uploadedAt: string;
}

export function TransactionsView() {
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<number | undefined>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(true);

  const loadPdfs = useCallback(async () => {
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
  }, [selectedPdfId]);

  // Load all PDFs on mount
  useEffect(() => {
    loadPdfs();
  }, [loadPdfs]);

  const loadTransactions = useCallback(async (pdfId: number) => {
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
  }, []);

  // Load transactions when PDF is selected
  useEffect(() => {
    if (selectedPdfId) {
      loadTransactions(selectedPdfId);
    }
  }, [selectedPdfId, loadTransactions]);

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
      void loadPdfs();
    };

    // Listen for custom event from upload component
    window.addEventListener("pdf-uploaded", handleRefresh);
    return () => window.removeEventListener("pdf-uploaded", handleRefresh);
  }, [loadPdfs]);

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

  const selectedPdf = pdfs.find((pdf) => pdf.id === selectedPdfId);

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

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <div className="flex flex-col gap-6">
            {/* PDF Preview Toggle */}
            {selectedPdfId && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPdfPreview(!showPdfPreview)}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  {showPdfPreview ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                      Hide PDF Preview
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Show PDF Preview
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Content Grid */}
            <div
              className={`grid ${
                showPdfPreview && selectedPdfId ? "lg:grid-cols-2" : "lg:grid-cols-1"
              } gap-6`}
            >
              {/* PDF Preview Panel */}
              {showPdfPreview && selectedPdfId && selectedPdf && (
                <div className="h-[800px]">
                  <PdfViewer
                    pdfId={selectedPdfId}
                    originalName={selectedPdf.originalName}
                  />
                </div>
              )}

              {/* Transactions Table */}
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
