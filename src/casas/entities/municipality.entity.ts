import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Province } from './provinces.entity';

@Entity('municipalities')
export class Municipality {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name must be less than 100 characters' })
  name: string;

  @ManyToOne(() => Province, (province) => province.municipalities)
  province: Province;
}
