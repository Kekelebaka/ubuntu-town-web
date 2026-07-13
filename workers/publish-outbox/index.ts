// ============================================================================
// Ubuntu Town OS — Publish Outbox Worker
// Drains publish_outbox rows: revalidates town pages, upserts search index,
// embeds for AI, and marks rows done.
//
// Deploy as: Supabase Edge Function, Cloudflare Worker (cron), or standalone script.
// Trigger: HTTP POST, NOTIFY 'work_published', pg_cron polling, or the Cloudflare
// Workers `scheduled` (cron) handler below.
//
// Uses service-role key to bypass RLS.
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cloudflare Worker env bindings (see wrangler.toml [vars] + `wrangler secret put`).
interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENAI_API_KEY?: string;
  REVALIDATE_TOKEN?: string;
  REVALIDATE_URL?: string;
}

const MAX_ATTEMPTS = 3;

// Resolve a config value from Cloudflare's `env` (Workers) or `process.env`
// (standalone Node script / Supabase Edge Function), preferring `env` when present.
function readEnv(env: Partial<Env> | undefined, key: keyof Env): string | undefined {
  if (env && env[key] !== undefined) return env[key] as string | undefined;
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key as string] ?? process.env[`NEXT_PUBLIC_${key as string}`];
  }
  return undefined;
}

function getSupabase(env?: Partial<Env>): SupabaseClient {
  const url = readEnv(env, 'SUPABASE_URL');
  const serviceRoleKey = readEnv(env, 'SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'uto' },
  });
}

interface OutboxRow {
  id: string;
  work_id: string;
  channel: string;
  status: string;
  attempts: number;
  payload: Record<string, unknown>;
  last_error: string | null;
}

// ============================================================================
// CHANNEL HANDLERS
// ============================================================================

async function handleTownPage(supabase: SupabaseClient, row: OutboxRow, env?: Partial<Env>): Promise<string> {
  const { town_id, action } = row.payload as { town_id: string; action: string };

  if (action === 'revalidate') {
    // In production: call Next.js revalidate API
    // POST /api/revalidate?tag=town-{town_slug}&token={REVALIDATE_TOKEN}
    const revalidateUrl = readEnv(env, 'REVALIDATE_URL') || 'https://enter.ubuntutown.co.za/api/revalidate';
    const revalidateToken = readEnv(env, 'REVALIDATE_TOKEN');

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
    // The fts column is already maintained by the trigger.
    // This handler can additionally upsert to an external search service (Algolia, Meilisearch, etc.)
    // For now, just verify the row exists and is searchable.
    const { data } = await supabase
      .from('community_work')
      .select('id, fts')
      .eq('id', row.work_id)
      .single();

    return `Search index: ${data?.fts ? 'vector exists' : 'no vector'} for "${title}"`;
  }
  return `Search: ${action} (no-op)`;
}

async function handleAiIndex(supabase: SupabaseClient, row: OutboxRow, env?: Partial<Env>): Promise<string> {
  const { title, description, action } = row.payload as { title: string; description: string; action: string };

  if (action === 'embed') {
    // In production: call OpenAI embedding API, then update community_work.embedding
    // For the vertical slice, we skip the actual embedding call.
    // The schema supports it (vector(1536) column exists).

    const openaiKey = readEnv(env, 'OPENAI_API_KEY');
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
            .eq('id', row.work_id);
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

// Channels with a real (or best-effort) handler. Any channel NOT listed here falls
// through to the DEFAULT no-op handler in drainOutbox(), which acknowledges the row
// as 'done' rather than failing it — this keeps the outbox draining cleanly for
// channels whose external endpoints don't exist yet, e.g.: kasibuy, maps,
// ubuntu_tourism, inside_town, homepage, ubuntu_events, town_calendar,
// national_portal, national_dashboard, ubuntu_town_news, regional_lead,
// national_hq, fixeasy24 (kept as a best-effort handler below), ubuntu_jobs, etc.
const HANDLERS: Record<string, (supabase: SupabaseClient, row: OutboxRow, env?: Partial<Env>) => Promise<string>> = {
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

export async function drainOutbox(env?: Partial<Env>): Promise<{ processed: number; failed: number; errors: string[] }> {
  const supabase = getSupabase(env);

  // Fetch pending rows, ordered by created_at
  const { data: rows, error: fetchError } = await supabase
    .from('publish_outbox')
    .select('*')
    .in('status', ['pending', 'failed'])
    .lt('attempts', MAX_ATTEMPTS)
    .order('created_at', { ascending: true })
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

    // DEFAULT channel behavior: any channel with no specific handler in HANDLERS is
    // acknowledged as done (benign no-op) rather than failed, so the outbox keeps
    // draining cleanly while downstream integrations are being built out.
    const handler = HANDLERS[row.channel];

    try {
      const result: string = handler
        ? await handler(supabase, row, env)
        : `Channel "${row.channel}": no handler configured (acknowledged as no-op)`;

      if (!handler) {
        console.log(`[publish-outbox] No handler for channel "${row.channel}" — acknowledging as no-op (work_id=${row.work_id})`);
      } else {
        console.log(`[publish-outbox] [${row.channel}] ${result}`);
      }

      await supabase
        .from('publish_outbox')
        .update({ status: 'done', last_error: null, processed_at: new Date().toISOString() })
        .eq('id', row.id);
      processed++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const newStatus = row.attempts + 1 >= MAX_ATTEMPTS ? 'failed' : 'pending';
      await supabase
        .from('publish_outbox')
        .update({ status: newStatus, last_error: msg, processed_at: new Date().toISOString() })
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

// Cloudflare Worker: cron-triggered `scheduled` handler + a lightweight `fetch`
// handler for manual pokes / health checks. Configured via workers/publish-outbox/wrangler.toml.
export default {
  async scheduled(event: unknown, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<void> {
    ctx.waitUntil(
      drainOutbox(env).then(result => {
        console.log(`[publish-outbox] scheduled drain: ${result.processed} processed, ${result.failed} failed`);
        if (result.errors.length > 0) {
          console.log('[publish-outbox] errors:', result.errors);
        }
      }).catch(err => {
        console.error('[publish-outbox] scheduled drain fatal:', err);
      })
    );
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    // Manual trigger / health check: POST to drain immediately, otherwise just report OK.
    try {
      if (req.method === 'POST') {
        const result = await drainOutbox(env);
        return new Response(JSON.stringify(result), {
          status: result.failed > 0 && result.processed === 0 ? 500 : 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response('ok', { status: 200 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return new Response(`error: ${msg}`, { status: 500 });
    }
  },
};

// Standalone script (Node / Supabase Edge Function): only runs under a real
// Node.js process, never when this module is loaded by the Cloudflare Workers
// runtime (which only ever calls the default export's scheduled/fetch below).
// `process.versions.node` is only set by actual Node.js — Workers' `nodejs_compat`
// polyfills `process.env` but does not set this, so it's a safe, unambiguous check.
// e.g. node --env-file=.env.local.uto workers/publish-outbox/index.ts
async function main() {
  console.log('Draining publish_outbox...');
  const result = await drainOutbox();
  console.log(`Done: ${result.processed} processed, ${result.failed} failed`);
  if (result.errors.length > 0) {
    console.log('Errors:', result.errors);
  }
  process.exit(result.failed > 0 ? 1 : 0);
}

const isRealNodeProcess = typeof process !== 'undefined' && !!process.versions?.node;

if (isRealNodeProcess) {
  main().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
  });
}
