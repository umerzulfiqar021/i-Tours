import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Hotel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  @Column('decimal')
  roomRent: number;

  @Column('decimal', { precision: 2, scale: 1 })
  rating: number;

  @Column()
  contactDetails: string;
}
