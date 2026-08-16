import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from bundling server-only modules into the client/edge bundle.
  // These are used only inside our custom Node.js server and API routes.
  serverExternalPackages: ['mongoose'],
};

export default nextConfig;
