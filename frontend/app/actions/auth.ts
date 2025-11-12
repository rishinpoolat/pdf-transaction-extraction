'use server';

import { redirect } from 'next/navigation';
import { setAuthCookies, clearAuthCookies } from '@/lib/auth';

interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
    };
    accessToken: string;
    refreshToken: string;
  };
  message?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
  shouldRedirect?: boolean;
}

/**
 * Server Action for user login
 */
export async function loginAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Validate input
  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required',
    };
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data: LoginResponse = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.message || 'Invalid credentials. Please try again.',
      };
    }

    // Set auth cookies
    if (data.data) {
      await setAuthCookies({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      });
    }

    // Return success and let client handle redirect
    return {
      success: true,
      shouldRedirect: true,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'An error occurred during login. Please try again.',
    };
  }
}

/**
 * Server Action for user logout
 */
export async function logoutAction(): Promise<void> {
  try {
    // Optionally call the backend logout endpoint to blacklist the token
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

    // Get cookies to send to the logout endpoint
    const { getAccessToken } = await import('@/lib/auth');
    const accessToken = await getAccessToken();

    if (accessToken) {
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  } catch (error) {
    console.error('Logout API error:', error);
    // Continue with local logout even if API call fails
  }

  // Clear auth cookies
  await clearAuthCookies();

  // Redirect to login
  redirect('/login');
}

/**
 * Server Action to refresh access token (callable from client)
 */
export async function refreshTokenAction(): Promise<{ success: boolean }> {
  try {
    const { refreshAccessToken } = await import('@/lib/auth');
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      return { success: true };
    }

    return { success: false };
  } catch (error) {
    console.error('Token refresh error:', error);
    return { success: false };
  }
}
