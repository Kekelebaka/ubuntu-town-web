import type { Metadata } from 'next';
import ReviewQueueClient from './ReviewQueueClient';

export const metadata: Metadata = {
  title: 'Review Queue — Ubuntu Town',
  description: 'Review submitted community work and its evidence.',
};

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function ReviewQueuePage() {
  return <ReviewQueueClient />;
}
