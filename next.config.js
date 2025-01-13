/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove any Replit-specific configuration
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
}

module.exports = nextConfig 