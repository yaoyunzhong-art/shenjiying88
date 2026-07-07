/**
 * 订单列表页 — Order List Page (Next.js App Router Page)
 * 店长/前台视角: 支持搜索、筛选、分页预览
 */
import React from 'react';
import { OrdersPage } from './components/OrdersPage';

export default async function OrdersListPage() {
  return (
    <OrdersPage orders={[]} total={0} page={1} pageSize={20} />
  );
}
