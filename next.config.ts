import type { NextConfig } from "next";
const { setupHoneybadger } = require('@honeybadger-io/nextjs');

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.ngrok.io', '*.ngrok-free.app'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.ngrok.io',
      },
      {
        protocol: 'https',
        hostname: '*.ngrok-free.app',
      },
    ],
  },
};

// Honeybadger configuration
const honeybadgerNextJsConfig = {
  // Disable source map upload (optional)
  disableSourceMapUpload: false,
  // Hide debug messages (optional)
  silent: true,
  // More information available at @honeybadger-io/webpack: https://github.com/honeybadger-io/honeybadger-js/tree/master/packages/webpack
  webpackPluginOptions: {
    // Required if you want to upload source maps to Honeybadger
    apiKey: process.env.NEXT_PUBLIC_HONEYBADGER_API_KEY,
    // Required if you want to upload source maps to Honeybadger
    // assetsUrl: process.env.NEXT_PUBLIC_HONEYBADGER_ASSETS_URL,
    revision: process.env.NEXT_PUBLIC_HONEYBADGER_REVISION,
    endpoint: 'https://api.honeybadger.io/v1/source_maps',
    ignoreErrors: false,
    retries: 3,
    workerCount: 5,
    deploy: {
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || process.env.NODE_ENV,
      repository: 'https://url.to.git.repository',
      localUsername: 'username'
    }
  }
};

export default setupHoneybadger(nextConfig, honeybadgerNextJsConfig);
