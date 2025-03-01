import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'olive-swift-dragon-159.mypinata.cloud',
      'i.imgur.com',
      'res.cloudinary.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com'
    ],
  },
};

export default nextConfig;
