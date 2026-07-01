import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export async function generateTownMetadata(slug: string) {
  const { data: town } = await supabase
    .from('towns')
    .select('name, slug, archetype, population_estimate, province_id, provinces(name)')
    .eq('slug', slug)
    .single();

  if (!town) {
    return {
      title: 'Town Not Found',
      description: 'The requested town could not be found.',
    };
  }

  const provinceName = (town.provinces as any)?.name || 'South Africa';
  const population = town.population_estimate
    ? town.population_estimate >= 1000000
      ? `${(town.population_estimate / 1000000).toFixed(1)}M`
      : town.population_estimate >= 1000
      ? `${Math.round(town.population_estimate / 1000)}K`
      : town.population_estimate.toString()
    : 'N/A';

  return {
    title: `${town.name} — Opportunities, Businesses & Community`,
    description: `Explore ${town.name}, ${provinceName}. Find local opportunities, businesses, coordinators, and community signals. Population: ${population}.`,
    openGraph: {
      title: `${town.name} — Ubuntu Town`,
      description: `Explore ${town.name}, ${provinceName}. Find opportunities, businesses, and community signals.`,
      type: 'website',
      locale: 'en_ZA',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${town.name} — Ubuntu Town`,
      description: `Explore ${town.name}, ${provinceName}.`,
    },
  };
}

export function generateTownJsonLd(town: any, province: any) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Place',
        '@id': `https://ubuntutown.co.za/town/${town.slug}#place`,
        name: town.name,
        description: `${town.name} — Community opportunity infrastructure on Ubuntu Town.`,
        containedInPlace: province
          ? {
              '@type': 'AdministrativeArea',
              name: province.name,
            }
          : undefined,
        geo: town.lat && town.lng
          ? {
              '@type': 'GeoCoordinates',
              latitude: town.lat,
              longitude: town.lng,
            }
          : undefined,
        population: town.population_estimate
          ? {
              '@type': 'QuantitativeValue',
              value: town.population_estimate,
            }
          : undefined,
      },
      {
        '@type': 'WebPage',
        '@id': `https://ubuntutown.co.za/town/${town.slug}#webpage`,
        url: `https://ubuntutown.co.za/town/${town.slug}`,
        name: `${town.name} — Ubuntu Town`,
        description: `Explore ${town.name}. Find opportunities, businesses, coordinators, and community signals.`,
        isPartOf: {
          '@id': 'https://ubuntutown.co.za/#website',
        },
        about: {
          '@id': `https://ubuntutown.co.za/town/${town.slug}#place`,
        },
      },
    ],
  };
}
