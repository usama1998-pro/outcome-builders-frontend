import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/chat/new",
        destination: "/chat",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
