import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import type { ICharacterRepository, IUserRepository } from '@/domain/repositories';
import type { Character, User, UserRole } from '@/domain/entities';
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

export interface CharacterWithOwner extends Character {
  playerDisplayName: string;
  playerEmail: string;
}

export class AdminService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly characterRepository: ICharacterRepository,
    private readonly emailService: EmailService,
  ) {}

  async listUsers(includeRemoved = false): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.userRepository.findAll();
    const filtered = includeRemoved ? users : users.filter((user) => !user.deletedAt);
    return filtered.map(withoutPasswordHash);
  }

  async listJudges(): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.listUsers();
    return users.filter((user) => user.roles.includes('judge'));
  }

  async createUser(input: CreateUserInput): Promise<Omit<User, 'passwordHash'>> {
    const email = input.email.trim().toLowerCase();
    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail && !existingEmail.deletedAt) {
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
      deletedAt: user.deletedAt,
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

  async listCharacters(includeInactive = true): Promise<CharacterWithOwner[]> {
    const [characters, users] = await Promise.all([
      this.characterRepository.findAll(),
      this.userRepository.findAll(),
    ]);

    const usersById = new Map(users.map((user) => [user.id, user]));

    return characters
      .filter((character) => includeInactive || character.active)
      .map((character) => {
        const owner = usersById.get(character.playerId);
        return {
          ...character,
          playerDisplayName: owner?.displayName ?? 'Desconhecido',
          playerEmail: owner?.email ?? '',
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async resetUserPassword(
    userId: string,
    password: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.updateUser(userId, { password });
    await this.emailService.sendPasswordResetNotification(user.email, user.displayName, password);
    return user;
  }

  async deleteUser(actorId: string, userId: string): Promise<Omit<User, 'passwordHash'>> {
    if (actorId === userId) {
      throw new Error('Você não pode remover sua própria conta');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    if (user.deletedAt) {
      throw new Error('Conta já removida');
    }

    const activeAdmins = (await this.userRepository.findAll()).filter(
      (item) => item.roles.includes('admin') && item.active && !item.deletedAt,
    );
    if (user.roles.includes('admin') && activeAdmins.length <= 1) {
      throw new Error('Não é possível remover o último administrador ativo');
    }

    const characters = await this.characterRepository.findByPlayerId(userId);
    await Promise.all(
      characters
        .filter((character) => character.active)
        .map((character) =>
          this.characterRepository.update({ ...character, active: false }),
        ),
    );

    const removed: User = {
      ...user,
      active: false,
      deletedAt: new Date().toISOString(),
      archivedEmail: user.email,
      email: `removed+${user.id}@arena.local`,
      username: `removed-${user.id.slice(0, 8)}`,
      displayName: user.displayName,
    };

    const saved = await this.userRepository.update(removed);
    return withoutPasswordHash(saved);
  }

  async restoreUser(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    if (!user.deletedAt) {
      throw new Error('Conta não está removida');
    }

    const email = user.archivedEmail ?? user.email;
    const emailTaken = await this.userRepository.findByEmail(email);
    if (emailTaken && emailTaken.id !== userId && !emailTaken.deletedAt) {
      throw new Error('O e-mail original já está em uso por outra conta');
    }

    const restored: User = {
      ...user,
      active: true,
      deletedAt: undefined,
      email,
      archivedEmail: undefined,
    };

    const saved = await this.userRepository.update(restored);
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
