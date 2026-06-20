import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import {
  MapPin,
  Sparkles,
  FileText,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { AppSidebarContent } from './app-sidebar-client';

// Mock user for sidebar display (real user comes from auth context)
const mockUser = {
  id: 'mock-user-id',
  email: 'user@example.com',
  user_metadata: {
    name: 'Guest User',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_anonymous: false,
} as any;

async function SidebarHeaderContent() {
  return <SidebarHeader>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link href="/">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-ubuntu-orange text-ubuntu-dark">
              <MapPin className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-ubuntu-light">Ubuntu Town</span>
              <span className="truncate text-xs text-muted-foreground">Community Platform</span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarHeader>
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeaderContent />
      <Suspense fallback={<SidebarMenu />}>
        <AppSidebarContent user={mockUser} />
      </Suspense>
    </Sidebar>
  );
}
