import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/domain/repositories';
import type { SessionPayload, User } from '@/domain/entities';
import { createSessionToken } from '@/infrastructure/auth/session-token';

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  async ensureDefaultAdmin(): Promise<void> {
    const users = await this.userRepository.findAll();
    if (users.length > 0) return;

    const passwordHash = await bcrypt.hash('admin123', 10);
    await this.userRepository.save({
      id: randomUUID(),
      email: 'admin@arena.local',
      username: 'admin',
      passwordHash,
      roles: ['admin', 'judge', 'player'],
      displayName: 'Administrador',
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  async register(input: RegisterInput): Promise<Omit<User, 'passwordHash'>> {
    const email = input.email.trim().toLowerCase();
    if (!email.includes('@')) {
      throw new Error('E-mail inválido');
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error('E-mail já cadastrado');
    }

    const username = email.split('@')[0] + '-' + randomUUID().slice(0, 6);
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.userRepository.save({
      id: randomUUID(),
      email,
      username,
      passwordHash,
      roles: ['player'],
      displayName: input.displayName.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    });

    return withoutPassword(user);
  }

  async login(
    identifier: string,
    password: string,
  ): Promise<{ token: string; session: SessionPayload } | null> {
    await this.ensureDefaultAdmin();

    const normalized = identifier.trim().toLowerCase();
    const user =
      (await this.userRepository.findByEmail(normalized)) ??
      (await this.userRepository.findByUsername(identifier.trim()));

    if (!user || !user.active) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    const session: SessionPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      displayName: user.displayName,
    };

    const token = await createSessionToken(session);
    return { token, session };
  }
}

function withoutPassword(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash, ...safeUser } = user;
  void passwordHash;
  return safeUser;
}
