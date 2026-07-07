/**
 * 采购单详情页 — Purchase Order Detail Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 💳采购
 * 功能: 采购单详情查看、状态流转、编辑、删除
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
  Stepper,
  Timeline,
  DescriptionList,
  EmptyState,
  useToast,
  ConfirmDialog,
  type DetailShellAction,
  type DetailActionBarAction,
  type DetailClosureLink,
  type DescriptionItem,
} from '@m5/ui';

// ---- 类型 ----

type PurchaseOrderStatus = 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'received' | 'cancelled';

interface PurchaseOrderItem {
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplier: string;
  contactPerson: string;
  contactPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  itemsCount: number;
  orderDate: string;
  expectedDelivery: string;
  actualDelivery: string | null;
  paymentTerms: string;
  paymentMethod: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
}

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  confirmed: '已确认',
  shipped: '已发货',
  received: '已收货',
  cancelled: '已取消',
};

const STATUS_STEPS: PurchaseOrderStatus[] = ['draft', 'submitted', 'confirmed', 'shipped', 'received'];

const STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['received', 'cancelled'],
  received: [],
  cancelled: [],
};

const TRANSITION_LABELS: Record<string, string> = {
  submitted: '提交审核',
  confirmed: '确认订单',
  shipped: '标记发货',
  received: '确认收货',
  cancelled: '取消订单',
};

const PAYMENT_LABELS: Record<string, string> = {
  net30: '月结30天',
  net60: '月结60天',
  deposit_balance: '预付款+尾款',
  cod: '货到付款',
  prepaid: '全额预付',
  bank_transfer: '银行转账',
  wechat: '微信支付',
  alipay: '支付宝',
  check: '支票',
};

interface HistoryEntry {
  time: string;
  action: string;
  user: string;
  status: string;
}

const STATUS_HISTORY: HistoryEntry[] = [
  { time: '2026-06-01 09:00', action: '创建采购单', user: '张店长', status: 'draft' },
  { time: '2026-06-02 10:30', action: '提交审核', user: '张店长', status: 'submitted' },
  { time: '2026-06-03 14:00', action: '确认订单', user: '采购经理王芳', status: 'confirmed' },
  { time: '2026-06-07 09:15', action: '供应商已发货', user: '系统', status: 'shipped' },
  { time: '2026-06-09 14:30', action: '已收货入库', user: '仓管刘洋', status: 'received' },
];

// ---- Mock 数据 ----

const MOCK_ORDER: PurchaseOrder = {
  id: '1',
  orderNo: 'PO-20260601-001',
  supplier: '广州美妆供应链有限公司',
  contactPerson: '李明',
  contactPhone: '13800138001',
  shippingAddress: '广州市天河区体育西路123号旗舰店仓库',
  totalAmount: 28600,
  status: 'received',
  itemsCount: 12,
  orderDate: '2026-06-01',
  expectedDelivery: '2026-06-10',
  actualDelivery: '2026-06-09',
  paymentTerms: 'net30',
  paymentMethod: 'bank_transfer',
  notes: '优先安排核心SKU入库。',
  createdAt: '2026-06-01 09:00:00',
  updatedAt: '2026-06-09 14:30:00',
  items: [
    { name: '保湿精华液（100ml）', sku: 'ES-100ML-001', quantity: 200, unit: '瓶', unitPrice: 68, totalPrice: 13600 },
    { name: '洁面乳（150g）', sku: 'CF-150G-002', quantity: 150, unit: '支', unitPrice: 45, totalPrice: 6750 },
    { name: '防晒霜（SPF50 60ml）', sku: 'SS-60ML-003', quantity: 100, unit: '支', unitPrice: 55, totalPrice: 5500 },
    { name: '面霜礼盒装', sku: 'CG-BOX-004', quantity: 50, unit: '盒', unitPrice: 55, totalPrice: 2750 },
  ],
};

// ---- 子组件 ----

function StatusStepper({ currentStatus }: { currentStatus: PurchaseOrderStatus }) {
  const stepIndex = STATUS_STEPS.indexOf(currentStatus);
  return (
    <Stepper
      activeStep={Math.max(stepIndex, 0)}
      steps={STATUS_STEPS.map((s) => ({
        label: STATUS_LABELS[s],
        completed: stepIndex > STATUS_STEPS.indexOf(s),
      }))}
    />
  );
}

function HistoryTimeline() {
  return (
    <Timeline
      items={STATUS_HISTORY.map((h) => ({
        key: h.time,
        heading: `${h.action} · ${h.user}`,
        subtitle: h.time,
        variant: h.status === 'cancelled' ? ('error' as const) : ('success' as const),
      }))}
    />
  );
}

function ItemsTable({ items }: { items: PurchaseOrderItem[] }) {
  const total = items.reduce((s, i) => s + i.totalPrice, 0);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
            <th style={thStyle}>商品名称</th>
            <th style={thStyle}>SKU</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>数量</th>
            <th style={thStyle}>单位</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>单价</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>小计</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
              <td style={tdStyle}>{item.name}</td>
              <td style={{ ...tdStyle, color: '#94a3b8', fontFamily: 'monospace', fontSize: 13 }}>{item.sku}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
              <td style={tdStyle}>{item.unit}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>¥{item.unitPrice.toLocaleString()}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>¥{item.totalPrice.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid rgba(148,163,184,0.2)' }}>
            <td colSpan={5} style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>合计</td>
            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#60a5fa' }}>
              ¥{total.toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  color: '#94a3b8',
  fontWeight: 600,
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  color: '#e2e8f0',
};

// ---- 页面组件 ----

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [order, setOrder] = useState<PurchaseOrder>({ ...MOCK_ORDER, id });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const canTransition = STATUS_TRANSITIONS[order.status] ?? [];

  const handleTransition = useCallback(
    async (targetStatus: PurchaseOrderStatus) => {
      if (targetStatus === 'cancelled') {
        setShowCancelConfirm(true);
        return;
      }
      await new Promise((r) => setTimeout(r, 400));
      setOrder((prev) => ({
        ...prev,
        status: targetStatus,
        updatedAt: new Date().toISOString(),
      }));
      toast.success(`采购单已${TRANSITION_LABELS[targetStatus] ?? targetStatus}`);
    },
    [toast],
  );

  const handleConfirmCancel = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
    setOrder((prev) => ({
      ...prev,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    }));
    toast.success('采购单已取消');
    setShowCancelConfirm(false);
  }, [toast]);

  const handleDelete = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 400));
    toast.success('采购单已删除');
    router.push('/purchase-orders');
  }, [toast, router]);

  if (!order) {
    return <EmptyState title="采购单未找到" description="指定采购单不存在或已被删除" />;
  }

  // DetailShell actions (header buttons)
  const headerActions: DetailShellAction[] = canTransition.reduce<DetailShellAction[]>((acc, target) => {
    const label = TRANSITION_LABELS[target];
    if (label) {
      acc.push({
        key: `transition-${target}`,
        label,
        variant: target === 'cancelled' ? 'danger' : 'primary',
        onClick: () => handleTransition(target),
      });
    }
    return acc;
  }, []);

  // DetailActionBar actions (action bar at bottom)
  const barActions: DetailActionBarAction[] = canTransition.reduce<DetailActionBarAction[]>((acc, target) => {
    const label = TRANSITION_LABELS[target];
    if (label) {
      acc.push({
        key: `bar-${target}`,
        label,
        variant: target === 'cancelled' ? 'danger' : 'primary',
        onClick: () => handleTransition(target),
      });
    }
    return acc;
  }, []);

  // DetailClosureBar links
  const closureLinks: DetailClosureLink[] = [
    {
      key: 'back-to-list',
      title: '返回采购单列表',
      subtitle: '查看所有采购单',
      href: '/purchase-orders',
    },
    {
      key: 'create-new',
      title: '新建采购单',
      subtitle: '创建新的采购订单',
      href: '/purchase-orders/new',
    },
  ];

  return (
    <DetailShell
      backHref="/purchase-orders"
      title={order.orderNo}
      subtitle={`供应商：${order.supplier} · 创建于 ${order.createdAt}`}
      actions={headerActions}
    >
      {/* 状态步骤条 */}
      <div style={{ marginBottom: 32 }}>
        <StatusStepper currentStatus={order.status} />
      </div>

      {/* 基本信息 */}
      <DescriptionList
        title="基本信息"
        columns={2}
        items={[
          { label: '采购单号', value: order.orderNo },
          { label: '供应商', value: order.supplier },
          { label: '采购日期', value: order.orderDate },
          {
            label: '状态',
            value: <StatusBadge label={STATUS_LABELS[order.status]} variant={order.status === 'cancelled' ? 'error' : order.status === 'received' ? 'neutral' : order.status === 'draft' ? 'warning' : 'info'} size="sm" />,
          },
          { label: '联系人', value: order.contactPerson },
          { label: '联系电话', value: order.contactPhone },
          { label: '收货地址', value: order.shippingAddress },
          { label: '预计到货', value: order.expectedDelivery },
          { label: '实际到货', value: order.actualDelivery ?? '—' },
          { label: '付款条件', value: PAYMENT_LABELS[order.paymentTerms] ?? order.paymentTerms },
          { label: '付款方式', value: PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod },
          { label: '备注', value: order.notes || '—' },
        ]}
      />

      {/* 采购清单 */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>
          采购清单（{order.items.length} 项）
        </h3>
        <ItemsTable items={order.items} />
      </div>

      {/* 操作历史 */}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 12 }}>
          操作历史
        </h3>
        <HistoryTimeline />
      </div>

      {/* 详情收口动作 */}
      {barActions.length > 0 && (
        <DetailActionBar actions={barActions} />
      )}

      {/* 底部闭环导航 */}
      <DetailClosureBar links={closureLinks} />

      {/* 取消确认对话框 */}
      <ConfirmDialog
        open={showCancelConfirm}
        title="确认取消采购单？"
        message={`确定要取消采购单 "${order.orderNo}" 吗？取消后不可恢复。`}
        confirmLabel="确认取消"
        cancelLabel="返回"
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
        variant="danger"
      />
    </DetailShell>
  );
}
