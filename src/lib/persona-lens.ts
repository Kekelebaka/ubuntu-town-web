import { PersonaLens, PersonaConfig } from './ubuntu-town-types';

export const PERSONAS: Record<PersonaLens, PersonaConfig> = {
  investor:    { label: 'Investor',    emoji: '📈', accent: '#B98114', spotlight: 'opps',    province_sort: 'potential' },
  visitor:     { label: 'Visitor',     emoji: '🧭', accent: '#7A3F8A', spotlight: 'tourism', province_sort: 'heritage' },
  resident:    { label: 'Resident',    emoji: '🏠', accent: '#13662C', spotlight: 'services',province_sort: 'state' },
  funder:      { label: 'Funder',      emoji: '🤝', accent: '#2C7E8C', spotlight: 'opps',    province_sort: 'potential' },
  coordinator: { label: 'Coordinator', emoji: '🛠️', accent: '#B5641E', spotlight: 'loop',    province_sort: 'claim' },
};

export const PERSONA_LIST: PersonaLens[] = ['investor', 'visitor', 'resident', 'funder', 'coordinator'];

export function getPersonaFromParams(searchParams: URLSearchParams): PersonaLens {
  const lens = searchParams.get('lens');
  if (lens && lens in PERSONAS) return lens as PersonaLens;
  return 'investor';
}
