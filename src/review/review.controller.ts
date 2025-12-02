import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { getUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities/user.entity';

@ApiTags('Reviews')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post(':casaId')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva reseña' })
  @ApiResponse({ status: 201, description: 'Reseña creada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Casa no encontrada' })
  @ApiResponse({ status: 409, description: 'Ya has reseñado esta casa' })
  create(
    @Param('casaId') casaId: string,
    @Body() createReviewDto: CreateReviewDto,
    @getUser() user: User,
  ) {
    return this.reviewService.create(casaId, createReviewDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las reseñas' })
  @ApiResponse({ status: 200, description: 'Lista de reseñas con paginación' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.reviewService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una reseña por ID' })
  @ApiResponse({ status: 200, description: 'Reseña encontrada' })
  @ApiResponse({ status: 404, description: 'Reseña no encontrada' })
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(+id);
  }

  @Patch(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una reseña' })
  @ApiResponse({ status: 200, description: 'Reseña actualizada' })
  @ApiResponse({ status: 404, description: 'Reseña no encontrada' })
  @ApiResponse({ status: 403, description: 'Solo puedes actualizar tus propias reseñas' })
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @getUser() user: User,
  ) {
    return this.reviewService.update(+id, updateReviewDto, user);
  }

  @Delete(':id')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una reseña' })
  @ApiResponse({ status: 200, description: 'Reseña eliminada' })
  @ApiResponse({ status: 404, description: 'Reseña no encontrada' })
  @ApiResponse({ status: 403, description: 'Solo puedes eliminar tus propias reseñas' })
  remove(@Param('id') id: string, @getUser() user: User) {
    return this.reviewService.remove(+id, user);
  }
}
