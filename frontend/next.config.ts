import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* API dùng cùng host với giao diện; Next proxy sang backend bên trong Docker. */
  experimental: {
    proxyClientMaxBodySize: "500mb",
  },
  async rewrites() {
    const apiTarget = process.env.API_INTERNAL_URL || "http://localhost:3001/api";
    return [{ source: "/api/:path*", destination: `${apiTarget}/:path*` }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
