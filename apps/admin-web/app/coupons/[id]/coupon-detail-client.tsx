'use client';

import { useMemo, useCallback, useState } from 'react';
import Link from 'next/link';

import {
  DetailClosureBar,
  DetailShell,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatusBadge,
  StatCard,
  CopyToClipboard,
  SubmitButton,
  WorkspaceBreadcrumb,
  useFormSubmit,
  Timeline,
  type DetailShellAction,
  type TimelineItem,
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';
import {
  buildStandardBreadcrumb,
  buildStandardClosureLinks,
} from '../../components/detail-workspace-registry';
import { MOCK_COUPONS, COUPON_STATUS_MAP, COUPON_TYPE_MAP, COUPON_SCOPE_MAP, type CouponItem, type CouponStatus } from '../../coupons-data';

// ---- 辅助 ----

const TYPE_VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
  percentage: 'info',
  fixed: 'warning',
  shipping: 'success',
  threshold: 'default',
};

function typeColor(type: string): string {
  switch (type) {
    case 'percentage': return '#60a5fa';
    case 'fixed': return '#a78bfa';
    case 'shipping': return '#34d399';
    case 'threshold': return '#fbbf24';
    default: return '#94a3b8';
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function claimRate(item: CouponItem): number {
  if (item.totalQuota <= 0) return 0;
  return (item.usedCount / item.totalQuota) * 100;
}

function generateTimeline(item: CouponItem): TimelineItem[] {
  const items: TimelineItem[] = [];
  items.push({
    key: 'created',
    heading: '创建',
    subtitle: formatDate(item.updatedAt),
    content: `由 ${item.createdBy} 创建`,
    variant: 'success',
  });
  if (item.status === 'active' || item.status === 'paused') {
    items.push({
      key: 'started',
      heading: '生效',
      subtitle: formatDate(item.startAt),
      content: '优惠券开始生效',
      variant: 'info',
    });
  }
  if (item.status === 'exhausted') {
    items.push({
      key: 'exhausted',
      heading: '领完',
      subtitle: formatDate(item.updatedAt),
      content: `全部 ${item.totalQuota.toLocaleString()} 张已发放完毕`,
      variant: 'warning',
    });
  }
  if (item.status === 'expired') {
    items.push({
      key: 'expired',
      heading: '过期',
      subtitle: formatDate(item.endAt),
      content: '优惠券已过期',
      variant: 'error',
    });
  }
  if (item.status === 'paused') {
    items.push({
      key: 'paused',
      heading: '暂停',
      subtitle: formatDate(item.updatedAt),
      content: '管理员手动暂停',
      variant: 'warning',
    });
  }
  items.push({
    key: 'end',
    heading: '截止',
    subtitle: formatDate(item.endAt),
    content: '优惠券截止领取',
    variant: item.status === 'expired' ? 'error' : 'default',
    pending: item.status !== 'expired' && item.status !== 'exhausted',
  });
  return items;
}

// ---- 组件 ----

function CouponDetailContent({ couponId }: { couponId: string }) {
  const coupon = useMemo(
    () => MOCK_COUPONS.find((c) => c.id === couponId),
    [couponId],
  );

  // Simulated editable fields
  const [name, setName] = useState(coupon?.name ?? '');
  const [status, setStatus] = useState<CouponStatus>(coupon?.status ?? 'draft');
  const [remainingQuota, setRemainingQuota] = useState(coupon?.remainingQuota ?? 0);

  const statusMeta = COUPON_STATUS_MAP[status];
  const rate = useMemo(() => coupon ? claimRate(coupon) : 0, [coupon]);
  const timeline = useMemo(() => coupon ? generateTimeline(coupon) : [], [coupon]);

  // Update sim
  const formSubmit = useFormSubmit({
    onSubmit: async () => {
      await new Promise((r) => setTimeout(r, 300));
    },
  });

  const { actions: detailBarActions } = useDetailActions({
    workspace: 'coupons',
    detailId: couponId,
    record: coupon,
    shareTitle: coupon?.name ?? couponId,
    shareText: `查看优惠券 ${coupon?.name ?? couponId} 详情`,
  });

  const closureLinks = buildStandardClosureLinks({
    workspace: 'coupons',
    detailId: couponId,
    closureLabel: '返回优惠券列表',
  });

  if (!coupon) {
    return (
      <main style={{ maxWidth: 860, margin: '0 auto', padding: 32, color: '#f87171' }}>
        <p>未找到该优惠券（ID: {couponId}）</p>
        <Link href="/coupons" style={{ color: '#60a5fa' }}>← 返回优惠券列表</Link>
      </main>
    );
  }
  // Guarantee coupon is non-null for downstream
  const c = coupon;

  const actionsList: DetailShellAction[] = detailBarActions.map((a) => ({
    key: a.key,
    label: a.label,
    variant: 'primary' as const,
    onClick: a.onClick,
  }));

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 32 }}>
      <WorkspaceBreadcrumb {...buildStandardBreadcrumb({ workspace: 'coupons', detailLabel: coupon?.name ?? couponId })} />

      <DetailShell
        title={coupon?.name ?? couponId}
        subtitle={`${coupon?.code ?? ''}`}
        actions={actionsList}
      >
        {/* 顶部统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 24,
          }}
        >
          <StatCard label="总发放量" value={coupon.totalQuota.toLocaleString()} />
          <StatCard label="已核销" value={coupon.usedCount.toLocaleString()} />
          <StatCard label="剩余" value={remainingQuota.toLocaleString()} />
          <StatCard
            label="领取率"
            value={`${rate.toFixed(1)}%`}
            variant={rate >= 90 ? 'error' : rate >= 60 ? 'warning' : 'default'}
          />
        </div>

        {/* 基本信息 */}
        <FormField label="优惠券名称" helper="编辑后点击保存生效">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: '#e2e8f0',
              fontSize: 14,
            }}
          />
        </FormField>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            margin: '20px 0',
          }}
        >
          <InfoRow label="优惠券类型" value={<span style={{ color: typeColor(coupon.type), fontWeight: 600 }}>
              {COUPON_TYPE_MAP[coupon.type].label}
              {coupon.discountValue > 0 && (
                <span style={{ marginLeft: 4 }}>
                  {coupon.discountValue}{COUPON_TYPE_MAP[coupon.type].suffix}
                </span>
              )}
            </span>} />

          <InfoRow label="状态" value={<StatusBadge label={statusMeta.label} variant={statusMeta.variant} dot />} />

          <InfoRow label="适用范围" value={<StatusBadge label={COUPON_SCOPE_MAP[coupon.scope]} variant="info" size="sm" />} />

          <InfoRow label="满减门槛" value={<span style={{ color: coupon.threshold > 0 ? '#94a3b8' : '#4ade80', fontVariantNumeric: 'tabular-nums' }}>
              {coupon.threshold > 0 ? `满¥${coupon.threshold}` : '无门槛'}
            </span>} />

          <InfoRow label="限领次数" value={<span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {coupon.usageLimit >= 99999 ? '不限' : `每人${coupon.usageLimit}次`}
            </span>} />

          <InfoRow label="券码" value={<CopyToClipboard text={coupon.code} label={coupon.code} />} />

          <InfoRow label="有效期" value={<span style={{ fontSize: 13, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
              {formatDate(coupon.startAt)} ~ {formatDate(coupon.endAt)}
            </span>} />

          <InfoRow label="创建人" value={<span style={{ color: '#cbd5e1' }}>{coupon.createdBy}</span>} />
        </div>

        {/* 领取进度条 */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
              fontSize: 13,
              color: '#94a3b8',
            }}
          >
            <span>领取进度</span>
            <span>{coupon.usedCount.toLocaleString()} / {coupon.totalQuota.toLocaleString()}</span>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 4,
              background: 'rgba(148,163,184,0.2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(rate, 100)}%`,
                height: '100%',
                borderRadius: 4,
                background: rate >= 90
                  ? 'linear-gradient(90deg, #f87171, #ef4444)'
                  : rate >= 60
                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                    : 'linear-gradient(90deg, #4ade80, #22c55e)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* 操作表单 */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 24,
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(148,163,184,0.15)',
            background: 'rgba(15,23,42,0.3)',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ minWidth: 180 }}>
            <label style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>
              修改剩余库存
            </label>
            <input
              type="number"
              value={remainingQuota}
              onChange={(e) => setRemainingQuota(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(148, 163, 184, 0.25)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#e2e8f0',
                fontSize: 14,
                width: '100%',
              }}
            />
          </div>
          <SubmitButton
            onClick={async () => {
              await formSubmit.submit();
            }}
            loading={formSubmit.submitting}
          >
            保存
          </SubmitButton>
        </div>

        {/* 提交反馈 */}
        {formSubmit.error && (
          <FormSubmitFeedback error={formSubmit.error} />
        )}
        {formSubmit.success && (
          <FormSubmitFeedback success="优惠券信息已更新" />
        )}

        {/* 时间线 */}
        <div style={{ marginTop: 28, marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: '#e2e8f0' }}>
            生命周期
          </h3>
          <Timeline items={timeline} />
        </div>
      </DetailShell>

      {/* 底部导航 */}
      <DetailClosureBar links={closureLinks} />
    </main>
  );
}

export default function CouponDetailClient({ couponId }: { couponId: string }) {
  return <CouponDetailContent couponId={couponId} />;
}
