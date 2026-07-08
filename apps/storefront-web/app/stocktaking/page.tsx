/**
 * 库存盘点列表页 — Stocktaking List Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🔧仓管
 * 功能: 搜索盘点单、筛选状态、分页查看、跳转新建/详情
 */
import React from 'react';
import { StocktakingPageClient } from './stocktaking-client';

/** 盘点单状态 */
export type StocktakingStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

/** 盘点单 */
export interface StocktakingRecord {
  id: string;
  batchNo: string;
  storeName: string;
  initiator: string;
  totalItems: number;
  checkedItems: number;
  discrepancyCount: number;
  status: StocktakingStatus;
  createdAt: string;
  completedAt?: string;
}

/* ── Mock 数据 ── */
const MOCK_RECORDS: StocktakingRecord[] = [
  {
    id: 'st-001', batchNo: 'PD-20260708-001', storeName: '朝阳旗舰店',
    initiator: '张三', totalItems: 320, checkedItems: 320, discrepancyCount: 2,
    status: 'completed', createdAt: '2026-07-08 08:30', completedAt: '2026-07-08 10:15',
  },
  {
    id: 'st-002', batchNo: 'PD-20260708-002', storeName: '朝阳旗舰店',
    initiator: '李四', totalItems: 150, checkedItems: 98, discrepancyCount: 0,
    status: 'in_progress', createdAt: '2026-07-08 09:00',
  },
  {
    id: 'st-003', batchNo: 'PD-20260707-001', storeName: '海淀分店',
    initiator: '王五', totalItems: 280, checkedItems: 280, discrepancyCount: 5,
    status: 'completed', createdAt: '2026-07-07 14:00', completedAt: '2026-07-07 16:30',
  },
  {
    id: 'st-004', batchNo: 'PD-20260707-002', storeName: '西单体验店',
    initiator: '赵六', totalItems: 200, checkedItems: 0, discrepancyCount: 0,
    status: 'draft', createdAt: '2026-07-07 11:20',
  },
  {
    id: 'st-005', batchNo: 'PD-20260706-001', storeName: '朝阳旗舰店',
    initiator: '张三', totalItems: 320, checkedItems: 320, discrepancyCount: 1,
    status: 'completed', createdAt: '2026-07-06 08:30', completedAt: '2026-07-06 11:00',
  },
  {
    id: 'st-006', batchNo: 'PD-20260705-001', storeName: '望京分店',
    initiator: '钱七', totalItems: 180, checkedItems: 50, discrepancyCount: 0,
    status: 'in_progress', createdAt: '2026-07-05 15:00',
  },
  {
    id: 'st-007', batchNo: 'PD-20260704-001', storeName: '海淀分店',
    initiator: '孙八', totalItems: 280, checkedItems: 280, discrepancyCount: 0,
    status: 'completed', createdAt: '2026-07-04 09:00', completedAt: '2026-07-04 11:45',
  },
  {
    id: 'st-008', batchNo: 'PD-20260703-001', storeName: '西单体验店',
    initiator: '周九', totalItems: 200, checkedItems: 0, discrepancyCount: 0,
    status: 'cancelled', createdAt: '2026-07-03 08:00', completedAt: '2026-07-03 08:30',
  },
];

export default function StocktakingListPage() {
  return (
    <StocktakingPageClient
      records={MOCK_RECORDS}
      total={MOCK_RECORDS.length}
    />
  );
}
