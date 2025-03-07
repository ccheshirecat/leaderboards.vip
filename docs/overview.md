# 🚀 Leaderboards.vip - Comprehensive Execution Plan (v4 - Crypto Casino Affiliate Focus)

## Executive Summary

This document outlines a comprehensive, phase-by-phase plan for building Leaderboards.vip, a platform designed specifically for crypto casino affiliates (primarily Kick streamers). The platform enables affiliates to:

*   Display leaderboard data fetched from casino APIs (Stake.com, Shuffle.com, etc.).
*   Automate player rewards (crypto payouts) based on configurable rules triggered by casino data.
*   Manage and automate sub-affiliate commissions.
*   Offer a player referral program with points-based rewards (manually verified).
*   Customize the appearance of their leaderboard pages.

The architecture is serverless-first, emphasizing scalability, cost-efficiency, and ease of maintenance. It leverages Cloudflare Workers, Neon PostgreSQL, Upstash Redis, and Thirdweb.

---

## Phase 1: Core Infrastructure & Casino API Integration (3-4 weeks)

**This phase is the *foundation* of the entire platform.  It prioritizes getting the data pipeline working reliably.**

### 1.1 Project Initialization & Development Environment

**Tasks:**
- Set up Git repository with branch protection rules.
- Configure development, staging, and production environments.
- Implement CI/CD pipelines with GitHub Actions (automated deployments on branch pushes/merges).
- Set up linting, formatting, and testing tools (Prettier, ESLint, Jest).
- Create Docker development environment for consistent local development.
- Establish a comprehensive monorepo structure using pnpm workspaces (frontend, backend, shared, bot-telegram, bot-discord).

**Technical Implementation:** (Same as previous plan, but re-emphasized)
```bash
# Project initialization (Monorepo setup)
mkdir leaderboards.vip
cd leaderboards.vip
git init
pnpm init

# Create workspace configuration
mkdir packages
cd packages
mkdir frontend
mkdir backend
mkdir shared
mkdir bot-telegram # Example
mkdir bot-discord # Example
cd ..

# pnpm-workspace.yaml (in the root)
# packages:
#  - 'packages/*'

# Set up Next.js frontend
cd packages/frontend
npx create-next-app@latest . --typescript --tailwind --eslint
pnpm add @shadcn/ui @tanstack/react-query zod axios framer-motion

# Set up NestJS backend
cd ../backend
npx @nestjs/cli new . --package-manager pnpm
pnpm add @nestjs/graphql @prisma/client trpc @nestjs/config nestjs-zod

# Example Shared package
cd ../shared
pnpm init -y
pnpm add typescript zod
# Add shared types, utility functions, etc.
```

**Deployment Configuration:**
- Configure Vercel for frontend deployment (with edge caching).
- Set up Cloudflare Workers for backend deployment (with connection pooling and regional deployments).
- Use environment variables (Doppler/Vault/Cloudflare Secrets) for sensitive configuration.
- Set up CI/CD to automatically deploy to staging on pushes to `develop` and to production on merges to `main` (with manual approval for production).

**Best Practices:**
- Strict TypeScript configuration (shared `tsconfig.json`).
- Shared type definitions (in the `shared` package).
- Document API standards and coding conventions from the start.
- Comprehensive error handling, logging, and monitoring.

**Potential Challenges:**
- Consistent development environment across team members.
- CI/CD configuration for a monorepo.
- Secrets management for serverless deployments.

### 1.2 Database & Caching Setup (Optimized for Casino Data)

**Tasks:**
- Set up Neon PostgreSQL database (with connection pooling and appropriate compute sizing).
- Configure Prisma ORM (with migration workflows and a schema tailored for this use case).
- Implement Upstash Redis (for caching processed leaderboard data and other high-frequency data).
- Design the initial database schema (including tables for tenants, users, leaderboard entries, referrals, sub-affiliate assignments, payouts, and commissions).
- Set up database backups and point-in-time recovery.

**Technical Implementation:**
```bash
# Set up Prisma (in the backend package)
cd packages/backend
pnpm add prisma -D
pnpm exec prisma init

# Configure Redis
pnpm add @upstash/redis ioredis
```

**Database Schema Planning (Key Tables):**

```prisma
// packages/backend/prisma/schema.prisma

model Tenant { // Represents an affiliate (streamer)
  id            String   @id @default(uuid())
  name          String
  slug          String   @unique
  customDomain  String?  @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  settings      Json     @default("{}") // Affiliate-specific settings (e.g., gas fee coverage)
  casino        String   // e.g., "stake", "shuffle" - to handle different API formats
  apiConfig     Json     // Store API keys/credentials (encrypted)
  users         User[]
  leaderboards  Leaderboard[]
  referrals     Referral[]
  subAffiliateAssignments SubAffiliateAssignment[]
  commissions     Commission[]
  payouts       Payout[]
    wallets     Wallet[]
  @@index([createdAt])
}

model User { // Represents a player *or* a sub-affiliate
    id              String     @id @default(uuid())
    tenantId        String
    casinoPlayerId  String?  // ID of the player on the casino platform
    casino          String? // Casino platform
    username        String? // Consider how to handle usernames securely and avoid PII issues
    email           String?   @unique // Optional, for communication
    password        String? // Optional, for direct login (if you offer it)
    referredBy      String? // ID of the referring user (for player referrals)
    referralCode    String  @unique @default(uuid()) //for sub affiliate assignment
    role            String   // "player", "sub_affiliate", "affiliate_admin", "superadmin"
    createdAt       DateTime   @default(now())
    updatedAt       DateTime   @updatedAt()
    pointsBalance   Float    @default(0) // For the player referral points system
    tenant          Tenant     @relation(fields: [tenantId], references: [id])
    referrals       Referral[]  // Referrals made by this user
    referredUsers   User[]     @relation("UserReferrals", fields: [referredBy], references: [id])
    referrer        User?       @relation("UserReferrals")
    subAffiliateAssignments SubAffiliateAssignment[] // Players assigned to this sub-affiliate
    playerAssignments       SubAffiliateAssignment[]    @relation("PlayerAssignments")
    commissions     Commission[] // Commissions earned by this user (if sub-affiliate)
    payouts         Payout[] // Payouts received by this user
    wallets     Wallet[]

    @@index([tenantId, role])
    @@index([referredBy])
    @@index([casinoPlayerId, casino]) // Index for efficient lookups
    @@unique([tenantId, casinoPlayerId, casino]) // Prevent duplicate casino player IDs
}

//This table is crucial for storing the processed data from the casino APIs.
model LeaderboardEntry {
  id            String   @id @default(uuid())
  tenantId      String
  userId        String? // Link to your User table (optional, if you link casino players)
  casinoPlayerId String // ID of the player on the casino platform
  casino        String   //e.g., "stake", "shuffle"
  wagerAmount   Float
  rank          Int
  timestamp     DateTime // Timestamp from the casino API
  data          Json     // Store any other relevant data from the casino API
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  user          User?     @relation(fields: [userId], references: [id])

  @@index([tenantId, timestamp])
  @@index([casinoPlayerId, casino])
  @@unique([tenantId, casinoPlayerId, casino, timestamp]) // Prevent duplicate entries

}

// Tracks player referrals (for the points system).
model Referral {
  id             String   @id @default(uuid())
  tenantId       String
  referringUserId String // The player who made the referral
  referredUserId  String // The new player who signed up
  status         String   // "pending", "approved", "rejected"
  createdAt      DateTime @default(now())
  approvedAt     DateTime?
  pointsAwarded   Int?
  tenant         Tenant    @relation(fields: [tenantId], references: [id])
  referringUser  User      @relation("ReferringUser", fields: [referringUserId], references: [id])
  referredUser   User      @relation("ReferredUser", fields: [referredUserId], references: [id])

  @@index([tenantId, status])
}

// Tracks which players are assigned to which sub-affiliates.
model SubAffiliateAssignment {
    id             String   @id @default(uuid())
    tenantId       String
    affiliateId    String //the user Id of the affiliate
    subAffiliateId String // The sub-affiliate
    playerId       String // The player assigned to the sub-affiliate
    assignedAt     DateTime @default(now())
    tenant         Tenant    @relation(fields: [tenantId], references: [id])
    affiliate      User      @relation("AffiliateAssignments",fields: [affiliateId], references: [id])
    subAffiliate   User      @relation(fields: [subAffiliateId], references: [id])
    player         User      @relation("PlayerAssignments", fields: [playerId], references: [id])

  @@index([tenantId, subAffiliateId])
  @@index([tenantId, playerId])
}

//Tracks sub-affiliate commissions.
model Commission {
  id             String   @id @default(uuid())
  tenantId       String
  affiliateId       String
  subAffiliateId String
  playerId       String? // Optional, if commissions are calculated per-player
  amount         Float
  currency       String
  status         String   // "pending", "approved", "paid"
  createdAt      DateTime @default(now())
  paidAt         DateTime?
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  affiliate     User      @relation("AffiliateCommissions",fields: [affiliateId], references: [id])
  subAffiliate   User      @relation(fields: [subAffiliateId], references: [id])
  player       User?      @relation(fields: [playerId], references: [id])

    @@index([tenantId, status])
}

// Tracks payouts (to both players and sub-affiliates).
model Payout {
  id              String   @id @default(uuid())
  tenantId        String
  userId          String // The recipient (player or sub-affiliate)
  walletId        String   // The *source* wallet (the affiliate's wallet)
  amount          Float
  currency        String
  transactionHash String?  // From the blockchain
  status          String   // "pending", "approved", "processing", "completed", "failed"
  createdAt       DateTime @default(now())
  processedAt     DateTime?
  gasFee          Float?
  gasFeeCoveredBy String?   // "affiliate" or "player"
    notes           String?
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  user            User      @relation(fields: [userId], references: [id])
  wallet          Wallet    @relation(fields: [walletId], references: [id])

    @@index([tenantId, status])
}

// Represents a wallet created by *your platform* (using Thirdweb).
model Wallet {
  id            String   @id @default(uuid())
  tenantId      String
  userId        String   @unique // The owner of the wallet (player or sub-affiliate)
  address       String   @unique // The wallet address
  encryptedKey  String?           // Encrypted private key (if you manage keys)
  type          String // "player" or "sub_affiliate" or "affiliate"
  chain         String // e.g., "ethereum", "polygon", "solana"
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  user          User      @relation(fields: [userId], references: [id])
  payouts       Payout[]

    @@index([tenantId, type])
}

//Used to store static or slowly changing data from casino apis to reduce calls
model Leaderboard{
    id String @id @default(uuid())
    tenantId String
    casino String
    lastFetched DateTime @default(now())
    leaderboardConfig Json
    data Json
    tenant Tenant @relation(fields:[tenantId], references: [id])

     @@index([tenantId, casino])
}

```
**Connection Management:** (Same as before, but crucial)

```typescript
// packages/backend/src/prisma.ts (Example Prisma Client Setup)
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : [],
});

export async function withPrisma<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  try {
    return await fn(prisma);
  } finally {
    await prisma.$disconnect();
  }
}
```

**Best Practices:**
- Database migrations from day one.
- Separate dev/staging/prod databases.
- Appropriate indexes (especially on foreign keys and frequently queried fields).
- Efficient data models.
- Database backups and recovery.
- Query logging (in dev/staging).
- Database monitoring.
- Row-Level Security (RLS) for tenant isolation.

**Potential Challenges:**
- Efficiently storing and querying large amounts of casino data.
- Handling different casino API formats.
- Managing database connections in a serverless environment.

### 1.3 Authentication & Core API Structure

**Tasks:**
- Implement SuperTokens for authentication (with Redis session storage).
- Set up RBAC (roles: `superadmin`, `affiliate_admin`, `sub_affiliate`, `player`).
- Create core API structure (GraphQL and/or tRPC) – design for efficiency and batching.
- Implement basic health-check endpoints.
- Implement rate limiting and request batching.
- Implement robust error handling and logging.
- **NEW:** Integrate WalletConnect for player withdrawals.

**Technical Implementation:**
```bash
# SuperTokens and GraphQL/tRPC setup (same as before)
cd packages/backend
pnpm add supertokens-node
pnpm add @trpc/server @nestjs/graphql @nestjs/apollo graphql apollo-server-express
pnpm add @walletconnect/web3-provider @walletconnect/client
```

**API Optimization:** (Same as before, but crucial)

```typescript
// packages/backend/src/app.module.ts (Example with middleware)
// ... imports ...
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { connectionMiddleware } from './middleware/connection.middleware';
import { tenantMiddleware } from './middleware/tenant.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';

@Module({
  imports: [ /* ... */ ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        loggingMiddleware,
        connectionMiddleware,
        tenantMiddleware,
        rateLimitMiddleware
      )
      .forRoutes('*');
  }
}
```
**WalletConnect Integration (Example):**

```typescript
// packages/backend/src/auth/walletconnect.service.ts
import { Injectable } from '@nestjs/common';
import WalletConnectProvider from "@walletconnect/web3-provider";
import { withPrisma } from 'src/prisma';

@Injectable()
export class WalletConnectService {
  private provider: WalletConnectProvider;

    constructor() {
         this.provider = new WalletConnectProvider({
            infuraId: process.env.INFURA_ID, // Replace with your Infura ID or other provider
        });
    }

    async enableProvider(){
        await this.provider.enable()
    }

    async getAccounts(): Promise<string[]>{
        return this.provider.accounts;
    }

    async disconnect(){
        await this.provider.disconnect()
    }

    async linkWalletAddress(userId: string, address: string) {
        return withPrisma(async (prisma) => {
            // Basic validation (you might want more robust address validation)
            if (!address.startsWith('0x') || address.length !== 42) {
                throw new Error('Invalid Ethereum address');
            }
            // Update user record with the linked wallet address
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    //Consider if u want to have a dedicated table for managing external addresses.
                    //For now, proceed with this, subject to change.
                    externalWalletAddress: address,
                },
            });
        })
    }
}
```
**Auth Configuration:**
- Token-based authentication (JWT) with SuperTokens.
- Social login providers (optional).
- JWT claims: `tenantId`, `userId`, `roles`.
- Redis for session storage.
- Edge caching for static auth assets.
- Robust password reset and account recovery.
- Multi-factor authentication (MFA) as an option.

**Best Practices:**
- Aggressive rate limiting for auth endpoints.
- Proper CORS configuration.
- Caching for user data.
- Scalable session storage (Redis).
- Local data preloading for configuration.
- Regular security audits.

**Potential Challenges:**
- Seamless auth experience across platforms.
- Balancing security with usability.
- Managing auth state in serverless.
- Handling cold starts.
- Concurrent authentication requests.

## Phase 2: Leaderboard Display & User Management (2-3 weeks)

**This phase focuses on presenting the fetched casino data and managing user accounts within the affiliate's context.**

### 2.1 Multi-Tenant System Architecture (Refined for Casino Data)

**Tasks:**
- Implement tenant management system (affiliate accounts).
- Implement efficient tenant isolation in the database (row-based, with composite indexes).
- Create a tenant onboarding workflow (signup, configuration, custom domain setup).
- Set up custom domain handling (wildcard DNS and routing).
- Implement data partitioning strategies (plan for the future).
- Design a tenant lifecycle management system.
- **NEW:** Implement the Casino API fetching and processing logic.  This is the *core* of this phase.

**Technical Implementation:**
```typescript
// packages/backend/src/middleware/tenant.middleware.ts (Tenant resolution - same as before)
// ... (see previous code example) ...

// packages/backend/src/casino/casino-api.service.ts (Example Fetcher Service)
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { withPrisma } from '../prisma';
import { Tenant } from '@prisma/client'


@Injectable()
export class CasinoApiService {
    private readonly logger = new Logger(CasinoApiService.name)

    // Example: Fetch data from a Stake.com leaderboard CSV
    async fetchStakeLeaderboardData(tenant: Tenant): Promise<any[]> {
        // 1. Get API configuration for the tenant (from tenant.apiConfig)
        const apiConfig = tenant.apiConfig as { url: string, apiKey: string };  //Type casting as any for simplicity

        // 2. Make the API request
        const response = await axios.get(apiConfig.url, {
            headers: {
                //   'Authorization': `Bearer ${apiConfig.apiKey}`, // If needed
                'Accept': 'text/csv' // Specify CSV format if applicable
            },
            //For endpoints that return JSON and not csv
            // transformResponse: [(data) => {
            //   // Custom transformation logic if endpoint returns JSON
            //   return this.transformStakeData(data);
            // }],
        });

        // 3. Parse the CSV data (using a library like csv-parser)
        const parsedData = await this.parseCsvData(response.data);

        // 4. Return the parsed data
        return parsedData;
    }

    async parseCsvData(csvData: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const results: any[] = [];
            const stream = require('stream');
            const { parse } = require('csv-parse')
            const bs = new stream.PassThrough();
            bs.push(csvData);
            bs.end();

            bs.pipe(parse({
                columns: true, // Treat the first row as headers
                skip_empty_lines: true,
            }))
                .on('data', (row: any) => results.push(row))
                .on('end', () => resolve(results))
                .on('error', (error: any) => reject(error));
        })
    }

    // Example: Data transformation for Stake (adapt to your specific fields)
    transformStakeData(data: any): any[] {
        return data.map((row: any) => ({
            casinoPlayerId: row.user_id, // Adapt to your field names
            casino: 'stake',
            wagerAmount: parseFloat(row.wagered_amount),
            rank: parseInt(row.rank, 10),
            timestamp: new Date(row.timestamp), // Convert to Date object
            // ... other fields ...
        }));
    }

    // ... other methods for fetching data from different casinos ...

    // Example: Scheduled task to fetch data for all tenants
    @Cron(CronExpression.EVERY_HOUR) // Run every hour (adjust as needed)
    async fetchAllLeaderboardData() {
        this.logger.log('Fetching leaderboard data for all tenants...');
        const tenants = await withPrisma(async (prisma) => {
            return prisma.tenant.findMany()
        })

        for (const tenant of tenants) {
            try {
                this.logger.log(`Fetching data from ${tenant.casino} API`)
                let data: any[] = []
                switch (tenant.casino) {
                    case 'stake':
                        data = await this.fetchStakeLeaderboardData(tenant);
                        break;
                    // Add cases for other casinos
                    default:
                        this.logger.warn(`Unsupported casino: ${tenant.casino}`);
                        continue;
                }

                // Process and store the fetched data
                await this.processAndStoreLeaderboardData(tenant.id, data);
                await this.cacheLeaderboardData(tenant.id, tenant.casino)
            } catch (error) {
                this.logger.error(`Error fetching data for tenant ${tenant.id}: ${error.message}`, error.stack);
            }
        }
    }

    async processAndStoreLeaderboardData(tenantId: string, data: any[]): Promise<void> {
        await withPrisma(async (prisma) => {
            // 1.  Map the fetched data to your LeaderboardEntry model
            const entries = data.map((row) => ({
                tenantId,
                casinoPlayerId: row.casinoPlayerId,
                casino: row.casino,
                wagerAmount: row.wagerAmount,
                rank: row.rank,
                timestamp: new Date(row.timestamp), // Ensure this is a Date object
                data: row, // Store the raw data as JSON
            }));

            // 2. Batch insert/update the data into the LeaderboardEntry table
            //    Use upsert to handle potential duplicate entries
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
                })));

            //Update last fetched for leaderboards
            await prisma.leaderboard.upsert({
                where: {
                    tenantId_casino: {
                        tenantId,
                        casino: data[0].casino
                    }
                },
                create: {
                    tenantId: tenantId,
                    casino: data[0].casino,
                    data: JSON.stringify(data),
                    leaderboardConfig: {} //Can expand on this later

                },
                update: {
                    lastFetched: new Date(),
                    data: JSON.stringify(data)
                }
            })
        });
    }

    // Example: Caching processed leaderboard data in Redis
    async cacheLeaderboardData(tenantId: string, casino: string): Promise<void> {
        this.logger.log(`Caching leaderboard for tenant ${tenantId}`)
        const leaderboard = await withPrisma(async (prisma) =>
            prisma.leaderboard.findUnique({
                where: {
                    tenantId_casino: { tenantId, casino }
                }
            }));
        if (!leaderboard) {
            this.logger.warn(`No leaderboard for tenant ${tenantId}`);
            return;
        }
        await redis.setex(`leaderboard:${tenantId}:${casino}`, 3600, JSON.stringify(leaderboard.data)) //cache for an hour

    }
}
```

**Domain & Routing Structure:** (Same as before)
- Wildcard DNS with edge caching.
- Dynamic routing based on hostname.
- Tenant-specific configurations (cached in Redis).
- CDN edge caching for static assets.
- Custom SSL certificates (if needed).

**Best Practices:**
- Composite indexes: `(tenantId, other_relevant_field)`.
- Partition large tables (plan for it).
- Tenant context in all API requests (`tenantMiddleware`).
- Idempotent tenant provisioning.
- Tenant data migration strategies.
- Edge KV/Redis for tenant config caching.
- Input validation and sanitization.
- Monitor tenant resource usage.
- **NEW:** Robust error handling and retry logic for the Casino API fetching.
- **NEW:** Rate limiting for the Casino API fetching (to avoid getting blocked).

**Potential Challenges:**
- Balancing tenant isolation with resource sharing.
- Handling tenant-specific customizations.
- Managing tenant lifecycle.
- "Noisy neighbor" issues.
- Large number of custom domains.
- Database schema changes across tenants.
- **NEW:**  Handling variations and changes in the casino APIs.
- **NEW:**  Dealing with API downtime or rate limits.

### 2.2 User Management & Role System

**Tasks:**
- Implement user registration and profile management (integrated with SuperTokens).
- Implement RBAC (roles: `superadmin`, `affiliate_admin`, `sub_affiliate`, `player`).
- Create user invitation workflows (for affiliates to invite players and sub-affiliates).
- Implement user administration interfaces (for affiliates to manage users).
- Implement efficient permission checks (with caching).
- Implement user activity logging and auditing.
- **NEW:** Implement the player referral link generation feature.
- **NEW:** Implement the manual verification workflow for player referrals.
- **NEW:** Implement the logic for assigning players to sub-affiliates (manual assignment by the affiliate).

**Technical Implementation:**
```typescript
// packages/shared/types.ts (Roles and Permissions)
export enum Role {
  SUPERADMIN = 'superadmin',
  AFFILIATE_ADMIN = 'affiliate_admin',
  SUB_AFFILIATE = 'sub_affiliate',
  PLAYER = 'player',
}

// packages/backend/src/auth/rbac.service.ts (RBAC service - with caching)
// ... (see previous code example) ...

// packages/backend/src/user/user.service.ts (Example User Service methods)
import { Injectable } from '@nestjs/common';
import { withPrisma } from '../prisma';
import { Role } from '@leaderboards/shared';
import { User } from '@prisma/client'

@Injectable()
export class UserService {
  async createUser(tenantId: string, userData: any): Promise<User> {
      // ... (implementation for creating a new user) ...
      return withPrisma(async prisma => {
          return prisma.user.create({
              data: {
                  tenantId,
                  ...userData, //includes any data for user creation
                  referralCode: this.generateReferralCode()
              }
          })
      })
    }
    async assignPlayerToSubAffiliate(tenantId: string, affiliateId: string, subAffiliateId: string, playerId: string): Promise<void> {

        // Check if the user making the assignment is an affiliate admin
        const hasPermission = await this.rbacService.hasPermission(affiliateId, tenantId, 'subAffiliate', 'assign');
        if (!hasPermission) {
            throw new Error('Unauthorized');
        }

        return withPrisma(async (prisma) => {
            // 1. Verify that the subAffiliate and player both belong to the tenant.
            const subAffiliate = await prisma.user.findFirst({
                where: {
                    id: subAffiliateId,
                    tenantId: tenantId,
                    role: Role.SUB_AFFILIATE,
                },
            });

            const player = await prisma.user.findFirst({
                where: {
                    id: playerId,
                    tenantId: tenantId,
                    role: Role.PLAYER,
                },
            });

            if (!subAffiliate || !player) {
                throw new Error('Invalid sub-affiliate or player ID.');
            }

            // 2. Create the SubAffiliateAssignment record.
            await prisma.subAffiliateAssignment.create({
                data: {
                    tenantId,
                    affiliateId,
                    subAffiliateId,
                    playerId,
                },
            });
        });
    }
  // ... other user management methods ...
    async getPendingReferrals(tenantId: string, affiliateId: string): Promise<any[]> {
        // Check if the user making the request is an affiliate admin
        const hasPermission = await this.rbacService.hasPermission(affiliateId, tenantId, 'referral', 'approve');
        if (!hasPermission) {
            throw new Error('Unauthorized');
        }

        return withPrisma(async (prisma) => {
            return prisma.referral.findMany({
                where: {
                    tenantId,
                    status: 'pending',
                },
                include: {
                    referredUser: true, // Include details of the referred user
                    referringUser: true
                }
            });
        });
    }
  async approveReferral(tenantId: string, referralId: string, affiliateId: string, approved: boolean): Promise<void> {
        const hasPermission = await this.rbacService.hasPermission(affiliateId, tenantId, 'referral', 'approve');
        if (!hasPermission) {
            throw new Error('Unauthorized');
        }
        return withPrisma(async (prisma) => {
            const referral = await prisma.referral.findUnique({
                where: {
                    id: referralId,
                },
            });

            if (!referral || referral.tenantId !== tenantId) {
                throw new Error('Invalid referral ID.');
            }

            if (approved) {
                // Update the referral status to 'approved' and award points.
                await prisma.referral.update({
                    where: { id: referralId },
                    data: {
                        status: 'approved',
                        approvedAt: new Date(),
                        // pointsAwarded: ..., // Get this from the tenant's settings
                    },
                });

                // Award points to the referring user.
                const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
                const pointsAward = tenant?.settings?.['referralPoints'] || 100
                await prisma.user.update({
                    where: { id: referral.referringUserId },
                    data: {
                        pointsBalance: {
                            increment: pointsAward, // Increment by configured amount
                        },
                    },
                });
            } else {
                // Update the referral status to 'rejected'.
                await prisma.referral.update({
                    where: { id: referralId },
                    data: {
                        status: 'rejected',
                    },
                });
            }
        });
    }

    generateReferralCode(): string {
        return Math.random().toString(36).substring(2, 15)
    }
}
```

**Permission System:**
- Policy-based authorization.
- Redis caching for permission checks.
- Role assignment and management interfaces.
- Role inheritance.
- Permission invalidation strategy.
- Bulk role/permission assignment.

**Best Practices:**
- Principle of least privilege.
- Role templates.
- Audit logging for permission changes.
- Permission caching.
- Composite indexes for permission queries.
- Batch permission checks.
- Regular review of role assignments.

**Potential Challenges:**
- Flexible yet manageable permission system.
- Cross-tenant permission management.
- Cache invalidation for permission changes.
- Large numbers of roles and permissions.
- Ensuring RBAC security.
- **NEW:** Handling a potentially large number of pending referrals (for manual approval).

### 2.3 Core Leaderboard Engine (Data Display & Customization)

**Tasks:**
- Fetch leaderboard data from *your* database (populated by the Casino API Fetcher).
- Display the data in a user-friendly format (table, list, etc.).
- Allow affiliates to customize the *presentation* of the leaderboard:
    - Choose which columns to display.
    - Customize colors, fonts, and branding.
    - Potentially add custom CSS.
    - Set a leaderboard title and description.
- Implement pagination for large leaderboards.
- Implement caching (Redis) for leaderboard data to reduce database load.
- **NEW:**  Integrate with the Plasmic UI customization system (if you choose to use it).

**Technical Implementation:**

```typescript

// packages/backend/src/leaderboard/leaderboard.service.ts (Simplified for Display)
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { withPrisma } from '../prisma';
import { Leaderboard, Prisma } from '@prisma/client'

const redis = new Redis(process.env.REDIS_URL);

@Injectable()
export class LeaderboardService {

    private readonly logger = new Logger(LeaderboardService.name)
    // Get leaderboard data for display (from *your* database)
    async getLeaderboardData(tenantId: string, casino: string, page: number = 1, pageSize: number = 20): Promise<any> {
        // 1. Try to get from cache
        const cacheKey = `leaderboard-data:${tenantId}:${casino}:page:${page}:pageSize`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        // 2. Fetch from
```typescript
// packages/backend/src/leaderboard/leaderboard.service.ts (Simplified for Display) - Continued
import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { withPrisma } from '../prisma';
import { Leaderboard, Prisma } from '@prisma/client'

const redis = new Redis(process.env.REDIS_URL);

@Injectable()
export class LeaderboardService {

    private readonly logger = new Logger(LeaderboardService.name)
    // Get leaderboard data for display (from *your* database)
    async getLeaderboardData(tenantId: string, casino: string, page: number = 1, pageSize: number = 20): Promise<any> {
        // 1. Try to get from cache
        const cacheKey = `leaderboard-data:${tenantId}:${casino}:page:${page}:pageSize`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        // 2. Fetch from database
        const data = await withPrisma(async (prisma) => {

            const skip = (page - 1) * pageSize;
            //We find it from the Leaderboard table instead of LeaderboardEntry
            const leaderboard = await prisma.leaderboard.findUnique({
                where: {
                    tenantId_casino: { tenantId, casino }
                },
            })
            if (!leaderboard) return []

            const parsed = JSON.parse(leaderboard.data as string)
            const entries = parsed.slice(skip, skip + pageSize) //simple pagination
            return entries;
        });

        // 3. Cache the result (for a short duration - e.g., 5 minutes)
        await redis.setex(cacheKey, 300, JSON.stringify(data));
        return data;
    }
    // Get leaderboard configuration (for customization)
    async getLeaderboardConfig(tenantId: string, casino: string): Promise<any> {
        return withPrisma(async (prisma) => {
            const leaderboard = await prisma.leaderboard.findUnique({
                where: {
                    tenantId_casino: { tenantId, casino }
                }
            })
            if (!leaderboard) return {}
            return leaderboard.leaderboardConfig || {}; // Return empty object if config is null
        });
    }

    // Update leaderboard configuration (for customization)
    async updateLeaderboardConfig(tenantId: string, casino: string, config: any): Promise<any> {
        return withPrisma(async (prisma) => {
            // Validate the config (ensure it only contains allowed settings)
            // ... (implementation for config validation) ...
            const leaderboard = await prisma.leaderboard.update({
                where: {
                    tenantId_casino: { tenantId, casino }
                },
                data: {
                    leaderboardConfig: config
                }
            })
            return leaderboard.leaderboardConfig
        });
    }
}
```

**Plasmic Integration (Example):**

If you're using Plasmic, you'll likely have a Plasmic component that renders the leaderboard.  You'll pass the leaderboard data (fetched by `getLeaderboardData`) to this component.  The component will use the configuration (fetched by `getLeaderboardConfig`) to determine how to display the data (columns, colors, etc.). The exact implementation depends on how you set up Plasmic.

**Best Practices:**

*   **Efficient Queries:** Fetch *only* the data you need for display.  Avoid fetching unnecessary columns.
*   **Pagination:** Implement proper pagination to handle large leaderboards.
*   **Caching:** Cache processed leaderboard data in Redis to reduce database load.  Use a short TTL (time-to-live) for the cache (e.g., 5-15 minutes), as the data is updated periodically.
*   **Data Validation:** Validate the leaderboard configuration to prevent invalid settings.
*   **UI Customization:** Provide a user-friendly interface for affiliates to customize the leaderboard's appearance (without needing to write code).  Plasmic can help with this.

**Potential Challenges:**

*   Handling large datasets efficiently.
*   Balancing real-time updates with performance (the casino data is fetched periodically, so the leaderboard won't be *perfectly* real-time).
*   Providing flexible customization options without making the system overly complex.

**AI Tool Usage (Phase 2):**

*   **Code Generation:** Use the AI to generate the code for fetching and processing leaderboard data, handling pagination, and implementing caching. Provide clear specifications, including the data models and API endpoints.
*   **Schema Design:** The AI can help refine the database schema, suggesting indexes and data types.
*   **Middleware:** The AI can generate the code for the middleware (tenant resolution, rate limiting, etc.).
*   **API Documentation:** Use the AI to generate API documentation (e.g., OpenAPI/Swagger) from your code.
* **Plasmic Integration:** Get assistance on how to best structure your data and components for plasmic.

---

## Phase 3: Smart Wallet Integration & Reward System (3-4 weeks)

**This phase focuses on automating payouts from affiliates to players (and sub-affiliates), using Thirdweb smart wallets.**

### 3.1 Smart Wallet Integration (Thirdweb - On-Demand Creation)

**Tasks:**

*   Integrate the Thirdweb SDK into your backend.
*   Implement the *on-demand* wallet creation logic:
    *   A wallet is created for a player *only when they are eligible for their first payout*.
    *   The wallet is created using Thirdweb.
    *   The wallet address and (encrypted) key are stored in your `Wallet` table, linked to the player's `User` record.
*   Implement the logic for affiliates to fund their smart wallets (this will likely involve providing instructions and a wallet address to the affiliate).
*   Implement support for multiple chains (Ethereum, Polygon, Arbitrum, Solana – prioritize low-gas options).
*   Implement the logic for players to provide their *external* wallet address (for withdrawals).
*   Implement the affiliate setting for covering gas fees (or deducting them from payouts).
* **NEW**: Create Wallets for Sub Affiliates upon creation

**Technical Implementation:**

```typescript
// packages/backend/src/wallet/wallet.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { withPrisma } from '../prisma';
import { Wallet, User } from '@prisma/client';
import { ethers } from 'ethers';


const DEFAULT_CHAIN = 'polygon'; // Use Polygon for lower gas costs by default

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);
    private thirdweb: ThirdwebSDK;

    constructor() {
        this.thirdweb = new ThirdwebSDK(process.env.THIRDWEB_PROVIDER_URL, {
            gasless: {
                openzeppelin: {
                    relayerUrl: process.env.OPENZEPPELIN_RELAYER_URL, //for meta transactions
                },
            },
        }); // Use a provider and options
    }


    // Creates a wallet *on demand* (when a player is eligible for a payout)
    async createPlayerWallet(tenantId: string, userId: string): Promise<string> {
        return withPrisma(async (prisma) => {

            // 1. Check if the user already has a wallet
            const existingWallet = await prisma.wallet.findFirst({
                where: { userId: userId, tenantId: tenantId },
            });
            if (existingWallet) {
                return existingWallet.address; // Return existing wallet address
            }

            // 2. Generate wallet using Thirdweb SDK
            const { wallet, encryptedKey } = await this.thirdweb.wallet.create({
                chain: DEFAULT_CHAIN,
            });

            // 3. Store wallet info (encrypt the key before storing)
            const encrypted = this.encryptKey(encryptedKey); // Implement your encryption
            await prisma.wallet.create({
                data: {
                    tenantId: tenantId,
                    userId,
                    address: wallet.getAddress(),
                    encryptedKey: encrypted,
                    chain: DEFAULT_CHAIN,
                    type: 'player',
                },
            });

            return wallet.getAddress();
        });
    }
  // Creates a wallet for sub-affiliates (called when a sub-affiliate is added)
    async createSubAffiliateWallet(tenantId: string, userId: string): Promise<string> {
         return withPrisma(async (prisma) => {

            // 1. Check if the user already has a wallet
            const existingWallet = await prisma.wallet.findFirst({
                where: { userId: userId, tenantId: tenantId },
            });
            if (existingWallet) {
                return existingWallet.address; // Return existing wallet address
            }

            // 2. Generate wallet using Thirdweb SDK
            const { wallet, encryptedKey } = await this.thirdweb.wallet.create({
                chain: DEFAULT_CHAIN,
            });

            // 3. Store wallet info (encrypt the key before storing)
            const encrypted = this.encryptKey(encryptedKey); // Implement your encryption
            await prisma.wallet.create({
                data: {
                    tenantId: tenantId,
                    userId,
                    address: wallet.getAddress(),
                    encryptedKey: encrypted,
                    chain: DEFAULT_CHAIN,
                    type: 'sub_affiliate',
                },
            });

            return wallet.getAddress();
         })
    }
      // Creates a wallet for affiliates (called when a sub-affiliate is added)
    async createAffiliateWallet(tenantId: string, userId: string): Promise<string> {
         return withPrisma(async (prisma) => {

            // 1. Check if the user already has a wallet
            const existingWallet = await prisma.wallet.findFirst({
                where: { userId: userId, tenantId: tenantId },
            });
            if (existingWallet) {
                return existingWallet.address; // Return existing wallet address
            }

            // 2. Generate wallet using Thirdweb SDK
            const { wallet, encryptedKey } = await this.thirdweb.wallet.create({
                chain: DEFAULT_CHAIN,
            });

            // 3. Store wallet info (encrypt the key before storing)
            const encrypted = this.encryptKey(encryptedKey); // Implement your encryption
            await prisma.wallet.create({
                data: {
                    tenantId: tenantId,
                    userId,
                    address: wallet.getAddress(),
                    encryptedKey: encrypted,
                    chain: DEFAULT_CHAIN,
                    type: 'affiliate',
                },
            });

            return wallet.getAddress();
         })
    }
    async getAffiliateWallet(tenantId:string, affiliateId: string): Promise<Wallet | null>{
        return withPrisma(async prisma => {
            return prisma.wallet.findFirst({
                where:{
                    tenantId: tenantId,
                    userId: affiliateId,
                    type: 'affiliate'
                }
            })
        })
    }

    //Securely Encrypt Key
    encryptKey(key: string): string {
        const secretKey = process.env.ENCRYPTION_KEY;
        if (!secretKey) throw new Error('Encryption Key not Configured')

        const iv = crypto.randomBytes(16); // Initialization vector
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
        let encrypted = cipher.update(key);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return `${iv.toString('hex')}:${encrypted.toString('hex')}`; // Store IV with encrypted key
    }

    //Decrypt
    decryptKey(encryptedText: string): string {

        const secretKey = process.env.ENCRYPTION_KEY;
        if (!secretKey) throw new Error('Encryption Key not Configured')

        const [ivText, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivText, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
        let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

    // ... other wallet-related methods ...
}
```

### 3.2 Points & Rewards System (Rules Engine)

**Tasks:**

*   Implement the rules engine that determines when payouts are triggered.
*   Allow affiliates to define trigger conditions based on:
    *   Wager amount (from the casino API data).
    *   Leaderboard rank (from the casino API data).
    *   Custom criteria (if you can get other data from the casino API).
    * Time based triggers.
*   Allow affiliates to define the reward amount (in crypto) and currency.
*   Implement the manual approval workflow (affiliates can choose to approve payouts manually).
*   Implement the optional points-based referral system for players (including the manual verification workflow).
*  **NEW:** Implement Eligibility Criteria for referrals.

**Technical Implementation:**

```typescript
// packages/backend/src/reward/reward.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { withPrisma } from '../prisma';
import { WalletService } from 'src/wallet/wallet.service';
import { PayoutService } from 'src/payout/payout.service';

@Injectable()
export class RewardService {
    private readonly logger = new Logger(RewardService.name);

    constructor(
        private walletService: WalletService,
        private payoutService: PayoutService
    ) { }
    // Evaluates reward rules and triggers payouts
    async evaluateRules(tenantId: string, leaderboardEntry: any): Promise<void> {
        return withPrisma(async (prisma) => {
            // 1. Get the affiliate's configured rules
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
            });

            if (!tenant) {
                this.logger.error(`evaluateRules: Tenant ${tenantId} Not Found`)
                return;
            }
            const rules = tenant.settings?.['rewardRules'] as any[] | undefined; //as any for simplicity

            if (!rules || rules.length === 0) {
                return; // No rules configured
            }

            // 2. Iterate through the rules and check if any trigger conditions are met
            for (const rule of rules) {
                if (this.checkRule(leaderboardEntry, rule.triggerConditions)) {
                    // 3. Trigger a payout if the rule matches
                    await this.triggerPayout(tenant, leaderboardEntry.userId, rule.rewardAmount, rule.currency, rule.requiresApproval, leaderboardEntry);
                }
            }
        });
    }

    // Checks if a leaderboard entry meets the trigger conditions of a rule
    checkRule(leaderboardEntry: any, triggerConditions: any): boolean {
        // Implement your logic for checking conditions based on the rule's structure
        // This is a simplified example - you'll need to handle different types of conditions
        switch (triggerConditions.type) {
            case 'wagerAmount':
                return leaderboardEntry.wagerAmount >= triggerConditions.value;
            case 'leaderboardRank':
                return leaderboardEntry.rank <= triggerConditions.value;
            // Add cases for other condition types
            default:
                return false;
        }
    }

    // Triggers a payout (creates a Payout record and initiates the transfer)
    async triggerPayout(tenant: any, userId: string, amount: number, currency: string, requiresApproval: boolean, leaderboardEntry: any): Promise<void> {
        return withPrisma(async (prisma) => {
            // 1. Get affiliate Wallet
            const affiliateWallet = await this.walletService.getAffiliateWallet(tenant.id, tenant.users[0].id) //get first user on tenant
            if (!affiliateWallet) {
                this.logger.warn(`Affiliate Wallet Not Found for tenant ${tenant.id}`)
                return
            }
            // 2. Create a Payout record
            const payout = await prisma.payout.create({
                data: {
                    tenantId: tenant.id,
                    userId,
                    walletId: affiliateWallet.id,
                    amount,
                    currency,
                    status: requiresApproval ? 'pending' : 'approved', // Automatically approve if no manual approval is needed
                    gasFeeCoveredBy: tenant.settings?.['gasFeeCoveredBy'] || 'affiliate', // Default to affiliate covering gas
                    notes: `Payout triggered by rule for leaderboard entry: ${leaderboardEntry.id}`,
                },
            });

            // 3. If no manual approval is required, initiate the payout immediately
            if (!requiresApproval) {
                await this.payoutService.processPayout(payout.id);
            }
        });
    }

    // ... other methods for managing reward rules ...
}
```

### 3.3 Transaction & Payout System (Automated Payouts)

**Tasks:**

*   Implement the automated payout process:
    *   When a payout is approved (either automatically or manually), initiate a transfer from the affiliate's smart wallet to the player's *external* wallet address (or the sub-affiliate's Leaderboards.vip wallet).
    *   Use the Thirdweb SDK to interact with the blockchain.
    *   Handle gas fees (either deduct them from the payout or have the affiliate cover them, based on the affiliate's settings).
    *   Update the `Payout` record with the transaction hash and status.
    *   Implement robust error handling and retries (in case of network issues or insufficient funds).
    *   Implement transaction monitoring and alerting.
* **NEW:** Implement the logic for processing sub affiliate commissions.

**Technical Implementation:**

```typescript
// packages/backend/src/payout/payout.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { withPrisma } from '../prisma';
import { ThirdwebSDK } from '@thirdweb-dev/sdk';
import { WalletService } from 'src/wallet/wallet.service';
import { ethers } from 'ethers';

@Injectable()
export class PayoutService {
    private readonly logger = new Logger(PayoutService.name);
    private thirdweb: ThirdwebSDK;

    constructor(
        private walletService: WalletService
    ) {
        this.thirdweb = new ThirdwebSDK(process.env.THIRDWEB_PROVIDER_URL, {
            gasless: {
                openzeppelin: {
                    relayerUrl: process.env.OPENZEPPELIN_RELAYER_URL, //for meta transactions
                },
            },
        }); // Use a provider and options
    }

    // Processes a payout (initiates the transfer)
    async processPayout(payoutId: string): Promise<void> {
        return withPrisma(async (prisma) => {
            // 1. Get the payout record
            const payout = await prisma.payout.findUnique({
                where: { id: payoutId },
                include: {
                    user: true, // Include details of the recipient
                    wallet: true, // Include details of the source wallet (affiliate's wallet)
                },
            });

            if (!payout) {
                this.logger.error(`Payout ${payoutId} not found.`);
                throw new Error('Payout not found');
            }

            // 2. Check if the payout is already processed or failed
            if (payout.status !== 'approved') {
                this.logger.warn(`Payout ${payout.id} has status ${payout.status}. Unable to process`)
                return; // Don't process if not approved
            }

            // 3. Update the payout status to "processing"
            await prisma.payout.update({
                where: { id: payoutId },
                data: { status: 'processing' },
            });
            try {

                // 4. Get the recipient's wallet address (external or internal)
                let recipientAddress: string
                //Check if user is sub affiliate
                if (payout.user.role == 'sub_affiliate') {
                    const recipientWallet = await this.walletService.createSubAffiliateWallet(payout.tenantId, payout.userId)
                    recipientAddress = recipientWallet
                }
                else {
                    recipientAddress = payout.user.externalWalletAddress
                }
                if (!recipientAddress) {
                    throw new Error(`Recipient address not found for user ${payout.userId}`);
                }

                // 5. Get the private key of the affiliate's wallet (for signing the transaction)
                const privateKey = this.walletService.decryptKey(payout.wallet.encryptedKey!);

                // 6. Initiate the transfer using the Thirdweb SDK
                const wallet = this.thirdweb.getWallet(payout.wallet.address);
                const signer = new ethers.Wallet(privateKey); // Create ethers.js signer
                await wallet.connect(signer)

                //Use L2 Network
                const network = payout.wallet.chain;
                await this.thirdweb.wallet.setDefaultChain(network);

                let txHash
                if (payout.currency.toLowerCase() == 'eth') {
                    this.logger.log(`Sending ${payout.amount} of native currency to ${recipientAddress}`)
                    const tx = await wallet.sendRaw(
                        {
                            to: recipientAddress, //player address or sub affiliate address
                            value: ethers.utils.parseEther(payout.amount.toString()),
                            // gasLimit: 21000, // Optional: Set a gas limit (adjust as needed)
                            // chainId: 137 // Optional: Set the chain ID,
                            data: '0x' //for empty data
                        }
                    );

                    this.logger.log(`Transaction Receipt`, tx)
                    txHash = tx.hash
                }
                else {
                    //ERC20 Logic
                    this.logger.log(`Sending ${payout.amount} of ${payout.currency} to ${recipientAddress}`)
                    const contractAddress = this.getTokenContractAddress(payout.currency, network);
                    const contract = this.thirdweb.getContract(contractAddress, 'token'); //get token contract
                    const tx = await (await contract).call('transfer', [recipientAddress, ethers.utils.parseUnits(payout.amount.toString())]);

                    this.logger.log(`Transaction Receipt`, tx)
                    txHash = tx.receipt.transactionHash
                }


                // 7. Calculate gas fee (if applicable)

                // 8. Update the payout record with the transaction hash and status
                await prisma.payout.update({
                    where: { id: payoutId },
                    data: {
                        transactionHash: txHash,
                        status: 'completed',
                        processedAt: new Date(),
                        // gasFee: gasFee.toString(), // Store the gas fee
                    },
                });
                this.logger.log(`Payout ${payout.id} completed successfully.`);

            } catch (error: any) {
                // Handle errors (e.g., insufficient funds, network issues)
                this.logger.error(`Error processing payout ${payoutId}: ${error.message}`, error.stack);

                // Update the payout status to "failed"
                await prisma.payout.update({
                    where: { id: payoutId },
                    data: { status: 'failed' },
                });

                // Implement retry logic (e.g., using a queue)
            }
        });
    }
    getTokenContractAddress(symbol: string, chain: string) {
        // Dummy token addresses for testing
        const tokenAddresses: any = {
            'polygon': {
                'usdt': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Replace with the actual USDT contract address on Polygon
                // Add other token addresses as needed
            },
            'ethereum': {
                'usdt': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            },
            'solana': { //devnet
                'usdt': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
            }
            // Add configurations for other chains
        };

        if (!tokenAddresses[chain] || !tokenAddresses[chain][symbol.toLowerCase()])
            throw new Error(`Token Address Not Configured for ${symbol} on chain ${chain}`)

        return tokenAddresses[chain][symbol.toLowerCase()];
    }

    // ... other payout-related methods (e.g., approvePayout, rejectPayout, retryPayout) ...
}
```

**AI Tool Usage (Phase 3):**

*   **Code Generation:** Use the AI to generate the code for:
    *   Thirdweb integration (wallet creation, transfers).
    *   The rules engine (checking trigger conditions).
    *   The payout processing logic (including error handling and retries).
    *   Database interactions (creating and updating records).
*   **Security:** Ask the AI for suggestions on securely storing and managing wallet keys.
*   **Gas Optimization:** Ask the AI for advice on optimizing gas costs for Thirdweb transactions.
*   **Error Handling:**  Get the AI to generate robust error handling and retry logic.

---

## Phase 4: Sub-Affiliate System & Reporting (2-3 weeks)

**This phase focuses on tracking sub-affiliate referrals and calculating/automating their commissions.**

### 4.1 Affiliate & Referral System (Sub-Affiliate Focus)

**Tasks:**

*   Implement referral link generation for *sub-affiliates*.
*   Implement the logic for *manually* assigning players to sub-affiliates (by the affiliate admin).
*   Implement the commission calculation logic:
    *   Based on data from the casino API (primarily wager amount).
    *   Using configurable rules defined by the affiliate (e.g., percentage of wager, percentage of house edge).
    *   Tracked over time (using the stored wager data).
*   Implement *automated* commission payouts (from the affiliate's smart wallet to the sub-affiliate's Leaderboards.vip wallet). This uses the same underlying payout mechanism as player rewards.
*   Provide reporting tools for affiliates to view:
    *   Which players are assigned to which sub-affiliates.
    *   The total wager amount for each sub-affiliate's players.
    *   The calculated commissions for each sub-affiliate.
    *   Payout history for each sub-affiliate.
* **NEW:** Create Wallets automatically for sub affiliates.

**Technical Implementation:**

```typescript
// packages/backend/src/subaffiliate/subaffiliate.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { withPrisma } from '../prisma';
import { UserService } from 'src/user/user.service';
import { Role } from '@leaderboards/shared';
import { WalletService } from 'src/wallet/wallet.service';

@Injectable()
export class SubAffiliateService {
    private readonly logger = new Logger(SubAffiliateService.name);
    constructor(
        private userService: UserService,
        private walletService: WalletService

    ) { }
    // Adds a sub-affiliate to the system (and creates a wallet for them)
    async addSubAffiliate(tenantId: string, affiliateId: string, subAffiliateData: any): Promise<any> {

        // Check if the user making the request is an affiliate admin
        const hasPermission = await this.userService.hasPermission(affiliateId, tenantId, 'subAffiliate', 'create');
        if (!hasPermission) {
            throw new Error('Unauthorized');
        }
        return withPrisma(async (prisma) => {
            // 1. Create the sub-affiliate user record
            const subAffiliate = await this.userService.createUser(tenantId, {
                ...subAffiliateData, //includes username, email
                role: Role.SUB_AFFILIATE,
            });

            // 2. Create a wallet for the sub-affiliate
            await this.walletService.createSubAffiliateWallet(tenantId, subAffiliate.id);
            return subAffiliate;
        });
    }

    // Calculates commissions for a sub-affiliate
    async calculateCommissions(tenantId: string, subAffiliateId: string): Promise<any> {

        return withPrisma(async (prisma) => {
            // 1. Get the affiliate's commission rules
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
            });

            if (!tenant) {
                this.logger.error(`Tenant ${tenantId} Not Found`)
                return
            }

            const commissionRules = tenant.settings?.['commissionRules'] as any[] | undefined; //as any
            if (!commissionRules) {
                return { totalCommission: 0, details: [] }; // No rules configured
            }

            // 2. Get the players assigned to the sub-affiliate
            const assignments = await prisma.subAffiliateAssignment.findMany({
                where: {
                    tenantId,
                    subAffiliateId,
                },
                include: {
                    player: true, // Include player details
                },
            });

            // 3. Calculate commissions based on the rules and player wagers

            let totalCommission = 0;
            const details = [];
            for (const assignment of assignments) {
                const player = assignment.player;

                for (const rule of commissionRules) {
                    // Fetch the player's wager data from LeaderboardEntry
                    const leaderboardEntries = await prisma.leaderboardEntry.findMany({
                        where: {
                            tenantId,
                            casinoPlayerId: player.casinoPlayerId, // Use casino player ID
                            casino: player.casino,
                            timestamp: {
                                gte: rule.startDate, // Example: Only consider wagers after a certain date
                                lte: rule.endDate,
                            },
                        },
                    });
                    let commissionForPlayer = 0;

                    for (const entry of leaderboardEntries) {
                        //Basic Implementation
                        if (rule.type === 'percentageOfWager') {
                            commissionForPlayer += entry.wagerAmount * (rule.percentage / 100);
                        }
                        // Add other rule types as needed (e.g., percentage of house edge)
                    }
                    totalCommission += commissionForPlayer;

                    details.push({
                        playerId: player.id,
                        playerName: player.username,
                        commission: commissionForPlayer,
                        rule: rule,
                    });
                }
            }

            // 4. Return the total commission and details
            return { totalCommission, details };
        });

    }

    // ... other sub-affiliate related methods ...
}
```

### 4.2 Casino API Integration

**Tasks:**
- Implement Scheduled tasks for fetching data from casino apis for all tenants.
- Cache the data for fast retrieval.
- Implement data transformation logic for various casino data formats.

**Technical Implementation:**
Already provided in `packages/backend/src/casino/casino-api.service.ts` in section 2.1

**AI Tool Usage (Phase 4):**

*   **Code Generation:** Generate code for:
    *   Sub-affiliate management (adding, assigning players).
    *   Commission calculation logic.
    *   Reporting queries.
    *   Automated payout integration (using the existing `PayoutService`).
*   **Algorithm Design:** Ask the AI for suggestions on the most efficient way to calculate commissions, given the data you have.
*   **Report Design:** Get the AI to help design the structure of the reports for affiliates.

---

## Phase 5: UI Customization & Analytics (2-3 weeks)

### 5.1 White-Label UI System (Plasmic)

**Tasks:**
- Implement Plasmic Integration.
- Configure components.
- Implement tenant-specific styling.

### 5.2 Analytics & Tracking System

**Tasks:**

*   Implement PostHog integration (or a similar analytics tool).
*   Track key events:
    *   Page views (on affiliate leaderboard pages).
    *   Referral link clicks.
    *   New player registrations.
    *   Payouts (to players and sub-affiliates).
    *   Sub-affiliate assignments.
    *   Affiliate logins and actions.
*   Create custom reporting dashboards (within PostHog or using your own reporting tools).

**Technical Implementation:** (Example with PostHog)

```typescript
// packages/backend/src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { PostHog } from 'posthog-node'; // Use the PostHog Node.js client

@Injectable()
export class AnalyticsService {
  private posthog: PostHog;
constructor(){
    this.posthog = new PostHog(
        process.env.POSTHOG_API_KEY!,
        { host: process.env.POSTHOG_HOST! }
      )
}
  trackEvent(tenantId: string, eventName: string, properties: any = {}, userId?: string) {
    // Add the tenantId to all events
    const allProperties = { ...properties, tenantId };

    this.posthog.capture({
      distinctId: userId || tenantId, // Use tenantId as fallback if no userId
      event: eventName,
      properties: allProperties,
    });
  }
  // ... other analytics-related methods ...
  shutdown(){
    this.posthog.shutdown()
  }
}
// Example usage in another service:
// this.analyticsService.trackEvent(tenantId, 'player_registered', { casinoPlayerId: '...', wagerAmount: 100 }, userId);
```

### 5.3 Reporting & Dashboard System
**Tasks:**
Design dashboards for Affiliates to view data.

**AI Tool Usage (Phase 5):**

*   **Event Tracking:** Get the AI to suggest the best way to structure your events for tracking in PostHog.
*   **Dashboard Design:** Use the AI to help design the layout and content of your analytics dashboards.

This completes the high-level execution plan. The next step would be to break down each phase into smaller, sprint-sized tasks. Given that you are using AI tools for development, you can likely move faster than a traditional development team. Remember to provide very clear and detailed specifications to the AI for each task.
