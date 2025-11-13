"use client";

import { PdfUpload } from "./pdf-upload";

export function PdfUploadSection() {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upload PDF for Transaction Extraction
      </h3>
      <div className="bg-white rounded-lg shadow-md p-6">
        <PdfUpload />
      </div>
    </div>
  );
}
