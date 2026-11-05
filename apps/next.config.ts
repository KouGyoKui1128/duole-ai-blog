import type { NextConfig } from "next";

import { getServerApiBase } from "./lib/api-base";

if (process.env.VERCEL && !process.env.SERVER_API_BASE) {
  throw new Error("SERVER_API_BASE must be set: the site cannot reach the backend without it");
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${getServerApiBase()}/:path*` }];
  },
};

export default nextConfig;
