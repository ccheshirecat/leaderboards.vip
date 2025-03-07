import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardEntry } from './models/leaderboard-entry.model';
import { LeaderboardResponse } from './models/leaderboard-response.model';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';

@Resolver(() => LeaderboardEntry)
export class LeaderboardResolver {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Query(() => LeaderboardResponse, { name: 'leaderboardData' })
  @UseGuards(AuthGuard) // Protect this endpoint with authentication
  async getLeaderboardData(
    @Args('tenantId') tenantId: string,
    @Args('casino') casino: string,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, nullable: true, defaultValue: 20 }) pageSize: number,
  ): Promise<LeaderboardResponse> {
    return this.leaderboardService.getLeaderboardData(tenantId, casino, page, pageSize);
  }

  @Query(() => Object, { name: 'leaderboardConfig' })
  @UseGuards(AuthGuard) // Protect this endpoint with authentication
  async getLeaderboardConfig(
    @Args('tenantId') tenantId: string,
    @Args('casino') casino: string,
  ): Promise<any> {
    return this.leaderboardService.getLeaderboardConfig(tenantId, casino);
  }
} 