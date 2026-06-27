import type { User } from '@/domain/entities';
import type { IUserRepository } from '@/domain/repositories';
import { FileStore } from '@/infrastructure/persistence/file-store';

export class UserFileRepository implements IUserRepository {
  private readonly fileName = 'users.json';

  constructor(private readonly store: FileStore) {}

  async findAll(): Promise<User[]> {
    return this.store.read<User[]>(this.fileName, []);
  }

  async findById(id: string): Promise<User | null> {
    const users = await this.findAll();
    return users.find((user) => user.id === id) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const users = await this.findAll();
    return users.find((user) => user.username === username) ?? null;
  }

  async save(user: User): Promise<User> {
    const users = await this.findAll();
    users.push(user);
    await this.store.write(this.fileName, users);
    return user;
  }

  async update(user: User): Promise<User> {
    const users = await this.findAll();
    const index = users.findIndex((item) => item.id === user.id);
    if (index === -1) {
      throw new Error('Usuário não encontrado');
    }
    users[index] = user;
    await this.store.write(this.fileName, users);
    return user;
  }
}
