/**
 * Type definitions for tRPC
 */

// Define the basic shape of our leaderboard data
export interface LeaderboardEntry {
  id: string;
  casinoPlayerId: string;
  casino: string;
  wagerAmount: number;
  rank: number;
  timestamp: string;
  data: any;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Define AppRouter type for tRPC
export interface AppRouter {
  leaderboard: {
    getLeaderboardData: {
      input: {
        tenantId: string;
        casino: string;
        page?: number;
        pageSize?: number;
      };
      output: LeaderboardResponse;
    };
    getLeaderboardConfig: {
      input: {
        tenantId: string;
        casino: string;
      };
      output: Record<string, any>;
    };
    invalidateCache: {
      input: {
        tenantId: string;
        casino: string;
      };
      output: { success: boolean };
    };
  };
}
