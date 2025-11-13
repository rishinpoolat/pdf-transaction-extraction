import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

/**
 * Root Page - Redirects to appropriate page based on auth status
 * 
 * This is a server component that checks authentication server-side
 * and redirects accordingly. The middleware.ts also handles this,
 * making this a fallback in case middleware is bypassed.
 */
export default async function Home() {
  const authenticated = await isAuthenticated();
  
  // Server-side redirect based on authentication status
  redirect(authenticated ? '/dashboard' : '/login');
}
