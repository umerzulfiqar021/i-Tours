import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './User.entity';

export enum TripType {
  FRIENDS = 'friends',
  SOLO = 'solo',
  FAMILY = 'family',
  COUPLE = 'couple',
}

@Entity()
export class TripPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  destination: string;

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
  startDate: Date;

  @Column()
  endDate: Date;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.tripPlans, { eager: true, nullable: true })
  user: User;
}
