"use server";

import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export interface Transaction {
  id: number;
  pdfId: number;
  pageNumber: number;
  documentNumberTamil?: string;
  documentNumberEnglish?: string;
  documentYear?: string;
  executionDate?: string;
  presentationDate?: string;
  registrationDate?: string;
  transactionNature?: string;
  sellerNameTamil?: string;
  sellerNameEnglish?: string;
  buyerNameTamil?: string;
  buyerNameEnglish?: string;
  surveyNumberTamil?: string;
  surveyNumberEnglish?: string;
  plotNumberTamil?: string;
  plotNumberEnglish?: string;
  villageTamil?: string;
  villageEnglish?: string;
  propertyType?: string;
  propertyExtent?: string;
  considerationValue?: string;
  marketValue?: string;
  originalText?: string;
  translatedText?: string;
  createdAt: string;
}

export interface TransactionsResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface GetTransactionsParams {
  pdfId?: number;
  page?: number;
  limit?: number;
  buyerName?: string;
  sellerName?: string;
  documentNumber?: string;
  surveyNumber?: string;
  plotNumber?: string;
}

export async function getTransactions(
  params: GetTransactionsParams = {}
): Promise<TransactionsResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      throw new Error("Not authenticated");
    }

    // Build query string
    const queryParams = new URLSearchParams();
    if (params.pdfId) queryParams.append("pdfId", params.pdfId.toString());
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const url = `${API_URL}/transactions?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch transactions");
    }

    return await response.json();
  } catch (error) {
    console.error("Get transactions error:", error);
    throw error;
  }
}

export async function getTransactionById(
  id: number
): Promise<{ success: boolean; data: Transaction }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch transaction");
    }

    return await response.json();
  } catch (error) {
    console.error("Get transaction error:", error);
    throw error;
  }
}

export async function getAllPdfs(): Promise<{
  success: boolean;
  data: Array<{
    id: number;
    filename: string;
    originalName: string;
    processingStatus: string;
    totalPages: number;
    totalTransactions: number;
    uploadedAt: string;
  }>;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/transactions/pdfs`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch PDFs");
    }

    return await response.json();
  } catch (error) {
    console.error("Get PDFs error:", error);
    throw error;
  }
}
