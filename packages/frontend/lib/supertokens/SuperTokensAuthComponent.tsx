'use client';

import React from 'react';
import EmailPassword from 'supertokens-auth-react/recipe/emailpassword';
import { redirectToAuth } from 'supertokens-auth-react';

// This component doesn't need to render EmailPasswordAuth directly
// SuperTokens handles the auth UI based on routes
export default function SuperTokensAuthComponent() {
  // Redirect to auth on mount if needed
  React.useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/auth')) {
      // SuperTokens will handle the auth UI
      // No need to do anything here
    } else {
      // For other routes, we can add logic if needed
    }
  }, []);
  
  // Return a loading state since SuperTokens will handle the actual UI
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <h2 className="mb-4 text-center text-2xl font-bold text-gray-800">
          Authentication
        </h2>
        <p className="text-center text-gray-600">
          Loading authentication interface...
        </p>
      </div>
    </div>
  );
} 