"use client";

import { usePdfProgress } from "@/hooks/usePdfProgress";
import { useEffect, useState } from "react";

interface PdfProgressProps {
  pdfId: number;
  accessToken: string;
  onComplete?: () => void;
}

export function PdfProgress({ pdfId, accessToken, onComplete }: PdfProgressProps) {
  const { progressData, isConnected, error } = usePdfProgress(pdfId, accessToken);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Call onComplete callback when processing is done
  useEffect(() => {
    if (progressData?.type === "completed" && onComplete) {
      onComplete();
    }
  }, [progressData, onComplete]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStepLabel = (step?: string) => {
    switch (step) {
      case "metadata_extracted":
        return "Extracting metadata...";
      case "processing_pages":
        return "Processing pages...";
      case "completed":
        return "Completed!";
      default:
        return "Initializing...";
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium">Progress stream error: {error}</span>
        </div>
      </div>
    );
  }

  if (!progressData && !isConnected) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
          <span>Connecting to progress stream...</span>
        </div>
      </div>
    );
  }

  const progress = progressData?.progress || 0;
  const step = progressData?.step || "initializing";
  const processedPages = progressData?.processedPages || 0;
  const totalPages = progressData?.totalPages || 0;
  const totalTransactions = progressData?.totalTransactions || 0;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="animate-pulse h-3 w-3 bg-blue-500 rounded-full"></div>
          <span className="font-medium text-blue-900">
            {getStepLabel(step)}
          </span>
        </div>
        <span className="text-sm text-blue-700">
          Elapsed: {formatTime(elapsedTime)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700">Progress</span>
          <span className="font-semibold text-blue-900">{progress}%</span>
        </div>
        <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div>
          <div className="text-xs text-blue-600 font-medium">Pages</div>
          <div className="text-lg font-semibold text-blue-900">
            {processedPages} / {totalPages}
          </div>
        </div>
        <div>
          <div className="text-xs text-blue-600 font-medium">Transactions</div>
          <div className="text-lg font-semibold text-blue-900">
            {totalTransactions}
          </div>
        </div>
      </div>

      {/* Estimated time (for processing pages step) */}
      {step === "processing_pages" && processedPages > 0 && totalPages > 0 && (
        <div className="pt-2 border-t border-blue-200">
          <div className="text-xs text-blue-600">
            {processedPages < totalPages ? (
              <>
                Processing at ~{(processedPages / (elapsedTime / 60)).toFixed(1)}{" "}
                pages/min
              </>
            ) : (
              "Finalizing..."
            )}
          </div>
        </div>
      )}

      {/* Completion message */}
      {progressData?.type === "completed" && (
        <div className="pt-2 border-t border-blue-200">
          <div className="flex items-center gap-2 text-green-700">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">Processing completed successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
}
