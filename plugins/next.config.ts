import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server build in `.next/standalone` for the Docker image
  // (Cloud Run). Run with `node server.js`; PORT / HOSTNAME come from the env.
  output: "standalone",
  // Pin the workspace root to this app — a lockfile in a parent dir otherwise
  // makes Next infer the wrong root for file tracing.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
