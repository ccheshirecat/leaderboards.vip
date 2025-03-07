"use client";

import React, { useEffect, useState } from 'react';
import { SuperTokensWrapper } from 'supertokens-auth-react';

// This function is defined here to avoid importing from config directly
// which would cause issues during server-rendering
const initSuperTokensOnClient = async () => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Dynamically import config to avoid server-side issues
    const { initSuperTokens } = await import('./config');
    // Initialize SuperTokens
    const result = initSuperTokens();
    return result;
  } catch (err) {
    console.error("Failed to initialize SuperTokens:", err);
    return false;
  }
};

export function SuperTokensProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // Initialize SuperTokens on the client side only
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      // Don't try to initialize if we're on the server or already initializing/initialized
      if (typeof window === 'undefined' || initialized || initializing) return;
      
      // Mark as initializing to prevent duplicate initialization attempts
      setInitializing(true);
      
      try {
        const success = await initSuperTokensOnClient();
        if (isMounted && success) {
          console.log("SuperTokens initialized successfully");
          setInitialized(true);
        }
      } catch (error) {
        console.error("Error initializing SuperTokens:", error);
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
    };
  }, [initialized, initializing]);

  // During SSR or when not initialized, render children directly
  if (typeof window === 'undefined' || !initialized) {
    return <>{children}</>;
  }

  // Only use SuperTokensWrapper when initialized on client
  return (
    <SuperTokensWrapper>
      {children}
    </SuperTokensWrapper>
  );
} 