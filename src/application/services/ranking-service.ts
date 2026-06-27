import type { IDuelRepository } from '@/domain/repositories';
import type {
  ClassStats,
  CompletedDuelSummary,
  PublicStats,
  RankingEntry,
} from '@/domain/entities';

function playerKey(name: string, characterClass: string): string {
  return `${name.toLowerCase()}::${characterClass}`;
}

export class RankingService {
  constructor(private readonly duelRepository: IDuelRepository) {}

  async getPublicStats(): Promise<PublicStats> {
    const duels = await this.duelRepository.findAll();
    const completed = duels.filter((duel) => duel.status === 'completed' && duel.result);

    const rankingMap = new Map<string, RankingEntry>();
    const classMap = new Map<string, ClassStats>();

    for (const duel of completed) {
      if (!duel.playerA || !duel.playerB || !duel.result) continue;

      this.applyPlayerResult(
        rankingMap,
        classMap,
        duel.playerA.name,
        duel.playerA.characterClass,
        duel.playerA.bracket,
        duel.result.pointsA,
        duel.result.outcome,
        'A',
      );
      this.applyPlayerResult(
        rankingMap,
        classMap,
        duel.playerB.name,
        duel.playerB.characterClass,
        duel.playerB.bracket,
        duel.result.pointsB,
        duel.result.outcome,
        'B',
      );
    }

    const ranking = [...rankingMap.values()].sort(
      (a, b) => b.points - a.points || b.wins - a.wins,
    );

    const classStats = [...classMap.values()]
      .map((stat) => ({
        ...stat,
        winRate: stat.total > 0 ? Math.round((stat.wins / stat.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const recentDuels: CompletedDuelSummary[] = completed
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
      .slice(0, 20)
      .map((duel) => ({
        id: duel.id,
        playerAName: duel.playerA!.name,
        playerBName: duel.playerB!.name,
        playerAClass: duel.playerA!.characterClass,
        playerBClass: duel.playerB!.characterClass,
        outcome: duel.result!.outcome,
        arena: duel.arena,
        rounds: duel.result!.rounds,
        completedAt: duel.completedAt!,
        isClassified: duel.isClassified,
      }));

    return {
      ranking,
      classStats,
      totalDuels: completed.length,
      recentDuels,
    };
  }

  private applyPlayerResult(
    rankingMap: Map<string, RankingEntry>,
    classMap: Map<string, ClassStats>,
    name: string,
    characterClass: string,
    bracket: RankingEntry['bracket'],
    points: number,
    outcome: 'player_a' | 'player_b' | 'draw',
    slot: 'A' | 'B',
  ): void {
    const key = playerKey(name, characterClass);
    const current = rankingMap.get(key) ?? {
      name,
      characterClass,
      bracket,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      duels: 0,
    };

    current.points += points;
    current.duels += 1;

    if (outcome === 'draw') {
      current.draws += 1;
    } else if (
      (outcome === 'player_a' && slot === 'A') ||
      (outcome === 'player_b' && slot === 'B')
    ) {
      current.wins += 1;
    } else {
      current.losses += 1;
    }

    rankingMap.set(key, current);

    const classStat = classMap.get(characterClass) ?? {
      characterClass,
      wins: 0,
      losses: 0,
      draws: 0,
      total: 0,
      winRate: 0,
    };

    classStat.total += 1;
    if (outcome === 'draw') {
      classStat.draws += 1;
    } else if (
      (outcome === 'player_a' && slot === 'A') ||
      (outcome === 'player_b' && slot === 'B')
    ) {
      classStat.wins += 1;
    } else {
      classStat.losses += 1;
    }

    classMap.set(characterClass, classStat);
  }
}
