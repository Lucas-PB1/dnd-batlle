import { describe, expect, it } from 'vitest';
import { calculateDuelPoints } from '@/domain/services/scoring-service';

describe('calculateDuelPoints', () => {
  it('awards +3 for win in same bracket', () => {
    const result = calculateDuelPoints({
      bracketA: 'A',
      bracketB: 'A',
      outcome: 'player_a',
      forPlayer: 'A',
    });
    expect(result.points).toBe(3);
  });

  it('awards +4 for underdog cross-bracket win', () => {
    const result = calculateDuelPoints({
      bracketA: 'A',
      bracketB: 'B',
      outcome: 'player_a',
      forPlayer: 'A',
    });
    expect(result.points).toBe(4);
  });

  it('awards +2 for favored cross-bracket win', () => {
    const result = calculateDuelPoints({
      bracketA: 'B',
      bracketB: 'A',
      outcome: 'player_a',
      forPlayer: 'A',
    });
    expect(result.points).toBe(2);
  });

  it('awards +1 on draw for both players', () => {
    const result = calculateDuelPoints({
      bracketA: 'C',
      bracketB: 'A',
      outcome: 'draw',
      forPlayer: 'B',
    });
    expect(result.points).toBe(1);
  });

  it('awards 0 on loss', () => {
    const result = calculateDuelPoints({
      bracketA: 'B',
      bracketB: 'C',
      outcome: 'player_b',
      forPlayer: 'A',
    });
    expect(result.points).toBe(0);
  });
});
