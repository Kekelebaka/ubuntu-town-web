import { NextResponse } from 'next/server';

// Public release provenance for Gate 12. No secrets, no private repo data.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      repository: 'Kekelebaka/ubuntu-town-web',
      sha: process.env.NEXT_PUBLIC_GIT_SHA ?? 'unknown',
      branch: process.env.NEXT_PUBLIC_GIT_BRANCH ?? 'unknown',
      source: process.env.NEXT_PUBLIC_RELEASE_SOURCE ?? 'local',
      generated_at: new Date().toISOString(),
    },
    {
      headers: {
        'cache-control': 'no-store',
      },
    }
  );
}
