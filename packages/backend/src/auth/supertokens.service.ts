import { Injectable, Logger } from '@nestjs/common';
import { withPrisma } from '../prisma';
import axios from 'axios';

interface SuperTokensConfig {
  apiKey: string;
  connectionUri: string;
}

interface SuperTokensSession {
  user: {
    id: string;
    email: string;
    timeJoined: number;
  };
  accessTokenPayload: Record<string, any>;
  sessionHandle: string;
}

@Injectable()
export class SuperTokensService {
  private readonly logger = new Logger(SuperTokensService.name);

  /**
   * Gets SuperTokens configuration for a tenant
   * @param tenantId The tenant ID
   * @returns The SuperTokens configuration (API key and connection URI)
   */
  async getSuperTokensConfig(tenantId: string): Promise<SuperTokensConfig> {
    return withPrisma(async (prisma) => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { settings: true },
      });

      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      const settings = tenant.settings as Record<string, any>; // Type casting for simplicity
      // Use type assertion to ensure type safety
      const apiKey = (settings?.superTokensApiKey as string) || '';
      const connectionUri =
        (settings?.superTokensConnectionUri as string) || '';

      if (!apiKey || !connectionUri) {
        // Default to environment variables if not set in tenant settings
        const defaultApiKey = process.env.SUPERTOKENS_API_KEY;
        const defaultConnectionUri = process.env.SUPERTOKENS_CONNECTION_URI;

        if (!defaultApiKey || !defaultConnectionUri) {
          throw new Error(
            `SuperTokens configuration missing for tenant: ${tenantId}`,
          );
        }

        return {
          apiKey: defaultApiKey,
          connectionUri: defaultConnectionUri,
        };
      }

      return {
        apiKey,
        connectionUri,
      };
    });
  }

  /**
   * Verifies a JWT token against the SuperTokens Core
   * @param tenantId The tenant ID
   * @param token The JWT token to verify
   * @returns The decoded token if valid, null otherwise
   */
  async verifyJwt(
    tenantId: string,
    token: string,
  ): Promise<SuperTokensSession | null> {
    try {
      const { apiKey, connectionUri } =
        await this.getSuperTokensConfig(tenantId);

      const response = await axios.post(
        `${connectionUri}/recipe/session/verify`,
        {
          accessToken: token,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
        },
      );

      return response.data as SuperTokensSession;
    } catch (error) {
      this.logger.error(
        `Error verifying JWT for tenant ${tenantId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return null;
    }
  }

  /**
   * Gets user information from SuperTokens
   * @param tenantId The tenant ID
   * @param userId The user ID
   * @returns User information if found, null otherwise
   */
  async getUserInfo(
    tenantId: string,
    userId: string,
  ): Promise<Record<string, any> | null> {
    try {
      const { apiKey, connectionUri } =
        await this.getSuperTokensConfig(tenantId);

      const response = await axios.get(
        `${connectionUri}/recipe/user/info?userId=${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
        },
      );

      return response.data as Record<string, any>;
    } catch (error) {
      this.logger.error(
        `Error getting user info for tenant ${tenantId}, user ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return null;
    }
  }

  /**
   * Revokes a session in SuperTokens
   * @param tenantId The tenant ID
   * @param sessionHandle The session handle to revoke
   * @returns True if successful, false otherwise
   */
  async revokeSession(
    tenantId: string,
    sessionHandle: string,
  ): Promise<boolean> {
    try {
      const { apiKey, connectionUri } =
        await this.getSuperTokensConfig(tenantId);

      await axios.post(
        `${connectionUri}/recipe/session/remove`,
        {
          sessionHandles: [sessionHandle],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
        },
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error revoking session for tenant ${tenantId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return false;
    }
  }
}
