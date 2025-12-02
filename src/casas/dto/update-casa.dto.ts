import {
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCasaDto {
  @ApiPropertyOptional({
    description: 'Título de la casa',
    example: 'Casa Colonial en Vedado',
    maxLength: 200,
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada de la casa',
    example: 'Hermosa casa colonial con patio y vista al mar',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Precio por noche en CUP',
    example: 3500,
    minimum: 0,
  })
  @IsOptional()
  @IsDecimal({}, { message: 'Price must be a decimal number' })
  @Min(0, { message: 'Price must be positive' })
  pricePerNight?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de habitaciones',
    example: 2,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Bedrooms must be an integer' })
  @Min(1, { message: 'Must have at least 1 bedroom' })
  bedroomsCount?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de baños',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Bathrooms must be an integer' })
  @Min(1, { message: 'Must have at least 1 bathroom' })
  bathroomsCount?: number;

  @ApiPropertyOptional({
    description: 'Capacidad de personas',
    example: 4,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Capacity must be an integer' })
  @Min(1, { message: 'Must accommodate at least 1 person' })
  capacityPeople?: number;

  @ApiPropertyOptional({
    description: 'Dirección completa',
    example: 'Calle 23 #456 entre L y M, Vedado',
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  address?: string;
}
