export const runtime = 'edge';
import TownDetail from './TownDetail';

export default async function TownPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TownDetail slug={slug} />;
}
