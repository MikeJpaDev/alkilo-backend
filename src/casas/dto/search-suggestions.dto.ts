import { IsString, IsNotEmpty, MinLength, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchSuggestionsDto {
  @ApiProperty({
    description: 'Término de búsqueda',
    example: 'Vedado',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Search term must be at least 2 characters' })
  query: string;

  @ApiPropertyOptional({
    description: 'Límite de sugerencias a retornar',
    example: 10,
    minimum: 1,
    maximum: 20,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit?: number = 10;
}
