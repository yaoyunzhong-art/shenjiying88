/**
 * suppliers/[id]/page.tsx — 供应商详情页路由 (ToB Next.js App Router)
 * 角色视角: 👔品牌运营 / 💳采购经理
 */
'use client';

import React, { use, Suspense } from 'react';
import Link from 'next/link';
import { MOCK_SUPPLIERS } from '../../suppliers-data';
import { SupplierDetailPage } from '../components/SupplierDetailPage';
import type { SupplierDetail } from '../components/SupplierDetailPage';

/* ── 扩展 Mock 数据构建详情 ── */
function buildSupplierDetail(id: string): SupplierDetail | null {
  const base = MOCK_SUPPLIERS.find((s) => s.id === id);
  if (!base) return null;

  const recentOrders = [
    { id: `PO-2026-${String(600 + Math.floor(Math.random() * 30)).padStart(4, '0')}`, product: '玻尿酸精华液', amount: 58000, date: '2026-06-20', status: '已收货' },
    { id: `PO-2026-${String(580 + Math.floor(Math.random() * 20)).padStart(4, '0')}`, product: '神经酰胺面霜', amount: 42000, date: '2026-06-18', status: '运输中' },
    { id: `PO-2026-${String(560 + Math.floor(Math.random() * 20)).padStart(4, '0')}`, product: '氨基酸洁面乳', amount: 28000, date: '2026-06-10', status: '已完成' },
    { id: `PO-2026-${String(540 + Math.floor(Math.random() * 20)).padStart(4, '0')}`, product: '防晒霜 SPF50', amount: 45000, date: '2026-06-05', status: '已完成' },
    { id: `PO-2026-${String(520 + Math.floor(Math.random() * 20)).padStart(4, '0')}`, product: '修护精华液', amount: 62000, date: '2026-05-28', status: '已完成' },
  ];

  const evaluations = [
    { date: '2026-06-15', score: 5, comment: '产品质量很好，交货准时，推荐合作。', reviewer: '张采购' },
    { date: '2026-05-20', score: 4, comment: '整体满意，包装可以进一步改进。', reviewer: '李经理' },
    { date: '2026-04-10', score: 5, comment: '响应速度快，品质稳定。', reviewer: '王采购' },
  ];

  return {
    ...base,
    description: '长期合作供应商，产品质量稳定，交货及时。',
    orderCount: Math.floor(base.totalProducts * 3.2),
    returnRate: (Math.random() * 4).toFixed(1) + '%',
    avgDeliveryDays: Math.floor(Math.random() * 7) + 2,
    qualityScore: +(3.5 + Math.random() * 1.5).toFixed(1),
    recentOrders,
    evaluations,
  };
}

/* ── 内容组件: 使用 use() 解析 Promise params ── */
function SupplierContent({ params }: { params: Promise<{ id: string }> }): React.ReactElement {
  const { id } = use(params);
  const supplier = buildSupplierDetail(id);

  if (!supplier) {
    return (
      <div style={{ maxWidth: 800, margin: '48px auto', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>供应商未找到</h2>
        <p style={{ color: '#6b7280', fontSize: 15, margin: 0 }}>
          未找到编码为「{id}」的供应商信息，请检查后重试。
        </p>
        <Link href="/suppliers" style={{ display: 'inline-block', marginTop: 20, padding: '10px 24px', backgroundColor: '#2563eb', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          ← 返回供应商列表
        </Link>
      </div>
    );
  }

  return <SupplierDetailPage supplier={supplier} />;
}

/* ── 默认导出: 包裹 Suspense ── */
export default function SupplierDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>加载中...</div>}>
      <SupplierContent params={params} />
    </Suspense>
  );
}
