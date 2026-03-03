import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { TripPlan } from './TripPlan.entity';

export enum RiskLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity('intelligence_insights')
export class IntelligenceInsight {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: RiskLevel,
    nullable: true,
  })
  riskLevel: RiskLevel;

  @Column({ nullable: true })
  insightType: string;

  @Column('text', { nullable: true })
  message: string;

  @Column({ nullable: true })
  timestamp: Date;

  @ManyToOne(() => TripPlan, (tripPlan) => tripPlan.intelligenceInsights, {
    eager: true,
    nullable: true,
  })
  tripPlan: TripPlan;
}
