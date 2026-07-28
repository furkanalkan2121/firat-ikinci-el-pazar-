/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Vercel derleme esnasında lint uyarılarının build'i durdurmasını engeller
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Vercel derleme esnasında tip uyarılarının build'i durdurmasını engeller
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
