import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack/Webpack from bundling Node's native C++ SQLite module into client chunks
  serverExternalPackages: ["node:sqlite"],
  // Allow base64 data URLs in images if using Next Image
  images: {
    unoptimized: true,
  },
  // Allow accessing Next.js dev resources & HMR from local network devices (e.g. mobile phones)
  allowedDevOrigins: [
    "192.168.1.55",
    "192.168.1.55:3000",
    "localhost",
    "localhost:3000",
    "127.0.0.1",
    "127.0.0.1:3000",
  ],
};

export default nextConfig;
