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
  ...(process.env.EXPERIENCE_ROOT_REDIRECT === '1' ||
    process.env.EXPERIENCE_002_ROOT_REDIRECT === '1' ||
    process.env.EXPERIENCE_003_ROOT_REDIRECT === '1' ||
    process.env.EXPERIENCE_004_ROOT_REDIRECT === '1'
    ? {
        async redirects() {
          const is002 = process.env.EXPERIENCE_002_ROOT_REDIRECT === '1';
          const is003 = process.env.EXPERIENCE_003_ROOT_REDIRECT === '1' || process.env.EXPERIENCE_004_ROOT_REDIRECT === '1';
          const root = is003 ? '/operate' : is002 ? '/real' : '/os';
          const rules = [{ source: '/', destination: root, permanent: false }];
          // EXPERIENCE 002 quarantine: the synthetic /os world is NOT served on the
          // real-data deployment — synthetic records must never be reachable there.
          if (is002) {
            rules.push({ source: '/os', destination: '/real', permanent: false });
            rules.push({ source: '/os/:path*', destination: '/real', permanent: false });
          }
          // EXPERIENCE 003 quarantine: the OS worker serves ONLY the OS. Legacy preview
          // surfaces (/os synthetic, /real) stay on their own workers — never mixed here.
          if (is003) {
            rules.push({ source: '/os', destination: '/operate', permanent: false });
            rules.push({ source: '/os/:path*', destination: '/operate', permanent: false });
            rules.push({ source: '/real', destination: '/operate', permanent: false });
            rules.push({ source: '/real/:path*', destination: '/operate', permanent: false });
          }
          return rules;
        },
      }
    : {}),
};

export default config;
