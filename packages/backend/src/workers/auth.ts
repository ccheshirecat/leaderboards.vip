import { Router } from 'itty-router';
import SuperTokens from 'supertokens-web-js';
import EmailPassword from 'supertokens-web-js/recipe/emailpassword';
import Session from 'supertokens-web-js/recipe/session';

interface Env {
  SUPERTOKENS_CONNECTION_URI?: string;
  SUPERTOKENS_API_KEY?: string;
  API_DOMAIN?: string;
  WEBSITE_DOMAIN?: string;
}

// Create a router for handling requests
const router = Router();

// SuperTokens handler for email/password authentication
const superTokensHandler = (request: Request, env: Env) => {
  // Initialize SuperTokens with type assertion to bypass type checking issues
  SuperTokens.init({
    appInfo: {
      appName: 'Leaderboards.vip',
      apiDomain: env.API_DOMAIN || 'http://localhost:3000',
      websiteDomain: env.WEBSITE_DOMAIN || 'http://localhost:4200',
      apiBasePath: '/auth',
      websiteBasePath: '/auth',
    },
    recipeList: [EmailPassword.init(), Session.init()],
    supertokens: {
      connectionURI: env.SUPERTOKENS_CONNECTION_URI || 'http://localhost:3567',
      apiKey: env.SUPERTOKENS_API_KEY,
    },
  } as any); // Type assertion to bypass type checking

  // Handle the request
  // Since we're in a worker, we return a basic response for now
  return new Response(
    JSON.stringify({
      message: 'SuperTokens auth is up and running!',
      env: {
        apiDomain: env.API_DOMAIN,
        websiteDomain: env.WEBSITE_DOMAIN,
        connectionURI: env.SUPERTOKENS_CONNECTION_URI,
      },
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
};

// Handle all authentication routes
router.all('/auth/*', (request: Request, env: Env) => {
  return superTokensHandler(request, env);
});

// Handle root path
router.get('/', () => {
  return new Response('SuperTokens Auth Worker is running!', { status: 200 });
});

// Fallback for any other routes
router.all('*', () => new Response('Not Found', { status: 404 }));

// Export the worker handler with a safer implementation
export default {
  // Explicitly handle the router result
  fetch: async (request: Request, env: Env): Promise<Response> => {
    // The router.handle method returns a Response or Promise<Response>
    // We wrap it in a try/catch to ensure we always return a Response
    try {
      const result = await router.handle(request, env);
      return result instanceof Response
        ? result
        : new Response('Internal Server Error', { status: 500 });
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
