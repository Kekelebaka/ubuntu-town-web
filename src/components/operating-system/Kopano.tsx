import GuidanceCard from './GuidanceCard';
import type { KopanoAnswer, TownTwinState } from '@/lib/digital-twin';

export function KopanoAnswerCard({ answer }: { answer: KopanoAnswer }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--foreground)', marginBottom: 10 }}>Kopano says</div>
      {answer.sections.map(section => (
        <div key={section.type} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '.08em', color: section.type === 'FACT' ? '#065F46' : section.type === 'INFERENCE' ? '#B45309' : 'var(--color-ubuntu-purple)' }}>{section.type}</div>
          <ul style={{ margin: '4px 0 0 18px', padding: 0, fontSize: 12.5, color: 'var(--muted-foreground)', lineHeight: 1.55 }}>
            {section.items.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ))}
      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        Trace: {answer.traceIds.slice(0, 4).join(' · ')}{answer.traceIds.length > 4 ? ' · …' : ''}
      </div>
    </div>
  );
}

export function KopanoEntry({ context, prompt }: { context: string; prompt: string }) {
  return (
    <GuidanceCard
      tone="kopano"
      eyebrow="Ask Kopano"
      title={context}
      body={`Try: “${prompt}” Kopano answers with FACT, INFERENCE and RECOMMENDATION, and important answers must trace back to town objects.`}
      next="Open Today"
      href="/workspace/today"
    />
  );
}

export function TownFlightDeck({ twin }: { twin: TownTwinState }) {
  const topBlocker = twin.blockers[0];
  return (
    <section style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-ubuntu-orange)' }}>Town Flight Deck</div>
          <h2 style={{ fontSize: 18, margin: '3px 0 0', color: 'var(--foreground)' }}>{twin.town.name} now</h2>
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: twin.readinessScore > 60 ? '#065F46' : '#B45309' }}>{twin.readinessScore}<span style={{ fontSize: 12 }}>/100</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <Mini label="Strongest signal" value={twin.workVelocity.summary} />
        <Mini label="Biggest blocker" value={topBlocker?.explanation ?? 'No blocker from current data'} />
        <Mini label="Active people" value={twin.people.summary} />
        <Mini label="Recent proof" value={twin.proofQuality.summary} />
      </div>

      <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--foreground)', marginBottom: 6 }}>Top three legitimate actions</div>
      <ol style={{ margin: '0 0 0 18px', padding: 0, fontSize: 12.5, color: 'var(--muted-foreground)', lineHeight: 1.55 }}>
        {twin.topRecommendations.map(r => <li key={r.action}><strong>{r.action}</strong> {r.requiresApproval ? '(needs approval)' : ''}</li>)}
      </ol>
    </section>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--secondary)', borderRadius: 12, padding: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontSize: 12.5, color: 'var(--foreground)', lineHeight: 1.35, marginTop: 3 }}>{value}</div>
    </div>
  );
}
