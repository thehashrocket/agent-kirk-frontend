/**
 * @file src/app/auth/signin/page.tsx
 * Sign-in page component that provides OAuth-based authentication methods.
 * Supports Google and Microsoft (Azure AD) sign-in flows.
 */

"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * @component SignInContent
 * Internal component that handles the sign-in logic
 */
function SignInContent() {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "azure-ad" | null>(null);
  const searchParams = useSearchParams();

  // Check for error or success messages from URL params
  const urlError = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  /**
   * Initiates an OAuth sign-in flow and redirects on success.
   */
  const handleOAuthSignIn = async (provider: "google" | "azure-ad") => {
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
    } finally {
      setLoadingProvider(null);
    }
  };

  const errorMessageMap: Record<string, string> = {
    OAuthAccountNotLinked: "This account is already linked with a different sign-in method.",
    AccessDenied: "Access was denied. Please try a different account or contact support.",
  };

  // Display URL error if present
  const displayError = urlError ? (errorMessageMap[urlError] || "Unable to sign in. Please try again.") : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        {/* Display error message */}
        {displayError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{displayError}</div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <button
              onClick={() => handleOAuthSignIn("google")}
              disabled={!!loadingProvider}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loadingProvider === "google" ? "Redirecting..." : "Sign in with Google"}
            </button>
            <button
              onClick={() => handleOAuthSignIn("azure-ad")}
              disabled={!!loadingProvider}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
            >
              {loadingProvider === "azure-ad" ? "Redirecting..." : "Sign in with Microsoft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @component SignIn
 * @path src/app/auth/signin/page.tsx
 * Root component for the sign-in page.
 * Provides a user interface for authentication with multiple sign-in options:
 * - Google OAuth authentication
 * - Microsoft (Azure AD) OAuth authentication
 */
export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
