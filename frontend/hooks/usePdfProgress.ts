"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface PdfProgressData {
  type: "connected" | "progress" | "completed" | "error";
  step?: string;
  processedPages?: number;
  totalPages?: number;
  totalTransactions?: number;
  progress?: number;
  error?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export function usePdfProgress(pdfId: number | null, accessToken: string | null) {
  const [progressData, setProgressData] = useState<PdfProgressData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!pdfId || !accessToken) return;

    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Create SSE connection with authentication via query parameter
      const url = `${API_URL}/transactions/progress/${pdfId}?token=${encodeURIComponent(accessToken)}`;
      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log(`📡 Connected to progress stream for PDF ${pdfId}`);
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: PdfProgressData = JSON.parse(event.data);
          console.log("📊 Progress update:", data);
          setProgressData(data);

          // Close connection when processing is complete or failed
          if (data.type === "completed" || data.type === "error") {
            console.log(`✅ Processing ${data.type} for PDF ${pdfId}`);
            eventSource.close();
            setIsConnected(false);
          }
        } catch (err) {
          console.error("Failed to parse progress data:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("❌ SSE connection error:", err);
        setError("Connection to progress stream failed");
        setIsConnected(false);
        eventSource.close();
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error("Failed to create EventSource:", err);
      setError("Failed to connect to progress stream");
      setIsConnected(false);
    }
  }, [pdfId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log("🔌 Disconnecting from progress stream");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Auto-connect when pdfId or accessToken changes
  useEffect(() => {
    if (pdfId && accessToken) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [pdfId, accessToken, connect, disconnect]);

  return {
    progressData,
    isConnected,
    error,
    connect,
    disconnect,
  };
}
