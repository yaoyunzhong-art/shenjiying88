/**
 * 供应商详情页 — Supplier Detail Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 💳采购
 * 功能: 供应商详情查看、合作状态流转、编辑、删除
 */
'use client';

import React, { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  DetailShell,
  InfoRow,
  StatusBadge,
  Button,
  DetailActionBar,
  DetailClosureBar,
  Timeline,
  DescriptionList,
  DataTable,
  EmptyState,
  useToast,
  ConfirmDialog,
  type DetailShellAction,
  type DetailActionBarAction,
  type DetailClosureLink,
  type DescriptionItem,
  type DataTableColumn,
} from '@m5/ui';

// ---- 类型 ----

type CooperationStatus = 'active' | 'suspended' | 'terminated' | 'pending';

interface SupplierProduct {
  name: string;
  category: string;
  sku: string;
  unitPrice: number;
  leadTime: string;
}

interface Supplier {
  id: string;
  name: string;
  shortName: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  address: string;
  website: string;
  cooperationStatus: CooperationStatus;
  cooperationSince: string;
  creditLevel: string;
  totalOrders: number;
  totalAmount: number;
  onTimeRate: number;
  qualityRate: number;
  paymentTerms: string;
  categories: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  products: SupplierProduct[];
}

const STATUS_LABELS: Record<CooperationStatus, string> = {
  active: '合作中',
  suspended: '暂停合作',
  terminated: '已终止',
  pending: '待审核',
};

const STATUS_TRANSITIONS: Record<CooperationStatus, CooperationStatus[]> = {
  active: ['suspended'],
  suspended: ['active', 'terminated'],
  terminated: [],
  pending: ['active', 'terminated'],
};

const TRANSITION_LABELS: Record<string, string> = {
  active: '恢复合作',
  suspended: '暂停合作',
  terminated: '终止合作',
};

const CREDIT_LABELS: Record<string, string> = {
  A: 'A级（优秀）',
  B: 'B级（良好）',
  C: 'C级（一般）',
  D: 'D级（待改进）',
};

interface HistoryEntry {
  time: string;
  action: string;
  user: string;
  status: string;
}

const STATUS_HISTORY: HistoryEntry[] = [
  { time: '2025-03-01 10:00', action: '供应商注册申请', user: '系统', status: 'pending' },
  { time: '2025-03-05 14:30', action: '资质审核通过', user: '采购经理王芳', status: 'active' },
  { time: '2025-06-15 09:00', action: '季度评估 A 级', user: '系统', status: 'active' },
  { time: '2025-12-10 16:00', action: '续签合作协议', user: '张店长', status: 'active' },
  { time: '2026-03-01 11:20', action: '半年度评估 A 级', user: '系统', status: 'active' },
];

// ---- Mock 数据 ----

const MOCK_SUPPLIER: Supplier = {
  id: '1',
  name: '广州美妆供应链有限公司',
  shortName: '广州美妆',
  contactPerson: '李明',
  contactPhone: '13800138001',
  email: 'liming@gzmz.com',
  address: '广州市白云区白云大道北168号美妆产业园A栋5楼',
  website: 'www.gzmz.com',
  cooperationStatus: 'active',
  cooperationSince: '2025-03-05',
  creditLevel: 'A',
  totalOrders: 86,
  totalAmount: 1285000,
  onTimeRate: 97.5,
  qualityRate: 99.2,
  paymentTerms: '月结30天',
  categories: ['护肤品', '彩妆', '个人护理'],
  notes: '核心供应商，响应速度快，产品质量稳定。',
  createdAt: '2025-03-01 10:00:00',
  updatedAt: '2026-03-01 11:20:00',
  products: [
    { name: '保湿精华液（100ml）', category: '护肤品', sku: 'ES-100ML-001', unitPrice: 68, leadTime: '3-5天' },
    { name: '洁面乳（150g）', category: '护肤品', sku: 'CF-150G-002', unitPrice: 45, leadTime: '2-4天' },
    { name: '防晒霜（SPF50 60ml）', category: '护肤品', sku: 'SS-60ML-003', unitPrice: 55, leadTime: '3-5天' },
    { name: '丝绒哑光口红', category: '彩妆', sku: 'LP-CLASSIC-001', unitPrice: 38, leadTime: '5-7天' },
    { name: '大地色眼影盘', category: '彩妆', sku: 'EP-EARTH-002', unitPrice: 72, leadTime: '5-7天' },
    { name: '面霜礼盒装', category: '护肤品', sku: 'CG-BOX-004', unitPrice: 55, leadTime: '4-6天' },
  ],
};

// ---- 子组件 ----

function HistoryTimeline() {
  return (
    <Timeline
      items={STATUS_HISTORY.map((h) => ({
        key: h.time,
        heading: `${h.action} · ${h.user}`,
        subtitle: h.time,
        variant: h.status === 'terminated' ? ('error' as const) : ('success' as const),
      }))}
    />
  );
}

// ---- 页面组件 ----

export default function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [supplier, setSupplier] = useState<Supplier>({ ...MOCK_SUPPLIER, id });
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<CooperationStatus | null>(null);

  const canTransition = STATUS_TRANSITIONS[supplier.cooperationStatus] ?? [];

  const handleTransition = useCallback(
    async (targetStatus: CooperationStatus) => {
      if (targetStatus === 'suspended' || targetStatus === 'terminated') {
        setPendingAction(targetStatus);
        setShowSuspendConfirm(true);
        return;
      }
      await new Promise((r) => setTimeout(r, 400));
      setSupplier((prev) => ({
        ...prev,
        cooperationStatus: targetStatus,
        updatedAt: new Date().toISOString(),
      }));
      toast.success(`供应商已${TRANSITION_LABELS[targetStatus] ?? targetStatus}`);
    },
    [toast],
  );

  const handleConfirmDanger = useCallback(async () => {
    if (!pendingAction) return;
    await new Promise((r) => setTimeout(r, 400));
    setSupplier((prev) => ({
      ...prev,
      cooperationStatus: pendingAction,
      updatedAt: new Date().toISOString(),
    }));
    toast.success(`供应商已${TRANSITION_LABELS[pendingAction] ?? pendingAction}`);
    setShowSuspendConfirm(false);
    setPendingAction(null);
  }, [toast, pendingAction]);

  const handleEdit = useCallback(async () => {
    toast.info('编辑供应商（跳转至编辑页）');
  }, [toast]);

  const handleDelete = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
    toast.success('供应商已删除');
    router.push('/suppliers');
  }, [toast, router]);

  if (!supplier) {
    return <EmptyState title="供应商未找到" description="指定供应商不存在或已被删除" />;
  }

  const headerActions: DetailShellAction[] = [
    ...canTransition.map((target) => ({
      key: `transition-${target}`,
      label: TRANSITION_LABELS[target] ?? target,
      variant: (target === 'suspended' || target === 'terminated' ? 'danger' : 'primary') as 'danger' | 'primary',
      onClick: () => handleTransition(target),
    })),
    {
      key: 'edit',
      label: '编辑',
      variant: 'secondary' as const,
      onClick: handleEdit,
    },
  ];

  const barActions: DetailActionBarAction[] = canTransition.map((target) => ({
    key: `bar-${target}`,
    label: TRANSITION_LABELS[target] ?? target,
    variant: (target === 'suspended' || target === 'terminated' ? 'danger' : 'primary') as 'danger' | 'primary',
    onClick: () => handleTransition(target),
  }));

  const closureLinks: DetailClosureLink[] = [
    {
      key: 'back-to-list',
      title: '返回供应商列表',
      subtitle: '查看所有供应商',
      href: '/suppliers',
    },
    {
      key: 'create-new',
      title: '新增供应商',
      subtitle: '添加新的供应商信息',
      href: '/suppliers/new',
    },
  ];

  const productColumns: DataTableColumn<SupplierProduct>[] = [
    { key: 'name', header: '产品名称', dataKey: 'name' },
    { key: 'category', header: '分类', dataKey: 'category' },
    { key: 'sku', header: 'SKU', dataKey: 'sku' },
    { key: 'unitPrice', header: '单价', dataKey: 'unitPrice', render: (row) => `¥${row.unitPrice.toLocaleString()}` },
    { key: 'leadTime', header: '交货周期', dataKey: 'leadTime' },
  ];

  return (
    <DetailShell
      backHref="/suppliers"
      title={supplier.name}
      subtitle={`简称：${supplier.shortName} · 合作于 ${supplier.cooperationSince}`}
      actions={headerActions}
    >
      {/* 基本信息 */}
      <DescriptionList
        title="基本信息"
        columns={2}
        items={[
          { label: '供应商名称', value: supplier.name },
          { label: '简称', value: supplier.shortName },
          { label: '联系人', value: supplier.contactPerson },
          { label: '联系电话', value: supplier.contactPhone },
          { label: '邮箱', value: supplier.email },
          { label: '地址', value: supplier.address },
          { label: '网站', value: supplier.website },
          { label: '合作状态', value: <StatusBadge label={STATUS_LABELS[supplier.cooperationStatus]} variant={supplier.cooperationStatus === 'active' ? 'success' : supplier.cooperationStatus === 'suspended' ? 'warning' : supplier.cooperationStatus === 'terminated' ? 'error' : 'info'} size="sm" /> },
          { label: '合作起始', value: supplier.cooperationSince },
          { label: '信用等级', value: CREDIT_LABELS[supplier.creditLevel] ?? supplier.creditLevel },
          { label: '付款条件', value: supplier.paymentTerms },
          { label: '备注', value: supplier.notes || '—' },
        ]}
      />

      {/* 合作数据 */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>合作数据</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {[
            { label: '总订单数', value: `${supplier.totalOrders} 单` },
            { label: '总金额', value: `¥${supplier.totalAmount.toLocaleString()}` },
            { label: '准时交货率', value: `${supplier.onTimeRate}%` },
            { label: '产品合格率', value: `${supplier.qualityRate}%` },
            { label: '供应品类', value: supplier.categories.join('、') },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '16px',
                borderRadius: 12,
                background: 'rgba(148,163,184,0.06)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 供应产品列表 */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>
          供应产品（{supplier.products.length} 项）
        </h3>
        <DataTable
          rows={supplier.products}
          columns={productColumns}
          rowKey={(row) => row.sku}
        />
      </div>

      {/* 操作历史 */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>
          合作历史
        </h3>
        <HistoryTimeline />
      </div>

      {/* 动作栏 */}
      {barActions.length > 0 && (
        <DetailActionBar actions={barActions} />
      )}

      {/* 闭环导航 */}
      <DetailClosureBar links={closureLinks} />

      {/* 确认对话框 */}
      <ConfirmDialog
        open={showSuspendConfirm}
        title={`确认${pendingAction === 'suspended' ? '暂停' : '终止'}合作？`}
        message={`确定要${pendingAction === 'suspended' ? '暂停' : '终止'}与 "${supplier.name}" 的合作吗？${pendingAction === 'terminated' ? '终止后不可恢复。' : '暂停期间将无法发起新的采购订单。'}`}
        confirmLabel={`确认${pendingAction === 'suspended' ? '暂停' : '终止'}`}
        cancelLabel="返回"
        onConfirm={handleConfirmDanger}
        onCancel={() => { setShowSuspendConfirm(false); setPendingAction(null); }}
        variant="danger"
      />
    </DetailShell>
  );
}
