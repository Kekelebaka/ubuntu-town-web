'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseClient } from '@/supabase-clients/server';

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

export async function acceptMission(formData: FormData) {
  const missionId = value(formData, 'mission_id');
  const townId = value(formData, 'town_id');
  if (!missionId || !townId) redirect('/living-town?notice=mission-unavailable');
  const client = await createSupabaseClient();
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) redirect('/login?next=/living-town');
  const db = (client as any).schema('uto');
  const { data, error } = await db.rpc('accept_mission', { _mission_id: missionId, _town_id: townId });
  if (error || !Array.isArray(data) || !data[0]?.work_id) redirect(`/living-town/mission?id=${encodeURIComponent(missionId)}&town=${encodeURIComponent(townId)}&error=accept`);
  revalidatePath('/living-town');
  redirect(`/living-town/work?id=${encodeURIComponent(data[0].work_id)}&town=${encodeURIComponent(townId)}&notice=accepted`);
}

export async function submitProof(formData: FormData) {
  const proofId = value(formData, 'proof_id');
  const workId = value(formData, 'work_id');
  const townId = value(formData, 'town_id');
  if (!proofId || !workId || !townId) redirect('/living-town?notice=proof-unavailable');
  const client = await createSupabaseClient();
  const db = (client as any).schema('uto');
  const { error } = await db.rpc('submit_proof', { _proof_id: proofId });
  if (error) redirect(`/living-town/work?id=${encodeURIComponent(workId)}&town=${encodeURIComponent(townId)}&error=submit`);
  revalidatePath('/living-town');
  revalidatePath('/living-town/work');
  redirect(`/living-town/work?id=${encodeURIComponent(workId)}&town=${encodeURIComponent(townId)}&notice=submitted`);
}

export async function reviewProof(formData: FormData) {
  const proofId = value(formData, 'proof_id');
  const workId = value(formData, 'work_id');
  const townId = value(formData, 'town_id');
  const decision = value(formData, 'decision');
  const note = value(formData, 'note') || null;
  if (!proofId || !workId || !townId || !['approved','returned','rejected'].includes(decision)) redirect('/living-town?notice=review-unavailable');
  const client = await createSupabaseClient();
  const db = (client as any).schema('uto');
  const { error } = await db.rpc('review_proof', { _proof_id: proofId, _decision: decision, _note: note });
  if (error) redirect(`/living-town/work?id=${encodeURIComponent(workId)}&town=${encodeURIComponent(townId)}&error=review`);
  revalidatePath('/living-town');
  revalidatePath('/living-town/work');
  redirect(`/living-town/work?id=${encodeURIComponent(workId)}&town=${encodeURIComponent(townId)}&notice=reviewed`);
}
