import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type RenewalStatus = 'pending' | 'success' | 'failed';

@Entity('license_renewal_records')
@Index(['licenseId', 'tenantId'])
export class LicenseRenewalRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'license_id' })
  @Index()
  licenseId!: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId!: string;

  @Column({ name: 'package_id', nullable: true })
  packageId?: string;

  @Column({ name: 'package_name', nullable: true })
  packageName?: string;

  @Column({ name: 'previous_expire_at', type: 'timestamptz', nullable: true })
  previousExpireAt?: Date;

  @Column({ name: 'new_expire_at', type: 'timestamptz', nullable: true })
  newExpireAt?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price!: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: RenewalStatus;

  @Column({ name: 'error_message', nullable: true })
  errorMessage?: string;

  @Column({ name: 'payment_id', nullable: true })
  paymentId?: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
