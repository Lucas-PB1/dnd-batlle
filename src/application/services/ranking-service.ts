import type { ICharacterRepository, IDuelRepository, IUserRepository } from '@/domain/repositories';
import type { ClassStats, Duel, DuelOutcome, PlayerStats, PublicStats } from '@/domain/entities';
import { aggregateRankings } from '@/domain/services/ranking-aggregator';
import {
  buildPlayerRankingsFromCharacters,
  mergeCharacterRankings,
} from '@/domain/services/ranking-builder';
import { hasRole } from '@/shared/utils/roles';

export class RankingService {
  constructor(
    private readonly duelRepository: IDuelRepository,
    private readonly userRepository: IUserRepository,
    private readonly characterRepository: ICharacterRepository,
  ) {}

  async getPublicStats(): Promise<PublicStats> {
    const stats = await this.buildFullRankings();
    const duels = await this.duelRepository.findAll();

    return {
      ...stats,
      classStats: this.buildClassStats(duels),
      totalDuels: duels.filter((duel) => duel.status === 'completed' && duel.isClassified).length,
    };
  }

  async getPlayerStats(playerId: string): Promise<PlayerStats> {
    const [stats, duels] = await Promise.all([
      this.buildFullRankings(),
      this.duelRepository.findAll(),
    ]);

    const playerDuels = duels.filter(
      (duel) =>
        duel.playerA?.playerId === playerId || duel.playerB?.playerId === playerId,
    );

    return {
      playerRanking:
        stats.playerRanking.find((entry) => entry.playerId === playerId) ?? null,
      characterRanking: stats.characterRanking.filter(
        (entry) => entry.playerId === playerId,
      ),
      recentDuels: aggregateRankings(playerDuels, { playerId }).recentDuels,
    };
  }

  private async buildFullRankings() {
    const [duels, users, characters] = await Promise.all([
      this.duelRepository.findAll(),
      this.userRepository.findAll(),
      this.characterRepository.findAll(),
    ]);

    const players = users.filter((user) => user.active && hasRole(user, 'player'));
    const duelRankings = aggregateRankings(duels);

    const characterRanking = mergeCharacterRankings(
      duelRankings.characterRanking,
      characters,
      users,
    );
    const playerRanking = buildPlayerRankingsFromCharacters(
      characterRanking,
      players,
      characters,
    );

    return {
      characterRanking,
      playerRanking,
      recentDuels: duelRankings.recentDuels,
    };
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
