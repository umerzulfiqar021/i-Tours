import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Destination } from './Destination.entity';

export enum Severity {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

@Entity()
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: Severity,
  })
  severity: Severity;

  @Column()
  timestamp: Date;

  @ManyToOne(() => Destination, (destination) => destination.alerts)
  destination: Destination;
}
