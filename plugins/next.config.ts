import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app — a lockfile in a parent dir otherwise
  // makes Next infer the wrong root for file tracing.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
