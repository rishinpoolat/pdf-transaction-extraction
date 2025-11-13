"use client";

import { useTransition } from "react";
import { logoutAction } from "@/app/actions/auth";
import { toast } from "sonner";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      // Show toast BEFORE calling logout action (since redirect() throws immediately)
      toast.success("Logged out successfully!");

      try {
        await logoutAction();
      } catch (error) {
        // NEXT_REDIRECT errors are expected and shouldn't be shown to user
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        // Only show error toast if it's not a redirect error
        if (!errorMessage.includes("NEXT_REDIRECT")) {
          toast.error("Logout failed. Please try again.");
        }
      }
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-none text-white bg-indigo-800 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? "Logging out..." : "Logout"}
    </button>
  );
}
