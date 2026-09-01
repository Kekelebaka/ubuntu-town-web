import type { TodayData } from './contracts';
// Synthetic QA only. Never mixed with authenticated data or returned in staging mode.
export function fixture(scenario?: string): TodayData {
  const data: TodayData = {
    name: 'Demo Builder', town: { id: 'example-town', name: 'Example Town' }, towns: [],
    work: { state: 'ready', data: [] },
    missions: { state: 'ready', data: [{ id: 'example-mission', title: 'Tell the story of a local place', description: 'Speak with the person responsible for a local place. Ask permission before taking photographs. Record what the place offers and what it needs next.', work_type: 'media', cadence: 'weekly' }] },
    signals: { state: 'ready', data: [{ id: 'example-signal', title: 'A community space has a story to share', category: 'Local places' }] },
    people: { state: 'ready', data: [] }, recordedWork: { state: 'ready', data: 0 },
  };
  if (scenario === 'empty') { data.missions = { state: 'ready', data: [] }; data.signals = { state: 'ready', data: [] }; }
  if (scenario === 'error') { data.work = { state: 'error', message: 'Your work could not be loaded. Try again.' }; data.signals = { state: 'error', message: 'Town signals could not be loaded. Try again.' }; }
  if (scenario === 'permission') { data.town = null; data.work = { state: 'permission', message: 'Choose a town your account can access.' }; data.missions = { state: 'permission', message: 'Your town connection needs attention.' }; }
  return data;
}
