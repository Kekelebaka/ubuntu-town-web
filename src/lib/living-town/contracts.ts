export type Resource<T> = { state: 'ready'; data: T } | { state: 'error' | 'permission' | 'unavailable'; message: string };
export interface Work { id: string; title: string; status: string; type: string; initiative: string | null; created_at: string; }
export interface Mission { id: string; title: string; description: string | null; work_type: string | null; cadence: string; }
export interface Signal { id: string; title: string; category: string | null; }
export interface Person { id: string; display_name: string | null; }
export interface TodayData {
  name: string; town: { id: string; name: string } | null;
  towns: { id: string; name: string }[];
  work: Resource<Work[]>; missions: Resource<Mission[]>; signals: Resource<Signal[]>;
  people: Resource<Person[]>; recordedWork: Resource<number>;
}
export function nextMove(data: TodayData): { title: string; reason: string; href: string; kind: string } | null {
  // Do not recommend new work when unfinished work could not be loaded.
  if (data.work.state !== 'ready') return null;
  const work = data.work.data.find(w => ['rejected', 'draft'].includes(w.status));
  if (work) return { title: work.title, reason: work.status === 'rejected' ? 'Your work was returned. View its summary; feedback is not connected in this preview.' : 'You have unfinished work. Review what is still needed.', href: `/living-town/work?id=${encodeURIComponent(work.id)}${data.town ? `&town=${encodeURIComponent(data.town.id)}` : ''}`, kind: work.initiative || work.type };
  if (data.missions.state !== 'ready') return null;
  const mission = data.missions.data[0];
  return mission ? { title: mission.title, reason: 'A mission to explore for your town. Read the requirements first.', href: `/living-town/mission?id=${encodeURIComponent(mission.id)}${data.town ? `&town=${encodeURIComponent(data.town.id)}` : ''}`, kind: mission.work_type || 'Local mission' } : null;
}
export function canUseStaging(env: { enabled?: string; mode?: string; url?: string; key?: string }): boolean {
  if (env.enabled !== 'true') return false;
  if (env.mode === 'fixture') return true;
  if (env.mode !== 'staging' || !env.key || !env.url) return false;
  try { const u = new URL(env.url); return u.protocol === 'https:' && u.hostname.endsWith('.supabase.co') && u.hostname !== 'afiokbhuxfdacbsipoqk.supabase.co'; } catch { return false; }
}
