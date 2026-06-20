// Mapbox integration utilities for Ubuntu Town OS v1
// Replace MAPBOX_TOKEN with your actual token from mapbox.com

export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.placeholder',
  style: 'mapbox://styles/mapbox/dark-v11' as const,
};

export interface MapMarker {
  lat: number;
  lng: number;
  type: 'coordinator' | 'business' | 'service' | 'signal' | 'access-point' | 'youth';
  title: string;
  description?: string;
}

// Color mapping for marker types
export const MARKER_COLORS = {
  coordinator: '#f5a340', // Ubuntu Orange
  business: '#22c55e',    // Learning Green
  service: '#0ea5e9',     // FixEasy Blue
  signal: '#ef4444',      // Proof Red
  'access-point': '#7649bc', // Ubuntu Purple
  youth: '#10b981',       // Youth Teal
};

export function getMarkerColor(type: MapMarker['type']): string {
  return MARKER_COLORS[type] || '#7649bc';
}
