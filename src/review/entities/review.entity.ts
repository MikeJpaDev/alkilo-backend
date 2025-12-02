import { IsInt, IsOptional, IsString } from 'class-validator';
import { User } from 'src/auth/entities/user.entity';
import { Casa } from 'src/casas/entities/casa.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Casa, (casa) => casa.reviews, { onDelete: 'CASCADE' })
  casaFk: Casa;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  userFk: User;

  @Column()
  @IsInt({ message: 'Rating must be an integer' })
  rating: number; // 1-5 validation in service or DTO

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString({ message: 'Comment must be a string' })
  comment?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
