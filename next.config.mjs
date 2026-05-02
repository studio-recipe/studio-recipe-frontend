/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/studio-recipe/:path*',
        destination: 'http://localhost:8080/studio-recipe/:path*',
      },
    ]
  },
}

export default nextConfig
