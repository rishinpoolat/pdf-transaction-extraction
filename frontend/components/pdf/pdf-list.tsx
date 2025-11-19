"use client";

interface PdfListProps {
  pdfs: Array<{
    id: number;
    filename: string;
    originalName: string;
    processingStatus: string;
    totalPages: number;
    totalTransactions: number;
    uploadedAt: string;
  }>;
  selectedPdfId?: number;
  onSelectPdf: (pdfId: number) => void;
}

export function PdfList({ pdfs, selectedPdfId, onSelectPdf }: PdfListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "queued":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Uploaded PDFs</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select a PDF to view its transactions
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {pdfs.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No PDFs uploaded yet. Upload a PDF to get started.
          </div>
        ) : (
          pdfs.map((pdf) => (
            <div
              key={pdf.id}
              onClick={() => onSelectPdf(pdf.id)}
              className={`px-6 py-4 cursor-pointer transition-colors ${
                selectedPdfId === pdf.id
                  ? "bg-blue-50 border-l-4 border-blue-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {pdf.originalName}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
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
                      {pdf.totalPages} pages
                    </span>
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
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
                      {pdf.totalTransactions} transactions
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(pdf.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <div className="ml-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      pdf.processingStatus
                    )}`}
                  >
                    {getStatusText(pdf.processingStatus)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
