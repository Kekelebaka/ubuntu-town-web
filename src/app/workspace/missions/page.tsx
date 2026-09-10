import type { Metadata } from 'next';
import VerifyLocalBusinessMission from './VerifyLocalBusinessMission';

export const metadata: Metadata = {
  title: 'Missions — Ubuntu Town',
  description: 'Discover, accept, and complete missions in your town.',
};

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function MissionsPage() {
  return <VerifyLocalBusinessMission />;
}
