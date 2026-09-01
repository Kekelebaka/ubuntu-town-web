import { describe, it, expect } from 'vitest';
import { canUseStaging, nextMove } from '../lib/living-town/contracts';
import { fixture } from '../lib/living-town/fixture';
describe('Living Town environment boundary', () => {
  it('is closed by default, even with a configured database', () => {
    expect(canUseStaging({ mode: 'staging', url: 'https://example.supabase.co', key: 'publishable' })).toBe(false);
  });
  it('refuses production and misleading lookalike origins', () => {
    for (const url of ['https://afiokbhuxfdacbsipoqk.supabase.co', 'https://afiokbhuxfdacbsipoqk.supabase.co/', 'https://example.supabase.co.evil.test', 'http://example.supabase.co', 'bad-url']) expect(canUseStaging({ enabled: 'true', mode: 'staging', key: 'publishable', url })).toBe(false);
  });
  it('requires an explicit mode and staging key', () => {
    expect(canUseStaging({ enabled: 'true', mode: 'staging', url: 'https://example.supabase.co' })).toBe(false);
    expect(canUseStaging({ enabled: 'true', mode: 'unknown' })).toBe(false);
    expect(canUseStaging({ enabled: 'true', mode: 'fixture' })).toBe(true);
    expect(canUseStaging({ enabled: 'true', mode: 'staging', url: 'https://example.supabase.co', key: 'publishable' })).toBe(true);
  });
});
describe('Truthful next action', () => {
  it('does not recommend new work when personal work failed to load', () => expect(nextMove(fixture('error'))).toBeNull());
  it('does not fabricate a mission for empty or unassigned people', () => {
    expect(nextMove(fixture('empty'))).toBeNull();
    expect(nextMove(fixture('permission'))).toBeNull();
  });
  it('prioritises unfinished work and retains town context', () => {
    const data = fixture();
    data.work = { state: 'ready', data: [{ id: 'work-1', title: 'Finish local story', type: 'media', initiative: 'InsideTown', status: 'draft', created_at: '2026-09-01' }] };
    expect(nextMove(data)?.title).toBe('Finish local story');
    expect(nextMove(data)?.href).toContain('town=example-town');
  });
  it('handles a global mission without a work type', () => {
    const data = fixture();
    if (data.missions.state === 'ready') data.missions.data[0].work_type = null;
    expect(nextMove(data)?.kind).toBe('Local mission');
  });
  it('never presents published work as unfinished or proof verified', () => {
    const data = fixture();
    data.work = { state: 'ready', data: [{ id: 'work-1', title: 'Published story', type: 'media', initiative: null, status: 'published', created_at: '2026-09-01' }] };
    expect(nextMove(data)?.title).toBe('Tell the story of a local place');
  });
});
