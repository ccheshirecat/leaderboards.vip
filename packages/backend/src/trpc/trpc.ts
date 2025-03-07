/**
 * This file sets up the core tRPC functionality for your API
 */
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

// Define your context shape - will be used for authentication and request data
export type TRPCContext = {
  req: Request;
  res: Response;
};

// Create context for each request
export const createTRPCContext = ({ req, res }: { req: Request; res: Response }): TRPCContext => {
  return {
    req,
    res,
  };
};

// Initialize tRPC
const t = initTRPC.context<TRPCContext>().create();

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure; 