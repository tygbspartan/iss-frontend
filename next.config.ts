import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Builds a self-contained server (.next/standalone/server.js) to run as the
  // cPanel Node.js app, without uploading node_modules. Copy `public/` and
  // `.next/static/` next to it after building.
  output: "standalone",
  experimental: {
    // Image resizing (next/image) otherwise runs on half the server's CPU
    // cores, and on shared hosting each of those threads counts against the
    // account's process limit. One is plenty for this site's traffic.
    imgOptConcurrency: 1,
  },
};

export default nextConfig;
