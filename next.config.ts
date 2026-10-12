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
  // EXPERIENCE PREVIEW BUILDS ONLY (flags set at build time; the main app build
  // sets neither and is unaffected):
  // - EXPERIENCE_ROOT_REDIRECT=1 (Experience 001 preview) → bare URL serves /os.
  // - EXPERIENCE_002_ROOT_REDIRECT=1 (Experience 002 real-data preview) → bare URL serves /real.
  ...(process.env.EXPERIENCE_ROOT_REDIRECT === '1' || process.env.EXPERIENCE_002_ROOT_REDIRECT === '1'
    ? {
        async redirects() {
          const rules = [
            {
              source: '/',
              destination: process.env.EXPERIENCE_002_ROOT_REDIRECT === '1' ? '/real' : '/os',
              permanent: false,
            },
          ];
          // EXPERIENCE 002 quarantine: the synthetic /os world is NOT served on the
          // real-data deployment — synthetic records must never be reachable there.
          if (process.env.EXPERIENCE_002_ROOT_REDIRECT === '1') {
            rules.push({ source: '/os', destination: '/real', permanent: false });
            rules.push({ source: '/os/:path*', destination: '/real', permanent: false });
          }
          return rules;
        },
      }
    : {}),
};

export default config;
