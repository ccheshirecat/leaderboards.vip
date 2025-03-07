/**
 * tRPC client setup for the frontend
 */
import { createTRPCNext } from '@trpc/next';
import { httpBatchLink } from '@trpc/client';
import SuperTokens from 'supertokens-auth-react';
import Session from 'supertokens-auth-react/recipe/session';

// Function to get session token if the user is logged in
const getAuthorizationHeader = async () => {
  try {
    if (typeof window !== 'undefined') {
      // Try to get access token from SuperTokens
      const session = await Session.getAccessToken();
      return session ? `Bearer ${session}` : '';
    }
  } catch (err) {
    console.error('Error getting auth token:', err);
  }
  return '';
};

// Default tenant ID to use if none is set
const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || '896e04f9-e569-46c0-acef-b1ff10eaadfc';

// Function to get tenant ID
const getTenantId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('tenantId') || DEFAULT_TENANT_ID;
  }
  return DEFAULT_TENANT_ID;
};

/**
 * Create a tRPC client with the Next.js adapter
 * Using any type here to avoid importing backend types
 */
export const trpc = createTRPCNext<any>({
  config() {
    return {
      transformer: {
        serialize: (data) => JSON.stringify(data),
        deserialize: (data) => JSON.parse(data as string),
      },
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/trpc`,
          // Include authorization headers and tenant ID with each request
          async headers() {
            const authHeader = await getAuthorizationHeader();
            const tenantId = getTenantId();
            
            return {
              Authorization: authHeader,
              'X-Tenant-Id': tenantId,
            };
          },
        }),
      ],
    };
  },
  // Disable SSR for tRPC
  ssr: false,
}); 