import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

export type LowcodeStatus = 'active' | 'archived' | 'deprecated'

/**
 * 低代码模板定义
 */
@Entity('lowcode_templates')
export class LowcodeTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 200 })
  @Index()
  name!: string

  @Column({ type: 'text', nullable: true })
  description?: string

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: LowcodeStatus

  @Column({ type: 'jsonb', default: [] })
  components!: Array<{ type: string; defaultProps: Record<string, unknown> }>

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>

  @Column({ name: 'created_by', type: 'varchar', length: 64, nullable: true })
  createdBy?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}

/**
 * 低代码页面快照（发布版本管理）
 */
@Entity('lowcode_page_snapshots')
export class LowcodePageSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'page_id', type: 'varchar', length: 64 })
  @Index()
  pageId!: string

  @Column({ type: 'int', default: 1 })
  version!: number

  @Column({ type: 'jsonb' })
  components!: Record<string, unknown>[]

  @Column({ type: 'varchar', length: 255, nullable: true })
  changelog?: string

  @Column({ name: 'published_by', type: 'varchar', length: 64, nullable: true })
  publishedBy?: string

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date
}

/**
 * 低代码组件库项目
 */
@Entity('lowcode_component_library')
export class LowcodeComponentLibrary {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 100 })
  name!: string

  @Column({ type: 'varchar', length: 50 })
  type!: string

  @Column({ type: 'jsonb', default: {} })
  defaultProps!: Record<string, unknown>

  @Column({ type: 'jsonb', default: {} })
  schema!: Record<string, unknown>

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: LowcodeStatus

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
