'use client';

import React from 'react';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 采购订单快照 */
export interface PurchaseOrderSnapshot {
  id: string;
  orderNo: string;
  /** 供应商 */
  supplier: string;
  /** 采购金额 */
  amount: number;
  /** 状态 */
  status: 'pending_approval' | 'approved' | 'shipped' | 'partial_received' | 'completed' | 'cancelled';
  /** 下单日期 */
  orderedAt: string;
  /** 预计到货 */
  expectedArrival: string;
  /** 到货率 (0-100) */
  arrivalRate: number;
  /** 采购员 */
  buyer: string;
}

/** 采购汇总指标 */
export interface ProcurementSummary {
  /** 进行中订单数 */
  activeOrders: number;
  /** 本月采购总额 */
  monthlyTotalAmount: number;
  /** 环比上月 */
  monthlyTrend: number;
  /** 本月到货订单 */
  monthlyArrivedOrders: number;
  /** 平均到货时长(天) */
  avgArrivalDays: number;
  /** 到货准时率 */
  onTimeRate: number;
  /** 待审批订单 */
  pendingApprovalCount: number;
  /** 异常订单数 */
  anomalyCount: number;
}

/** 供应商概况 */
export interface SupplierOverview {
  id: string;
  name: string;
  /** 合作等级 */
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  /** 本月采购额 */
  monthlyAmount: number;
  /** 到货准时率 */
  onTimeRate: number;
  /** 退货率 */
  returnRate: number;
  /** 活跃合同数 */
  activeContracts: number;
  /** 上次采购 */
  lastPurchaseDate: string;
  /** 状态 */
  status: 'active' | 'suspended' | 'onboarding';
}

export interface ProcurementManagerDashboardProps {
  /** 采购汇总 */
  summary: ProcurementSummary;
  /** 采购订单列表 */
  orders: PurchaseOrderSnapshot[];
  /** 供应商概况 */
  suppliers: SupplierOverview[];
  /** 用户名 */
  userName?: string;
  /** 近期待办任务(审批/异常) */
  pendingApprovals?: number;
}

// ---- 子组件 ----

function StatusLabel({ status }: { status: PurchaseOrderSnapshot['status'] }) {
  const map: Record<PurchaseOrderSnapshot['status'], { text: string; variant: 'info' | 'success' | 'warning' | 'neutral' | 'danger' }> = {
    pending_approval: { text: '待审批', variant: 'warning' },
    approved: { text: '已批准', variant: 'info' },
    shipped: { text: '已发货', variant: 'info' },
    partial_received: { text: '部分到货', variant: 'warning' },
    completed: { text: '已完成', variant: 'success' },
    cancelled: { text: '已取消', variant: 'danger' },
  };
  const m = map[status];
  return <StatusBadge variant={m.variant} label={m.text} />;
}

function SupplierTier({ tier }: { tier: SupplierOverview['tier'] }) {
  const map: Record<SupplierOverview['tier'], { text: string; color: string }> = {
    platinum: { text: '铂金', color: '#a375e0' },
    gold: { text: '黄金', color: '#d4a017' },
    silver: { text: '白银', color: '#999' },
    bronze: { text: '青铜', color: '#cd7f32' },
  };
  const m = map[tier];
  return (
    <span style={{ color: m.color, fontWeight: 600, fontSize: 13 }}>
      {m.text}
    </span>
  );
}

// ---- 主组件 ----

export function ProcurementManagerDashboard({
  summary,
  orders,
  suppliers,
  userName = '采购经理',
  pendingApprovals = 0,
}: ProcurementManagerDashboardProps) {
  const statItems: QuickStatItem[] = [
    {
      label: '进行中订单',
      value: String(summary.activeOrders),
    },
    {
      label: '本月采购额',
      value: `¥${(summary.monthlyTotalAmount / 10000).toFixed(1)}万`,
    },
    {
      label: '平均到货(天)',
      value: String(summary.avgArrivalDays),
    },
    {
      label: '到货准时率',
      value: `${summary.onTimeRate}%`,
    },
  ];

  const orderColumns: DataTableColumn<PurchaseOrderSnapshot>[] = [
    { key: 'orderNo', header: '采购单号', dataKey: 'orderNo' },
    { key: 'supplier', header: '供应商', dataKey: 'supplier' },
    { key: 'buyer', header: '采购员', dataKey: 'buyer' },
    {
      key: 'amount',
      header: '金额',
      render: (row) => `¥${row.amount.toFixed(2)}`,
    },
    {
      key: 'status',
      header: '状态',
      render: (row) => <StatusLabel status={row.status} />,
    },
    {
      key: 'arrivalRate',
      header: '到货率',
      render: (row) => `${row.arrivalRate}%`,
    },
    { key: 'expectedArrival', header: '预计到货', dataKey: 'expectedArrival' },
  ];


  const supplierColumns: DataTableColumn<SupplierOverview>[] = [
    { key: 'name', header: '供应商名称', dataKey: 'name' },
    {
      key: 'tier',
      header: '等级',
      render: (row) => <SupplierTier tier={row.tier} />,
    },
    {
      key: 'monthlyAmount',
      header: '本月采购额',
      render: (row) => `¥${(row.monthlyAmount / 10000).toFixed(1)}万`,
    },
    {
      key: 'onTimeRate',
      header: '准时率',
      render: (row) => `${row.onTimeRate}%`,
    },
    {
      key: 'returnRate',
      header: '退货率',
      render: (row) => `${row.returnRate}%`,
    },
    { key: 'status', header: '状态', render: (row) => row.status === 'active' ? '正常' : row.status === 'suspended' ? '暂停' : '入驻中' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>
      {/* 头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{userName}工作台</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>
            采购管理 | {pendingApprovals > 0 && `待审批 ${pendingApprovals} 项 | `}{summary.anomalyCount > 0 && `异常 ${summary.anomalyCount} 项 | `}{new Date().toLocaleDateString('zh-CN')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            📄 新建采购单
          </button>
          <button
            type="button"
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: '1px solid #1677ff',
              background: '#1677ff',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            📊 采购报表
          </button>
        </div>
      </div>

      {/* 汇总指标 */}
      <QuickStats items={statItems} />

      {/* 异常提醒 */}
      {summary.anomalyCount > 0 && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            fontSize: 14,
            color: '#cf1322',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          ⚠️ 当前有 {summary.anomalyCount} 个异常采购订单，请及时处理！
        </div>
      )}

      {/* 采购订单 */}
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>采购订单</h3>
        <DataTable columns={orderColumns} data={orders} rowKey={(r) => r.id} />
      </div>

      {/* 供应商概况 */}
      <div>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600 }}>供应商概况</h3>
        <DataTable columns={supplierColumns} data={suppliers} rowKey={(r) => r.id} />
      </div>
    </div>
  );
}
