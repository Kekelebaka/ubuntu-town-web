'use client';
import { TownRef, PersonaLens } from '@/lib/ubuntu-town-types';
import TownCard from './TownCard';

interface Props {
  towns: TownRef[];
  lens?: PersonaLens;
}

export default function ConstellationGrid({ towns, lens = 'investor' }: Props) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 20,
    }}>
      {towns.map(town => (
        <TownCard key={town.slug} town={town} lens={lens} />
      ))}
    </div>
  );
}
