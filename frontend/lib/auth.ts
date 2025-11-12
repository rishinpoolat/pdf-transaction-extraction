import { cookies } from "next/headers";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Get the access token from cookies (server-side only)
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value;
}

/**
 * Get the refresh token from cookies (server-side only)
 */
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("refreshToken")?.value;
}

/**
 * Check if user is authenticated (server-side only)
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

/**
 * Set auth cookies (server-side only)
 */
export async function setAuthCookies(tokens: AuthTokens): Promise<void> {
  const cookieStore = await cookies();

  // Set access token (expires in 15 minutes)
  cookieStore.set("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 15, // 15 minutes
    path: "/",
  });

  // Set refresh token (expires in 7 days)
  cookieStore.set("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

/**
 * Clear auth cookies (server-side only)
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}

/**
 * Refresh access token using refresh token (server-side only)
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
    const response = await fetch(`${apiUrl}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is invalid or expired
      await clearAuthCookies();
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.data?.accessToken;

    if (newAccessToken) {
      // Update access token cookie
      const cookieStore = await cookies();
      cookieStore.set("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 15, // 15 minutes
        path: "/",
      });

      return newAccessToken;
    }

    return null;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return null;
  }
}

/**
 * Fetch user data from API with automatic token refresh (server-side only)
 */
export async function getCurrentUser(): Promise<User | null> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return null;
  }

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

    // First attempt to fetch user
    let response = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store", // Don't cache user data
    });

    // If token expired (401), try to refresh it
    if (response.status === 401) {
      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        // Retry with new access token
        response = await fetch(`${apiUrl}/auth/me`, {
          headers: {
            Authorization: `Bearer ${newAccessToken}`,
          },
          cache: "no-store",
        });
      } else {
        // Refresh failed, user needs to log in again
        return null;
      }
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data?.user || data.data || data.user || null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}
