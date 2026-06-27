import path from 'path';
import type { IDuelRepository, IUserRepository } from '@/domain/repositories';
import { DuelFileRepository } from '@/infrastructure/persistence/repositories/duel-file-repository';
import { UserFileRepository } from '@/infrastructure/persistence/repositories/user-file-repository';
import { FileStore } from '@/infrastructure/persistence/file-store';

export class RepositoryFactory {
  private static instance: RepositoryFactory | null = null;

  private readonly fileStore: FileStore;
  private userRepository: IUserRepository | null = null;
  private duelRepository: IDuelRepository | null = null;

  private constructor(dataDir?: string) {
    const baseDir = dataDir ?? path.join(process.cwd(), 'data');
    this.fileStore = new FileStore(baseDir);
  }

  static create(dataDir?: string): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory(dataDir);
    }
    return RepositoryFactory.instance;
  }

  static reset(): void {
    RepositoryFactory.instance = null;
  }

  getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserFileRepository(this.fileStore);
    }
    return this.userRepository;
  }

  getDuelRepository(): IDuelRepository {
    if (!this.duelRepository) {
      this.duelRepository = new DuelFileRepository(this.fileStore);
    }
    return this.duelRepository;
  }
}
