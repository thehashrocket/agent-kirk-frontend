import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.ngrok.io', '*.ngrok-free.app'],
  experimental: {
    turbo: {
      // ...
    },
  },
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

export default nextConfig;
