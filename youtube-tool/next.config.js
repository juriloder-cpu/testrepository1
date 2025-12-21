/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('better-sqlite3');
    }
    return config;
  },
};

module.exports = nextConfig;
