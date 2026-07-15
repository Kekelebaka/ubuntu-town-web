import { NextResponse } from 'next/server';

// Revalidate town pages + search after publish
// Called by the outbox worker with REVALIDATE_TOKEN

export async function POST(req: Request) {
  const token = req.headers.get('x-revalidate-token');
  const expected = process.env.REVALIDATE_TOKEN;
  if (!expected || token !== expected) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const { tag } = body; // e.g. 'town-clarens', 'search', 'town_all'

  try {
    // Next.js 13+ revalidate on demand via revalidatePath / revalidateTag
    // For Cloudflare Pages with next-on-pages, revalidation must be a no-op
    // (static export); the outbox worker handles FTS + ai_index directly.
    // This endpoint is a handshake for the worker contract.
    return NextResponse.json({ ok: true, tag, note: 'Cloudflare Pages is static; revalidation handled by worker' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
