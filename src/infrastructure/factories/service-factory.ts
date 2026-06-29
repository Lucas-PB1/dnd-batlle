import { AuthService } from '@/application/services/auth-service';
import { AdminService } from '@/application/services/admin-service';
import { CharacterService } from '@/application/services/character-service';
import { DuelService } from '@/application/services/duel-service';
import { EmailService } from '@/application/services/email-service';
import { RankingService } from '@/application/services/ranking-service';
import { RepositoryFactory } from '@/infrastructure/factories/repository-factory';

export class ServiceFactory {
  private static instance: ServiceFactory | null = null;

  private emailService: EmailService | null = null;
  private authService: AuthService | null = null;
  private adminService: AdminService | null = null;
  private characterService: CharacterService | null = null;
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

  getEmailService(): EmailService {
    if (!this.emailService) {
      this.emailService = new EmailService();
    }
    return this.emailService;
  }

  getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService(this.repositoryFactory.getUserRepository());
    }
    return this.authService;
  }

  getAdminService(): AdminService {
    if (!this.adminService) {
      this.adminService = new AdminService(
        this.repositoryFactory.getUserRepository(),
        this.getEmailService(),
      );
    }
    return this.adminService;
  }

  getCharacterService(): CharacterService {
    if (!this.characterService) {
      this.characterService = new CharacterService(
        this.repositoryFactory.getCharacterRepository(),
      );
    }
    return this.characterService;
  }

  getDuelService(): DuelService {
    if (!this.duelService) {
      this.duelService = new DuelService(
        this.repositoryFactory.getDuelRepository(),
        this.repositoryFactory.getUserRepository(),
        this.repositoryFactory.getCharacterRepository(),
        this.getEmailService(),
      );
    }
    return this.duelService;
  }

  getRankingService(): RankingService {
    if (!this.rankingService) {
      this.rankingService = new RankingService(
        this.repositoryFactory.getDuelRepository(),
        this.repositoryFactory.getUserRepository(),
        this.repositoryFactory.getCharacterRepository(),
      );
    }
    return this.rankingService;
  }
}
