import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { TripPlan } from './TripPlan.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column('jsonb', { nullable: true })
  preferences: any;

  @OneToMany(() => TripPlan, (tripPlan) => tripPlan.user)
  tripPlans: TripPlan[];
}
