/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow images from Unsplash (used as product photo fallbacks)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Support trailing slashes for store URLs
  trailingSlash: false,
  // Ensure dynamic store routes work on Vercel
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
