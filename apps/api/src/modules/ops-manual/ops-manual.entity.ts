/**
 * 🐜 自动: [ops-manual] [A] entity 补全
 *
 * 运营手册记录实体
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type OpsManualRole = 'store_manager' | 'sales_staff' | 'cashier' | 'customer_service';
export type OpsManualExportFormat = 'markdown' | 'html' | 'pdf-json' | 'checklist';

@Entity('ops_manual_records')
@Index(['tenantId', 'role'])
export class OpsManualRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId!: string;

  @Column({ name: 'role', type: 'varchar', length: 30 })
  role!: OpsManualRole;

  @Column({ name: 'title' })
  title!: string;

  @Column({ name: 'version', default: '1.0.0' })
  version!: string;

  @Column({ name: 'export_format', type: 'varchar', length: 20, default: 'markdown' })
  exportFormat!: OpsManualExportFormat;

  @Column({ name: 'content', type: 'text', nullable: true })
  content?: string;

  @Column({ name: 'total_sections', type: 'int', default: 0 })
  totalSections!: number;

  @Column({ name: 'total_pages', type: 'int', default: 0 })
  totalPages!: number;

  @Column({ name: 'estimated_read_time', type: 'int', default: 0 })
  estimatedReadTime!: number;

  @Column({ name: 'generated_by', nullable: true })
  generatedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('ops_manual_search_logs')
@Index(['tenantId', 'keyword'])
export class OpsManualSearchLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId!: string;

  @Column({ name: 'role', type: 'varchar', length: 30 })
  role!: OpsManualRole;

  @Column({ name: 'keyword' })
  keyword!: string;

  @Column({ name: 'result_count', type: 'int', default: 0 })
  resultCount!: number;

  @Column({ name: 'searched_by', nullable: true })
  searchedBy?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
