import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TodayData, Resource, Work, Mission, Signal, Person } from './contracts';

function resource<T>(data: T | null, error: { code?: string } | null, fallback: T): Resource<T> {
  if (error) return { state: error.code === '42501' ? 'permission' : 'error', message: error.code === '42501' ? 'Your account cannot view this information.' : 'This information could not be loaded. Try again.' };
  return { state: 'ready', data: data ?? fallback };
}
export async function loadToday(client: SupabaseClient, userId: string, name: string, requestedTown?: string): Promise<TodayData> {
  const db = client.schema('uto');
  const { data: roles, error: roleError } = await db.from('role_assignments').select('town_id,role_key').eq('user_id', userId);
  if (roleError) throw new Error('Your town access could not be checked. Please try again.');
  const national = (roles ?? []).some(r => r.town_id === null && ['admin', 'ops'].includes(r.role_key));
  const townIds = Array.from(new Set((roles ?? []).map(r => r.town_id).filter(Boolean)));
  let townQuery = db.from('towns').select('id,name').order('name');
  if (!national) townQuery = townQuery.in('id', townIds);
  const { data: towns, error: townError } = townIds.length || national ? await townQuery : { data: [], error: null };
  if (townError) throw new Error('Your towns could not be loaded. Please try again.');
  const allowedTowns = towns ?? [];
  const town = requestedTown ? allowedTowns.find(t => t.id === requestedTown) ?? null : allowedTowns[0] ?? null;
  const { data: person } = await db.from('coordinators').select('display_name').eq('id', userId).maybeSingle();
  const unavailable = { state: 'unavailable' as const, message: requestedTown ? 'Choose a town your account can access.' : 'Your town connection is not set up yet. Ask your town steward for help.' };
  const base = { name: person?.display_name || name, town, towns: allowedTowns };
  if (!town) return { ...base, work: unavailable, missions: unavailable, signals: unavailable, people: unavailable, recordedWork: unavailable };
  // Every local query has an explicit town predicate AND the viewer's cookie/RLS context.
  const [work, missions, signals, people, count] = await Promise.all([
    db.from('community_work').select('id,title,status,type,initiative,created_at').eq('town_id', town.id).eq('created_by', userId).is('deleted_at', null).order('created_at', { ascending: false }).limit(20),
    db.from('missions').select('id,title,description,work_type,cadence').or(`town_id.eq.${town.id},town_id.is.null`).eq('active', true).order('title').limit(6),
    db.from('signals').select('id,title,category').eq('town_id', town.id).eq('status', 'new').order('created_at', { ascending: false }).limit(4),
    db.from('coordinators').select('id,display_name').eq('town_id', town.id).order('display_name').limit(6),
    db.from('community_work').select('id', { count: 'exact', head: true }).eq('town_id', town.id).is('deleted_at', null),
  ]);
  return { ...base,
    work: resource<Work[]>(work.data, work.error, []), missions: resource<Mission[]>(missions.data, missions.error, []),
    signals: resource<Signal[]>(signals.data, signals.error, []), people: resource<Person[]>(people.data, people.error, []),
    recordedWork: resource(count.count, count.error, 0),
  };
}
