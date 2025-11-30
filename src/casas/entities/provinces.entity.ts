import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Municipality } from './municipality.entity';
import { Casa } from './casa.entity';

@Entity('provinces')
export class Province {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(50, { message: 'Name must be less than 50 characters' })
  name: string;

  @OneToMany(() => Municipality, (municipality) => municipality.province, {
    cascade: true,
  })
  municipalities: Municipality;

  @OneToMany(() => Casa, (casa) => casa.munipalityId)
  casasId: Casa[];
}
