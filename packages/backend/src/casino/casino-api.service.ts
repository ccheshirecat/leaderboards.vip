import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { withPrisma } from '../prisma';
import { Tenant } from '@prisma/client';

@Injectable()
export class CasinoApiService {
  private readonly logger = new Logger(CasinoApiService.name);

  /**
   * Fetches leaderboard data from Stake.com
   * @param tenant The tenant object containing API configuration
   * @returns Processed leaderboard data
   */
  async fetchStakeLeaderboardData(tenant: Tenant): Promise<any[]> {
    try {
      // 1. Get API configuration for the tenant
      const apiConfig = tenant.apiConfig as { url: string; apiKey?: string };
      
      if (!apiConfig.url) {
        throw new Error('API URL not configured for tenant');
      }

      // 2. Make the API request
      this.logger.log(`Fetching data from ${apiConfig.url}`);
      const response = await axios.get(apiConfig.url, {
        headers: {
          ...(apiConfig.apiKey && { 'Authorization': `Bearer ${apiConfig.apiKey}` }),
          'Accept': 'text/csv'
        },
        responseType: 'text'
      });

      // 3. Parse the CSV data
      const parsedData = await this.parseCsvData(response.data);
      
      // 4. Transform the data to match our schema
      const transformedData = this.transformStakeData(parsedData);
      
      this.logger.log(`Successfully fetched and processed ${transformedData.length} entries`);
      return transformedData;
    } catch (error) {
      this.logger.error(`Error fetching Stake.com leaderboard data: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Parses CSV data into JSON
   * @param csvData CSV data as string
   * @returns Parsed JSON array
   */
  private async parseCsvData(csvData: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(csvData);
      
      stream
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (row: any) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', (error: any) => reject(error));
    });
  }

  /**
   * Transforms Stake.com data to match our schema
   * @param data Raw parsed data from Stake.com
   * @returns Transformed data matching our schema
   */
  private transformStakeData(data: any[]): any[] {
    return data.map((row, index) => ({
      casinoPlayerId: row.user_id || row.userId || row.id || `unknown-${index}`,
      casino: 'stake',
      wagerAmount: parseFloat(row.wagered_amount || row.wageredAmount || row.wager || '0'),
      rank: parseInt(row.rank || index + 1, 10),
      timestamp: new Date(row.timestamp || row.date || new Date()),
      data: row // Store the raw data for future reference
    }));
  }

  /**
   * Processes and stores leaderboard data in the database
   * @param tenantId Tenant ID
   * @param data Processed leaderboard data
   */
  async processAndStoreLeaderboardData(tenantId: string, data: any[]): Promise<void> {
    if (!data.length) {
      this.logger.warn(`No data to store for tenant ${tenantId}`);
      return;
    }

    try {
      await withPrisma(async (prisma) => {
        // 1. Map the fetched data to our LeaderboardEntry model
        const entries = data.map((row) => ({
          tenantId,
          casinoPlayerId: row.casinoPlayerId,
          casino: row.casino,
          wagerAmount: row.wagerAmount,
          rank: row.rank,
          timestamp: row.timestamp,
          data: row.data
        }));

        // 2. Batch upsert the entries
        this.logger.log(`Storing ${entries.length} entries for tenant ${tenantId}`);
        
        // Use Promise.all for batch processing
        await Promise.all(entries.map(entry => 
          prisma.leaderboardEntry.upsert({
            where: {
              tenantId_casinoPlayerId_casino_timestamp: {
                tenantId: entry.tenantId,
                casinoPlayerId: entry.casinoPlayerId,
                casino: entry.casino,
                timestamp: entry.timestamp
              }
            },
            create: entry,
            update: entry
          })
        ));

        // 3. Update the Leaderboard record
        await prisma.leaderboard.upsert({
          where: {
            tenantId_casino: {
              tenantId,
              casino: data[0].casino
            }
          },
          create: {
            tenantId,
            casino: data[0].casino,
            data: data,
            leaderboardConfig: {}
          },
          update: {
            lastFetched: new Date(),
            data: data
          }
        });

        this.logger.log(`Successfully stored leaderboard data for tenant ${tenantId}`);
      });
    } catch (error) {
      this.logger.error(`Error storing leaderboard data: ${error.message}`, error.stack);
    }
  }

  /**
   * Caches leaderboard data in Redis (placeholder for future implementation)
   * @param tenantId Tenant ID
   * @param casino Casino name
   */
  async cacheLeaderboardData(tenantId: string, casino: string): Promise<void> {
    // This is a placeholder for Redis caching implementation
    // Will be implemented in future sprints when Redis is added
    this.logger.log(`[Placeholder] Caching leaderboard data for tenant ${tenantId} and casino ${casino}`);
    
    // Example implementation (commented out until Redis is added):
    /*
    const leaderboard = await withPrisma(async (prisma) =>
      prisma.leaderboard.findUnique({
        where: {
          tenantId_casino: { tenantId, casino }
        }
      })
    );
    
    if (!leaderboard) {
      this.logger.warn(`No leaderboard found for tenant ${tenantId} and casino ${casino}`);
      return;
    }
    
    await redis.setex(`leaderboard:${tenantId}:${casino}`, 3600, JSON.stringify(leaderboard.data));
    */
  }

  /**
   * Scheduled task to fetch leaderboard data for all tenants
   */
  @Cron(CronExpression.EVERY_HOUR)
  async fetchAllLeaderboardData() {
    this.logger.log('Scheduled task: Fetching leaderboard data for all tenants');
    
    try {
      const tenants = await withPrisma(async (prisma) => {
        return prisma.tenant.findMany();
      });

      this.logger.log(`Found ${tenants.length} tenants`);

      for (const tenant of tenants) {
        try {
          this.logger.log(`Processing tenant: ${tenant.name} (${tenant.id}) for casino: ${tenant.casino}`);
          
          let data: any[] = [];
          
          // Fetch data based on casino type
          switch (tenant.casino.toLowerCase()) {
            case 'stake':
              data = await this.fetchStakeLeaderboardData(tenant);
              break;
            // Add cases for other casinos as needed
            default:
              this.logger.warn(`Unsupported casino: ${tenant.casino}`);
              continue;
          }

          if (data.length > 0) {
            // Process and store the fetched data
            await this.processAndStoreLeaderboardData(tenant.id, data);
            
            // Cache the data (placeholder for now)
            await this.cacheLeaderboardData(tenant.id, tenant.casino);
          } else {
            this.logger.warn(`No data fetched for tenant ${tenant.id}`);
          }
        } catch (error) {
          this.logger.error(`Error processing tenant ${tenant.id}: ${error.message}`, error.stack);
        }
      }
    } catch (error) {
      this.logger.error(`Error in scheduled task: ${error.message}`, error.stack);
    }
  }
} 