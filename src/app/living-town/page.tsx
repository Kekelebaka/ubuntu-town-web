import Shell from '@/components/living-town/Shell';
import Today from '@/components/living-town/Today';
import { todayContext } from '@/lib/living-town/context';
export default async function Page({ searchParams }: { searchParams: Promise<{ town?: string; scenario?: string }> }) {
  const params = await searchParams;
  const context = await todayContext(params.town, params.scenario);
  return <Shell fixture={context.fixture} townId={context.data.town?.id}><Today data={context.data} /></Shell>;
}
