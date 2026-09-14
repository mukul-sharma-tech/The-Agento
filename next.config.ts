import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['tesseract.js'],
  },
};

export default nextConfig;
