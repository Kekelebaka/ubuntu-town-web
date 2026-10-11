import { NextConfig } from "next";

const config: NextConfig = {
  cacheComponents: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // EXPERIENCE 001 PREVIEW ONLY: when EXPERIENCE_ROOT_REDIRECT=1 at build time
  // (the public preview build), the opening experience serves at the bare URL.
  // The main app build does not set this flag and is unaffected.
  ...(process.env.EXPERIENCE_ROOT_REDIRECT === '1'
    ? {
        async redirects() {
          return [{ source: '/', destination: '/os', permanent: false }];
        },
      }
    : {}),
};

export default config;
