/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  typescript: {
    // Type checking done separately with increased stack size
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
