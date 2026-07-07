/**
 * 店长工作台页 — Store Manager Dashboard (Next.js App Router Page)
 * 角色: 店长视角，展示门店经营概览、待办任务、设备状态、快速操作
 */
import React from 'react';
import { StoreManagerDashboardClient } from './store-manager-client';

export default function StoreManagerPage() {
  return <StoreManagerDashboardClient />;
}
