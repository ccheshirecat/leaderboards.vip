import SuperTokens from 'supertokens-auth-react';
import EmailPassword from 'supertokens-auth-react/recipe/emailpassword';
import Session from 'supertokens-auth-react/recipe/session';

// Default values for local development
const DEFAULT_WEBSITE_DOMAIN = 'http://localhost:3000';
const DEFAULT_API_DOMAIN = 'http://localhost:3000';
const DEFAULT_SUPERTOKENS_URL = 'https://leaderboards-auth.hoehenghub888.workers.dev';

// Initialize SuperTokens with configuration
export const initSuperTokens = () => {
  // Get configuration from environment variables or use defaults
  const websiteDomain = process.env.NEXT_PUBLIC_WEBSITE_DOMAIN || DEFAULT_WEBSITE_DOMAIN;
  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || DEFAULT_API_DOMAIN;
  const superTokensUrl = process.env.NEXT_PUBLIC_SUPERTOKENS_URL || DEFAULT_SUPERTOKENS_URL;

  try {
    // Initialize SuperTokens with safe type assertion to bypass TypeScript errors
    SuperTokens.init({
      appInfo: {
        appName: 'Leaderboards.vip',
        apiDomain,
        apiBasePath: '/auth',
        websiteDomain,
        websiteBasePath: '/auth',
      },
      recipeList: [
        EmailPassword.init({
          signInAndUpFeature: {
            signUpForm: {
              formFields: [
                {
                  id: 'email',
                  label: 'Email',
                  placeholder: 'Email',
                },
                {
                  id: 'password',
                  label: 'Password',
                  placeholder: 'Password',
                },
                {
                  id: 'username',
                  label: 'Username',
                  placeholder: 'Username',
                  optional: true,
                },
              ],
            },
          },
          override: {
            functions: (originalImplementation) => {
              return {
                ...originalImplementation,
                // Add any function overrides if needed
              };
            },
            components: (originalComponents) => {
              return {
                ...originalComponents,
                // Add any component overrides if needed
              };
            },
          },
        } as Parameters<typeof EmailPassword.init>[0]),
        Session.init(),
      ],
      // Use this format for the connection URI
      supertokens: {
        connectionURI: superTokensUrl,
      },
    } as any); // Use any type assertion as a last resort

    console.log("SuperTokens initialized successfully");
    return true;
  } catch (err) {
    console.error("Error initializing SuperTokens:", err);
    return false;
  }
}; 