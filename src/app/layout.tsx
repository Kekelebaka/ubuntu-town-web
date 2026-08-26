import '@/styles/globals.css';
import '@/styles/utown.css';
import localFont from 'next/font/local';
import { Bricolage_Grotesque, IBM_Plex_Mono, Caveat } from 'next/font/google';
import { DynamicLayoutProviders } from './DynamicLayoutProviders';
import { ClientLayout } from './ClientLayout';
import ServiceWorkerRegister from '@/components/app-shell/ServiceWorkerRegister';

const inter = localFont({
  src: [
    { path: '../../node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
});

const robotoMono = localFont({
  src: [
    { path: '../../node_modules/@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../node_modules/@fontsource/roboto-mono/files/roboto-mono-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-roboto-mono',
  display: 'swap',
});

// Ubuntu Town OS brand fonts (display / mono / handwritten accent)
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-plex-mono', display: 'swap' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', display: 'swap' });

export const metadata = {
  // Without metadataBase, Next resolves relative og/twitter image paths against the
  // request origin, which on the Cloudflare edge runtime resolved to http://localhost:3000
  // and broke every social share preview.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://enter.ubuntutown.co.za'),
  title: {
    default: 'Ubuntu Town — 1 Million CVs. 1 Million Opportunities.',
    template: '%s | Ubuntu Town',
  },
  description:
    'Ubuntu Town OS builds community opportunity infrastructure for South African towns. Connecting communities with verified opportunities, CV creation, and coordinator networks. When AI agents allocate opportunity, communities without structured data don\'t exist — Ubuntu Town builds the data layer first.',
  keywords: [
    'Ubuntu Town',
    'South Africa',
    'town coordinator',
    'opportunity infrastructure',
    'CV engine',
    'workpacks',
    'proof-based work',
    'agentic economy',
    'Ubuntu Intelligence',
    'Kopano',
    'ambassador network',
    'community coordination',
    'small towns',
    'townships',
    'job matching',
  ],
  authors: [{ name: 'Keke Lebaka', url: 'https://kekelebaka.com' }],
  creator: 'Keke Lebaka',
  publisher: 'Ubuntu Town',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://www.ubuntutown.co.za',
    siteName: 'Ubuntu Town — 1 Million CVs. 1 Million Opportunities.',
    title: 'Ubuntu Town — Community Opportunity Infrastructure for South Africa',
    description:
      'Ubuntu Town OS builds community opportunity infrastructure for South African towns. Connecting communities with verified opportunities, CV creation, and coordinator networks.',
    images: [
      {
        url: 'https://www.ubuntutown.co.za/ubuntu-town-logo-512.png',
        width: 512,
        height: 512,
        alt: 'Ubuntu Town — 1 Million CVs. 1 Million Opportunities.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ubuntu Town — 1 Million CVs. 1 Million Opportunities.',
    description:
      'Community opportunity infrastructure for South African towns. Connecting communities with verified opportunities, CV creation, and coordinator networks.',
    images: ['https://www.ubuntutown.co.za/ubuntu-town-logo-512.png'],
    creator: '@kekelebaka',
  },
  alternates: {
    types: {
      'application/json': '/ubuntu-town.json',
    },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.ubuntutown.co.za/#organization',
        name: 'Ubuntu Town',
        alternateName: ['Ubuntu Town OS', 'UTown'],
        description:
          'Community opportunity infrastructure for South African towns. When AI agents allocate opportunity, communities without structured, trusted data don\'t exist — Ubuntu Town builds the data layer first.',
        url: 'https://www.ubuntutown.co.za',
        tagline: '1 Million CVs. 1 Million Opportunities.',
        motto: 'One Town. Many Hands. U > I',
        foundingLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'ZA',
          },
        },
        foundingDate: '2025-2026',
        founder: {
          '@type': 'Person',
          name: 'Keke Lebaka',
          url: 'https://kekelebaka.com',
        },
        sameAs: [
          'https://kekelebaka.com',
          'https://t.me/UbuntuTown',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'info@ubuntutown.co.za',
          contactType: 'general inquiry',
        },
        keywords: [
          'Ubuntu Town',
          'opportunity infrastructure',
          'town coordinator',
          'CV engine',
          'proof',
          'workpacks',
          'South Africa',
          'agentic economy',
          'community coordination',
          'Ubuntu Intelligence',
        ],
        knowsAbout: [
          'opportunity infrastructure',
          'town coordination',
          'CV creation',
          'proof-based work',
          'agentic economy',
          'community development',
          'Ubuntu Intelligence',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.ubuntutown.co.za/#website',
        url: 'https://www.ubuntutown.co.za',
        name: 'Ubuntu Town — 1 Million CVs. 1 Million Opportunities.',
        description: 'Community opportunity infrastructure for South African towns.',
        inLanguage: 'en',
        publisher: { '@id': 'https://www.ubuntutown.co.za/#organization' },
      },
      {
        '@type': 'WebApplication',
        '@id': 'https://www.ubuntutown.co.za/#webapp',
        name: 'Ubuntu Town OS',
        description:
          'Community coordination platform for South African towns. Connects communities with opportunities, CV creation, and coordinator networks.',
        url: 'https://www.ubuntutown.co.za',
        applicationCategory: 'SocialApplication',
        operatingSystem: 'Web (mobile-first)',
        browserRequirements: 'Requires JavaScript',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'ZAR',
          description: 'Free access for individuals and communities',
        },
      },
    ],
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${robotoMono.variable} ${bricolage.variable} ${plexMono.variable} ${caveat.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          defer
          data-domain={typeof window !== 'undefined' ? window.location.hostname : 'ubuntutown.co.za'}
          src="https://plausible.io/js/script.js"
        ></script>
        <meta name="theme-color" content="#6B1F66" />
        <meta name="msapplication-TileColor" content="#6B1F66" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ubuntu Town" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ServiceWorkerRegister />
        <DynamicLayoutProviders>
          <ClientLayout>
            {children}
          </ClientLayout>
        </DynamicLayoutProviders>
      </body>
    </html>
  );
}
