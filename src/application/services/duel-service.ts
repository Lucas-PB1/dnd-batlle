import { randomUUID } from 'crypto';
import type {
  ICharacterRepository,
  IDuelRepository,
  IUserRepository,
} from '@/domain/repositories';
import type { Bracket, Duel, DuelOutcome, PlayerEntry } from '@/domain/entities';
import { calculateDuelPoints } from '@/domain/services/scoring-service';
import { EmailService } from '@/application/services/email-service';
import { BRACKET_BY_CLASS } from '@/shared/constants/game-rules';
import { hasRole } from '@/shared/utils/roles';

export interface CreateDuelInput {
  judgeId: string;
  isClassified: boolean;
}

export interface RegisterPlayerInput {
  token: string;
  slot: 'A' | 'B';
  characterId?: string;
  playerId?: string;
  name?: string;
  characterClass?: string;
  subclass?: string;
  seasonPointsBefore?: number;
}

export interface CompleteDuelInput {
  duelId: string;
  judgeId: string;
  arena: number;
  outcome: DuelOutcome;
  rounds: number;
  notes?: string;
}

function resolveBracket(characterClass: string): Bracket {
  const bracket = BRACKET_BY_CLASS[characterClass];
  if (!bracket) {
    throw new Error('Classe inválida');
  }
  return bracket;
}

function generateToken(): string {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

export class DuelService {
  constructor(
    private readonly duelRepository: IDuelRepository,
    private readonly userRepository: IUserRepository,
    private readonly characterRepository: ICharacterRepository,
    private readonly emailService: EmailService,
  ) {}

  async createDuel(input: CreateDuelInput): Promise<Duel> {
    const judge = await this.userRepository.findById(input.judgeId);
    if (!judge || !hasRole(judge, 'judge') || !judge.active) {
      throw new Error('Juiz inválido');
    }

    const duel: Duel = {
      id: randomUUID(),
      token: generateToken(),
      judgeId: judge.id,
      judgeName: judge.displayName,
      status: 'open',
      isClassified: input.isClassified,
      createdAt: new Date().toISOString(),
    };

    return this.duelRepository.save(duel);
  }

  async getDuelByToken(token: string): Promise<Duel | null> {
    return this.duelRepository.findByToken(token);
  }

  async getDuelsByJudge(judgeId: string): Promise<Duel[]> {
    const duels = await this.duelRepository.findAll();
    return duels
      .filter((duel) => duel.judgeId === judgeId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async registerPlayer(input: RegisterPlayerInput): Promise<Duel> {
    const duel = await this.duelRepository.findByToken(input.token);
    if (!duel) throw new Error('Duelo não encontrado');
    if (duel.status === 'completed') throw new Error('Duelo já finalizado');

    const player = await this.buildPlayerEntry(input);

    const updated: Duel = {
      ...duel,
      playerA: input.slot === 'A' ? player : duel.playerA,
      playerB: input.slot === 'B' ? player : duel.playerB,
    };

    if (updated.playerA && updated.playerB) {
      updated.status = 'ready';
    }

    return this.duelRepository.update(updated);
  }

  async completeDuel(input: CompleteDuelInput): Promise<Duel> {
    const duel = await this.duelRepository.findById(input.duelId);
    if (!duel) throw new Error('Duelo não encontrado');
    if (duel.judgeId !== input.judgeId) throw new Error('Sem permissão');
    if (!duel.playerA || !duel.playerB) throw new Error('Jogadores incompletos');
    if (duel.status === 'completed') throw new Error('Duelo já finalizado');

    const pointsA = calculateDuelPoints({
      bracketA: duel.playerA.bracket,
      bracketB: duel.playerB.bracket,
      outcome: input.outcome,
      forPlayer: 'A',
    }).points;

    const pointsB = calculateDuelPoints({
      bracketA: duel.playerA.bracket,
      bracketB: duel.playerB.bracket,
      outcome: input.outcome,
      forPlayer: 'B',
    }).points;

    const completed: Duel = {
      ...duel,
      status: 'completed',
      arena: input.arena,
      result: {
        outcome: input.outcome,
        rounds: input.rounds,
        pointsA,
        pointsB,
        notes: input.notes,
      },
      completedAt: new Date().toISOString(),
    };

    const saved = await this.duelRepository.update(completed);
    await this.notifyPlayers(saved);
    return saved;
  }

  private async buildPlayerEntry(input: RegisterPlayerInput): Promise<PlayerEntry> {
    if (input.characterId && input.playerId) {
      const character = await this.characterRepository.findById(input.characterId);
      if (!character || character.playerId !== input.playerId || !character.active) {
        throw new Error('Personagem inválido');
      }

      const player = await this.userRepository.findById(input.playerId);
      if (!player || !hasRole(player, 'player')) {
        throw new Error('Jogador inválido');
      }

      const seasonPointsBefore = input.seasonPointsBefore ?? 0;

      return {
        characterId: character.id,
        playerId: player.id,
        playerDisplayName: player.displayName,
        name: character.name,
        characterClass: character.characterClass,
        subclass: character.subclass,
        description: character.description,
        portraitUrl: character.portraitUrl,
        generation: character.generation,
        isDead: character.isDead,
        bracket: resolveBracket(character.characterClass),
        seasonPointsBefore,
      };
    }

    if (!input.name || !input.characterClass) {
      throw new Error('Informe personagem cadastrado ou dados manuais');
    }

    return {
      name: input.name.trim(),
      characterClass: input.characterClass,
      subclass: input.subclass?.trim(),
      bracket: resolveBracket(input.characterClass),
      seasonPointsBefore: input.seasonPointsBefore ?? 0,
    };
  }

  private async notifyPlayers(duel: Duel): Promise<void> {
    if (!duel.playerA || !duel.playerB || !duel.result) return;

    const entries = [duel.playerA, duel.playerB];
    const points = [duel.result.pointsA, duel.result.pointsB];

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      if (!entry.playerId) continue;

      const user = await this.userRepository.findById(entry.playerId);
      if (!user?.email) continue;

      const summary = `+${points[i]} pts · ${duel.result.outcome === 'draw' ? 'empate' : 'resultado registrado'}`;
      await this.emailService.sendDuelResultNotification(
        user.email,
        user.displayName,
        entry.name,
        summary,
      );
    }
  }
}
