import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.whatsapp.net'
      },
      {
        protocol: 'https',
        hostname: 'graph.facebook.com'
      }
    ]
  },
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true
};

export default nextConfig;
