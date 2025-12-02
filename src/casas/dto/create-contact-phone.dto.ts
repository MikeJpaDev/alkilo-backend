import {
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContactPhoneDto {
  @ApiProperty({
    description: 'Nombre del contacto',
    example: 'Pedro López',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Número de teléfono cubano',
    example: '+5352123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'number is required' })
  @IsPhoneNumber('CU', { message: 'Invalid phone number format' })
  number: string;
}
