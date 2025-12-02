import {
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class ContactPhoneDto {
  @IsString()
  @IsNotEmpty({ message: 'name is required' })
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'number is required' })
  @IsPhoneNumber('CU', { message: 'Invalid phone number format' })
  number: number;
}
