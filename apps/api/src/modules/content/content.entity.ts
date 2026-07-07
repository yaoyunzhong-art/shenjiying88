/**
 * content.entity.ts - 内容管理实体
 * 用途: 通用内容管理实体定义，支持图文、公告、活动内容等
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type ContentStatus = 'draft' | 'published' | 'archived' | 'deleted';

export type ContentCategory =
  | 'notice'         // 公告
  | 'activity'       // 活动内容
  | 'guide'          // 指南
  | 'news'           // 新闻
  | 'promotion'      // 促销
  | 'education'      // 教育
  | 'other';         // 其他

export interface ContentMetadata {
  tags?: string[];
  author?: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
  readTimeMinutes?: number;
  version?: number;
}

@Entity('contents')
@Index(['category', 'status'])
@Index(['authorId', 'createdAt'])
@Index(['publishedAt'])
export class ContentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title!: string;

  @Column({ name: 'slug', type: 'varchar', length: 255, unique: true })
  @Index()
  slug!: string;

  @Column({ name: 'summary', type: 'text', nullable: true })
  summary?: string;

  @Column({ name: 'body', type: 'text' })
  body!: string;

  @Column({ name: 'category', type: 'varchar', length: 50 })
  @Index()
  category!: ContentCategory;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'draft' })
  @Index()
  status!: ContentStatus;

  @Column({ name: 'author_id', type: 'varchar', length: 100 })
  authorId!: string;

  @Column({ name: 'cover_image_url', type: 'varchar', length: 500, nullable: true })
  coverImageUrl?: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: ContentMetadata;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  @Index()
  publishedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
