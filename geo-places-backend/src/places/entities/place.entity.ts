import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlaceType } from './place-type.enum';

@Entity('places')
export class PlaceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: PlaceType,
    default: PlaceType.OTHER,
  })
  type: PlaceType;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'double precision', default: 0 })
  rating: number;

  @Column({ type: 'double precision' })
  latitude: number;

  @Column({ type: 'double precision' })
  longitude: number;

  @Column({ name: 'event_start_at', type: 'timestamp', nullable: true })
  eventStartAt?: Date;

  @Column({ name: 'ticket_price', type: 'double precision', nullable: true })
  ticketPrice?: number;

  @Column({ name: 'event_details', type: 'text', nullable: true })
  eventDetails?: string;

  @Column({ name: 'ticket_url', nullable: true })
  ticketUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
