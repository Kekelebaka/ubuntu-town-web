export const runtime = 'edge';
import TownDetail from './TownDetail';
import { generateTownMetadata, generateTownJsonLd } from './metadata';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return generateTownMetadata(slug);
}

export async function generateStaticParams() {
  const { data: towns } = await supabase
    .from('towns')
    .select('slug');

  return (towns || []).map((t) => ({
    slug: t.slug,
  }));
}

export default async function TownPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Fetch town data for JSON-LD
  const { data: town } = await supabase
    .from('towns')
    .select('*, provinces(name)')
    .eq('slug', slug)
    .single();

  const jsonLd = town ? generateTownJsonLd(town, town.provinces) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <TownDetail slug={slug} />
    </>
  );
}
