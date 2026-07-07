import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type LowcodePageStatus = 'draft' | 'published';

@Entity('lowcode_pages')
export class LowcodePage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  @Index()
  name!: string;

  @Column({ name: 'template_id', length: 100 })
  templateId!: string;

  @Column({ type: 'jsonb', default: [] })
  components!: Record<string, unknown>[];

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status!: LowcodePageStatus;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('lowcode_audit_metrics')
export class LowcodeAuditMetric {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200 })
  @Index()
  name!: string;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  value!: number;

  @Column({ type: 'jsonb', default: {} })
  tags!: Record<string, string>;

  @Column({ type: 'timestamptz' })
  @Index()
  timestamp!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
