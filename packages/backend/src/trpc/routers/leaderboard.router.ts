import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { LeaderboardService } from '../../leaderboard/leaderboard.service';

// Create a singleton instance of the leaderboard service
// We'll replace this with proper dependency injection later
let leaderboardServiceInstance: LeaderboardService | null = null;

const getLeaderboardService = (): LeaderboardService => {
  if (!leaderboardServiceInstance) {
    // This is a temporary workaround - in production you'd use proper DI
    leaderboardServiceInstance = new LeaderboardService({} as any);
  }
  return leaderboardServiceInstance;
};

// Define input schemas for type safety
const leaderboardDataInputSchema = z.object({
  tenantId: z.string(),
  casino: z.string(),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(20),
});

const leaderboardConfigInputSchema = z.object({
  tenantId: z.string(),
  casino: z.string(),
});

// Create the leaderboard router
export const leaderboardRouter = router({
  // Get leaderboard data
  getLeaderboardData: publicProcedure
    .input(leaderboardDataInputSchema)
    .query(async ({ input }) => {
      const leaderboardService = getLeaderboardService();
      return leaderboardService.getLeaderboardData(
        input.tenantId,
        input.casino,
        input.page,
        input.pageSize
      );
    }),

  // Get leaderboard configuration
  getLeaderboardConfig: publicProcedure
    .input(leaderboardConfigInputSchema)
    .query(async ({ input }) => {
      const leaderboardService = getLeaderboardService();
      return leaderboardService.getLeaderboardConfig(
        input.tenantId,
        input.casino
      );
    }),

  // Invalidate cache for a specific tenant and casino
  invalidateCache: publicProcedure
    .input(leaderboardConfigInputSchema)
    .mutation(async ({ input }) => {
      const leaderboardService = getLeaderboardService();
      await leaderboardService.invalidateCache(
        input.tenantId,
        input.casino
      );
      return { success: true };
    }),
}); 