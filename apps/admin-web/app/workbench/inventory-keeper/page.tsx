/**
 * 仓管员工作台 — Inventory Keeper Workbench (Next.js App Router Page)
 * 角色视角: 📦仓库管理员
 * 功能: 库存概览 / 入库待处理 / 出库待处理 / 库存预警 / 快速操作
 */

import { getAdminWorkbenchConsumerSnapshot, getRoleWorkbench } from '../../bootstrap';
import InventoryKeeperWorkbenchClient from './inventory-keeper-client';

export default async function InventoryKeeperWorkbenchPage() {
  const [snapshot, roleWorkbench] = await Promise.all([
    getAdminWorkbenchConsumerSnapshot(),
    getRoleWorkbench('WAREHOUSE'),
  ]);

  return (
    <InventoryKeeperWorkbenchClient
      deliveryMode={snapshot.deliveryMode}
      roleWorkbench={roleWorkbench}
    />
  );
}
