import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidRoles } from '../interfaces/valid-roles';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Cédula de Identidad cubana',
    example: '99010112345',
    minLength: 11,
    maxLength: 11,
  })
  @IsString()
  @IsNotEmpty({ message: 'CI is required' })
  @MinLength(11, { message: 'CI must be 11 characters' })
  @MaxLength(11)
  @IsOptional()
  ci?: string;

  @ApiPropertyOptional({
    description: 'Primer nombre del usuario',
    example: 'Juan',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellidos del usuario',
    example: 'Pérez García',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Email del usuario',
    example: 'juan.perez@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Nueva contraseña',
    example: 'NewPassword123!',
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
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({
    description: 'Dirección del usuario',
    example: 'Calle 23 #456, Vedado, La Habana',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Roles del usuario',
    example: ['user', 'admin'],
    enum: ValidRoles,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ValidRoles, {
    each: true,
    message: `Role must be user, admin or superUser`,
  })
  roles?: ValidRoles[];
}
