import Shell from '@/components/living-town/Shell';
import { KopanoPrompt, EmptyState } from '@/components/living-town/primitives';
import { todayContext } from '@/lib/living-town/context';
export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string; town?: string }> }) {
  const params = await searchParams;
  const context = await todayContext(params.town);
  const work = context.data.work.state === 'ready' ? context.data.work.data.find(w => w.id === params.id) : null;
  return <Shell fixture={context.fixture} townId={context.data.town?.id}><a className="lt-help" href={`/living-town${context.data.town ? `?town=${encodeURIComponent(context.data.town.id)}` : ''}`}>← Today</a>{work ? <><p className="lt-eyebrow">Your work · {context.data.town?.name}</p><h1>{work.title}</h1><p className="lt-pill">{work.status.replaceAll('_', ' ')}</p><EmptyState>This is a read-only work summary. Work editing, return feedback and proof capture are not connected in this preview.</EmptyState><KopanoPrompt /></> : <EmptyState>This work is not available in your current town view. Return to Today.</EmptyState>}</Shell>;
}
