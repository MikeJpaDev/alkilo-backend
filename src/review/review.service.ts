import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { Casa } from 'src/casas/entities/casa.entity';
import { User } from 'src/auth/entities/user.entity';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Casa)
    private readonly casaRepository: Repository<Casa>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(casaId: string, createReviewDto: CreateReviewDto, user: User) {
    try {
      const { rating, comment } = createReviewDto;

      // Verificar que la casa existe
      const casa = await this.casaRepository.findOne({
        where: { id: casaId },
      });

      if (!casa) {
        throw new NotFoundException(`Casa with ID ${casaId} not found`);
      }

      // Verificar que el usuario no haya comentado ya esta casa
      const existingReview = await this.reviewRepository.findOne({
        where: {
          casaFk: { id: casaId },
          userFk: { id: user.id },
        },
      });

      if (existingReview) {
        throw new ConflictException('You have already reviewed this property');
      }

      // Crear la reseña
      const review = this.reviewRepository.create({
        rating,
        comment,
        casaFk: casa,
        userFk: user,
      });

      const savedReview = await this.reviewRepository.save(review);

      // Retornar la reseña con información del usuario
      return {
        id: savedReview.id,
        rating: savedReview.rating,
        comment: savedReview.comment,
        createdAt: savedReview.createdAt,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        casa: {
          id: casa.id,
          title: casa.title,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      const [reviews, total] = await this.reviewRepository.findAndCount({
        relations: ['userFk', 'casaFk'],
        select: {
          userFk: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          casaFk: {
            id: true,
            title: true,
          },
        },
        take: limit,
        skip: skip,
        order: { createdAt: 'DESC' },
      });

      const formattedReviews = reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: review.userFk,
        casa: review.casaFk,
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        data: formattedReviews,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasPrevious: page > 1,
          hasNext: page < totalPages,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(id: number) {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ['userFk', 'casaFk'],
        select: {
          userFk: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
          casaFk: {
            id: true,
            title: true,
          },
        },
      });

      if (!review) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }

      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: review.userFk,
        casa: review.casaFk,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }

  async update(id: number, updateReviewDto: UpdateReviewDto, user: User) {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ['userFk', 'casaFk'],
      });

      if (!review) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }

      // Verificar que el usuario sea el dueño de la reseña o admin
      const isOwner = review.userFk.id === user.id;
      const isAdmin = user.roles.includes(ValidRoles.admin);
      
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You can only update your own reviews');
      }

      // Actualizar los campos
      if (updateReviewDto.rating !== undefined) {
        review.rating = updateReviewDto.rating;
      }
      if (updateReviewDto.comment !== undefined) {
        review.comment = updateReviewDto.comment;
      }

      const updatedReview = await this.reviewRepository.save(review);

      return {
        id: updatedReview.id,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        createdAt: updatedReview.createdAt,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        casa: {
          id: review.casaFk.id,
          title: review.casaFk.title,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }

  async remove(id: number, user: User) {
    try {
      const review = await this.reviewRepository.findOne({
        where: { id },
        relations: ['userFk'],
      });

      if (!review) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }

      // Verificar que el usuario sea el dueño de la reseña o admin
      const isOwner = review.userFk.id === user.id;
      const isAdmin = user.roles.includes(ValidRoles.admin);
      
      if (!isOwner && !isAdmin) {
        throw new ForbiddenException('You can only delete your own reviews');
      }

      await this.reviewRepository.remove(review);

      return {
        message: 'Review deleted successfully',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }
}
