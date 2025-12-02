import { Exclude } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Casa } from 'src/casas/entities/casa.entity';
import { Review } from 'src/review/entities/review.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ci', unique: true, length: 11 })
  @IsString({ message: 'CI must be a string' })
  @IsNotEmpty({ message: 'CI is required' })
  @MaxLength(11, { message: 'CI must be 11 characters' })
  ci: string;

  @Column({ name: 'first_name', length: 100 })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(100)
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(100)
  lastName: string;

  @Column({ unique: true, length: 255 })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @Exclude() //No devolver contra
  password: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  //No se si es string o number lo que me dijiste de guardarlo
  @Column({ name: 'profile_picture', nullable: true, length: 500 })
  @IsOptional()
  @IsString()
  profilePicture?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;

  //ToDo faltan Roles
  @Column('text', { array: true, default: ['user'] })
  roles: string[];

  @OneToMany(() => Casa, (casa) => casa.createdBy)
  casas: Casa[];

  @OneToMany(() => Review, (reviews) => reviews.userFk)
  reviews: Review[];

  @BeforeInsert()
  checkfieldsBeforeInsert() {
    this.email = this.email.toLowerCase().trim();
  }

  @BeforeUpdate()
  checkfieldsBeforeUpdate() {
    this.email = this.email.toLowerCase().trim();
  }
}
