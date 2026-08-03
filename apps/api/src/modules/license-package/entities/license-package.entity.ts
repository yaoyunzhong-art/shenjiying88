import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('license_packages')
export class LicensePackage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'int' })
  duration!: number;

  @Column({ type: 'varchar', length: 20, default: 'month' })
  durationUnit!: string;

  @Column({ name: 'max_users', type: 'int', default: 10 })
  maxUsers!: number;

  @Column({ name: 'max_stores', type: 'int', default: 1 })
  maxStores!: number;

  @Column({ type: 'simple-array', nullable: true })
  features?: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 64, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 64, nullable: true })
  updatedBy?: string;

  @Column({ name: 'deleted_by', type: 'varchar', length: 64, nullable: true })
  deletedBy?: string;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
