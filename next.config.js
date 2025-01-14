/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove any Replit-specific configuration
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: '*.firebasestorage.app',
        pathname: '/o/**',
      },
    ],
  },
}

module.exports = nextConfig 