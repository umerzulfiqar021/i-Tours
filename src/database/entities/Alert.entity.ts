import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

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

  @Column({ nullable: true })
  location: string;
}
