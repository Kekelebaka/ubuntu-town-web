import type { Metadata } from 'next';
import TownClient from './TownClient';
import freeState from '@/data/provinces/free-state.json';
import westernCape from '@/data/provinces/western-cape.json';
import gauteng from '@/data/provinces/gauteng.json';
import kzn from '@/data/provinces/kwaZulu-natal.json';
import mpumalanga from '@/data/provinces/mpumalanga.json';
import limpopo from '@/data/provinces/limpopo.json';
import easternCape from '@/data/provinces/eastern-cape.json';
import northWest from '@/data/provinces/north-west.json';
import northernCape from '@/data/provinces/northern-cape.json';

const ALL_PROVINCES = [freeState, westernCape, gauteng, kzn, mpumalanga, limpopo, easternCape, northWest, northernCape];
const ALL_TOWNS = ALL_PROVINCES.flatMap(p => p.towns.map(t => ({ ...t, _province: p })));

export const dynamic = 'force-static';

export function generateStaticParams() {
  return ALL_TOWNS.map(t => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const town = ALL_TOWNS.find(t => t.slug === slug);
  if (!town) return { title: 'Town Not Found — Ubuntu Town' };
  
  const province = town._province;
  const desc = town.description || `${town.name} — a town in ${province?.name || 'South Africa'} being rendered by Ubuntu Town.`;
  const shortDesc = desc.length > 160 ? desc.slice(0, 157) + '...' : desc;
  
  return {
    title: `${town.name} — Ubuntu Town Digital Twin`,
    description: shortDesc,
    openGraph: {
      title: `${town.name} — Ubuntu Town`,
      description: shortDesc,
      url: `https://www.ubuntutown.co.za/town/${slug}`,
      siteName: 'Ubuntu Town',
      locale: 'en_ZA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${town.name} — Ubuntu Town`,
      description: shortDesc,
    },
    alternates: {
      canonical: `https://www.ubuntutown.co.za/town/${slug}`,
    },
  };
}

export default async function TownPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ lens?: string }> }) {
  const { slug } = await params;
  const { lens } = await searchParams;
  const town = ALL_TOWNS.find(t => t.slug === slug);
  const province = town ? ALL_PROVINCES.find(p => p.towns.some(t => t.slug === slug)) || null : null;
  if (!town) {
    return <div style={{ minHeight: '100vh', background: '#FBF4E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Town Not Found</h1><p style={{ color: '#6B5E4B' }}>This town is not yet in the network.</p></div></div>;
  }
  return <TownClient town={town} province={province} lens={lens || 'investor'} />;
}
