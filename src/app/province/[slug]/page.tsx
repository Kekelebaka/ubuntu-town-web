export const runtime = 'edge';
import ProvinceClient from './ProvinceClient';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

interface ProvinceData {
  slug: string;
  name: string;
  default_lens?: string;
  hero_image?: string;
  description?: string;
  network?: { towns: number; provinces: number; coordinators: number };
  aggregates?: {
    towns: number;
    live: number;
    building: number;
    unclaimed: number;
    opportunity_index_avg: number;
  };
  data_vintage?: string;
  towns: any[];
  coordinators?: { name: string; status: string; town: string }[];
  featured_stories?: { title: string; content: string; author: string; town: string }[];
  top_opportunities?: { title: string; type: string; source: string; town: string }[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: province } = await supabase
    .from('provinces')
    .select('name, slug')
    .eq('slug', slug)
    .single();

  if (!province) {
    return {
      title: 'Province Not Found',
      description: 'The requested province could not be found.',
    };
  }

  return {
    title: `${province.name} Province — Towns & Opportunities`,
    description: `Explore all towns in ${province.name} Province. Find opportunities, coordinators, businesses, and community signals across the province.`,
    openGraph: {
      title: `${province.name} Province — Ubuntu Town`,
      description: `Explore all towns in ${province.name} Province.`,
      type: 'website',
      locale: 'en_ZA',
    },
  };
}

export async function generateStaticParams() {
  const { data: provinces } = await supabase
    .from('provinces')
    .select('slug');

  return (provinces || []).map((p) => ({
    slug: p.slug,
  }));
}

export default async function ProvincePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch province data
  const { data: province } = await supabase
    .from('provinces')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!province) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Province Not Found</h1>
          <a href="/towns" className="text-ubuntu-gold-dark hover:underline">
            ← Browse all towns
          </a>
        </div>
      </div>
    );
  }

  // Fetch towns in this province
  const { data: towns } = await supabase
    .from('towns')
    .select('*')
    .eq('province_id', province.id)
    .order('name');

  // Fetch coordinators
  const { data: coordinators } = await supabase
    .from('coordinators')
    .select('display_name, status, town_id')
    .in(
      'town_id',
      (towns || []).map((t) => t.id)
    );

  // Build province data structure
  const provinceData: ProvinceData = {
    slug: province.slug,
    name: province.name,
    default_lens: 'investor',
    description: `Explore all towns in ${province.name} Province.`,
    towns: (towns || []).map((t) => ({
      slug: t.slug,
      name: t.name,
      region: t.archetype || 'Town',
      district: t.archetype,
      status: t.coordinator_id ? 'live' : 'building',
      render_pct: t.coordinator_id ? 100 : 50,
      opportunity_potential: 60,
      heritage: false,
      coordinator_status: t.coordinator_id ? 'assigned' : 'unassigned',
      lat: t.lat,
      lng: t.lng,
      route: `/town/${t.slug}`,
    })),
    aggregates: {
      towns: towns?.length || 0,
      live: towns?.filter((t) => t.coordinator_id).length || 0,
      building: towns?.filter((t) => !t.coordinator_id).length || 0,
      unclaimed: 0,
      opportunity_index_avg: 60,
    },
    network: {
      towns: towns?.length || 0,
      provinces: 9,
      coordinators: coordinators?.length || 0,
    },
    coordinators: (coordinators || []).map((c) => ({
      name: c.display_name,
      status: c.status,
      town: towns?.find((t) => t.id === c.town_id)?.name || 'Unknown',
    })),
  };

  return <ProvinceClient province={provinceData} lens="investor" />;
}
