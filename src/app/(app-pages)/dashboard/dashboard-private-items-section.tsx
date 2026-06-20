import type { Table as TableType } from '@/types';

interface DashboardTownInfoProps {
  townsPromise: Promise<TableType<'towns'>[]>;
}

export async function DashboardTownInfo({
  townsPromise,
}: DashboardTownInfoProps) {
  const towns = await townsPromise;
  const activeCount = towns.filter(t => t.slug).length;
  return (
    <div className="space-y-4 p-4 md:p-6">
      <h2 className="text-2xl font-bold text-ubuntu-light">Your Towns</h2>
      <p className="text-muted-foreground">
        You have access to {activeCount} towns in the Ubuntu Town network.
      </p>
      {towns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No towns mapped yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {towns.slice(0, 6).map((town) => (
            <div key={town.id} className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-4">
              <p className="font-semibold text-ubuntu-light">{town.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{town.archetype || 'General'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
