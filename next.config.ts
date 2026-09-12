import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // If an external backend URL is specified (e.g., custom domain or separate server)
    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      return [
        {
          source: "/api/backend/:path*",
          destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`,
        },
      ];
    }
    // In local development, proxy to local FastAPI server running on port 8000
    if (process.env.NODE_ENV !== "production") {
      return [
        {
          source: "/api/backend/:path*",
          destination: "http://127.0.0.1:8000/api/:path*",
        },
      ];
    }
    // In production on Vercel, vercel.json routes /api/backend/* to /api/index.py
    return [];
  },
};

export default nextConfig;
