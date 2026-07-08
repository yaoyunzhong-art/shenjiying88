/**
 * 入库接收处理页 — Inbound Receiving Page (Next.js App Router Page)
 * 角色视角: 🏭库房管理员
 * 类型: B-页面创建
 * 功能: 入库单详情/验收/质检/上架/完成
 */
'use client';

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  DetailShell,
  StatusBadge,
  DetailActionBar,
  DetailClosureBar,
  DescriptionList,
  useToast,
  ConfirmDialog,
  type DetailShellAction,
  type DetailActionBarAction,
  type DetailClosureLink,
  type DescriptionItem,
} from '@m5/ui';

// ---- 类型 ----

interface InboundItem {
  sku: string;
  name: string;
  expectedQty: number;
  inspectedQty: number;
  passQty: number;
  failQty: number;
  unit: string;
  status: 'pending' | 'passed' | 'failed';
}

type InboundStatus = 'pending' | 'inspecting' | 'shelving' | 'completed' | 'cancelled';

interface InboundDetail {
  id: string;
  orderNo: string;
  poNo: string;
  supplier: string;
  status: InboundStatus;
  items: InboundItem[];
  totalExpected: number;
  totalInspected: number;
  totalPassed: number;
  totalFailed: number;
  createdAt: string;
  expectedAt: string;
  completedAt?: string;
  operator?: string;
  notes?: string;
}

// ---- Mock Data ----

function getMockInbound(id: string): InboundDetail {
  return {
    id,
    orderNo: `IN-${id}`,
    poNo: 'PO-2024-0689',
    supplier: '云南咖啡基地',
    status: 'inspecting',
    items: [
      {
        sku: 'SKU-001',
        name: '哥伦比亚精品咖啡豆',
        expectedQty: 200,
        inspectedQty: 180,
        passQty: 175,
        failQty: 5,
        unit: '袋',
        status: 'passed',
      },
      {
        sku: 'SKU-002',
        name: '埃塞俄比亚耶加雪菲',
        expectedQty: 150,
        inspectedQty: 150,
        passQty: 150,
        failQty: 0,
        unit: '袋',
        status: 'passed',
      },
      {
        sku: 'SKU-003',
        name: '有机抹茶粉',
        expectedQty: 100,
        inspectedQty: 80,
        passQty: 70,
        failQty: 10,
        unit: '罐',
        status: 'failed',
      },
      {
        sku: 'SKU-004',
        name: '法式烘焙混合豆',
        expectedQty: 250,
        inspectedQty: 0,
        passQty: 0,
        failQty: 0,
        unit: '袋',
        status: 'pending',
      },
      {
        sku: 'SKU-005',
        name: '阿拉比卡挂耳包',
        expectedQty: 100,
        inspectedQty: 100,
        passQty: 100,
        failQty: 0,
        unit: '盒',
        status: 'passed',
      },
    ],
    totalExpected: 800,
    totalInspected: 510,
    totalPassed: 495,
    totalFailed: 15,
    createdAt: '2024-06-30 09:00',
    expectedAt: '2024-06-30 14:00',
    operator: '张三',
    notes: '注意抹茶粉包装有破损，需退回供应商。',
  };
}

// ---- 状态映射 ----

const STATUS_MAP: Record<InboundStatus, { label: string; variant: 'pending' | 'info' | 'warning' | 'success' | 'danger' | 'neutral' }> = {
  pending: { label: '待验收', variant: 'pending' },
  inspecting: { label: '质检中', variant: 'info' },
  shelving: { label: '上架中', variant: 'warning' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'neutral' },
};

const ITEM_STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: '待检', bg: '#f1f5f9', color: '#64748b' },
  passed: { label: '合格', bg: '#dcfce7', color: '#166534' },
  failed: { label: '不合格', bg: '#fef2f2', color: '#991b1b' },
};

// ---- 表单样式 ----

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: '70px',
  padding: '4px 8px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  textAlign: 'center',
};

// ---- 主线卡样式 ----

const sectionCard: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  overflow: 'hidden',
  marginBottom: '16px',
};

const sectionHeader: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #e2e8f0',
  fontWeight: 600,
  fontSize: '14px',
  color: '#0f172a',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

// ---- 组件 ----

export default function InboundReceivingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [detail] = useState<InboundDetail>(() => getMockInbound(id));
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [itemInputs, setItemInputs] = useState<Record<string, { inspected: number; pass: number }>>({});

  const status = STATUS_MAP[detail.status];

  // ---- 操作按钮 ----

  const actions: DetailShellAction[] = [
    {
      key: 'edit',
      label: '编辑',
      onClick: () => { toast.info('打开编辑模式'); },
    },
    {
      key: 'verify',
      label: '完成验收',
      onClick: () => { toast.success('验收完成'); },
    },
  ];

  const closureActions: DetailActionBarAction[] = [
    {
      key: 'start_inspect',
      label: '开始质检',
      variant: 'primary',
      disabled: detail.status === 'completed' || detail.status === 'cancelled',
      onClick: () => setConfirmAction('start_inspect'),
    },
    {
      key: 'to_shelving',
      label: '确认上架',
      variant: 'primary',
      disabled: detail.status !== 'inspecting',
      onClick: () => setConfirmAction('to_shelving'),
    },
    {
      key: 'cancel',
      label: '取消入库',
      variant: 'danger',
      disabled: detail.status === 'completed' || detail.status === 'cancelled',
      onClick: () => setConfirmAction('cancel'),
    },
  ];

  const closureLinks: DetailClosureLink[] = [
    {
      key: 'back-po',
      title: '返回采购单',
      subtitle: detail.poNo,
      href: `/purchase-orders/${detail.poNo}`,
    },
    {
      key: 'all-inbound',
      title: '所有入库记录',
      subtitle: '查看全部历史入库单',
      href: '/stock',
    },
  ];

  const confirmAndProceed = () => {
    if (confirmAction === 'start_inspect') {
      toast.success('质检已开始，请在下方逐项录入检验数量');
    } else if (confirmAction === 'to_shelving') {
      toast.success('已确认上架，库存已更新');
    } else if (confirmAction === 'cancel') {
      toast.warning('入库单已取消');
    }
    setConfirmAction(null);
  };

  const handleItemQtyChange = (sku: string, field: 'inspected' | 'pass', value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setItemInputs((prev) => {
      const existing = prev[sku] ?? { inspected: 0, pass: 0 };
      return { ...prev, [sku]: { ...existing, [field]: num } };
    });
  };

  // ---- 详情描述 ----

  const detailItems: DescriptionItem[] = [
    { label: '入库单号', value: detail.orderNo },
    { label: '关联采购单', value: detail.poNo },
    { label: '供应商', value: detail.supplier },
    { label: '创建时间', value: detail.createdAt },
    { label: '预计到货', value: detail.expectedAt },
    { label: '操作人', value: detail.operator ?? '-' },
    { label: '备注', value: detail.notes ?? '-' },
  ];

  // ---- 汇总统计 ----

  const SummaryRow = ({ label, value, color }: { label: string; value: number; color?: string }) => (
    <div style={{ textAlign: 'center', padding: '12px 16px' }}>
      <div style={{ fontSize: '24px', fontWeight: 700, color: color ?? '#0f172a' }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{label}</div>
    </div>
  );

  return (
    <>
      <DetailShell
        title={`入库接收 — ${detail.orderNo}`}
        subtitle={`${detail.supplier} | ${detail.totalExpected}件`}
        backHref="/stock"
        actions={actions}
      >
        {/* ---- 状态与统计 ---- */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ ...sectionCard, flex: 1 }}>
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>当前状态</span>
                <StatusBadge label={status.label} variant={status.variant} />
              </div>
            </div>
          </div>
          <div style={{ ...sectionCard, flex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0' }}>
              <SummaryRow label="预计件数" value={detail.totalExpected} />
              <SummaryRow label="已检验" value={detail.totalInspected} color="#2563eb" />
              <SummaryRow label="合格" value={detail.totalPassed} color="#16a34a" />
              <SummaryRow label="不合格" value={detail.totalFailed} color="#dc2626" />
            </div>
          </div>
        </div>

        {/* ---- 商品列表 ---- */}
        <div style={sectionCard}>
          <div style={sectionHeader}>
            <span>📦 入库商品 ({detail.items.length} 项)</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={thStyle}>SKU</th>
                  <th style={thStyle}>商品名称</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>预期数量</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>实收数量</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>合格数量</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>不合格数量</th>
                  <th style={thStyle}>质检状态</th>
                  <th style={thStyle}>操作</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((item) => {
                  const statusStyle = ITEM_STATUS_STYLES[item.status] ?? { bg: '#f1f5f9', color: '#64748b', label: item.status };
                  return (
                    <tr key={item.sku} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>{item.sku}</td>
                      <td style={tdStyle}>{item.name}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{item.expectedQty}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{item.inspectedQty}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{item.passQty}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{item.failQty}</td>
                      <td style={tdStyle}>
                        <span style={{ ...badgeStyle, backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                          {statusStyle.label}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="number"
                            min={0}
                            max={item.expectedQty}
                            placeholder="实收"
                            style={{ ...inputStyle, width: '60px' }}
                            onChange={(e) => handleItemQtyChange(item.sku, 'inspected', e.target.value)}
                          />
                          <input
                            type="number"
                            min={0}
                            placeholder="合格"
                            style={{ ...inputStyle, width: '60px' }}
                            onChange={(e) => handleItemQtyChange(item.sku, 'pass', e.target.value)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---- 基本信息 ---- */}
        <div style={sectionCard}>
          <div style={sectionHeader}>
            <span>📋 基本信息</span>
          </div>
          <div style={{ padding: '16px' }}>
            <DescriptionList items={detailItems} columns={2} />
          </div>
        </div>

        {/* ---- 操作提交区域 ---- */}
        <DetailActionBar
          heading="入库操作"
          actions={closureActions}
        />
      </DetailShell>

      {/* 确认弹窗 */}
      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction === 'start_inspect' ? '开始质检' :
          confirmAction === 'to_shelving' ? '确认上架' : '取消入库'
        }
        message={
          confirmAction === 'start_inspect' ? '确认开始对该批次进行质检？请在商品列表中逐项填写检验数量。' :
          confirmAction === 'to_shelving' ? '确认上架后，库存数量将被更新，不可撤回。' :
          '确认取消该入库单？取消后状态将变为"已取消"，需要重新创建入库单。'
        }
        confirmLabel="确认"
        cancelLabel="取消"
        onConfirm={confirmAndProceed}
        onCancel={() => setConfirmAction(null)}
      />

      <DetailClosureBar links={closureLinks} />
    </>
  );
}

// ---- 表格样式 ----

const thStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '12px',
  color: '#64748b',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
};
