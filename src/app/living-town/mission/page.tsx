import Shell from '@/components/living-town/Shell';
import { KopanoPrompt, EmptyState } from '@/components/living-town/primitives';
import { todayContext } from '@/lib/living-town/context';
import { acceptMission } from '@/lib/living-town/actions';
export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string; town?: string; error?: string }> }) {
  const params = await searchParams;
  const context = await todayContext(params.town);
  const mission = context.data.missions.state === 'ready' ? context.data.missions.data.find(m => m.id === params.id) : null;
  const executable = Boolean(mission?.work_type && context.data.town);
  return <Shell fixture={context.fixture} townId={context.data.town?.id}><a className="lt-help" href={`/living-town${context.data.town ? `?town=${encodeURIComponent(context.data.town.id)}` : ''}`}>← Today</a>{mission ? <><div className="lt-intro"><p className="lt-eyebrow">{context.data.town?.name} · Mission</p><h1>{mission.title.replace(/^[^A-Za-z0-9]+/, '')}</h1><p>{mission.description || 'Ask your town steward for the full brief.'}</p></div><div className="lt-card lt-stack"><p><strong>{(mission.work_type || 'Planning mission').replaceAll('_', ' ')}</strong> · {mission.cadence}</p><p>Accepting creates one durable work record for you in this town. Repeating this action returns the same work; it never creates duplicates.</p>{params.error && <div className="lt-state" data-tone="error" role="alert">This mission could not be accepted. It may not yet have an executable work type.</div>}{executable ? <form action={acceptMission}><input type="hidden" name="mission_id" value={mission.id}/><input type="hidden" name="town_id" value={context.data.town!.id}/><button className="lt-button" type="submit">Accept mission</button></form> : <EmptyState>This mission describes a target, but it does not yet create a valid work type. Choose a concrete work mission from Today.</EmptyState>}</div><KopanoPrompt /></> : <EmptyState>This mission is not available in your current town view. Return to Today to choose a visible mission.</EmptyState>}</Shell>;
}
