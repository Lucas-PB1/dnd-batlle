import type { Bracket, DuelOutcome } from '@/domain/entities';

export interface ScoreInput {
  bracketA: Bracket;
  bracketB: Bracket;
  outcome: DuelOutcome;
  forPlayer: 'A' | 'B';
}

export interface ScoreResult {
  points: number;
}

function bracketKey(a: Bracket, b: Bracket): string {
  return `${a}-${b}`;
}

function isSameBracket(a: Bracket, b: Bracket): boolean {
  return a === b;
}

function isFavored(bracket: Bracket, opponent: Bracket): boolean {
  const key = bracketKey(bracket, opponent);
  const favoredMap: Record<string, Bracket> = {
    'A-B': 'B',
    'B-A': 'B',
    'B-C': 'C',
    'C-B': 'C',
    'A-C': 'C',
    'C-A': 'C',
  };
  return favoredMap[key] === bracket;
}

export function calculateDuelPoints(input: ScoreInput): ScoreResult {
  const { bracketA, bracketB, outcome, forPlayer } = input;

  if (outcome === 'draw') {
    return { points: 1 };
  }

  const playerBracket = forPlayer === 'A' ? bracketA : bracketB;
  const opponentBracket = forPlayer === 'A' ? bracketB : bracketA;
  const playerWon =
    (outcome === 'player_a' && forPlayer === 'A') ||
    (outcome === 'player_b' && forPlayer === 'B');

  if (!playerWon) {
    return { points: 0 };
  }

  if (isSameBracket(playerBracket, opponentBracket)) {
    return { points: 3 };
  }

  if (isFavored(playerBracket, opponentBracket)) {
    return { points: 2 };
  }

  return { points: 4 };
}
