import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContactPhone } from '../entities/contact-phone.entity';
import { ContactPhoneDto } from './create-contact-phone.dto';

export class CreateCasaDto {
  @ApiProperty({
    description: 'Título de la casa',
    example: 'Casa Colonial en Vedado',
    maxLength: 200,
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Descripción detallada de la casa',
    example: 'Hermosa casa colonial con patio y vista al mar',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Precio por noche en CUP',
    example: 3500,
    minimum: 0,
    maximum: 1000000,
  })
  @IsPositive()
  @Max(1000000)
  @IsNumber({}, { message: 'Price must be a decimal number' })
  @Min(0, { message: 'Price must be positive' })
  @Type(() => Number)
  pricePerNight: number;

  @ApiProperty({
    description: 'Cantidad de habitaciones',
    example: 2,
    minimum: 1,
  })
  @IsInt({ message: 'Bedrooms must be an integer' })
  @Min(1, { message: 'Must have at least 1 bedroom' })
  bedroomsCount: number;

  @ApiProperty({
    description: 'Cantidad de baños',
    example: 1,
    minimum: 1,
  })
  @IsInt({ message: 'Bathrooms must be an integer' })
  @Min(1, { message: 'Must have at least 1 bathroom' })
  bathroomsCount: number;

  @ApiProperty({
    description: 'Capacidad de personas',
    example: 4,
    minimum: 1,
  })
  @IsInt({ message: 'Capacity must be an integer' })
  @Min(1, { message: 'Must accommodate at least 1 person' })
  capacityPeople: number;

  @ApiProperty({
    description: 'Dirección completa',
    example: 'Calle 23 #456 entre L y M, Vedado',
  })
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @ApiProperty({
    description: 'Lista de contactos telefónicos',
    type: [ContactPhoneDto],
    example: [{ name: 'Pedro López', number: '+5352123456' }],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one contact is required' })
  @ValidateNested({ each: true })
  @Type(() => ContactPhoneDto)
  contacts: ContactPhoneDto[];

  @ApiProperty({
    description: 'ID del municipio',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  municipalityId: number;
}
