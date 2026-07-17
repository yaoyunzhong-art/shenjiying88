// StockTransaction 实体脚手架 · Phase-17 T1
// 创建: 2026-07-18 · 库存管理模块
// 状态: 🚧 SKELETON · 等待实际实施

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum StockTransactionType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

/**
 * StockTransaction 出入库记录实体
 *
 * 记录库存商品的入库、出库和调整操作，支持审计追踪。
 *
 * @example
 * {
 *   id: 'txn-001',
 *   stockItemId: 'stock-item-001',
 *   type: StockTransactionType.IN,
 *   quantity: 100,
 *   reason: '补货入库',
 *   operatorId: 'user-001',
 *   storeId: 'store-001',
 * }
 */
@Entity('stock_transaction')
@Index(['stockItemId'])
@Index(['storeId', 'createdAt'])
@Index(['operatorId'])
export class StockTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  stockItemId!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: StockTransactionType;

  /**
   * 变动数量:
   * - 入库(IN) > 0
   * - 出库(OUT) < 0
   * - 调整(ADJUSTMENT) 可为正或负
   */
  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  reason!: string | null;

  @Column({ type: 'varchar' })
  operatorId!: string;

  @Column({ type: 'varchar' })
  storeId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
