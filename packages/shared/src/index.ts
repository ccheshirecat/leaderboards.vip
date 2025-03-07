import { z } from 'zod';

// Role enum for user roles
export enum Role {
  SUPERADMIN = 'superadmin',
  AFFILIATE_ADMIN = 'affiliate_admin',
  SUB_AFFILIATE = 'sub_affiliate',
  PLAYER = 'player',
}

// Zod schema for tenant
export const TenantSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  customDomain: z.string().optional().nullable(),
  apiConfig: z.record(z.any()),
  casino: z.string(),
});

export type Tenant = z.infer<typeof TenantSchema>;

// Zod schema for user
export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  casinoPlayerId: z.string().optional().nullable(),
  casino: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  role: z.nativeEnum(Role),
  referredBy: z.string().uuid().optional().nullable(),
  referralCode: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

// Zod schema for leaderboard entry
export const LeaderboardEntrySchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid().optional().nullable(),
  casinoPlayerId: z.string(),
  casino: z.string(),
  wagerAmount: z.number().positive(),
  rank: z.number().int().positive(),
  timestamp: z.date(),
  data: z.record(z.any()),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

// Export other types as needed
