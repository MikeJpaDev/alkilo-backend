import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { AuthModule } from 'src/auth/auth.module';
import { Review } from './entities/review.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Casa } from 'src/casas/entities/casa.entity';
import { User } from 'src/auth/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Casa, User]), AuthModule],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
