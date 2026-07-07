/**
 * coupons/[id]/page.tsx — ToB 优惠券详情页
 *
 * 展示优惠券详细信息（面值、有效期、核销数据、市场品牌归属）
 * 支持编辑 / 停用 / 激活操作
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useCallback } from 'react';

import {
  PageShell,
  DetailShell,
  StatusBadge,
  Modal,
  SubmitButton,
  FormField,
  FormSubmitFeedback,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';

// ---- 类型 ----

type CouponType = 'discount' | 'cash' | 'free_shipping' | 'voucher';
type CouponStatus = 'active' | 'expired' | 'disabled';

interface Coupon {
  id: string;
  name: string;
  type: CouponType;
  value: string;
  minAmount: string;
  maxAmount: string;
  totalIssued: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  marketCode: string;
  brandCode: string;
  status: CouponStatus;
  createdBy: string;
  description?: string;
  usageLimit: number;
}

// ---- 工具 ----

const TYPE_LABELS: Record<CouponType, string> = {
  discount: '打折券',
  cash: '代金券',
  free_shipping: '免运费',
  voucher: '礼品券',
};

const TYPE_VARIANTS: Record<CouponType, 'success' | 'warning' | 'info' | 'danger'> = {
  discount: 'success',
  cash: 'warning',
  free_shipping: 'info',
  voucher: 'danger',
};

const STATUS_LABELS: Record<CouponStatus, string> = {
  active: '进行中',
  expired: '已过期',
  disabled: '已停用',
};

const STATUS_VARIANTS: Record<CouponStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  expired: 'neutral',
  disabled: 'warning',
};

const REVERSE_STATUS: Partial<Record<CouponStatus, CouponStatus>> = {
  active: 'disabled',
  disabled: 'active',
};

const REVERSE_ACTION_LABEL: Partial<Record<CouponStatus, string>> = {
  active: '停用优惠券',
  disabled: '重新激活',
};

// ---- Mock 数据 ----

const MARKETS = ['CN-SH', 'CN-BJ', 'CN-GD', 'CN-SC', 'CN-ZJ'];
const BRANDS = ['M5', 'M5-PRO', 'M5-LITE'];
const SALESPERSONS = ['张三', '李四', '王五', '赵六'];

function createMockCoupons(): Coupon[] {
  const now = new Date('2026-06-26');
  const names = [
    '新客首单8折', '满300减50', '会员专享免运费', '夏季狂欢9折',
    '端午节礼券', '满500减80', '年终特惠8.5折', '开业庆代价券',
    '复购有礼', '好友邀请券', '周末促销', '超值套餐券',
    '店庆大促', '跨店满减', '会员日专享', '批量采购优惠',
    '新品首发折扣', '积分兑换券', '老客回馈', '季度满减',
  ];
  const types: CouponType[] = ['discount', 'cash', 'free_shipping', 'voucher'];
  const statuses: CouponStatus[] = ['active', 'active', 'active', 'expired', 'disabled'];

  return names.map((name, i) => {
    const type = types[i % types.length]!;
    const status = statuses[i % statuses.length]!;
    const totalIssued = Math.floor(Math.random() * 2000) + 100;
    const usedCount = Math.floor(Math.random() * totalIssued);
    const startDays = Math.floor(Math.random() * 60) + 1;
    const endDays = Math.floor(Math.random() * 180) + 30;

    const valueMap: Record<CouponType, string> = {
      discount: `${[8, 8.5, 9, 7, 6.5][i % 5]}折`,
      cash: `¥${[20, 30, 50, 80, 100, 200][i % 6]}`,
      free_shipping: '免运费',
      voucher: `¥${[30, 50, 100, 200][i % 4]}`,
    };
    const minAmount = (() => {
      switch(type) {
        case 'discount': return ['满0元', '满200元', '满0元'][i % 3];
        case 'cash': return ['满100元', '满300元', '满500元', '满600元'][i % 4];
        case 'free_shipping': return ['满99元', '满0元'][i % 2];
        case 'voucher': return ['满100元', '满200元'][i % 2];
      }
    })();
    const descs = [
      '适用于本品牌所有门店，可与其他优惠叠加使用',
      '仅限指定商品，不参与会员折扣',
      '适用于本品牌线上商城及线下门店',
      '活动期间每人限领1张',
    ];

    return {
      id: `tob-cpn-${String(i + 1).padStart(3, '0')}`,
      name,
      type,
      value: valueMap[type],
      minAmount: minAmount as string,
      maxAmount: type === 'discount' || type === 'cash' ? '¥200' : '',
      totalIssued,
      usedCount,
      validFrom: new Date(now.getTime() - startDays * 86400000).toISOString().slice(0, 10),
      validTo: new Date(now.getTime() + endDays * 86400000).toISOString().slice(0, 10),
      marketCode: MARKETS[i % MARKETS.length]!,
      brandCode: BRANDS[i % BRANDS.length]!,
      status,
      createdBy: SALESPERSONS[i % SALESPERSONS.length]!,
      description: descs[i % descs.length]!,
      usageLimit: Math.floor(Math.random() * 3) + 1,
    };
  });
}

const MOCK_COUPONS = createMockCoupons();

// ---- 样式 ----

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'rgba(15,23,42,0.6)',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.2)',
  background: 'transparent',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: 13,
};

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 16,
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.12)',
        background: 'rgba(15,23,42,0.4)',
        padding: 20,
      }}
    >
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: 14,
          fontWeight: 600,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </section>
  );
}

function InfoRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 0',
        minHeight: 28,
      }}
    >
      <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
      {children ?? <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{value}</span>}
    </div>
  );
}

function StatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '10px 8px',
        borderRadius: 8,
        background: 'rgba(15,23,42,0.3)',
      }}
    >
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ---- 编辑弹窗 ----

type EditFormData = {
  name: string;
  value: string;
  minAmount: string;
  validFrom: string;
  validTo: string;
  description: string;
};

function EditCouponModal({
  open,
  onClose,
  onSaved,
  coupon,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (data: EditFormData) => void;
  coupon: Coupon;
}) {
  const [form, setForm] = useState<EditFormData>({
    name: coupon.name,
    value: coupon.value,
    minAmount: coupon.minAmount,
    validFrom: coupon.validFrom,
    validTo: coupon.validTo,
    description: coupon.description ?? '',
  });

  const { submitting, error, success, submit, clearError } = useFormSubmit({
    onSubmit: async () => {
      if (!form.name.trim()) throw new Error('优惠券名称不能为空');
      onSaved(form);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <Modal open={open} onClose={onClose} title="编辑优惠券">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="券名称" error={!form.name.trim() ? '名称不能为空' : undefined}>
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="优惠券名称"
            style={inputStyle}
          />
        </FormField>
        <FormField label="面值">
          <input
            value={form.value}
            onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
            placeholder="如 8折 / ¥50"
            style={inputStyle}
          />
        </FormField>
        <FormField label="使用门槛">
          <input
            value={form.minAmount}
            onChange={(e) => setForm((p) => ({ ...p, minAmount: e.target.value }))}
            placeholder="如 满200元"
            style={inputStyle}
          />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="生效日期">
            <input
              type="date"
              value={form.validFrom}
              onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))}
              style={inputStyle}
            />
          </FormField>
          <FormField label="截止日期">
            <input
              type="date"
              value={form.validTo}
              onChange={(e) => setForm((p) => ({ ...p, validTo: e.target.value }))}
              style={inputStyle}
            />
          </FormField>
        </div>
        <FormField label="说明">
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="优惠券使用说明"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </FormField>
        <FormSubmitFeedback
          submitting={submitting}
          error={error}
          success={success}
          onDismissError={clearError}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>
            取消
          </button>
          <SubmitButton loading={submitting} type="submit">
            保存
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ---- 状态变更确认弹窗 ----

function StatusConfirmModal({
  open,
  onClose,
  onConfirm,
  coupon,
  nextStatus,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  coupon: Coupon;
  nextStatus: CouponStatus;
}) {
  const { submitting, submit } = useFormSubmit({
    onSubmit: async () => {
      onConfirm();
    },
  });

  const from = STATUS_LABELS[coupon.status];
  const to = STATUS_LABELS[nextStatus];

  return (
    <Modal open={open} onClose={onClose} title="变更优惠券状态">
      <div style={{ color: '#cbd5e1', marginBottom: 16 }}>
        确定将优惠券「{coupon.name}」从 [{from}] 变更为 [{to}] 吗？
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>
            取消
          </button>
          <SubmitButton loading={submitting} type="submit">
            确认变更
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ---- 详情页 ----

export default function CouponDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [coupon, setCoupon] = useState<Coupon | undefined>(() =>
    MOCK_COUPONS.find((c) => c.id === params.id),
  );
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const handleStatusChange = useCallback(() => {
    if (!coupon) return;
    const next = REVERSE_STATUS[coupon.status];
    if (!next) return;
    setCoupon((prev) => (prev ? { ...prev, status: next } : prev));
    setStatusOpen(false);
  }, [coupon]);

  const handleEditSave = useCallback((data: EditFormData) => {
    setCoupon((prev) =>
      prev
        ? {
            ...prev,
            name: data.name,
            value: data.value,
            minAmount: data.minAmount,
            validFrom: data.validFrom,
            validTo: data.validTo,
            description: data.description,
          }
        : prev,
    );
    setEditOpen(false);
  }, []);

  const detailActions: DetailShellAction[] = useMemo(
    () => [
      {
        key: 'edit',
        label: '编辑',
        onClick: () => setEditOpen(true),
        variant: 'primary',
      },
      ...(coupon && REVERSE_STATUS[coupon.status]
        ? [
            {
              key: 'toggle-status',
              label: REVERSE_ACTION_LABEL[coupon.status] ?? '变更状态',
              onClick: () => setStatusOpen(true),
              variant: 'secondary' as const,
            },
          ]
        : []),
      {
        key: 'back',
        label: '返回列表',
        onClick: () => router.push('/coupons'),
        variant: 'secondary',
      },
    ],
    [coupon],
  );

  if (!coupon) {
    return (
      <PageShell title="优惠券详情" description="">
        <div
          style={{
            textAlign: 'center',
            padding: 64,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          未找到优惠券 (ID: {params.id})
        </div>
      </PageShell>
    );
  }

  const typeMeta = TYPE_LABELS[coupon.type];
  const typeVar = TYPE_VARIANTS[coupon.type];
  const statusMeta = STATUS_LABELS[coupon.status];
  const statusVar = STATUS_VARIANTS[coupon.status];
  const usageRate = Math.round((coupon.usedCount / coupon.totalIssued) * 100);
  const nextStatus = REVERSE_STATUS[coupon.status];

  return (
    <PageShell
      title={coupon.name}
      description={`${coupon.id} · ${typeMeta} · ${coupon.brandCode} / ${coupon.marketCode}`}
    >
      <DetailShell
        title={coupon.name}
        subtitle={`${coupon.id} · ${typeMeta} · ${coupon.brandCode} / ${coupon.marketCode}`}
        actions={detailActions}
      >
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <StatBadge label="类型" value={typeMeta} color="#60a5fa" />
          <StatBadge label="面值" value={coupon.value} color="#fbbf24" />
          <StatBadge label="核销率" value={`${usageRate}%`} color="#4ade80" />
          <StatBadge label="状态" value={statusMeta} color={statusVar === 'success' ? '#4ade80' : '#f87171'} />
        </div>

        {/* 基本信息 */}
        <InfoSection title="基本信息">
          <InfoRow label="优惠券名称" value={coupon.name} />
          <InfoRow label="优惠券 ID" value={coupon.id} />
          <InfoRow label="类型">
            <StatusBadge label={typeMeta} variant={typeVar} size="sm" />
          </InfoRow>
          <InfoRow label="面值" value={coupon.value} />
          <InfoRow label="使用门槛" value={coupon.minAmount} />
          {coupon.maxAmount && <InfoRow label="最高抵扣" value={coupon.maxAmount} />}
          <InfoRow label="每人限用" value={`${coupon.usageLimit} 次`} />
        </InfoSection>

        {/* 有效期 */}
        <InfoSection title="有效期">
          <InfoRow label="生效日期" value={coupon.validFrom} />
          <InfoRow label="截止日期" value={coupon.validTo} />
          <InfoRow label="状态">
            <StatusBadge label={statusMeta} variant={statusVar} size="sm" dot />
          </InfoRow>
        </InfoSection>

        {/* 核销统计 */}
        <InfoSection title="核销统计">
          <InfoRow label="总发放量" value={coupon.totalIssued.toLocaleString()} />
          <InfoRow label="已核销量" value={coupon.usedCount.toLocaleString()} />
          <InfoRow label="剩余量" value={(coupon.totalIssued - coupon.usedCount).toLocaleString()} />
          <InfoRow
            label="核销率"
            value={`${usageRate}%（${coupon.usedCount}/${coupon.totalIssued}）`}
          />
        </InfoSection>

        {/* 归属信息 */}
        <InfoSection title="归属信息">
          <InfoRow label="所属品牌" value={coupon.brandCode} />
          <InfoRow label="适用市场" value={coupon.marketCode} />
          <InfoRow label="创建人" value={coupon.createdBy} />
        </InfoSection>

        {/* 说明 */}
        {coupon.description && (
          <InfoSection title="说明">
            <div
              style={{
                fontSize: 14,
                color: '#e2e8f0',
                lineHeight: 1.6,
                padding: '4px 0',
              }}
            >
              {coupon.description}
            </div>
          </InfoSection>
        )}
      </DetailShell>

      {/* 编辑弹窗 */}
      <EditCouponModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={handleEditSave}
        coupon={coupon}
      />

      {/* 状态变更弹窗 */}
      {coupon && nextStatus && (
        <StatusConfirmModal
          open={statusOpen}
          onClose={() => setStatusOpen(false)}
          onConfirm={handleStatusChange}
          coupon={coupon}
          nextStatus={nextStatus}
        />
      )}
    </PageShell>
  );
}
