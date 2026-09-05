import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "0.0.0.0:3000",
        "::1:3000",
        "192.168.1.7:3000",
      ],
    },
  },
};

export default nextConfig;
