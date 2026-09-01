import '@/styles/living-town.css';
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Today · Living Town', robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
