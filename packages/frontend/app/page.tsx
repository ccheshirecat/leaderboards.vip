import React from 'react';
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for components that use Apollo Client
const LeaderboardTable = dynamic(
  () => import('../components/LeaderboardTable').then(mod => ({ default: mod.LeaderboardTable })),
  { ssr: false }
);

export default function Home() {
  // Hardcoded values for testing
  const tenantId = '896e04f9-e569-46c0-acef-b1ff10eaadfc'; // Replace with your actual tenant ID
  const casino = 'stake';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4">
          Welcome to{' '}
          <span className="text-blue-600">Leaderboards.vip</span>
        </h1>

        <p className="mt-3 text-xl mb-8">
          The premier platform for crypto casino affiliates
        </p>

        <div className="w-full max-w-6xl">
          <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
          <LeaderboardTable tenantId={tenantId} casino={casino} />
        </div>
      </div>
    </div>
  );
}
