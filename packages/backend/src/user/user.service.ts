import { Injectable, Logger } from '@nestjs/common';
import { withPrisma } from '../prisma';
import { randomBytes } from 'crypto';

// Define roles enum
enum Role {
  SUPERADMIN = 'superadmin',
  AFFILIATE_ADMIN = 'affiliate_admin',
  SUB_AFFILIATE = 'sub_affiliate',
  PLAYER = 'player',
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  /**
   * Creates a new user
   * @param tenantId The tenant ID
   * @param userData User data
   * @returns The created user
   */
  async createUser(tenantId: string, userData: any) {
    this.logger.log(`Creating user for tenant ${tenantId}`);
    
    // Generate a referral code if not provided
    if (!userData.referralCode) {
      userData.referralCode = this.generateReferralCode();
    }
    
    return withPrisma(async (prisma) => {
      return prisma.user.create({
        data: {
          tenantId,
          ...userData,
        },
      });
    });
  }

  /**
   * Generates a unique referral code
   * @returns A unique referral code
   */
  generateReferralCode(): string {
    // Generate a random string of 8 characters
    const randomString = randomBytes(4).toString('hex');
    
    // Add a prefix based on the current timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36).slice(-4);
    
    return `${timestamp}${randomString}`.toUpperCase();
  }

  /**
   * Checks if a user has permission to perform an action
   * @param userId The user ID
   * @param tenantId The tenant ID
   * @param resource The resource to check permission for
   * @param action The action to check permission for
   * @returns True if the user has permission, false otherwise
   */
  async hasPermission(userId: string, tenantId: string, resource: string, action: string): Promise<boolean> {
    return withPrisma(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!user || user.tenantId !== tenantId) {
        return false;
      }
      
      // Simple role-based permission check
      // In a real application, you would have a more sophisticated permission system
      switch (user.role) {
        case Role.SUPERADMIN:
          return true;
        case Role.AFFILIATE_ADMIN:
          return true;
        case Role.SUB_AFFILIATE:
          // Sub-affiliates can only access certain resources
          return ['player', 'leaderboard'].includes(resource);
        case Role.PLAYER:
          // Players have very limited permissions
          return resource === 'leaderboard' && action === 'view';
        default:
          return false;
      }
    });
  }
} 