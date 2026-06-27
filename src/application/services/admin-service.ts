import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/domain/repositories';
import type { User } from '@/domain/entities';

export interface CreateJudgeInput {
  username: string;
  password: string;
  displayName: string;
}

function withoutPasswordHash(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash, ...safeUser } = user;
  void passwordHash;
  return safeUser;
}

export class AdminService {
  constructor(private readonly userRepository: IUserRepository) {}

  async listJudges(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepository.findAll();
    return users
      .filter((user) => user.role === 'judge')
      .map(withoutPasswordHash);
  }

  async createJudge(input: CreateJudgeInput): Promise<Omit<User, 'passwordHash'>> {
    const existing = await this.userRepository.findByUsername(input.username);
    if (existing) {
      throw new Error('Usuário já existe');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.userRepository.save({
      id: randomUUID(),
      username: input.username,
      passwordHash,
      role: 'judge',
      displayName: input.displayName,
      active: true,
      createdAt: new Date().toISOString(),
    });

    return withoutPasswordHash(user);
  }

  async toggleJudgeActive(
    judgeId: string,
    active: boolean,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findById(judgeId);
    if (!user || user.role !== 'judge') {
      throw new Error('Juiz não encontrado');
    }
    const updated = await this.userRepository.update({ ...user, active });
    return withoutPasswordHash(updated);
  }
}
