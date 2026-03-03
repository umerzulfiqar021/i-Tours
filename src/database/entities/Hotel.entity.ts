import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Destination } from './Destination.entity';

@Entity()
export class Hotel {
  @PrimaryGeneratedColumn()
  id: number; // hotel_id PK

  @Column()
  name: string;

  @Column('decimal')
  roomRent: number; // room_rent

  @Column('text', { nullable: true })
  facilities: string;

  @Column({ nullable: true })
  contactInfo: string; // contact_info

  @ManyToOne(() => Destination, (destination) => destination.hotels, {
    eager: true,
    nullable: true,
  })
  destination: Destination; // dest_id FK
}
