import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.whatsapp.net'
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com'
      },
      {
        protocol: 'https',
        hostname: 'media.nest.messagebird.com'
      }
    ]
  },
  typescript: {
    ignoreBuildErrors: false
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true
};

export default nextConfig;
