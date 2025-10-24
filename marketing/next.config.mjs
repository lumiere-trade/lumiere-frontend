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
