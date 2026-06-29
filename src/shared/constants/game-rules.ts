import { DEFAULT_ARENAS } from '@/shared/constants/arena-defaults';

export const CHARACTER_CLASSES = [
  'Bárbaro',
  'Bardo',
  'Bruxo',
  'Clérigo',
  'Druida',
  'Feiticeiro',
  'Ladino',
  'Guerreiro',
  'Mago',
  'Monge',
  'Paladino',
  'Patrulheiro',
  'Artífice',
  'Pugilista',
  'Irlliger',
  'Gunslinger',
  'Caçador de Monstros'
] as const;

export const BRACKET_BY_CLASS: Record<string, 'A' | 'B' | 'C'> = {
  Bárbaro: 'A',
  Ladino: 'A',
  Lutador: 'A',
  Monge: 'A',
  Pugilista: 'A',
  Patrulheiro: 'A',
  Irlliger: 'A',
  Gunslinger: 'A',
  'Caçador de Monstros': 'A',
  Paladino: 'B',
  Clérigo: 'B',
  Druida: 'B',
  Bardo: 'B',
  Artífice: 'B',
  Mago: 'C',
  Feiticeiro: 'C',
  Bruxo: 'C',
};

/** Legado estático — prefira arenas do banco via ArenaService */
export const ARENAS: Record<number, { name: string; effect: string }> = Object.fromEntries(
  DEFAULT_ARENAS.map((arena) => [
    arena.diceValue,
    { name: arena.name, effect: arena.effect },
  ]),
);

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
