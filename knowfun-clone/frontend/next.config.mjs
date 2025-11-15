/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['www.knowfun.io', 'api.knowfun.io', 'localhost'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
