import type { Metadata } from 'next';
import TownPassportClient from './TownPassportClient';

export const metadata: Metadata = {
  title: 'Town Passport — Ubuntu Town',
  description: 'Your town: people, economy, assets, opportunities, initiatives and proof.',
};

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function TownPage() {
  return <TownPassportClient />;
}
