import 'server-only';
import { createSupabaseClient } from '@/supabase-clients/server';
import { redirect } from 'next/navigation';

export async function workContext(workId?: string) {
  const client = await createSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect('/login?next=/living-town');
  if (!workId) return { user, work:null, proof:null, reviews:[], canReview:false, isOwner:false, capability:null };
  const db = (client as any).schema('uto');
  const { data: work } = await db.from('community_work').select('id,title,description,status,type,initiative,town_id,created_by,created_at,updated_at').eq('id',workId).maybeSingle();
  if (!work) return { user, work:null, proof:null, reviews:[], canReview:false, isOwner:false, capability:null };
  const [{data:proofs},{data:assignments},{data:roles},{data:capability}] = await Promise.all([
    db.from('proofs').select('id,status,notes,created_at,reviewed_at,reviewed_by,media_asset_id').eq('community_work_id',workId).order('created_at',{ascending:false}).limit(1),
    db.from('work_assignments').select('assignee_id,status').eq('work_id',workId),
    db.from('role_assignments').select('role_key,town_id').eq('user_id',user.id),
    db.rpc('my_living_town_capability'),
  ]);
  const proof = proofs?.[0] ?? null;
  const { data: reviews } = proof ? await db.from('proof_reviews').select('id,decision,note,created_at,reviewer_id').eq('proof_id',proof.id).order('created_at',{ascending:false}) : {data:[]};
  const assigned = (assignments??[]).some((a:any)=>a.assignee_id===user.id);
  const authorised = (roles??[]).some((r:any)=>(r.town_id===null&&['admin','ops'].includes(r.role_key))||(r.town_id===work.town_id&&['admin','ops','deputy'].includes(r.role_key)));
  return { user,work,proof,reviews:reviews??[],isOwner:work.created_by===user.id||assigned,canReview:Boolean(proof&&proof.status==='pending'&&authorised&&work.created_by!==user.id&&!assigned),capability:Array.isArray(capability)?capability[0]:null };
}
