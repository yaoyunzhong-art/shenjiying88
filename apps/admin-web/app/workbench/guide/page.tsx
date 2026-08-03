/**
 * 门店导购工作台 - Store Guide Workbench
 * 角色: 🎮导玩员
 * 功能: 今日接待、游戏指导、设备巡检、客户服务、活动推荐
 */

import { getAdminWorkbenchConsumerSnapshot, getRoleWorkbench } from '../../bootstrap';
import GuideWorkbenchClient from './guide-client';

export default async function GuideWorkbenchPage() {
  const [snapshot, roleWorkbench] = await Promise.all([
    getAdminWorkbenchConsumerSnapshot(),
    getRoleWorkbench('GUIDE'),
  ]);

  return (
    <GuideWorkbenchClient
      deliveryMode={snapshot.deliveryMode}
      roleWorkbench={roleWorkbench}
    />
  );
}
