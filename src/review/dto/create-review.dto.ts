import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Calificación de 1 a 5 estrellas',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must be at most 5' })
  rating: number;

  @ApiPropertyOptional({
    description: 'Comentario de la reseña',
    example: 'Excelente lugar, muy limpio y cómodo',
  })
  @IsOptional()
  @IsString({ message: 'Comment must be a string' })
  comment?: string;
}
