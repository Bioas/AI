/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle mongodb on the client side
      config.externals.push({
        mongodb: 'commonjs mongodb',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
