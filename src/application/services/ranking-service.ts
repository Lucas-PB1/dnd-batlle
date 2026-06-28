import type { IDuelRepository, IUserRepository } from '@/domain/repositories';
import type { ClassStats, Duel, DuelOutcome, PlayerStats, PublicStats } from '@/domain/entities';
import { aggregateRankings } from '@/domain/services/ranking-aggregator';

export class RankingService {
  constructor(
    private readonly duelRepository: IDuelRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async getPublicStats(): Promise<PublicStats> {
    const duels = await this.duelRepository.findAll();
    const { characterRanking, playerRanking, recentDuels } = aggregateRankings(duels);

    const playerRankingWithNames = await this.enrichPlayerNames(playerRanking);

    return {
      characterRanking,
      playerRanking: playerRankingWithNames,
      classStats: this.buildClassStats(duels),
      totalDuels: duels.filter((duel) => duel.status === 'completed' && duel.isClassified).length,
      recentDuels,
    };
  }

  async getPlayerStats(playerId: string): Promise<PlayerStats> {
    const duels = await this.duelRepository.findAll();
    const playerDuels = duels.filter(
      (duel) =>
        duel.playerA?.playerId === playerId || duel.playerB?.playerId === playerId,
    );

    const { characterRanking, playerRanking, recentDuels } = aggregateRankings(playerDuels, {
      playerId,
    });

    return {
      playerRanking: playerRanking[0] ?? null,
      characterRanking,
      recentDuels,
    };
  }

  private async enrichPlayerNames(
    ranking: PublicStats['playerRanking'],
  ): Promise<PublicStats['playerRanking']> {
    const users = await this.userRepository.findAll();
    const userMap = new Map(users.map((user) => [user.id, user.displayName]));

    return ranking.map((entry) => ({
      ...entry,
      playerDisplayName: userMap.get(entry.playerId) ?? entry.playerDisplayName,
    }));
  }

  private buildClassStats(duels: Duel[]): ClassStats[] {
    const classMap = new Map<string, ClassStats>();
    const completed = duels.filter(
      (duel) => duel.status === 'completed' && duel.result && duel.isClassified,
    );

    for (const duel of completed) {
      if (!duel.playerA || !duel.playerB || !duel.result) continue;

      this.applyClassResult(classMap, duel.playerA.characterClass, duel.result.outcome, 'A');
      this.applyClassResult(classMap, duel.playerB.characterClass, duel.result.outcome, 'B');
    }

    return [...classMap.values()]
      .map((stat) => ({
        ...stat,
        winRate: stat.total > 0 ? Math.round((stat.wins / stat.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }

  private applyClassResult(
    classMap: Map<string, ClassStats>,
    characterClass: string,
    outcome: DuelOutcome,
    slot: 'A' | 'B',
  ): void {
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
