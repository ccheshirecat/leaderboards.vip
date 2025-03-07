import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

// Temporary imports with relative paths until we set up proper folder structure
// and install all necessary dependencies
const appRouter = {
  /* Placeholder for the actual router */
};

// Create a simple context for now
const createTRPCContext = ({ req, res }: { req: Request; res: Response }) => {
  return { req, res };
};

// HTTP handler for tRPC requests
const handler = async (req: Request) => {
  // Create a response object
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter as any, // Type assertion until we set up proper types
    createContext: () => createTRPCContext({ req, res: new Response() }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`❌ tRPC error on '${path}':`, error);
          }
        : undefined,
  });
};

export { handler as GET, handler as POST }; 