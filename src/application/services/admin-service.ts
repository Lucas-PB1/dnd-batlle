import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import type { IUserRepository } from '@/domain/repositories';
import type { User, UserRole } from '@/domain/entities';
import { EmailService } from '@/application/services/email-service';

export interface CreateUserInput {
  email: string;
  password: string;
  displayName: string;
  roles: UserRole[];
}

export interface UpdateUserInput {
  displayName?: string;
  email?: string;
  roles?: UserRole[];
  active?: boolean;
  password?: string;
}

function withoutPasswordHash(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash, ...safeUser } = user;
  void passwordHash;
  return safeUser;
}

export class AdminService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: EmailService,
  ) {}

  async listUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepository.findAll();
    return users.map(withoutPasswordHash);
  }

  async listJudges(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.listUsers();
    return users.filter((user) => user.roles.includes('judge'));
  }

  async createUser(input: CreateUserInput): Promise<Omit<User, 'passwordHash'>> {
    const email = input.email.trim().toLowerCase();
    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail) {
      throw new Error('E-mail já existe');
    }

    const username = email.split('@')[0];
    const existingUsername = await this.userRepository.findByUsername(username);
    const finalUsername = existingUsername ? `${username}-${randomUUID().slice(0, 6)}` : username;

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.userRepository.save({
      id: randomUUID(),
      email,
      username: finalUsername,
      passwordHash,
      roles: input.roles.length ? input.roles : ['player'],
      displayName: input.displayName.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    });

    await this.emailService.sendRoleNotification(user.email, user.displayName, user.roles);

    return withoutPasswordHash(user);
  }

  async createJudge(input: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<Omit<User, 'passwordHash'>> {
    return this.createUser({
      ...input,
      roles: ['judge', 'player'],
    });
  }

  async updateUser(userId: string, input: UpdateUserInput): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const roles = input.roles ?? user.roles;
    const updated: User = {
      ...user,
      displayName: input.displayName?.trim() ?? user.displayName,
      email: input.email?.trim().toLowerCase() ?? user.email,
      roles,
      active: input.active ?? user.active,
      passwordHash: input.password
        ? await bcrypt.hash(input.password, 10)
        : user.passwordHash,
    };

    const saved = await this.userRepository.update(updated);
    if (input.roles) {
      await this.emailService.sendRoleNotification(saved.email, saved.displayName, saved.roles);
    }

    return withoutPasswordHash(saved);
  }

  async toggleJudgeActive(
    judgeId: string,
    active: boolean,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findById(judgeId);
    if (!user || !user.roles.includes('judge')) {
      throw new Error('Juiz não encontrado');
    }
    return this.updateUser(judgeId, { active });
  }
}
