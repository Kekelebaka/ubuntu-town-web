import { Suspense } from 'react';
import { DashboardHeading } from './dashboard-heading';
import { DashboardListSkeleton } from './dashboard-list-skeleton';
import { DashboardTownInfo } from './dashboard-private-items-section';

type MockTown = { id: string; province_id: string; name: string; slug: string; archetype: string | null; population_estimate: number | null; coordinator_id: string | null; created_at: string };

export default function DashboardPage() {
  const mockTowns: MockTown[] = [
    { id: 'demo-1', province_id: 'prov-gauteng', name: 'Johannesburg', slug: 'johannesburg', archetype: 'metropolitan', population_estimate: 5600000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
    { id: 'demo-2', province_id: 'prov-wc', name: 'Cape Town', slug: 'cape-town', archetype: 'metropolitan', population_estimate: 4600000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
    { id: 'demo-3', province_id: 'prov-limpopo', name: 'Polokwane', slug: 'polokwane', archetype: 'peri-urban', population_estimate: 65000, coordinator_id: null, created_at: '2024-01-01T00:00:00Z' },
  ];
  const townsPromise = Promise.resolve(mockTowns);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <DashboardHeading />
      <Suspense fallback={<DashboardListSkeleton />}>
        <DashboardTownInfo townsPromise={townsPromise} />
      </Suspense>
    </div>
  );
}
