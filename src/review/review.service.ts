import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ReviewService {
  create(createReviewDto: CreateReviewDto) {
    return 'This action adds a new review';
  }

  findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      },
      message: 'Review functionality not implemented yet',
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} review`;
  }

  update(id: number, updateReviewDto: UpdateReviewDto) {
    return `This action updates a #${id} review`;
  }

  remove(id: number) {
    return `This action removes a #${id} review`;
  }
}
