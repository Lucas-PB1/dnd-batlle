import { randomUUID } from 'crypto';
import type { IDuelRepository, IUserRepository } from '@/domain/repositories';
import type { Bracket, Duel, DuelOutcome, PlayerEntry } from '@/domain/entities';
import { calculateDuelPoints } from '@/domain/services/scoring-service';
import { BRACKET_BY_CLASS } from '@/shared/constants/game-rules';

export interface CreateDuelInput {
  judgeId: string;
  isClassified: boolean;
}

export interface RegisterPlayerInput {
  token: string;
  slot: 'A' | 'B';
  name: string;
  characterClass: string;
  subclass?: string;
  seasonPointsBefore: number;
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
  ) {}

  async createDuel(input: CreateDuelInput): Promise<Duel> {
    const judge = await this.userRepository.findById(input.judgeId);
    if (!judge || judge.role !== 'judge' || !judge.active) {
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

    const player: PlayerEntry = {
      name: input.name.trim(),
      characterClass: input.characterClass,
      subclass: input.subclass?.trim(),
      bracket: resolveBracket(input.characterClass),
      seasonPointsBefore: input.seasonPointsBefore,
    };

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

    return this.duelRepository.update(completed);
  }
}
