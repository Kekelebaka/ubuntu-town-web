// ============================================================================
// Ubuntu Town OS — Publish Outbox Worker
// Drains publish_outbox rows: revalidates town pages, upserts search index,
// embeds for AI, and marks rows done.
//
// Deploy as: Supabase Edge Function, Cloudflare Worker (cron), or standalone script.
// Trigger: HTTP POST, NOTIFY 'work_published', or pg_cron polling.
//
// Uses service-role key to bypass RLS.
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Optional: Cloudflare Worker env
interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  REVALIDATE_TOKEN?: string;
  REVALIDATE_URL?: string;
}

function getSupabase(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface OutboxRow {
  id: string;
  community_work_id: string;
  channel: string;
  status: string;
  attempts: number;
  max_attempts: number;
  payload: Record<string, unknown>;
  error: string | null;
}

// ============================================================================
// CHANNEL HANDLERS
// ============================================================================

async function handleTownPage(supabase: SupabaseClient, row: OutboxRow): Promise<string> {
  const { town_id, action } = row.payload as { town_id: string; action: string };

  if (action === 'revalidate') {
    // In production: call Next.js revalidate API
    // POST /api/revalidate?tag=town-{town_slug}&token={REVALIDATE_TOKEN}
    const revalidateUrl = process.env.REVALIDATE_URL || 'https://enter.ubuntutown.co.za/api/revalidate';
    const revalidateToken = process.env.REVALIDATE_TOKEN;

    if (revalidateToken) {
      const { data: town } = await supabase
        .from('towns')
        .select('slug')
        .eq('id', town_id)
        .single();

      if (town) {
        await fetch(`${revalidateUrl}?tag=town-${town.slug}&token=${revalidateToken}`, {
          method: 'POST',
        });
        return `Revalidated town page for ${town.slug}`;
      }
    }
    return `Revalidate requested for town ${town_id} (no token configured)`;
  }
  return `Town page: ${action} (no-op)`;
}

async function handleSearch(supabase: SupabaseClient, row: OutboxRow): Promise<string> {
  const { title, description, action } = row.payload as { title: string; description: string; action: string };

  if (action === 'upsert') {
    // The search_vector is already maintained by the trigger.
    // This handler can additionally upsert to an external search service (Algolia, Meilisearch, etc.)
    // For now, just verify the row exists and is searchable.
    const { data } = await supabase
      .from('community_work')
      .select('id, search_vector')
      .eq('id', row.community_work_id)
      .single();

    return `Search index: ${data?.search_vector ? 'vector exists' : 'no vector'} for "${title}"`;
  }
  return `Search: ${action} (no-op)`;
}

async function handleAiIndex(supabase: SupabaseClient, row: OutboxRow): Promise<string> {
  const { title, description, action } = row.payload as { title: string; description: string; action: string };

  if (action === 'embed') {
    // In production: call OpenAI embedding API, then update community_work.embedding
    // For the vertical slice, we skip the actual embedding call.
    // The schema supports it (vector(1536) column exists).

    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && description) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: `${title}\n${description}`,
          }),
        });
        const result = await response.json() as { data?: { embedding: number[] }[] };
        if (result.data?.[0]?.embedding) {
          await supabase
            .from('community_work')
            .update({ embedding: JSON.stringify(result.data[0].embedding) })
            .eq('id', row.community_work_id);
          return `Embedded: ${title} (${result.data[0].embedding.length} dims)`;
        }
      } catch (err) {
        return `Embedding failed: ${err instanceof Error ? err.message : 'unknown'}`;
      }
    }
    return `AI index: ${action} (no OpenAI key, skipped embedding)`;
  }
  return `AI index: ${action} (no-op)`;
}

async function handleFixeasy24(supabase: SupabaseClient, row: OutboxRow): Promise<string> {
  const { title, action } = row.payload as { title: string; action: string };

  if (action === 'upsert_worker') {
    // In production: rebuild the FixEasy24 node site or update its data source
    // For the vertical slice: log and mark done
    return `FixEasy24: upserted worker "${title}"`;
  }
  return `FixEasy24: ${action} (no-op)`;
}

async function handleUbuntuJobs(supabase: SupabaseClient, row: OutboxRow): Promise<string> {
  const { title, action } = row.payload as { title: string; action: string };
  return `Ubuntu Jobs: ${action} "${title}"`;
}

async function handleCoordinatorDashboard(supabase: SupabaseClient, row: OutboxRow): Promise<string> {
  const { title, action } = row.payload as { title: string; action: string };
  return `Coordinator dashboard: ${action} "${title}"`;
}

const HANDLERS: Record<string, (supabase: SupabaseClient, row: OutboxRow) => Promise<string>> = {
  town_page: handleTownPage,
  search: handleSearch,
  ai_index: handleAiIndex,
  fixeasy24: handleFixeasy24,
  ubuntu_jobs: handleUbuntuJobs,
  coordinator_dashboard: handleCoordinatorDashboard,
};

// ============================================================================
// MAIN: Drain pending outbox rows
// ============================================================================

export async function drainOutbox(supabase: SupabaseClient): Promise<{ processed: number; failed: number; errors: string[] }> {
  // Fetch pending rows, ordered by scheduled_at
  const { data: rows, error: fetchError } = await supabase
    .from('publish_outbox')
    .select('*')
    .in('status', ['pending', 'failed'])
    .lt('attempts', 3)  // max_attempts
    .order('scheduled_at', { ascending: true })
    .limit(50);

  if (fetchError) {
    return { processed: 0, failed: 0, errors: [`Fetch error: ${fetchError.message}`] };
  }

  if (!rows || rows.length === 0) {
    return { processed: 0, failed: 0, errors: [] };
  }

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows as OutboxRow[]) {
    // Mark as processing
    await supabase
      .from('publish_outbox')
      .update({ status: 'processing', attempts: row.attempts + 1 })
      .eq('id', row.id);

    const handler = HANDLERS[row.channel];
    if (!handler) {
      const msg = `No handler for channel: ${row.channel}`;
      await supabase
        .from('publish_outbox')
        .update({ status: 'failed', error: msg, processed_at: new Date().toISOString() })
        .eq('id', row.id);
      failed++;
      errors.push(msg);
      continue;
    }

    try {
      const result = await handler(supabase, row);
      await supabase
        .from('publish_outbox')
        .update({ status: 'done', error: null, processed_at: new Date().toISOString() })
        .eq('id', row.id);
      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const newStatus = row.attempts + 1 >= row.max_attempts ? 'failed' : 'pending';
      await supabase
        .from('publish_outbox')
        .update({ status: newStatus, error: msg, processed_at: new Date().toISOString() })
        .eq('id', row.id);
      failed++;
      errors.push(`[${row.channel}] ${msg}`);
    }
  }

  return { processed, failed, errors };
}

// ============================================================================
// ENTRY POINTS
// ============================================================================

// Standalone script: node --env-file=.env.local.uto workers/publish-outbox/index.ts
async function main() {
  const supabase = getSupabase();
  console.log('Draining publish_outbox...');
  const result = await drainOutbox(supabase);
  console.log(`Done: ${result.processed} processed, ${result.failed} failed`);
  if (result.errors.length > 0) {
    console.log('Errors:', result.errors);
  }
  process.exit(result.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
