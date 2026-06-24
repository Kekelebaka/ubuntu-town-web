import '@/styles/globals.css';
import localFont from 'next/font/local';
import { DynamicLayoutProviders } from './DynamicLayoutProviders';
import { ClientLayout } from './ClientLayout';

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

export const metadata = {
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
        url: '/og/og-default.png',
        width: 1200,
        height: 630,
        alt: 'Ubuntu Town — 1 Million CVs. 1 Million Opportunities.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ubuntu Town — 1 Million CVs. 1 Million Opportunities.',
    description:
      'Community opportunity infrastructure for South African towns. Connecting communities with verified opportunities, CV creation, and coordinator networks.',
    images: ['/og/og-default.png'],
    creator: '@kekelebaka',
  },
  alternates: {
    canonical: 'https://www.ubuntutown.co.za',
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${robotoMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script defer data-domain="enter.ubuntutown.co.za" src="https://plausible.io/js/script.js"></script>
        <link rel="canonical" href="https://www.ubuntutown.co.za" />
        <meta name="theme-color" content="#1a7f37" />
        <meta name="msapplication-TileColor" content="#1a7f37" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <DynamicLayoutProviders>
          <ClientLayout>
            {children}
          </ClientLayout>
        </DynamicLayoutProviders>
      </body>
    </html>
  );
}
