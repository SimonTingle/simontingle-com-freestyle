import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR from local network IPs for development
  allowedDevOrigins: ['192.168.1.15', 'localhost', '127.0.0.1'],
  experimental: {
    webpackBuildWorker: true,
  },
};

export default nextConfig;
