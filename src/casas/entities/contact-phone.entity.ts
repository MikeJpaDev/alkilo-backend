import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Casa } from './casa.entity';

@Entity('contact-phone')
export class ContactPhone {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column('text', { nullable: false })
  name: string;

  @Column('text', { nullable: false })
  number: string;

  @ManyToOne(() => Casa, (casa) => casa.contacts, { onDelete: 'CASCADE' })
  houseId: Casa;
}
