// StockItem 实体脚手架 · Phase-17 T1
// 创建: 2026-07-18 · 库存管理模块
// 状态: 🚧 SKELETON · 等待实际实施

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StockItemStatus {
  ACTIVE = 'ACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

/**
 * StockItem 库存商品实体
 *
 * 表示各门店的库存商品，支持按品类和门店维度管理。
 *
 * @example
 * {
 *   id: 'stock-item-001',
 *   name: '可乐 330ml',
 *   sku: 'COLA-330ML-CAN',
 *   category: '饮品',
 *   quantity: 200,
 *   price: 3.50,
 *   status: StockItemStatus.ACTIVE,
 *   storeId: 'store-001',
 * }
 */
@Entity('stock_item')
@Index(['storeId', 'sku'], { unique: true })
@Index(['storeId', 'category'])
@Index(['storeId', 'status'])
export class StockItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  sku!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category!: string | null;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'varchar', length: 20, default: StockItemStatus.ACTIVE })
  status!: StockItemStatus;

  @Column({ type: 'varchar', name: 'tenant_id', length: 128, nullable: true })
  @Index()
  /** 租户 ID（RLS 多租户隔离字段） */
  tenantId?: string;

  @Column({ type: 'varchar' })
  storeId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
