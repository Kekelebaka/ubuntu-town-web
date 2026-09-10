import type { Metadata } from 'next';
import OpportunitiesClient from './OpportunitiesClient';

export const metadata: Metadata = {
  title: 'Opportunities — Ubuntu Town',
  description: 'Opportunities from your town and the Ubuntu Town network.',
};

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function OpportunitiesPage() {
  return <OpportunitiesClient />;
}
