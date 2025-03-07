'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Explicitly set this page to always render dynamically
export const runtime = "edge";

// Dynamically load SuperTokens UI to avoid SSR issues
const SuperTokensAuthUI = dynamic(
  async () => {
    if (typeof window === 'undefined') {
      // Return a placeholder during SSR
      return () => <AuthLoadingUI />;
    }
    
    try {
      // Import required modules on client-side only
      const { initSuperTokens } = await import('../../../lib/supertokens/config');
      const { canHandleRoute, getRoutingComponent } = await import('supertokens-auth-react/ui');
      const { EmailPasswordPreBuiltUI } = await import('supertokens-auth-react/recipe/emailpassword/prebuiltui');
      
      // Initialize SuperTokens
      initSuperTokens();
      
      // Create and return a component that checks if this route should be handled
      return function SuperTokensAuth() {
        // Check if SuperTokens should handle this route
        if (canHandleRoute([EmailPasswordPreBuiltUI])) {
          return getRoutingComponent([EmailPasswordPreBuiltUI]);
        }
        
        // Fallback UI
        return <AuthLoadingUI initializing={false} />;
      };
    } catch (err) {
      console.error('Failed to initialize SuperTokens:', err);
      // Return error component
      return () => <AuthLoadingUI error={true} />;
    }
  },
  { ssr: false } // Important: ensures it only runs on client
);

// Loading/error UI component
function AuthLoadingUI({ initializing = true, error = false }: { initializing?: boolean; error?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">
          Authentication
        </h2>
        <p className="text-center text-gray-600 mb-4">
          {error 
            ? "There was an error loading the authentication interface. Please try again later."
            : initializing 
              ? "Preparing authentication interface..."
              : "Loading authentication interface..."}
        </p>
        
        {!error && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
          </div>
        )}
        
        {error && (
          <div className="mt-4 text-center">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main auth page component
export default function AuthPage() {
  return <SuperTokensAuthUI />;
} 