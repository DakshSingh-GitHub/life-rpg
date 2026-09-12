import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // If an external backend URL is specified (e.g., custom domain or separate server)
    let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
    if (backendUrl) {
      if (!backendUrl.startsWith("http://") && !backendUrl.startsWith("https://")) {
        backendUrl = `https://${backendUrl}`;
      }
      backendUrl = backendUrl.replace(/\/+$/, "");
      return [
        {
          source: "/api/backend/:path*",
          destination: `${backendUrl}/api/:path*`,
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
