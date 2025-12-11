import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { TripPlan } from './TripPlan.entity';
import { Alert } from './Alert.entity';
import { Hotel } from './Hotel.entity';

@Entity()
export class Destination {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal')
  latitude: number;

  @Column('decimal')
  longitude: number;

  @Column('text')
  description: string;

  @Column()
  type: string;

  @ManyToOne(() => TripPlan, (tripPlan) => tripPlan.destinations)
  tripPlan: TripPlan;

  @OneToMany(() => Alert, (alert) => alert.destination)
  alerts: Alert[];

  @OneToMany(() => Hotel, (hotel) => hotel.destination)
  hotels: Hotel[];
}
