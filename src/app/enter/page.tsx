import NationalView from './NationalView';
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

export const dynamic = 'force-static';

export default async function EnterPage({ searchParams }: { searchParams: Promise<{ lens?: string }> }) {
  const { lens } = await searchParams;
  return <NationalView provinces={ALL_PROVINCES} lens={lens || 'investor'} />;
}
