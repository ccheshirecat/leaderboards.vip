import { Injectable, Logger } from '@nestjs/common';
import { withPrisma } from '../prisma';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { LeaderboardResponse } from './models/leaderboard-response.model';
import { LeaderboardEntry } from './models/leaderboard-entry.model';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);
  private readonly CACHE_TTL = 300; // 5 minutes in seconds

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  /**
   * Fetches leaderboard data for a specific tenant and casino
   * @param tenantId The tenant ID
   * @param casino The casino name (e.g., 'stake')
   * @param page Page number (1-indexed)
   * @param pageSize Number of items per page
   * @returns Paginated leaderboard entries
   */
  async getLeaderboardData(
    tenantId: string,
    casino: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<LeaderboardResponse> {
    this.logger.log(`Fetching leaderboard data for tenant ${tenantId}, casino ${casino}, page ${page}, pageSize ${pageSize}`);
    
    // Create a cache key based on the parameters
    const cacheKey = `leaderboard:${tenantId}:${casino}:page:${page}:size:${pageSize}`;
    
    // Try to get data from cache first
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      this.logger.log(`Cache hit for ${cacheKey}`);
      return cachedData as LeaderboardResponse;
    }
    
    this.logger.log(`Cache miss for ${cacheKey}, fetching from database`);
    
    // Calculate skip value for pagination (0-indexed)
    const skip = (page - 1) * pageSize;
    
    try {
      // Fetch data from the database
      const data = await withPrisma(async (prisma) => {
        // First check if we have a record in the Leaderboard table
        const leaderboard = await prisma.leaderboard.findUnique({
          where: {
            tenantId_casino: { tenantId, casino }
          },
        });
        
        if (!leaderboard) {
          this.logger.warn(`No leaderboard found for tenant ${tenantId} and casino ${casino}`);
          return { 
            entries: [], 
            total: 0,
            page,
            pageSize,
            totalPages: 0
          } as LeaderboardResponse;
        }
        
        // Then fetch the paginated entries
        const entries = await prisma.leaderboardEntry.findMany({
          where: {
            tenantId,
            casino,
          },
          orderBy: {
            rank: 'asc',
          },
          skip,
          take: pageSize,
        });
        
        // Get total count for pagination metadata
        const total = await prisma.leaderboardEntry.count({
          where: {
            tenantId,
            casino,
          },
        });
        
        const response: LeaderboardResponse = {
          entries: entries as LeaderboardEntry[],
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        };
        
        return response;
      });
      
      // Cache the result
      await this.cacheManager.set(cacheKey, data, this.CACHE_TTL);
      
      return data;
    } catch (error) {
      this.logger.error(`Error fetching leaderboard data: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Gets leaderboard configuration
   * @param tenantId The tenant ID
   * @param casino The casino name
   */
  async getLeaderboardConfig(tenantId: string, casino: string) {
    const cacheKey = `leaderboard-config:${tenantId}:${casino}`;
    
    // Try to get from cache first
    const cachedConfig = await this.cacheManager.get(cacheKey);
    if (cachedConfig) {
      return cachedConfig;
    }
    
    const config = await withPrisma(async (prisma) => {
      const leaderboard = await prisma.leaderboard.findUnique({
        where: {
          tenantId_casino: { tenantId, casino }
        }
      });
      
      if (!leaderboard) {
        return {};
      }
      
      return leaderboard.leaderboardConfig || {};
    });
    
    // Cache the config
    await this.cacheManager.set(cacheKey, config, this.CACHE_TTL);
    
    return config;
  }
  
  /**
   * Invalidates the cache for a specific tenant and casino
   * @param tenantId The tenant ID
   * @param casino The casino name
   */
  async invalidateCache(tenantId: string, casino: string) {
    this.logger.log(`Invalidating cache for tenant ${tenantId}, casino ${casino}`);
    
    // We would need to delete all cache keys that match the pattern
    // This is a simplified version - in production you might want to use Redis SCAN
    const cacheKey = `leaderboard:${tenantId}:${casino}:*`;
    const configKey = `leaderboard-config:${tenantId}:${casino}`;
    
    // Delete the config cache
    await this.cacheManager.del(configKey);
    
    // For the data cache, we'd need to implement a more sophisticated solution
    // with Redis SCAN or keep track of all cache keys
    this.logger.log(`Cache invalidated for ${configKey} and pattern ${cacheKey}`);
  }
} 