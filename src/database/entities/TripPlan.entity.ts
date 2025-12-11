import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './User.entity';
import { Destination } from './Destination.entity';

@Entity()
export class TripPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column()
  duration: number;

  @Column({ default: false })
  isArchived: boolean;

  @ManyToOne(() => User, (user) => user.tripPlans)
  user: User;

  @OneToMany(() => Destination, (destination) => destination.tripPlan)
  destinations: Destination[];
}
