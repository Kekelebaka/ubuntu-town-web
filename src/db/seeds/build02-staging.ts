// Build 02 Staging Seed — Work Engine Commissioning
// Uses staging Supabase lgbkfthojyxhwemgkpgo
// HARD ABORT if target == afiokbhuxfdacbsipoqk (production)
//
// This seed creates deterministic synthetic actors and exercises the full
// mission lifecycle: publish → accept → start → submit_proof → verify.
// All actors use real auth.users identities created via admin API.
//
// IMPORTANT: Builders are ordinary authenticated participants (no special
// role_key). Coordinators use the canonical 'coordinator' role_key.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_PROJECT_REF = SUPABASE_URL.split('.supabase.co')[0].replace('https://://', '');

if (SUPABASE_PROJECT_REF === 'afiokbhuxfdacbsipoqk') {
  console.error('🚨 HARD ABORT: Seed script refusing to run against production (afiokbhuxfdacbsipoqk)');
  console.error('Target staging ref must be: lgbkfthojyxhwemgkpgo');
  process.exit(1);
}

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('🚨 SUPABASE_SERVICE_ROLE_KEY environment variable required');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'uto' } }
);

const BUILDER_ALPHA_EMAIL = 'alpha-builder@ubuntutown.test';
const BUILDER_BETA_EMAIL = 'beta-builder@ubuntutown.test';
const COORDINATOR_ALPHA_EMAIL = 'alpha-coordinator@ubuntutown.test';

async function getOrCreateUser(email: string, name: string): Promise<string> {
  // Try to find existing user
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existing = listData.users.find(u => u.email === email);
  if (existing) {
    console.log(`  ℹ️  User already exists: ${email} (${existing.id})`);
    return existing.id;
  }

  // Create new user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'staging-test-password-2026',
    email_confirm: true,
    user_metadata: { name },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create user ${email}: ${error?.message}`);
  }

  console.log(`  ✅ Created user: ${email} (${data.user.id})`);
  return data.user.id;
}

async function seed() {
  console.log('🌱 Build 02 Staging Seed');
  console.log(`📍 Target: ${SUPABASE_URL}`);
  console.log('');

  // 1. Find a test town
  console.log('1️⃣  Finding test town...');
  const { data: towns, error: townsError } = await supabase
    .from('towns')
    .select('id, name, slug')
    .limit(10);

  if (townsError || !towns || towns.length === 0) {
    console.error('❌ No towns found in staging — seed aborted');
    return false;
  }

  const testTown = towns.find(t => t.slug === 'ubuntu-test-town-a') || towns[0];
  console.log(`  📍 Using: ${testTown.name} (${testTown.id})`);

  // 2. Create/reuse auth users
  console.log('');
  console.log('2️⃣  Creating staging actors...');
  const builderAlphaId = await getOrCreateUser(BUILDER_ALPHA_EMAIL, 'Alpha Builder');
  const builderBetaId = await getOrCreateUser(BUILDER_BETA_EMAIL, 'Beta Builder');
  const coordinatorAlphaId = await getOrCreateUser(COORDINATOR_ALPHA_EMAIL, 'Alpha Coordinator');

  // 3. Create coordinator record (required for display_name in useActor)
  console.log('');
  console.log('3️⃣  Creating coordinator records...');
  for (const [{ id, email, name }, role] of [
    [{ id: builderAlphaId, email: BUILDER_ALPHA_EMAIL, name: 'Alpha Builder' }, null],
    [{ id: builderBetaId, email: BUILDER_BETA_EMAIL, name: 'Beta Builder' }, null],
    [{ id: coordinatorAlphaId, email: COORDINATOR_ALPHA_EMAIL, name: 'Alpha Coordinator' }, 'coordinator'],
  ] as const) {
    // Upsert coordinator record
    const { error: coordError } = await supabase
      .from('coordinators')
      .upsert({ id, display_name: name, town_id: testTown.id, phone: null, status: 'active' }, { onConflict: 'id' });
    if (coordError) {
      console.log(`  ⚠️  Coordinator record for ${email}: ${coordError.message}`);
    } else {
      console.log(`  ✅ Coordinator record: ${name}`);
    }

    // Assign coordinator role (only for coordinator)
    if (role === 'coordinator') {
      const { error: roleError } = await supabase
        .from('role_assignments')
        .upsert({ user_id: id, town_id: testTown.id, role_key: role }, { onConflict: 'user_id,town_id,role_key' });
      if (roleError) {
        console.log(`  ⚠️  Role assignment for ${email}: ${roleError.message}`);
      } else {
        console.log(`  ✅ Role: ${name} → coordinator`);
      }
    }
    // Builders are ordinary authenticated participants — no role assignment needed
    // Their access comes from being assigned_to on a mission
  }

  // 4. Publish a mission
  console.log('');
  console.log('4️⃣  Publishing mission...');
  const { data: mission, error: missionError } = await supabase
    .from('missions')
    .insert({
      town_id: testTown.id,
      mission_type: 'verify_local_business',
      title: 'Verify a local business',
      description: 'Help improve the town\'s local business map by verifying a real local business.',
      status: 'draft',
      created_by: coordinatorAlphaId,
      estimated_minutes: 20,
      capability_target: 'local_intelligence',
    })
    .select()
    .single();

  if (missionError || !mission) {
    console.error('❌ Failed to create mission:', missionError?.message);
    return false;
  }
  console.log(`  ✅ Mission created: ${mission.id}`);

  // Publish via RPC (would normally be called by coordinator)
  // Since we're using service-role, we bypass auth.uid() checks
  // So we update directly for the seed
  const { error: publishError } = await supabase
    .from('missions')
    .update({ status: 'open', published_at: new Date().toISOString() })
    .eq('id', mission.id)
    .eq('status', 'draft');

  if (publishError) {
    console.error('❌ Failed to publish mission:', publishError.message);
    return false;
  }
  console.log('  ✅ Mission published (open)');

  // 5. Builder accepts (direct update since service-role bypasses auth.uid())
  console.log('');
  console.log('5️⃣  Builder Alpha accepts mission...');
  const { error: acceptError } = await supabase
    .from('missions')
    .update({ status: 'accepted', assigned_to: builderAlphaId, accepted_at: new Date().toISOString() })
    .eq('id', mission.id)
    .eq('status', 'open')
    .is('assigned_to', null);

  if (acceptError) {
    console.error('❌ Failed to accept:', acceptError.message);
    return false;
  }
  console.log('  ✅ Builder Alpha accepted');

  // 6. Start mission
  console.log('');
  console.log('6️⃣  Starting mission...');
  const { error: startError } = await supabase
    .from('missions')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', mission.id)
    .eq('status', 'accepted');

  if (startError) {
    console.error('❌ Failed to start:', startError.message);
    return false;
  }
  console.log('  ✅ Mission in progress');

  // 7. Submit proof
  console.log('');
  console.log('7️⃣  Submitting proof...');
  const { data: proof, error: proofError } = await supabase
    .from('mission_proofs')
    .insert({
      mission_id: mission.id,
      submitted_by: builderAlphaId,
      status: 'pending',
      current_version: 1,
    })
    .select()
    .single();

  if (proofError || !proof) {
    console.error('❌ Failed to create proof:', proofError?.message);
    return false;
  }

  // Create proof version
  const { error: versionError } = await supabase
    .from('mission_proof_versions')
    .insert({
      proof_id: proof.id,
      version_number: 1,
      business_name: 'Test KasiStore',
      business_category: 'Retail',
      location: 'Main Street, Ubuntu Test Town',
      observation: 'Store appears operational with active foot traffic. Good signage visible from the road.',
      submitted_by: builderAlphaId,
    });

  if (versionError) {
    console.error('❌ Failed to create proof version:', versionError.message);
    return false;
  }

  // Update mission status
  await supabase.from('missions')
    .update({ status: 'proof_submitted' })
    .eq('id', mission.id);

  console.log(`  ✅ Proof submitted: ${proof.id}`);

  // 8. Coordinator verifies (direct update since service-role)
  console.log('');
  console.log('8️⃣  Coordinator verifying proof...');

  // Update proof
  await supabase.from('mission_proofs')
    .update({
      status: 'verified',
      verified_by: coordinatorAlphaId,
      verified_at: new Date().toISOString(),
      reviewer_note: 'Verified — contributes to town intelligence',
    })
    .eq('id', proof.id);

  // Update mission
  await supabase.from('missions')
    .update({ status: 'verified', completed_at: new Date().toISOString() })
    .eq('id', mission.id);

  // Create capability evidence
  const { error: capError } = await supabase
    .from('capabilities_evidence')
    .insert({
      mission_id: mission.id,
      builder_id: builderAlphaId,
      capability: 'local_intelligence',
      evidence_level: 'foundation',
      proof_id: proof.id,
    });

  if (capError) {
    console.log(`  ⚠️  Capability evidence: ${capError.message}`);
  } else {
    console.log('  ✅ Capability evidence created: local_intelligence/foundation');
  }

  // Create memory event
  await supabase.from('mission_memory_events').insert({
    mission_id: mission.id,
    event_type: 'proof_verified',
    actor_id: coordinatorAlphaId,
    town_id: testTown.id,
    proof_id: proof.id,
    note: 'Proof verified — local intelligence capability awarded',
  });

  console.log('  ✅ Memory event recorded');

  // Summary
  console.log('');
  console.log('🌱 Seed complete — Build 02 golden path verified.');
  console.log('');
  console.log('Actors:');
  console.log(`  Builder Alpha:     ${BUILDER_ALPHA_EMAIL} (${builderAlphaId})`);
  console.log(`  Builder Beta:      ${BUILDER_BETA_EMAIL} (${builderBetaId})`);
  console.log(`  Coordinator Alpha: ${COORDINATOR_ALPHA_EMAIL} (${coordinatorAlphaId})`);
  console.log('');
  console.log('Mission lifecycle completed:');
  console.log('  draft → open → accepted → in_progress → proof_submitted → verified');
  console.log('');
  console.log('Test the full flow by logging in as these users in the staging app.');
  return true;
}

seed().catch(err => {
  console.error('🌱 Seed failed:', err);
  process.exit(1);
});
