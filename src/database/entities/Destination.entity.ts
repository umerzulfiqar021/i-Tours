import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TripPlan } from './TripPlan.entity';
import { Hotel } from './Hotel.entity';

@Entity()
export class Destination {
  @PrimaryGeneratedColumn()
  id: number; // dest_id PK

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  budgetRange: string; // budget_range

  @Column('decimal', { precision: 2, scale: 1, nullable: true })
  rating: number;

  // One destination can have many trip plans
  @OneToMany(() => TripPlan, (tripPlan) => tripPlan.destination)
  tripPlans: TripPlan[];

  // One destination can have many hotels
  @OneToMany(() => Hotel, (hotel) => hotel.destination)
  hotels: Hotel[];
}
