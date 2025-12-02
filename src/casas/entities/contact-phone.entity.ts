import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Casa } from './casa.entity';

@Entity('contact-phone')
export class ContactPhone {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: false })
  number: number;

  @ManyToOne(() => Casa, (casa) => casa.contacts)
  houseId: Casa;
}
