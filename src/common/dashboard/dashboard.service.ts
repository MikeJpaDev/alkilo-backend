import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Casa } from 'src/casas/entities/casa.entity';
import { Review } from 'src/review/entities/review.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Casa)
    private readonly casaRepository: Repository<Casa>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async getStats() {
    const [totalUsers, totalCasas, totalReviews] = await Promise.all([
      this.userRepository.count(),
      this.casaRepository.count(),
      this.reviewRepository.count(),
    ]);

    // Estadísticas adicionales útiles
    const [activeUsers, activeCasas] = await Promise.all([
      this.userRepository.count({ where: { isActive: true } }),
      this.casaRepository.count(),
    ]);

    // Calcular promedio de calificaciones
    const reviewsWithRatings = await this.reviewRepository.find({
      select: ['rating'],
    });
    
    const averageRating = reviewsWithRatings.length > 0
      ? reviewsWithRatings.reduce((acc, review) => acc + review.rating, 0) / reviewsWithRatings.length
      : 0;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      casas: {
        total: totalCasas,
      },
      reviews: {
        total: totalReviews,
        averageRating: Number(averageRating.toFixed(2)),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
