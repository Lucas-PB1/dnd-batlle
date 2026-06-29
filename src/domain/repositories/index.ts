import type { Character, Duel, User } from '@/domain/entities';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
}

export interface ICharacterRepository {
  findAll(): Promise<Character[]>;
  findById(id: string): Promise<Character | null>;
  findByPlayerId(playerId: string): Promise<Character[]>;
  save(character: Character): Promise<Character>;
  update(character: Character): Promise<Character>;
  delete(id: string): Promise<void>;
}

export interface IDuelRepository {
  findAll(): Promise<Duel[]>;
  findById(id: string): Promise<Duel | null>;
  findByToken(token: string): Promise<Duel | null>;
  save(duel: Duel): Promise<Duel>;
  update(duel: Duel): Promise<Duel>;
  delete(id: string): Promise<void>;
}
