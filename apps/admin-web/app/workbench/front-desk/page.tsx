/**
 * 前台操作面板 — Front Desk Workbench (Next.js App Router Page)
 * 角色视角: 🎯前台收银/服务人员
 * 功能: 购物篮收银 / 排队叫号 / 快捷操作 / 今日营业数据 / 支付处理
 */

import { getAdminWorkbenchConsumerSnapshot, getRoleWorkbench } from '../../bootstrap';
import FrontDeskWorkbenchClient from './front-desk-client';

export default async function FrontDeskWorkbenchPage() {
  const [snapshot, roleWorkbench] = await Promise.all([
    getAdminWorkbenchConsumerSnapshot(),
    getRoleWorkbench('CASHIER'),
  ]);

  return (
    <FrontDeskWorkbenchClient
      deliveryMode={snapshot.deliveryMode}
      roleWorkbench={roleWorkbench}
    />
  );
}
