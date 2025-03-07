import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ['latin'] });

// Load SuperTokens provider only on client-side
const SuperTokensProviderNoSSR = dynamic(
  () => import('../lib/supertokens/SuperTokensProvider').then(mod => ({ default: mod.SuperTokensProvider })),
  { ssr: false }
);

// Load TrpcProvider dynamically to avoid SSR issues
const TrpcProviderNoSSR = dynamic(
  () => import('../lib/trpc/TrpcProvider').then(mod => ({ default: mod.TrpcProvider })),
  { ssr: false }
);

export const metadata: Metadata = {
  title: 'Leaderboards.vip',
  description: 'Crypto Casino Affiliate Platform',
};

// Force dynamic rendering
export const runtime = "edge";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* SuperTokensProvider for authentication */}
        <SuperTokensProviderNoSSR>
          {/* TrpcProvider for API communication */}
          <TrpcProviderNoSSR>
            <main>{children}</main>
          </TrpcProviderNoSSR>
        </SuperTokensProviderNoSSR>
      </body>
    </html>
  );
}
