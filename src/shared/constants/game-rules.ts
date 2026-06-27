export const CHARACTER_CLASSES = [
  'Bárbaro',
  'Bardo',
  'Bruxo',
  'Clérigo',
  'Druida',
  'Feiticeiro',
  'Ladino',
  'Lutador',
  'Mago',
  'Monge',
  'Paladino',
  'Patrulheiro',
  'Artífice',
] as const;

export const BRACKET_BY_CLASS: Record<string, 'A' | 'B' | 'C'> = {
  Bárbaro: 'A',
  Ladino: 'A',
  Lutador: 'A',
  Monge: 'A',
  Patrulheiro: 'A',
  Paladino: 'B',
  Clérigo: 'B',
  Druida: 'B',
  Bardo: 'B',
  Artífice: 'B',
  Mago: 'C',
  Feiticeiro: 'C',
  Bruxo: 'C',
};

export const ARENAS: Record<number, { name: string; effect: string }> = {
  1: { name: 'Areia', effect: 'Terreno difícil. Disparada → Acrobacia CD 12 ou Caído' },
  2: { name: 'Pilares', effect: 'Reação: pilar adjacente → +2 CA' },
  3: {
    name: 'Gelo',
    effect: 'Vantagem gerada em corpo a corpo → Acrobacia CD 13 ou Caído',
  },
  4: { name: 'Pântano', effect: 'Ataque à distância >3 m → Desvantagem' },
  5: { name: 'Desníveis', effect: 'Elevado → Vantagem em Força para empurrar/derrubar' },
  6: { name: 'Vazio', effect: 'Sem modificador ambiental' },
};

export const FAVORED_BRACKET: Record<string, 'A' | 'B' | 'C'> = {
  'A-B': 'B',
  'B-A': 'B',
  'B-C': 'C',
  'C-B': 'C',
  'A-C': 'C',
  'C-A': 'C',
};

export const SESSION_COOKIE = 'arena_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
