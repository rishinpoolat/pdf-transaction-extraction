"use server";

import { getAccessToken } from "../auth";

export async function uploadPdf(formData: FormData) {
  try {
    // Get access token from server-side cookies
    const accessToken = await getAccessToken();

    if (!accessToken) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

    // Forward the request to the backend with proper authorization
    const response = await fetch(`${apiUrl}/transactions/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || "Upload failed",
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload PDF",
    };
  }
}
