"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { uploadPdf } from "@/lib/actions/upload";

export function PdfUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== "application/pdf") {
      return "Please upload a PDF file only";
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    return null;
  };

  const handleFile = (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      toast.error(error);
      return;
    }

    setFile(selectedFile);
    toast.success(`File selected: ${selectedFile.name}`);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Use server action to upload with proper authentication
      const result = await uploadPdf(formData);

      clearInterval(progressInterval);
      setProgress(100);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      toast.success("PDF uploaded and processed successfully!");

      // Reset state
      setFile(null);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload PDF";
      toast.error(errorMessage);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {/* Drag and Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 bg-white hover:border-gray-400"
          }
          ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploading}
        />

        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="flex justify-center">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Upload Text */}
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragging ? "Drop your PDF here" : "Drag and drop your PDF here"}
            </p>
            <p className="text-sm text-gray-500 mt-1">or</p>
            <button
              type="button"
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
            >
              Browse Files
            </button>
          </div>

          {/* File Info */}
          <p className="text-xs text-gray-500">
            PDF files only, maximum {MAX_FILE_SIZE / (1024 * 1024)}MB
          </p>
        </div>
      </div>

      {/* Selected File Info */}
      {file && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg
                className="w-8 h-8 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            {!uploading && (
              <button
                onClick={handleRemoveFile}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Uploading...
                </span>
                <span className="text-sm font-medium text-gray-700">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          {!uploading && (
            <button
              onClick={handleUpload}
              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Upload and Process PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
}
