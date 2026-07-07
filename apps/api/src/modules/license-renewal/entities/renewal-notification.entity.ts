import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type NotificationType = 'reminder' | 'success' | 'failure';

@Entity('renewal_notifications')
@Index(['licenseId', 'tenantId'])
export class RenewalNotification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'license_id' })
  @Index()
  licenseId!: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId!: string;

  @Column({ type: 'varchar', length: 20, default: 'reminder' })
  type!: NotificationType;

  @Column({ name: 'reminder_days', type: 'int', nullable: true })
  reminderDays?: number;

  @Column({ name: 'sent_at', type: 'timestamptz' })
  sentAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
