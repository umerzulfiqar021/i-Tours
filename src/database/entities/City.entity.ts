import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

/**
 * Entity representing a City in Pakistan, based on GeoNames data.
 * Used for autocompletion and location-based trip planning.
 */
@Entity('cities')
export class City {

  @PrimaryColumn({ type: 'bigint' })
  id: number;

  @Column({ length: 255 })
  @Index('idx_city_name_lower', { synchronize: false }) // Handle lower case index manually or via migration if needed, but for TypeORM:
  name: string;

  @Column({ length: 255, nullable: true })
  asciiname: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  @Index()
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  @Index()
  longitude: number;

  @Column({ length: 5, nullable: true })
  feature_class: string;

  @Column({ length: 10, nullable: true })
  feature_code: string;

  @Column({ length: 5, nullable: true })
  country_code: string;

  @Column({ type: 'bigint', default: 0 })
  @Index()
  population: number;

  @Column({ length: 100, nullable: true })
  timezone: string;

  @Column({ type: 'date', nullable: true })
  modification_date: Date | null;
}


