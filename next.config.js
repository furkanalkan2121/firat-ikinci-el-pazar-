/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint uyarıları build'i durdurmasın (yalnızca uyarı seviyesi)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Tip hataları artık build'i durdursun — gerçek hatalar prod'a sızmasın.
    // (Kod tabanı `tsc --noEmit` ile temiz geçiyor.)
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
