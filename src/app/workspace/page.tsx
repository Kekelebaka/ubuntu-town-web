import type { Metadata } from 'next';
import WorkspaceClient from './WorkspaceClient';

export const metadata: Metadata = {
  title: 'Workspace — Ubuntu Town',
  description: 'Manage your town\'s community work. Add workers, businesses, events, and more.',
};

export const dynamic = 'force-dynamic';

export default function WorkspacePage() {
  return <WorkspaceClient />;
}
