import path from 'path';
import type { IDuelRepository, IUserRepository } from '@/domain/repositories';
import { isPostgresEnabled, resetDbClientForTests } from '@/infrastructure/persistence/db';
import { DuelFileRepository } from '@/infrastructure/persistence/repositories/duel-file-repository';
import { DuelPostgresRepository } from '@/infrastructure/persistence/repositories/duel-postgres-repository';
import { UserFileRepository } from '@/infrastructure/persistence/repositories/user-file-repository';
import { UserPostgresRepository } from '@/infrastructure/persistence/repositories/user-postgres-repository';
import { FileStore } from '@/infrastructure/persistence/file-store';

export class RepositoryFactory {
  private static instance: RepositoryFactory | null = null;

  private readonly fileStore: FileStore | null;
  private readonly usePostgres: boolean;
  private userRepository: IUserRepository | null = null;
  private duelRepository: IDuelRepository | null = null;

  private constructor(dataDir?: string) {
    if (dataDir) {
      this.fileStore = new FileStore(dataDir);
      this.usePostgres = false;
      return;
    }

    if (isPostgresEnabled()) {
      this.fileStore = null;
      this.usePostgres = true;
      return;
    }

    this.fileStore = new FileStore(path.join(process.cwd(), 'data'));
    this.usePostgres = false;
  }

  static create(dataDir?: string): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory(dataDir);
    }
    return RepositoryFactory.instance;
  }

  static reset(): void {
    RepositoryFactory.instance = null;
    resetDbClientForTests();
  }

  getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = this.usePostgres
        ? new UserPostgresRepository()
        : new UserFileRepository(this.fileStore!);
    }
    return this.userRepository;
  }

  getDuelRepository(): IDuelRepository {
    if (!this.duelRepository) {
      this.duelRepository = this.usePostgres
        ? new DuelPostgresRepository()
        : new DuelFileRepository(this.fileStore!);
    }
    return this.duelRepository;
  }
}
