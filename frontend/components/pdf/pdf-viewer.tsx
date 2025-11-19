"use client";

import { useState, useEffect } from "react";
import { getPdfFile } from "@/lib/actions/transactions";

interface PdfViewerProps {
  pdfId: number;
  originalName: string;
}

export function PdfViewer({ pdfId, originalName }: PdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call server action to fetch PDF with authentication
        const dataUrl = await getPdfFile(pdfId);

        if (!dataUrl) {
          throw new Error("Failed to load PDF");
        }

        setPdfDataUrl(dataUrl);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError(err instanceof Error ? err.message : "Failed to load PDF");
      } finally {
        setLoading(false);
      }
    };

    void fetchPdf();
  }, [pdfId]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError("Failed to display PDF");
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 truncate">
            {originalName}
          </h3>
          {pdfDataUrl && (
            <a
              href={pdfDataUrl}
              download={originalName}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              Download PDF
            </a>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-600">Loading PDF...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-3 text-sm font-medium text-gray-900">{error}</p>
              <p className="mt-1 text-xs text-gray-500">
                Please try refreshing the page
              </p>
            </div>
          </div>
        )}

        {pdfDataUrl && !loading && (
          <iframe
            src={pdfDataUrl}
            className="w-full h-full border-0"
            title={originalName}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
}
