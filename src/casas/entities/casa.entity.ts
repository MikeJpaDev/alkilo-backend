import {
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { User } from 'src/auth/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContactPhone } from './contact-phone.entity';

@Entity('casas')
export class Casa {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.houses, { cascade: true })
  createdBy: User;

  @Column({ length: 200 })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(200)
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ name: 'price_per_night', type: 'decimal', precision: 10, scale: 2 })
  @IsDecimal({}, { message: 'Price must be a decimal number' })
  @Min(0, { message: 'Price must be positive' })
  pricePerNight: number;

  @Column({ name: 'bedrooms_count' })
  @IsInt({ message: 'Bedrooms must be an integer' })
  @Min(1, { message: 'Must have at least 1 bedroom' })
  bedroomsCount: number;

  @Column({ name: 'bathrooms_count', default: 1 })
  @IsInt({ message: 'Bathrooms must be an integer' })
  @Min(1, { message: 'Must have at least 1 bathroom' })
  bathroomsCount: number;

  @Column({ name: 'capacity_people' })
  @IsInt({ message: 'Capacity must be an integer' })
  @Min(1, { message: 'Must accommodate at least 1 person' })
  capacityPeople: number;

  @Column({ type: 'text' })
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @CreateDateColumn({ name: 'created_at' })
  createDate: Date;

  @OneToMany(() => ContactPhone, (contactPhone) => contactPhone.houseId)
  contacts: ContactPhone[];
}
