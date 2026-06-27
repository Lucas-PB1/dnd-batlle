import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/domain/repositories';
import type { SessionPayload } from '@/domain/entities';
import { createSessionToken } from '@/infrastructure/auth/session-token';

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  async ensureDefaultAdmin(): Promise<void> {
    const users = await this.userRepository.findAll();
    if (users.length > 0) return;

    const passwordHash = await bcrypt.hash('admin123', 10);
    await this.userRepository.save({
      id: randomUUID(),
      username: 'admin',
      passwordHash,
      role: 'admin',
      displayName: 'Administrador',
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ token: string; session: SessionPayload } | null> {
    await this.ensureDefaultAdmin();
    const user = await this.userRepository.findByUsername(username);
    if (!user || !user.active) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    const session: SessionPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    };

    const token = await createSessionToken(session);
    return { token, session };
  }
}
