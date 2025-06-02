/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  images: {
    unoptimized: true,
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "ext.same-assets.com",
      "ugc.same-assets.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for @supabase/node-fetch browser.js issue
    if (!isServer) {
      // Provide polyfills for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
        'node-fetch': false,
      };
      
      // Create specific aliases for problematic modules
      config.resolve.alias = {
        ...config.resolve.alias,
        '@supabase/node-fetch': path.resolve(__dirname, 'browser-polyfills.js'),
      };

      // Ignore specific modules that cause issues
      config.module = {
        ...config.module,
        rules: [
          ...config.module.rules,
          {
            test: /node_modules\/@supabase\/node-fetch\/browser\.js/,
            use: 'null-loader',
          },
        ],
      };
    }
    return config;
  },
  // Configure Turbopack
  experimental: {
    turbo: {
      // Add any Turbopack-specific configuration here if needed
    }
  },
};

module.exports = nextConfig;
