import { PdfUpload } from "./pdf-upload";
import { getAccessToken } from "@/lib/auth";

export async function PdfUploadSection() {
  // Read access token from server-side cookies (HttpOnly cookies are accessible here)
  const accessToken = await getAccessToken();

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upload PDF for Transaction Extraction
      </h3>
      <div className="bg-white rounded-lg shadow-md p-6">
        <PdfUpload accessToken={accessToken || undefined} />
      </div>
    </div>
  );
}
