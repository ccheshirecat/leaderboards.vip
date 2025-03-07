/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build as a standalone application
  output: 'standalone',
  
  // Add custom webpack configuration to handle SuperTokens properly
  webpack: (config, { isServer }) => {
    // Keep SuperTokens from causing server-side issues
    if (isServer) {
      return {
        ...config,
        externals: [...config.externals, 'supertokens-auth-react'],
      };
    }
    return config;
  },
}

module.exports = nextConfig 