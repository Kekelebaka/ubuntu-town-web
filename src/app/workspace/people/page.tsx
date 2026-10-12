import type { Metadata } from 'next';
import PeopleClient from './PeopleClient';

export const metadata: Metadata = {
  title: 'My People — Ubuntu Town',
  description: 'The people you work with in your town.',
};

export const dynamic = 'force-dynamic';

export default function PeoplePage() {
  return <PeopleClient />;
}
