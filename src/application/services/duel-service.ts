import { randomUUID } from 'crypto';
import type {
  ICharacterRepository,
  IDuelRepository,
  IUserRepository,
} from '@/domain/repositories';
import type { Duel, DuelOutcome, PlayerEntry, UserRole } from '@/domain/entities';
import { calculateDuelPoints } from '@/domain/services/scoring-service';
import { EmailService } from '@/application/services/email-service';
import { BRACKET_BY_CLASS } from '@/shared/constants/game-rules';
import { hasRole } from '@/shared/utils/roles';
import {
  canCompleteDuel,
  canDeleteDuel,
  canManageDuel,
} from '@/shared/utils/duel-permissions';

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
  actorId: string;
  roles: UserRole[];
  arena: number;
  outcome: DuelOutcome;
  rounds: number;
  notes?: string;
  isClassified?: boolean;
}

export interface UpdateDuelInput {
  duelId: string;
  actorId: string;
  roles: UserRole[];
  isClassified?: boolean;
  arena?: number;
  outcome?: DuelOutcome;
  rounds?: number;
  notes?: string;
  pointsA?: number;
  pointsB?: number;
}

export interface DeleteDuelInput {
  duelId: string;
  actorId: string;
  roles: UserRole[];
}

function resolveBracket(characterClass: string) {
  const bracket = BRACKET_BY_CLASS[characterClass];
  if (!bracket) {
    throw new Error('Classe inválida');
  }
  return bracket;
}

function generateToken(): string {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

function buildResultPoints(
  duel: Duel,
  outcome: DuelOutcome,
  manual?: { pointsA?: number; pointsB?: number },
) {
  if (!duel.playerA || !duel.playerB) {
    throw new Error('Jogadores incompletos');
  }

  const pointsA =
    manual?.pointsA ??
    calculateDuelPoints({
      bracketA: duel.playerA.bracket,
      bracketB: duel.playerB.bracket,
      outcome,
      forPlayer: 'A',
    }).points;

  const pointsB =
    manual?.pointsB ??
    calculateDuelPoints({
      bracketA: duel.playerA.bracket,
      bracketB: duel.playerB.bracket,
      outcome,
      forPlayer: 'B',
    }).points;

  return { pointsA, pointsB };
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

  async getDuelById(duelId: string): Promise<Duel | null> {
    return this.duelRepository.findById(duelId);
  }

  async getDuelByToken(token: string): Promise<Duel | null> {
    return this.duelRepository.findByToken(token);
  }

  async getAllDuels(): Promise<Duel[]> {
    const duels = await this.duelRepository.findAll();
    return duels.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getDuelsForJudge(judgeId: string): Promise<Duel[]> {
    const duels = await this.duelRepository.findAll();
    return duels
      .filter((duel) => duel.status === 'completed' || duel.judgeId === judgeId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
    if (duel.status === 'ready' || (duel.playerA && duel.playerB)) {
      throw new Error('Arena lotada — as duas vagas já foram preenchidas');
    }

    const slotTaken = input.slot === 'A' ? duel.playerA : duel.playerB;
    if (slotTaken) {
      throw new Error(
        input.slot === 'A'
          ? 'A vaga do Desafiante A já está ocupada'
          : 'A vaga do Desafiante B já está ocupada',
      );
    }

    const player = await this.buildPlayerEntry(input);

    if (input.characterId) {
      const other = input.slot === 'A' ? duel.playerB : duel.playerA;
      if (other?.characterId && other.characterId === input.characterId) {
        throw new Error('Este herói já está inscrito no outro lado da arena');
      }
    }

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
    if (!canCompleteDuel(duel, input.actorId, input.roles)) {
      throw new Error('Sem permissão');
    }
    if (!duel.playerA || !duel.playerB) throw new Error('Jogadores incompletos');
    if (duel.status === 'completed') throw new Error('Duelo já finalizado');

    const { pointsA, pointsB } = buildResultPoints(duel, input.outcome);

    const completed: Duel = {
      ...duel,
      status: 'completed',
      isClassified: input.isClassified ?? duel.isClassified,
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

  async updateDuel(input: UpdateDuelInput): Promise<Duel> {
    const duel = await this.duelRepository.findById(input.duelId);
    if (!duel) throw new Error('Duelo não encontrado');
    if (!canManageDuel(duel, input.actorId, input.roles)) {
      throw new Error('Sem permissão');
    }

    if (duel.status !== 'completed' || !duel.result) {
      if (input.isClassified === undefined) {
        throw new Error('Apenas duelos selados podem ter glória editada');
      }

      return this.duelRepository.update({
        ...duel,
        isClassified: input.isClassified,
      });
    }

    const outcome = input.outcome ?? duel.result.outcome;
    const rounds = input.rounds ?? duel.result.rounds;
    const arena = input.arena ?? duel.arena;
    const hasManualPoints = input.pointsA !== undefined || input.pointsB !== undefined;
    const { pointsA, pointsB } = buildResultPoints(duel, outcome, {
      pointsA: input.pointsA,
      pointsB: input.pointsB,
    });

    if (hasManualPoints && (input.pointsA === undefined || input.pointsB === undefined)) {
      throw new Error('Informe a glória de ambos os desafiantes');
    }

    const updated: Duel = {
      ...duel,
      isClassified: input.isClassified ?? duel.isClassified,
      arena,
      result: {
        outcome,
        rounds,
        pointsA,
        pointsB,
        notes: input.notes ?? duel.result.notes,
      },
      completedAt: duel.completedAt ?? new Date().toISOString(),
    };

    return this.duelRepository.update(updated);
  }

  async deleteDuel(input: DeleteDuelInput): Promise<void> {
    const duel = await this.duelRepository.findById(input.duelId);
    if (!duel) throw new Error('Duelo não encontrado');
    if (!canDeleteDuel(duel, input.actorId, input.roles)) {
      throw new Error('Sem permissão');
    }

    await this.duelRepository.delete(input.duelId);
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
