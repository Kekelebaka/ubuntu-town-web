'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Wrench, Home, ShoppingBag, Calendar, Mic, ExternalLink } from 'lucide-react';

interface CommunityWorkItem {
  id: string;
  type: string;
  title: string;
  summary: string | null;
  description: string | null;
  visibility: string;
  published_at: string | null;
  detail: Record<string, unknown> | null;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  fixeasy_worker: <Wrench size={16} />,
  familyhouse: <Home size={16} />,
  business: <ShoppingBag size={16} />,
  event: <Calendar size={16} />,
  podcast: <Mic size={16} />,
};

const TYPE_LABELS: Record<string, string> = {
  fixeasy_worker: 'Service Provider',
  familyhouse: 'Hospitality Host',
  business: 'Local Business',
  event: 'Community Event',
  podcast: 'Podcast Episode',
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  fixeasy_worker: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
  familyhouse: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
  business: { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
  event: { bg: '#EDE9FE', text: '#5B21B6', border: '#8B5CF6' },
  podcast: { bg: '#FCE7F3', text: '#9D174D', border: '#EC4899' },
};

export default function CommunityWorkSection({ townId, townSlug }: { townId: string; townSlug: string }) {
  const [items, setItems] = useState<CommunityWorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWork() {
      const { data, error } = await supabase
        .from('community_work')
        .select('id, type, title, summary, description, visibility, published_at')
        .eq('town_id', townId)
        .eq('status', 'published')
        .in('visibility', ['public', 'national'])
        .order('published_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setItems(data);
      }
      setLoading(false);
    }
    fetchWork();
  }, [townId]);

  if (loading) {
    return (
      <section style={{ padding: '32px 0' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: 120, background: '#F3EDE0', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  // Group by type
  const grouped = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, CommunityWorkItem[]>);

  return (
    <section style={{ padding: '32px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#B8860B', marginBottom: 4, fontWeight: 600 }}>Community Work</p>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>What&apos;s been built in {townSlug}</h2>
        </div>
        <span style={{ fontSize: 12, color: '#999', background: '#F3EDE0', padding: '4px 12px', borderRadius: 20 }}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {Object.entries(grouped).map(([type, typeItems]) => (
        <div key={type} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ color: TYPE_COLORS[type]?.text || '#666' }}>{TYPE_ICONS[type]}</span>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>{TYPE_LABELS[type] || type}</h3>
            <span style={{ fontSize: 11, color: '#999' }}>({typeItems.length})</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {typeItems.map(item => {
              const colors = TYPE_COLORS[item.type] || { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB' };
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'white',
                    border: `1px solid ${colors.border}20`,
                    borderRadius: 12,
                    padding: 16,
                    transition: 'border-color 0.15s',
                    cursor: 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
                      color: colors.text, background: colors.bg, padding: '2px 8px', borderRadius: 20,
                    }}>
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                    {item.visibility === 'national' && (
                      <span style={{ fontSize: 10, color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: 20 }}>🇿🇦 National</span>
                    )}
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E', margin: '0 0 4px' }}>{item.title}</h4>
                  {item.summary && (
                    <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.4 }}>{item.summary}</p>
                  )}
                  {item.published_at && (
                    <p style={{ fontSize: 11, color: '#999', margin: '8px 0 0' }}>
                      Published {new Date(item.published_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* CTA */}
      <div style={{ background: '#FBF4E6', borderRadius: 12, padding: 20, textAlign: 'center', border: '1px dashed #E8DCC8' }}>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 12px' }}>Want to add your community work to this page?</p>
        <a
          href={`https://wa.me/27761966009?text=Hi!%20I%20want%20to%20add%20community%20work%20in%20${encodeURIComponent(townSlug)}`}
          style={{ color: '#B8860B', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          WhatsApp us to get started <ExternalLink size={14} />
        </a>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </section>
  );
}
