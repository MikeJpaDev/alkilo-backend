import { IsString, IsNotEmpty, MinLength, IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchCasasDto {
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
    description: 'Número de página',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página',
    example: 10,
    minimum: 1,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Orden de resultados',
    example: 'relevance',
    enum: ['relevance', 'price_asc', 'price_desc', 'newest'],
    default: 'relevance',
  })
  @IsOptional()
  @IsIn(['relevance', 'price_asc', 'price_desc', 'newest'])
  sortBy?: string = 'relevance';
}
