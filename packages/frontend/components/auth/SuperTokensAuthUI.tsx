'use client';

import React, { useEffect } from 'react';
import { SuperTokensWrapper } from 'supertokens-auth-react';
import { initSuperTokens } from '../../lib/supertokens/config';

export default function SuperTokensAuthUI() {
  // Initialize SuperTokens
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initSuperTokens();
    }
  }, []);

  // This is a placeholder component
  // SuperTokens will automatically handle the auth UI when initialized
  return (
    <SuperTokensWrapper>
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
    </SuperTokensWrapper>
  );
} 