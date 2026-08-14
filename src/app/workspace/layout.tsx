import type { ReactNode } from 'react';
import WorkspaceChrome from './WorkspaceChrome';

// Applies the persistent Ubuntu Town app navigation to every /workspace route.
// Server layout renders the client chrome wrapper so the existing (client)
// page components are untouched.
export const runtime = 'edge';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <WorkspaceChrome>{children}</WorkspaceChrome>;
}
