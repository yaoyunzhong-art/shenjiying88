/**
 * 库房管理员工作台页 — Inventory Keeper Dashboard (Next.js App Router Page)
 * 角色视角: 🏭库房管理员
 * 类型: D-角色操作界面
 * 功能: 库房概览、库存预警、入库待处理、出库待处理、库位分配
 */
import React from 'react';
import { InventoryKeeperClient } from './inventory-keeper-client';

export default function InventoryKeeperPage() {
  return <InventoryKeeperClient />;
}
