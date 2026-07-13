import type { Metadata } from 'next';
import NewCommunityWorkClient from './NewCommunityWorkClient';

export const metadata: Metadata = {
  title: 'Add Community Work — Ubuntu Town',
  description: 'Register a worker, host, business, event, or podcast in your town.',
};

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function NewCommunityWorkPage() {
  return <NewCommunityWorkClient />;
}
