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
import { ContactPhone } from '../entities/contact-phone.entity';
import { ContactPhoneDto } from './create-contact-phone.dto';

export class CreateCasaDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsPositive()
  @Max(1000000)
  @IsNumber({}, { message: 'Price must be a decimal number' })
  @Min(0, { message: 'Price must be positive' })
  @Type(() => Number)
  pricePerNight: number;

  @IsInt({ message: 'Bedrooms must be an integer' })
  @Min(1, { message: 'Must have at least 1 bedroom' })
  bedroomsCount: number;

  @IsInt({ message: 'Bathrooms must be an integer' })
  @Min(1, { message: 'Must have at least 1 bathroom' })
  bathroomsCount: number;

  @IsInt({ message: 'Capacity must be an integer' })
  @Min(1, { message: 'Must accommodate at least 1 person' })
  capacityPeople: number;

  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'At least one contact is required' })
  @ValidateNested({ each: true })
  @Type(() => ContactPhoneDto)
  contacts: ContactPhoneDto[];

  @IsInt()
  @IsPositive()
  municipalityId: number;
}
