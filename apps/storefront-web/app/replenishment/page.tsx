/**
 * 补货申请列表页 — Replenishment List Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🔧仓管
 * 功能: 搜索补货单、筛选状态、分页查看、跳转新建/详情
 */
import React from 'react';
import { ReplenishmentListClient } from './replenishment-client';

/** 补货申请状态 */
export type ReplenishmentStatus = 'draft' | 'pending_approval' | 'approved' | 'shipped' | 'completed' | 'rejected' | 'cancelled';

/** 补货申请单 */
export interface ReplenishmentOrder {
  id: string;
  orderNo: string;
  storeName: string;
  applicant: string;
  itemCount: number;
  totalEstimatedQty: number;
  urgent: boolean;
  status: ReplenishmentStatus;
  reason: string;
  remark?: string;
  createdAt: string;
  approvedAt?: string;
  completedAt?: string;
}

/* ── Mock 数据 ── */
const MOCK_ORDERS: ReplenishmentOrder[] = [
  {
    id: 'rp-001', orderNo: 'BC-20260709-001', storeName: '朝阳旗舰店',
    applicant: '张三', itemCount: 15, totalEstimatedQty: 320, urgent: true,
    status: 'pending_approval', reason: '库存预警，热销商品库存不足',
    createdAt: '2026-07-09 08:30',
  },
  {
    id: 'rp-002', orderNo: 'BC-20260709-002', storeName: '朝阳旗舰店',
    applicant: '李四', itemCount: 8, totalEstimatedQty: 150, urgent: false,
    status: 'draft', reason: '下周活动备货',
    createdAt: '2026-07-09 09:00',
  },
  {
    id: 'rp-003', orderNo: 'BC-20260708-001', storeName: '海淀分店',
    applicant: '王五', itemCount: 22, totalEstimatedQty: 480, urgent: true,
    status: 'approved', reason: '周末活动大促备货',
    createdAt: '2026-07-08 14:00', approvedAt: '2026-07-08 16:30',
  },
  {
    id: 'rp-004', orderNo: 'BC-20260708-002', storeName: '西单体验店',
    applicant: '赵六', itemCount: 5, totalEstimatedQty: 60, urgent: false,
    status: 'completed', reason: '常规补货',
    createdAt: '2026-07-08 10:00', approvedAt: '2026-07-08 11:00', completedAt: '2026-07-08 14:20',
  },
  {
    id: 'rp-005', orderNo: 'BC-20260707-001', storeName: '朝阳旗舰店',
    applicant: '张三', itemCount: 12, totalEstimatedQty: 200, urgent: false,
    status: 'rejected', reason: '不符合补货策略', remark: '请重新评估库存需求',
    createdAt: '2026-07-07 09:15', approvedAt: '2026-07-07 11:30',
  },
  {
    id: 'rp-006', orderNo: 'BC-20260707-002', storeName: '望京分店',
    applicant: '周七', itemCount: 18, totalEstimatedQty: 350, urgent: true,
    status: 'shipped', reason: '商品即将售罄',
    createdAt: '2026-07-07 13:00', approvedAt: '2026-07-07 14:30',
  },
  {
    id: 'rp-007', orderNo: 'BC-20260706-001', storeName: '海淀分店',
    applicant: '王五', itemCount: 10, totalEstimatedQty: 180, urgent: false,
    status: 'cancelled', reason: '已通过其他渠道补充', remark: '已取消',
    createdAt: '2026-07-06 09:00',
  },
  {
    id: 'rp-008', orderNo: 'BC-20260706-002', storeName: '大兴仓储店',
    applicant: '吴八', itemCount: 30, totalEstimatedQty: 600, urgent: false,
    status: 'pending_approval', reason: '季末补货',
    createdAt: '2026-07-06 10:30',
  },
  {
    id: 'rp-009', orderNo: 'BC-20260705-001', storeName: '朝阳旗舰店',
    applicant: '张三', itemCount: 6, totalEstimatedQty: 90, urgent: false,
    status: 'completed', reason: '消耗品补货',
    createdAt: '2026-07-05 08:00', approvedAt: '2026-07-05 10:00', completedAt: '2026-07-05 15:30',
  },
  {
    id: 'rp-010', orderNo: 'BC-20260704-001', storeName: '西单体验店',
    applicant: '赵六', itemCount: 20, totalEstimatedQty: 400, urgent: true,
    status: 'approved', reason: '国庆预热备货',
    createdAt: '2026-07-04 16:00', approvedAt: '2026-07-04 17:30',
  },
];

export default function ReplenishmentPage() {
  return <ReplenishmentListClient orders={MOCK_ORDERS} />;
}
