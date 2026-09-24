"use client";

import { useState } from 'react';
import { useTownContext } from '@/contexts/town-context';
import WesternCape from '@/data/provinces/western-cape.json';
import Gauteng from '@/data/provinces/gauteng.json';
import KwaZuluNatal from '@/data/provinces/kwaZulu-natal.json';
import Mpumalanga from '@/data/provinces/mpumalanga.json';
import Limpopo from '@/data/provinces/limpopo.json';
import EasternCape from '@/data/provinces/eastern-cape.json';
import NorthWest from '@/data/provinces/north-west.json';
import NorthernCape from '@/data/provinces/northern-cape.json';
import { MotionDiv } from '@/components/MotionDiv';

interface TownFromCanonicalJSON {
  slug: string;
  name: string;
  region: string;
  district?: string | undefined;
  status: string;
  render_pct: number;
  opportunity_potential: number;
  heritage?: boolean | undefined;
  coordinator_status: string;
  route: string;
  illustrative?: boolean | undefined;
  coordinates?: { lat: number; lng: number };
  coordinator_name?: string;
  youth_mapped?: number;
  active_signals?: number;
  open_opportunities?: number;
}

interface ProvinceData {
  name: string;
  towns: TownFromCanonicalJSON[];
}

const PROVINCES: Record<string, ProvinceData> = {
  westernCape: WesternCape,
  gauteng: Gauteng,
  kwaZuluNatal: KwaZuluNatal,
  mpumalanga: Mpumalanga,
  limpopo: Limpopo,
  easternCape: EasternCape,
  northWest: NorthWest,
  northernCape: NorthernCape,
};

export default function TownSelectPage() {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const { selectTown } = useTownContext();

  const handleSelectTown = (
    slug: string,
    name: string,
    // mappedBy canonical fields; displayName is derived in UI
    provinceCode: string
  ) => {
    // Mapped from canonical slug and name; displayName retained from context
    selectTown(slug, name, name, provinceCode);
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-light text-white mb-2">Choose Your Town</h1>
        <p className="text-gray-400 text-lg mb-12">Tap to enter Ubuntu Town field OS</p>

        {selectedProvince ? (
          <ProvinceTowns
            province={PROVINCES[selectedProvince]}
            onSelectTown={handleSelectTown}
            onBack={() => setSelectedProvince(null)}
            provinceNameForCode={PROVINCES[selectedProvince].name}
          />
        ) : (
          <ProvincesList
            provinces={PROVINCES}
            onSelectProvince={setSelectedProvince}
          />
        )}
      </div>
    </div>
  );
}

function ProvincesList({ provinces, onSelectProvince }: { provinces: Record<string, ProvinceData>; onSelectProvince: (id: string) => void }) {
  const provinceOrder = [
    'westernCape', 'gauteng', 'kwaZuluNatal', 'mpumalanga',
    'limpopo', 'easternCape', 'northWest', 'northernCape',
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {provinceOrder.map((key) => {
        const province = provinces[key];
        return (
          <MotionDiv key={key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div
              className="h-64 rounded-md overflow-hidden cursor-pointer relative group bg-gray-900"
              onClick={() => onSelectProvince(key)}
            >
              <h2 className="text-2xl font-light text-white absolute bottom-4 left-4 z-10 group-hover:scale-105 transition-transform">
                {province.name}
              </h2>
              <img
                src={province.name.toLowerCase()}
                alt={province.name}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
            </div>
          </MotionDiv>
        );
      })}
    </div>
  );
}

function ProvinceTowns({
  province,
  onSelectTown,
  onBack,
  provinceNameForCode
}: {
  province: ProvinceData;
  onSelectTown: (slug: string, name: string, provinceCode: string) => void;
  onBack: () => void;
  provinceNameForCode: string
}) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center text-white mb-8 hover:opacity-80 transition-opacity"
      >
        <span className="mr-2">←</span> Back to Provinces
      </button>

      <div className="mb-12">
        <h2 className="text-2xl font-light text-white mb-6">Featured Towns</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {province.towns.map((town) => (
            <MotionDiv key={town.slug} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div
                className="relative h-80 rounded-md overflow-hidden cursor-pointer group"
                onClick={() =>
                  onSelectTown(town.slug, town.name, provinceNameForCode.replace(/\s+/g, '').toLowerCase())
                }
              >
                <h3 className="text-3xl font-light text-white mb-1">{town.name}</h3>
              </div>
            </MotionDiv>
          ))}
        </div>
      </div>
    </div>
  );
}