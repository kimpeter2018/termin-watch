"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  console.log(
    "AuthGuard - user:",
    user,
    "profile:",
    profile,
    "loading:",
    loading
  );

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user, redirect to signin
        router.push("/auth/signin");
      } else if (
        profile &&
        !profile.onboarding_completed &&
        pathname !== "/onboarding"
      ) {
        // User exists but hasn't completed onboarding
        router.push("/onboarding");
      } else if (
        profile &&
        profile.onboarding_completed &&
        pathname === "/onboarding"
      ) {
        // User completed onboarding but is on onboarding page, redirect to dashboard
        router.push("/dashboard");
      }
    }
  }, [user, profile, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20 animate-pulse">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-900 text-lg font-semibold">
            Loading your account...
          </p>
          <p className="text-gray-500 text-sm mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If onboarding not completed and not on onboarding page, don't render children
  if (profile && !profile.onboarding_completed && pathname !== "/onboarding") {
    return null;
  }

  return <>{children}</>;
}
