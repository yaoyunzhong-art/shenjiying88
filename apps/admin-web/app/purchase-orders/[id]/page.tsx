/**
 * 采购单详情页 — Purchase Order Detail Page
 * 角色视角: 👤采购管理员 / 店长
 * 功能: 查看 / 编辑 / 状态流转 / 删除
 * 状态流: draft → pending_approval → approved → shipped → partial_received → received
 *                                      ↘ cancelled (任意状态可取消)
 */
'use client';

import React, { useState, useCallback, use } from 'react';

import {
  DetailClosureBar,
  DetailShell,
  FormField,
  InfoRow,
  StatusBadge,
  SubmitButton,
  useFormSubmit,
  FormSubmitFeedback,
} from '@m5/ui';

import {
  type PurchaseOrderItem,
  type PurchaseOrderStatus,
  type PurchaseOrderUrgency,
  MOCK_PURCHASE_ORDERS,
  PURCHASE_ORDER_STATUS_MAP,
  PURCHASE_ORDER_URGENCY_MAP,
  computePurchaseOrderStats,
  formatCurrency,
} from '../purchase-orders-data';

// ─── 状态流转图 ──────────────────────────────────────────
//
//  draft ──→ pending_approval ──→ approved ──→ shipped ──→ partial_received ──→ received
//    │             │                  │            │               │
//    └── cancelled ┘                  └── cancelled ┘               └── cancelled
//
//  cancelled 为终态, 不可逆

const STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  draft: ['pending_approval', 'cancelled'],
  pending_approval: ['approved', 'cancelled'],
  approved: ['shipped', 'cancelled'],
  shipped: ['partial_received', 'received', 'cancelled'],
  partial_received: ['received', 'cancelled'],
  received: [],
  cancelled: [],
};

const STATUS_TRANSITION_LABELS: Record<string, string> = {
  pending_approval: '提交审批',
  approved: '批准',
  shipped: '标记发货',
  partial_received: '部分收货',
  received: '完成收货',
  cancelled: '取消订单',
};

type TabKey = 'basic' | 'logistics';

export default function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = use(params);
  const item = MOCK_PURCHASE_ORDERS.find((po: PurchaseOrderItem) => po.id === resolved.id);

  const [form, setForm] = useState({
    remark: item?.remark ?? '',
    contactPerson: item?.contactPerson ?? '',
    contactPhone: item?.contactPhone ?? '',
  });
  const [status, setStatus] = useState<PurchaseOrderStatus>(item?.status ?? 'draft');
  const [tab, setTab] = useState<TabKey>('basic');

  const { submit, submitting, state } = useFormSubmit<{
    success: boolean;
    message: string;
  }>({
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 500));
      return { success: true, message: '采购单已更新' };
    },
    successMessage: '保存成功',
    defaultErrorMessage: '保存失败，请重试',
  });

  const handleSave = useCallback(() => {
    submit();
  }, [submit]);

  const handleStatusTransition = useCallback(
    (nextStatus: PurchaseOrderStatus) => {
      const msg =
        nextStatus === 'cancelled'
          ? '确认取消此采购单？此操作不可逆。'
          : `确认将采购单状态变更为"${PURCHASE_ORDER_STATUS_MAP[nextStatus].label}"？`;
      if (confirm(msg)) {
        setStatus(nextStatus);
      }
    },
    [],
  );

  const handleDelete = useCallback(() => {
    if (confirm('确认删除此采购单？')) {
      window.location.href = '/purchase-orders';
    }
  }, []);

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  if (!item) {
    return (
      <DetailShell
        title="采购单未找到"
        breadcrumbs={[
          { label: '采购管理', href: '/purchase-orders' },
          { label: '未找到' },
        ]}
      >
        <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
          该采购单不存在或已被删除
        </div>
        <DetailClosureBar
          links={[
            {
              key: 'back-list',
              title: '采购单管理',
              subtitle: '返回采购单列表',
              href: '/purchase-orders',
            },
          ]}
        />
      </DetailShell>
    );
  }

  const transitions = STATUS_TRANSITIONS[status] ?? [];
  const urgencyInfo = PURCHASE_ORDER_URGENCY_MAP[item.urgency];
  const statusInfo = PURCHASE_ORDER_STATUS_MAP[status];

  return (
    <DetailShell
      title={item.orderNo}
      subtitle={`供应商: ${item.supplierName} | 门店: ${item.storeCode} | 部门: ${item.department}`}
      breadcrumbs={[
        { label: '采购管理', href: '/purchase-orders' },
        { label: item.orderNo },
      ]}
      actions={[
        {
          key: 'status',
          label: statusInfo.label as DetailShellAction['label'],
          variant: statusInfo.variant as DetailShellAction['variant'],
        },
      ]}
    >
      {/* Tab 导航 */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid #334155',
          marginBottom: 24,
          paddingBottom: 0,
        }}
      >
        {([
          { key: 'basic' as TabKey, label: '基本信息' },
          { key: 'logistics' as TabKey, label: '物流信息' },
        ]).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: tab === t.key ? '#2563eb' : 'transparent',
              color: tab === t.key ? '#fff' : '#94a3b8',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'basic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 基本信息网格 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            <FormField label="采购单号">
              <InfoRow label="单号" value={item.orderNo} />
            </FormField>
            <FormField label="供应商">
              <InfoRow label="供应商" value={item.supplierName} />
            </FormField>
            <FormField label="紧急程度">
              <StatusBadge
                variant={urgencyInfo.variant}
                label={urgencyInfo.label}
                size="sm"
                dot
              />
            </FormField>
            <FormField label="状态">
              <StatusBadge
                variant={statusInfo.variant}
                label={statusInfo.label}
                size="sm"
                dot
              />
            </FormField>
            <FormField label="总金额">
              <span
                style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 18 }}
              >
                ¥{item.totalAmount.toLocaleString('zh-CN')}
              </span>
            </FormField>
            <FormField label="商品数量">
              <InfoRow
                label="品项"
                value={`${item.itemsCount} 种 / ${item.totalQuantity} 件`}
              />
            </FormField>
            <FormField label="下单日期">
              <InfoRow label="日期" value={item.orderDate} />
            </FormField>
            <FormField label="预计交货">
              <InfoRow label="交货期" value={item.expectedDelivery} />
            </FormField>
            {item.actualDelivery && (
              <FormField label="实际交货">
                <InfoRow label="实际" value={item.actualDelivery} />
              </FormField>
            )}
            <FormField label="创建人">
              <InfoRow label="创建人" value={item.createdBy} />
            </FormField>
            <FormField label="创建时间">
              <InfoRow label="创建" value={item.createdAt} />
            </FormField>
            <FormField label="更新时间">
              <InfoRow label="更新" value={item.updatedAt} />
            </FormField>
          </div>

          {/* 可编辑字段 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
              padding: 16,
              borderRadius: 8,
              background: 'rgba(15,23,42,0.3)',
              border: '1px solid #334155',
            }}
          >
            <FormField label="联系人" required>
              <input
                style={{
                  width: '100%',
                  borderRadius: 6,
                  border: '1px solid #475569',
                  padding: '8px 12px',
                  fontSize: 14,
                  background: '#1e293b',
                  color: '#e2e8f0',
                }}
                value={form.contactPerson}
                onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
                placeholder="输入联系人"
              />
            </FormField>
            <FormField label="联系电话" required>
              <input
                style={{
                  width: '100%',
                  borderRadius: 6,
                  border: '1px solid #475569',
                  padding: '8px 12px',
                  fontSize: 14,
                  background: '#1e293b',
                  color: '#e2e8f0',
                }}
                value={form.contactPhone}
                onChange={(e) => handleFieldChange('contactPhone', e.target.value)}
                placeholder="输入联系电话"
              />
            </FormField>
            <FormField label="备注">
              <textarea
                style={{
                  width: '100%',
                  borderRadius: 6,
                  border: '1px solid #475569',
                  padding: '8px 12px',
                  fontSize: 14,
                  minHeight: 80,
                  background: '#1e293b',
                  color: '#e2e8f0',
                }}
                value={form.remark}
                onChange={(e) => handleFieldChange('remark', e.target.value)}
                placeholder="输入备注信息"
              />
            </FormField>
          </div>

          {/* 提交反馈 */}
          <FormSubmitFeedback state={state} />

          {/* 操作按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <SubmitButton loading={submitting} onClick={handleSave}>
              保存修改
            </SubmitButton>

            {/* 状态流转按钮 */}
            {transitions.map((next) => {
              const label = STATUS_TRANSITION_LABELS[next] ?? next;
              const nextInfo = PURCHASE_ORDER_STATUS_MAP[next];
              return (
                <SubmitButton
                  key={next}
                  variant={
                    next === 'cancelled'
                      ? 'danger'
                      : next === 'received'
                        ? 'primary'
                        : 'secondary'
                  }
                  onClick={() => handleStatusTransition(next)}
                >
                  {next === 'cancelled' ? `✕ ${label}` : `→ ${label}`}
                </SubmitButton>
              );
            })}

            <SubmitButton variant="danger" onClick={handleDelete}>
              删除采购单
            </SubmitButton>
          </div>
        </div>
      )}

      {tab === 'logistics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            <FormField label="供应商名称">
              <InfoRow label="供应商" value={item.supplierName} />
            </FormField>
            <FormField label="联系人">
              <InfoRow label="联系人" value={item.contactPerson} />
            </FormField>
            <FormField label="联系电话">
              <InfoRow label="电话" value={item.contactPhone} />
            </FormField>
            <FormField label="门店">
              <InfoRow label="门店编码" value={item.storeCode} />
            </FormField>
            <FormField label="所属部门">
              <InfoRow label="部门" value={item.department} />
            </FormField>
            <FormField label="预计交货日期">
              <InfoRow label="期望" value={item.expectedDelivery} />
            </FormField>
            {item.actualDelivery && (
              <FormField label="实际交货日期">
                <InfoRow label="实际" value={item.actualDelivery} />
              </FormField>
            )}
          </div>
          <div
            style={{
              padding: 16,
              borderRadius: 8,
              background: 'rgba(15,23,42,0.3)',
              border: '1px solid #334155',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#e2e8f0' }}>
              状态流转说明
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                alignItems: 'center',
                fontSize: 13,
                color: '#94a3b8',
              }}
            >
              {[
                'draft',
                'pending_approval',
                'approved',
                'shipped',
                'partial_received',
                'received',
              ].map((s, i, arr) => (
                <React.Fragment key={s}>
                  <StatusBadge
                    variant={
                      status === s
                        ? 'success'
                        : ['draft', 'pending_approval'].includes(s)
                          ? 'pending'
                          : ['shipped', 'partial_received'].includes(s)
                            ? 'warning'
                            : 'info'
                    }
                    label={PURCHASE_ORDER_STATUS_MAP[s as PurchaseOrderStatus].label}
                    size="sm"
                  />
                  {i < arr.length - 1 && <span style={{ color: '#475569' }}>→</span>}
                </React.Fragment>
              ))}
              <span style={{ color: '#475569', margin: '0 4px' }}>|</span>
              <StatusBadge variant="danger" label="cancelled" size="sm" />
            </div>
          </div>
        </div>
      )}

      <DetailClosureBar
        links={[
          {
            key: 'back-list',
            title: '采购单管理',
            subtitle: '返回采购单列表',
            href: '/purchase-orders',
          },
          {
            key: 'related-suppliers',
            title: item.supplierName,
            subtitle: '查看供应商详情',
            href: `/suppliers/${item.supplierId}`,
          },
        ]}
      />
    </DetailShell>
  );
}

// ---- DetailShellAction label 类型引用 -----------------
type DetailShellAction = {
  key: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
};
