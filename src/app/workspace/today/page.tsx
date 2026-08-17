import type { Metadata } from 'next';
import TodayClient from './TodayClient';

export const metadata: Metadata = {
  title: 'Today — Ubuntu Town',
  description: 'What needs you today in your town.',
};

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function TodayPage() {
  return <TodayClient />;
}
