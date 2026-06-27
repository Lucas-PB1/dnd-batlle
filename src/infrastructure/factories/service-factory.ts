import { AuthService } from '@/application/services/auth-service';
import { AdminService } from '@/application/services/admin-service';
import { DuelService } from '@/application/services/duel-service';
import { RankingService } from '@/application/services/ranking-service';
import { RepositoryFactory } from '@/infrastructure/factories/repository-factory';

export class ServiceFactory {
  private static instance: ServiceFactory | null = null;

  private authService: AuthService | null = null;
  private adminService: AdminService | null = null;
  private duelService: DuelService | null = null;
  private rankingService: RankingService | null = null;

  private constructor(private readonly repositoryFactory: RepositoryFactory) {}

  static create(dataDir?: string): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory(RepositoryFactory.create(dataDir));
    }
    return ServiceFactory.instance;
  }

  static reset(): void {
    ServiceFactory.instance = null;
    RepositoryFactory.reset();
  }

  getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService(this.repositoryFactory.getUserRepository());
    }
    return this.authService;
  }

  getAdminService(): AdminService {
    if (!this.adminService) {
      this.adminService = new AdminService(this.repositoryFactory.getUserRepository());
    }
    return this.adminService;
  }

  getDuelService(): DuelService {
    if (!this.duelService) {
      this.duelService = new DuelService(
        this.repositoryFactory.getDuelRepository(),
        this.repositoryFactory.getUserRepository(),
      );
    }
    return this.duelService;
  }

  getRankingService(): RankingService {
    if (!this.rankingService) {
      this.rankingService = new RankingService(
        this.repositoryFactory.getDuelRepository(),
      );
    }
    return this.rankingService;
  }
}
