import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { TripPlan } from './TripPlan.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column('jsonb', { nullable: true })
  preferences: any;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => TripPlan, (tripPlan) => tripPlan.user)
  tripPlans: TripPlan[];
}
