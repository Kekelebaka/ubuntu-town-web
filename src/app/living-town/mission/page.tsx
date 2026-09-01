import Shell from '@/components/living-town/Shell';
import { KopanoPrompt, EmptyState } from '@/components/living-town/primitives';
import { todayContext } from '@/lib/living-town/context';
export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string; town?: string }> }) {
  const params = await searchParams;
  const context = await todayContext(params.town);
  const mission = context.data.missions.state === 'ready' ? context.data.missions.data.find(m => m.id === params.id) : null;
  return <Shell fixture={context.fixture} townId={context.data.town?.id}><a className="lt-help" href={`/living-town${context.data.town ? `?town=${encodeURIComponent(context.data.town.id)}` : ''}`}>← Today</a>{mission ? <><div className="lt-intro"><p className="lt-eyebrow">{context.data.town?.name} · Mission</p><h1>{mission.title}</h1><p>{mission.description || 'Ask your town steward for the full brief.'}</p></div><div className="lt-card lt-stack"><p>Type: {(mission.work_type || 'Local mission').replaceAll('_', ' ')} · {mission.cadence}</p><p>Effort and capability requirements have not been set for this mission.</p><EmptyState>Acceptance is not available in this preview. Reading a mission does not assign it to you.</EmptyState><button disabled className="lt-button">Acceptance coming next</button><KopanoPrompt /></div></> : <EmptyState>This mission is not available in your current town view. Return to Today to choose a visible mission.</EmptyState>}</Shell>;
}
