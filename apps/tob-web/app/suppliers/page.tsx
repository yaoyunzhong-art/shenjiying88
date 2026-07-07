/**
 * suppliers/page.tsx — 供应商管理列表页 (ToB Next.js App Router)
 * 角色视角: 👔品牌运营 / 💳采购经理
 * 功能: 搜索、品类筛选、状态筛选、分页浏览供应商列表
 */
import React from 'react';
import { SuppliersPage } from './components/SuppliersPage';
import { MOCK_SUPPLIERS } from '../suppliers-data';

export default async function SuppliersListPage() {
  return (
    <SuppliersPage
      items={MOCK_SUPPLIERS}
      total={MOCK_SUPPLIERS.length}
      page={1}
      pageSize={15}
    />
  );
}
