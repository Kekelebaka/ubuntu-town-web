import type { Metadata } from 'next';
import ProvinceClient from './ProvinceClient';
import freeState from '@/data/provinces/free-state.json';
import westernCape from '@/data/provinces/western-cape.json';
import gauteng from '@/data/provinces/gauteng.json';
import kzn from '@/data/provinces/kwaZulu-natal.json';
import mpumalanga from '@/data/provinces/mpumalanga.json';
import limpopo from '@/data/provinces/limpopo.json';
import easternCape from '@/data/provinces/eastern-cape.json';
import northWest from '@/data/provinces/north-west.json';
import northernCape from '@/data/provinces/northern-cape.json';

const ALL_PROVINCES: Record<string, any> = {
  'free-state': freeState, 'western-cape': westernCape, gauteng,
  'kwaZulu-natal': kzn, mpumalanga, limpopo, 'eastern-cape': easternCape,
  'north-west': northWest, 'northern-cape': northernCape,
};

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(ALL_PROVINCES).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const province = ALL_PROVINCES[slug];
  if (!province) return { title: 'Province Not Found — Ubuntu Town' };
  const desc = province.description || `${province.name} — Ubuntu Town digital twin network.`;
  return {
    title: `${province.name} — Ubuntu Town Province`,
    description: desc.slice(0, 160),
    openGraph: { title: `${province.name} — Ubuntu Town`, description: desc.slice(0, 160) },
  };
}

export default async function ProvincePage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ lens?: string }> }) {
  const { slug } = await params;
  const { lens } = await searchParams;
  const province = ALL_PROVINCES[slug];
  if (!province) {
    return <div style={{ minHeight: '100vh', background: '#FBF4E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><h1 style={{ fontSize: 24, fontWeight: 800 }}>Province Not Found</h1><p style={{ color: '#6B5E4B' }}>This province is not yet in the network.</p></div></div>;
  }
  return <ProvinceClient province={province} lens={lens || 'investor'} />;
}
