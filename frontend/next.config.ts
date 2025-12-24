import type { NextConfig } from "next";
import path from 'path';

// Extend the NextConfig type to include turbopack
type CustomNextConfig = NextConfig & {
  turbopack?: {
    resolveAlias?: Record<string, string>;
  };
};

const nextConfig: CustomNextConfig = {
  // Basic configuration
  reactStrictMode: true,
  
  // Configure path aliases for webpack
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, '.'),
      '@app': path.resolve(__dirname, './app'),
    };
    return config;
  },
  
  // Configure TypeScript
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // Configure Turbopack
  experimental: {
    // @ts-ignore - Turbopack types might not be fully updated
    turbopack: {
      resolveAlias: {
        '@': path.resolve(__dirname, './src'),
        '@app': path.resolve(__dirname, './app'),
      }
    }
  }
};

export default nextConfig;
