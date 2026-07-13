'use client';
import Link from 'next/link';
import { TownRef, PersonaLens } from '@/lib/ubuntu-town-types';
import { getStatusSkin, hashToHue } from '@/lib/render-state';
import { PERSONAS } from '@/lib/persona-lens';

interface TownCardProps {
  town: TownRef;
  lens?: PersonaLens;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  ghost:    { label: 'Unclaimed',  bg: '#F6EDDB', color: '#6B5E4B', border: '#ECE3D2' },
  building: { label: 'Building',   bg: 'rgba(238,184,73,0.12)', color: '#B98114', border: 'rgba(238,184,73,0.3)' },
  live:     { label: 'Live',       bg: 'rgba(19,102,44,0.1)', color: '#13662C', border: 'rgba(19,102,44,0.25)' },
};

const COORD_ICONS: Record<string, string> = {
  recruiting: '👤', assigned: '✅', active: '🟢', dormant: '⏸️',
};

export default function TownCard({ town, lens = 'investor' }: TownCardProps) {
  const hue = hashToHue(town.slug);
  const skin = getStatusSkin(town.status, town.render_pct, hue);
  const statusStyle = STATUS_LABELS[town.status];
  const persona = PERSONAS[lens];

  return (
    <Link href={town.route + '?lens=' + lens} style={{ textDecoration: 'none' }}>
      <div
        style={{
          background: skin.bg,
          border: `1px ${skin.borderStyle} ${skin.border}`,
          borderRadius: '18px', padding: '20px',
          boxShadow: skin.glow === 'none' ? '0 1px 2px rgba(21,16,21,.04), 0 8px 30px rgba(21,16,21,.06)' : skin.glow,
          transition: 'all 0.2s ease', cursor: 'pointer', position: 'relative', overflow: 'hidden',
          minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}
        onMouseEnter={e => { (e.currentTarget).style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { (e.currentTarget).style.transform = 'translateY(0)'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            background: statusStyle.bg, color: statusStyle.color,
            border: `1px solid ${statusStyle.border}`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusStyle.color, opacity: town.status === 'building' ? 0.7 : 1 }} />
            {statusStyle.label}
          </span>
          {town.illustrative && (
            <span style={{ fontSize: '9px', color: '#6B5E4B', fontStyle: 'italic' }}>illustrative</span>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#151015', margin: '0 0 4px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {town.name}
          </h3>
          {town.region && (
            <p style={{ fontSize: '12px', color: '#6B5E4B', margin: 0 }}>{town.region}</p>
          )}
        </div>

        {town.status !== 'ghost' && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#6B5E4B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: town.status === 'live' ? '#13662C' : '#B98114' }}>{town.render_pct}%</span>
            </div>
            <div style={{ height: '4px', borderRadius: '2px', background: '#ECE3D2', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '2px', width: town.render_pct + '%', background: town.status === 'live' ? '#13662C' : 'linear-gradient(90deg, #EEB849, #B98114)', transition: 'width 0.3s ease' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <span style={{ fontSize: '11px', color: '#6B5E4B' }}>
            {COORD_ICONS[town.coordinator_status]} {town.coordinator_status}
          </span>
          <span style={{
            fontSize: '11px', fontWeight: 700, color: persona.accent,
            padding: '2px 8px', borderRadius: '999px', background: persona.accent + '15',
          }}>
            {town.opportunity_potential}% potential
          </span>
        </div>

        {town.status === 'ghost' && (
          <div style={{
            position: 'absolute', bottom: '16px', right: '16px',
            fontSize: '10px', fontWeight: 600, color: '#B98114',
            padding: '4px 12px', borderRadius: '999px',
            background: 'rgba(238,184,73,0.1)', border: '1px solid rgba(238,184,73,0.2)',
          }}>
            Claim this town →
          </div>
        )}
      </div>
    </Link>
  );
}
