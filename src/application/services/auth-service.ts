import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/domain/repositories';
import type { SessionPayload, User, UserRole } from '@/domain/entities';
import { createSessionToken } from '@/infrastructure/auth/session-token';
import { normalizeRoles } from '@/shared/utils/roles';

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

const DEFAULT_ADMIN_EMAIL = 'admin@arena.local';
const DEFAULT_ADMIN_USERNAME = 'admin';

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  async ensureDefaultAdmin(): Promise<void> {
    const users = await this.userRepository.findAll();
    const admin =
      users.find((user) => user.roles.includes('admin')) ??
      users.find((user) => user.username === DEFAULT_ADMIN_USERNAME) ??
      users.find((user) => user.email === DEFAULT_ADMIN_EMAIL);

    if (!admin) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await this.userRepository.save({
        id: randomUUID(),
        email: DEFAULT_ADMIN_EMAIL,
        username: DEFAULT_ADMIN_USERNAME,
        passwordHash,
        roles: ['admin', 'judge', 'player'],
        displayName: 'Administrador',
        active: true,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    const roles = normalizeRoles(admin.roles);
    const needsUpgrade = !roles.includes('judge') || !roles.includes('player');

    if (needsUpgrade) {
      await this.userRepository.update({
        ...admin,
        email: admin.email || DEFAULT_ADMIN_EMAIL,
        roles: Array.from(new Set<UserRole>([...roles, 'admin', 'judge', 'player'])),
      });
    }
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

    const trimmed = identifier.trim();
    const normalized = trimmed.toLowerCase();

    const user =
      (await this.userRepository.findByEmail(normalized)) ??
      (await this.userRepository.findByUsername(trimmed)) ??
      (normalized === DEFAULT_ADMIN_USERNAME
        ? await this.userRepository.findByUsername(DEFAULT_ADMIN_USERNAME)
        : null);

    if (!user || !user.active) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    const roles = normalizeRoles(user.roles);
    const session: SessionPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      roles,
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
