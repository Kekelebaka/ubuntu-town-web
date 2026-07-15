import type { Metadata } from 'next';
import WorkDetailClient from './WorkDetailClient';

export const metadata: Metadata = {
  title: 'Work Detail — Ubuntu Town',
  description: 'Review community work, discuss, and confirm.',
};

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function WorkDetailPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const id = params?.id;
  if (!id) return <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>Missing work id.</div>;
  return <WorkDetailClient id={id} />;
}
