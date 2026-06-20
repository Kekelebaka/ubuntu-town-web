// Provinces matching the database schema
export interface Province {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export const provinces: Province[] = [
  { id: 'prov-gauteng', name: 'Gauteng', slug: 'gauteng', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-wc', name: 'Western Cape', slug: 'western-cape', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-kzn', name: 'KwaZulu-Natal', slug: 'kwazulu-natal', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-ec', name: 'Eastern Cape', slug: 'eastern-cape', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-limpopo', name: 'Limpopo', slug: 'limpopo', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-mpumalanga', name: 'Mpumalanga', slug: 'mpumalanga', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-nw', name: 'North West', slug: 'north-west', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-fs', name: 'Free State', slug: 'free-state', created_at: '2024-01-01T00:00:00Z' },
  { id: 'prov-nc', name: 'Northern Cape', slug: 'northern-cape', created_at: '2024-01-01T00:00:00Z' },
];

export function getProvinceBySlug(slug: string): Province | undefined {
  return provinces.find(p => p.slug === slug);
}

export function getProvincesByTown(townProvinceId: string): Province | undefined {
  return provinces.find(p => p.id === townProvinceId);
}
