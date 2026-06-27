import type { Duel, User } from '@/domain/entities';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
}

export interface IDuelRepository {
  findAll(): Promise<Duel[]>;
  findById(id: string): Promise<Duel | null>;
  findByToken(token: string): Promise<Duel | null>;
  save(duel: Duel): Promise<Duel>;
  update(duel: Duel): Promise<Duel>;
}
