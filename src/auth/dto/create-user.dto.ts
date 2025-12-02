import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsCI } from '../validations/is-ci-valid';

export class CreateUserDto {
  @ApiProperty({
    description: 'Cédula de Identidad cubana',
    example: '99010112345',
    minLength: 11,
    maxLength: 11,
  })
  @IsString()
  @IsNotEmpty({ message: 'CI is required' })
  @MinLength(11, { message: 'CI must be 11 characters' })
  @MaxLength(11)
  @IsCI()
  ci: string;

  @ApiProperty({
    description: 'Primer nombre del usuario',
    example: 'Juan',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'Apellidos del usuario',
    example: 'Pérez García',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'juan.perez@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Contraseña (mínimo 8 caracteres, debe incluir mayúscula, minúscula, número y carácter especial)',
    example: 'Password123!',
    minLength: 6,
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(150)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain uppercase, lowercase, number and special character',
    },
  )
  password: string;

  @ApiProperty({
    description: 'Dirección del usuario',
    example: 'Calle 23 #456, Vedado, La Habana',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;
}
