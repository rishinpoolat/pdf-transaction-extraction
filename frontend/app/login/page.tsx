"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

// Login schema validation
const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const hasRedirected = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  // Prevent redirect loop - only redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await axiosInstance.post("/auth/login", data);

      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;

        // Show success toast
        toast.success("Login successful!");

        // Update Zustand store and localStorage
        login({ accessToken, refreshToken }, user);

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      }
    } catch (err) {
      // Show error toast with longer duration
      console.log(err);
      const errorMessage =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;

      const message = errorMessage || "Invalid credentials. Please try again.";

      toast.error(message, {
        duration: 4000,
      });

      // Set form error
      setError("root", {
        type: "manual",
        message,
      });

      // Re-enable form
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-800 via-indigo-900 to-indigo-1000 p-12 flex-col justify-between text-white">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-2xl font-semibold">Extract</span>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <h1 className="text-5xl font-bold leading-tight">
            PDF
            <br />
            Transaction
            <br />
            Extraction
          </h1>
          <p className="text-lg text-indigo-100 max-w-md">
            Process financial documents
          </p>

          {/* Stats */}
        </div>

        {/* Footer */}
        <div className="text-indigo-200 text-sm">
          © 2025 Extract. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-indigo-900">Welcome Back</h2>
            <p className="mt-2 text-base text-gray-500">
              Sign in to your account to continue
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Email Address
                </label>
                <input
                  {...register("email")}
                  id="email"
                  type="text"
                  autoComplete="email"
                  disabled={isLoading}
                  className={`appearance-none block w-full px-4 py-3 border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed transition-all`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.email.message}
                  </p>
                )}
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
                  {...register("password")}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={`appearance-none block w-full px-4 py-3 border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed transition-all`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-medium rounded-xl text-white ${
                  isLoading
                    ? "bg-indigo-800 cursor-not-allowed"
                    : "bg-indigo-800 hover:bg-indigo-900 cursor-pointer"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all`}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
        </div>
      </div>
    </div>
  );
}
