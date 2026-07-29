/**
 * 店长工作台 - Store Manager Workbench
 * 角色: 👔门店店长
 * 功能: 今日运营仪表盘、待办任务、设备状态、热门商品、人员排班、营收看板
 */

import { getAdminWorkbenchConsumerSnapshot, getRoleWorkbench } from '../../bootstrap';
import StoreManagerWorkbenchClient from './store-manager-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StoreManagerWorkbenchPage() {
  const [snapshot, roleWorkbench] = await Promise.all([
    getAdminWorkbenchConsumerSnapshot(),
    getRoleWorkbench('STORE_MANAGER'),
  ]);

  return (
    <StoreManagerWorkbenchClient
      deliveryMode={snapshot.deliveryMode}
      roleWorkbench={roleWorkbench}
    />
  );
}
