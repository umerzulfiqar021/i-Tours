import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { TripPlan } from './TripPlan.entity';

export enum RiskLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity('alert_history') // Rename table to match ERD
export class Alert {
  @PrimaryGeneratedColumn()
  id: number; // id PK

  @Column({
    type: 'enum',
    enum: RiskLevel,
    nullable: true,
  })
  riskLevel: RiskLevel; // risk_level

  @Column({ nullable: true })
  alertType: string; // alert_type

  @Column('text', { nullable: true })
  message: string;

  @Column({ nullable: true })
  timestamp: Date;

  @ManyToOne(() => TripPlan, (tripPlan) => tripPlan.alerts, {
    eager: true,
    nullable: true,
  })
  tripPlan: TripPlan;
}
