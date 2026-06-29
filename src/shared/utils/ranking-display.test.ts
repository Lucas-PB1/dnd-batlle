import { describe, expect, it } from 'vitest';
import { buildDisplayRanks } from '@/shared/utils/ranking-display';

describe('ranking-display', () => {
  it('assigns the same rank to perfectly tied entries', () => {
    const ranked = buildDisplayRanks([
      { name: 'A', points: 4, wins: 1, draws: 0, losses: 0, duels: 1 },
      { name: 'B', points: 4, wins: 1, draws: 0, losses: 0, duels: 1 },
      { name: 'C', points: 2, wins: 0, draws: 1, losses: 0, duels: 1 },
    ]);

    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(1);
    expect(ranked[1].tied).toBe(true);
    expect(ranked[2].rank).toBe(3);
  });
});
