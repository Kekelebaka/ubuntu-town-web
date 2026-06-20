import { MapPinned } from 'lucide-react';

export default function TownMap({ townSlug, center, zoom }: { townSlug: string; center: [number, number]; zoom?: number }) {
  return (
    <div className="bg-ubuntu-dark/80 border border-ubuntu-border rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
      <MapPinned className="w-16 h-16 text-ubuntu-orange/40 mb-4" />
      <p className="text-muted-foreground text-center">
        Interactive map for <span className="text-ubuntu-light font-semibold">{townSlug}</span>
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Map integration coming soon. Showing town layout preview.
      </p>
    </div>
  );
}
