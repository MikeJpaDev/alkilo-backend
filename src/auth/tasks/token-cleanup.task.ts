import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { TokenBlacklist } from '../entities/token-blacklist.entity';

@Injectable()
export class TokenCleanupTask {
  private readonly logger = new Logger(TokenCleanupTask.name);

  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) {}

  // Ejecutar todos los días a las 3:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron() {
    this.logger.log('Starting token cleanup task...');
    
    try {
      const now = new Date();
      const result = await this.tokenBlacklistRepository.delete({
        expiresAt: LessThan(now),
      });

      this.logger.log(`Token cleanup completed. Deleted ${result.affected || 0} expired tokens.`);
    } catch (error) {
      this.logger.error('Error during token cleanup:', error);
    }
  }

  // También ejecutar cada hora para mayor limpieza
  @Cron(CronExpression.EVERY_HOUR)
  async hourlyCleanup() {
    try {
      const now = new Date();
      const result = await this.tokenBlacklistRepository.delete({
        expiresAt: LessThan(now),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(`Hourly cleanup: Deleted ${result.affected} expired tokens.`);
      }
    } catch (error) {
      this.logger.error('Error during hourly token cleanup:', error);
    }
  }
}
