import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { withPrisma } from '../prisma';

// Extend the Express Request interface to include tenant properties
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: any;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // For this sprint, we'll get the tenant ID from the X-Tenant-Id header
      const tenantId = req.headers['x-tenant-id'] as string;
      
      if (!tenantId) {
        this.logger.warn('Tenant ID header not found');
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Try to get tenant from cache
      const cacheKey = `tenant:${tenantId}`;
      let tenant = await this.cacheManager.get(cacheKey);
      
      if (!tenant) {
        this.logger.log(`Cache miss for tenant ${tenantId}, fetching from database`);
        
        // Fetch from database
        tenant = await withPrisma(async (prisma) => {
          return prisma.tenant.findUnique({
            where: { id: tenantId },
          });
        });
        
        if (!tenant) {
          this.logger.warn(`Tenant not found: ${tenantId}`);
          return res.status(404).json({ error: 'Tenant not found' });
        }
        
        // Cache the tenant
        await this.cacheManager.set(cacheKey, tenant, 3600); // Cache for 1 hour
      } else {
        this.logger.log(`Cache hit for tenant ${tenantId}`);
      }
      
      // Attach tenant to request
      req.tenantId = tenantId;
      req.tenant = tenant;
      
      next();
    } catch (error) {
      this.logger.error(`Error in TenantMiddleware: ${error.message}`, error.stack);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
} 