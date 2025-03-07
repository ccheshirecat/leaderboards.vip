import { router } from './trpc';
import { leaderboardRouter } from './routers/leaderboard.router';

// Create the root router and merge all feature routers
export const appRouter = router({
  leaderboard: leaderboardRouter,
  // Add more routers here as you build features
});

// Export type definition of the API
export type AppRouter = typeof appRouter; 