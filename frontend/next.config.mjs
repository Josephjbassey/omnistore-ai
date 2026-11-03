/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    // If explicit proxying to Python backend is requested via env var
    if (process.env.USE_PYTHON_BACKEND_PROXY === "true") {
      return [
        {
          source: "/api/v1/:path*",
          destination: "http://127.0.0.1:8000/api/v1/:path*",
        },
      ];
    }
    // By default, native Next.js API route handlers in app/api/v1/ handle requests,
    // with automatic dynamic fallback & proxying to FastAPI when running on port 8000.
    return [];
  },
};

export default nextConfig;
