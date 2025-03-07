import { Test, TestingModule } from '@nestjs/testing';
import { CasinoApiService } from './casino-api.service';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Prisma
jest.mock('../prisma', () => ({
  withPrisma: jest.fn((fn) => fn({
    leaderboardEntry: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    leaderboard: {
      upsert: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue({}),
    },
    tenant: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'tenant-1',
          name: 'Test Tenant',
          casino: 'stake',
          apiConfig: { url: 'https://example.com/api/leaderboard.csv' },
        },
      ]),
    },
  })),
}));

describe('CasinoApiService', () => {
  let service: CasinoApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CasinoApiService],
    }).compile();

    service = module.get<CasinoApiService>(CasinoApiService);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchStakeLeaderboardData', () => {
    it('should fetch and transform data from Stake.com', async () => {
      // Mock CSV data
      const mockCsvData = 'user_id,wagered_amount,rank,timestamp\n' +
                         'user1,1000,1,2023-01-01T00:00:00Z\n' +
                         'user2,500,2,2023-01-01T00:00:00Z';
      
      // Mock axios response
      mockedAxios.get.mockResolvedValueOnce({
        data: mockCsvData,
      });

      // Mock tenant
      const tenant = {
        id: 'tenant-1',
        name: 'Test Tenant',
        slug: 'test-tenant',
        customDomain: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {},
        casino: 'stake',
        apiConfig: { url: 'https://example.com/api/leaderboard.csv' },
      };

      // Call the method
      const result = await service.fetchStakeLeaderboardData(tenant);

      // Assertions
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.com/api/leaderboard.csv',
        expect.objectContaining({
          headers: { 'Accept': 'text/csv' },
          responseType: 'text',
        })
      );
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        casinoPlayerId: 'user1',
        casino: 'stake',
        wagerAmount: 1000,
        rank: 1,
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        casinoPlayerId: 'user2',
        casino: 'stake',
        wagerAmount: 500,
        rank: 2,
      }));
    });

    it('should handle errors and return empty array', async () => {
      // Mock axios to throw an error
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

      // Mock tenant
      const tenant = {
        id: 'tenant-1',
        name: 'Test Tenant',
        slug: 'test-tenant',
        customDomain: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {},
        casino: 'stake',
        apiConfig: { url: 'https://example.com/api/leaderboard.csv' },
      };

      // Call the method
      const result = await service.fetchStakeLeaderboardData(tenant);

      // Assertions
      expect(result).toEqual([]);
    });
  });

  // Add more tests for other methods as needed
}); 