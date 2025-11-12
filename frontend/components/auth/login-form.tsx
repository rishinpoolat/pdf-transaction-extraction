"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(loginAction, null);

  // Handle success/error states
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error, {
        duration: 4000,
      });
    }

    if (state?.success && state?.shouldRedirect) {
      toast.success("Login successful!");
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh(); // Refresh to get new auth state
      }, 500);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <div className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="text"
            autoComplete="email"
            required
            disabled={isPending}
            className={`appearance-none block w-full px-4 py-3 border ${
              state?.error ? "border-red-500" : "border-gray-300"
            } placeholder-gray-400 text-gray-900 rounded-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed transition-all`}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-900"
            >
              Password
            </label>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            className={`appearance-none block w-full px-4 py-3 border ${
              state?.error ? "border-red-500" : "border-gray-300"
            } placeholder-gray-400 text-gray-900 rounded-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed transition-all`}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isPending}
          className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-medium rounded-none text-white ${
            isPending
              ? "bg-indigo-800 cursor-not-allowed"
              : "bg-indigo-800 hover:bg-indigo-900 cursor-pointer"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all`}
        >
          {isPending ? "Signing in..." : "Sign In"}
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-none border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Demo Credentials
        </h3>
        <p className="text-sm text-gray-600 font-mono">
          Email: <span className="text-gray-900">admin</span>
        </p>
        <p className="text-sm text-gray-600 font-mono mt-1">
          Password: <span className="text-gray-900">admin123</span>
        </p>
      </div>
    </form>
  );
}
