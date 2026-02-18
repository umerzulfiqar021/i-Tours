import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User.entity';
import { Destination } from './Destination.entity';
import { Alert } from './Alert.entity';

export enum TripType {
  FRIENDS = 'friends',
  SOLO = 'solo',
  FAMILY = 'family',
  COUPLE = 'couple',
}

@Entity()
export class TripPlan {
  @PrimaryGeneratedColumn()
  id: number; // trip_id PK

  @Column({
    type: 'enum',
    enum: TripType,
    default: TripType.SOLO,
  })
  tripType: TripType;

  @Column({ default: 1 })
  numberOfPersons: number;

  @Column({ nullable: true })
  stayDuration: string;

  @Column()
  startDate: Date; // start_date

  @Column()
  endDate: Date; // end_date

  @Column('text', { nullable: true })
  routePath: string; // route_path

  @Column({ default: 'planned' })
  status: string;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.tripPlans, { eager: true, nullable: true })
  user: User; // user_id FK

  @ManyToOne(() => Destination, (destination) => destination.tripPlans, { eager: true, nullable: true })
  destination: Destination; // dest_id FK

  @OneToMany(() => Alert, (alert) => alert.tripPlan)
  alerts: Alert[];
}
