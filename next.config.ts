import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase serverless function limits for large XML imports
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
