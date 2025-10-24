/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@lumiere/shared'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}
export default nextConfig
// Rebuild Fri Oct 24 02:34:46 PM EEST 2025
