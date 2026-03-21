import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      fs: "./lib/empty.ts",
    },
  },
};

export default nextConfig;
