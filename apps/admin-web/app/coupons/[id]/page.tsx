'use client';

import { Suspense, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  PageShell,
  StatusBadge,
  DetailActionBar,
  DetailClosureBar,
  InfoCard,
  ProgressCard,
  KpiSummaryCard,
  Spinner,
  ToastContainer,
  useToast,
} from '@m5/ui';

import {
  MOCK_COUPONS,
  COUPON_STATUS_MAP,
  COUPON_TYPE_MAP,
  COUPON_SCOPE_MAP,
  type CouponItem,
  type CouponStatus,
} from '../../coupons-data';

// ---- 辅助函数 ----

function findCoupon(id: string): CouponItem | undefined {
  return MOCK_COUPONS.find((c) => c.id === id);
}

function claimRate(item: CouponItem): number {
  if (item.totalQuota <= 0) return 0;
  return (item.usedCount / item.totalQuota) * 100;
}

// ---- 可用的状态流转映射 ----

const STATUS_TRANSITIONS: Record<CouponStatus, CouponStatus[]> = {
  draft: ['active'],
  active: ['paused', 'exhausted'],
  paused: ['active', 'exhausted'],
  exhausted: [],
  expired: [],
};

function statusActionLabel(status: CouponStatus, target: CouponStatus): string {
  const map: Record<string, string> = {
    'draft->active': '发布',
    'active->paused': '暂停',
    'paused->active': '恢复',
    'active->exhausted': '设为已领完',
    'paused->exhausted': '截停',
  };
  return map[`${status}->${target}`] ?? target;
}

// ---- 样式 ----

const sectionCardStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#e2e8f0',
  marginBottom: 12,
  paddingBottom: 8,
  borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
};

const statValueStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  color: '#e2e8f0',
  marginTop: 6,
};

const backBtnStyle: React.CSSProperties = {
  marginTop: 16,
  padding: '10px 24px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.3)',
  background: 'rgba(15,23,42,0.5)',
  color: '#93c5fd',
  cursor: 'pointer',
  fontSize: 14,
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.3)',
  background: 'transparent',
  color: '#94a3b8',
  cursor: 'pointer',
  fontSize: 14,
};

const confirmBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: 8,
  border: 'none',
  background: '#3b82f6',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
};

// ---- 详情页面组件 ----

function CouponDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const coupon = useMemo(() => findCoupon(id), [id]);

  // 状态流转
  const [confirmTarget, setConfirmTarget] = useState<CouponStatus | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const toast = useToast();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleStatusTransition = useCallback(
    (target: CouponStatus) => {
      if (!coupon) return;
      setConfirmTarget(target);
      setShowDialog(true);
    },
    [coupon],
  );

  const confirmTransition = useCallback(async () => {
    if (!coupon || !confirmTarget) return;
    setIsConfirming(true);
    await new Promise((r) => setTimeout(r, 600));
    const action = statusActionLabel(coupon.status, confirmTarget);
    toast.success(`操作成功：${action} —— 优惠券「${coupon.name}」`);
    setIsConfirming(false);
    setShowDialog(false);
    setConfirmTarget(null);
  }, [coupon, confirmTarget, toast]);

  const handleEdit = useCallback(() => {
    if (!coupon) return;
    router.push(`/coupons/form?id=${coupon.id}`);
  }, [coupon, router]);

  const handleDelete = useCallback(async () => {
    if (!coupon) return;
    toast.info(`已删除优惠券「${coupon.name}」（模拟操作）`);
  }, [coupon, toast]);

  const handleBack = useCallback(() => {
    router.push('/coupons');
  }, [router]);

  if (!coupon) {
    return (
      <PageShell title="优惠券详情" subtitle="未找到该优惠券">
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h2 style={{ color: '#cbd5e1', marginBottom: 8 }}>找不到该优惠券</h2>
          <p>优惠券 ID：{id} 不存在，可能已删除或链接有误。</p>
          <button onClick={handleBack} style={backBtnStyle}>
            ← 返回优惠券列表
          </button>
        </div>
      </PageShell>
    );
  }

  const rate = claimRate(coupon);
  const statusInfo = COUPON_STATUS_MAP[coupon.status];
  const typeInfo = COUPON_TYPE_MAP[coupon.type];
  const transitions = STATUS_TRANSITIONS[coupon.status] ?? [];
  const canDelete = coupon.status === 'draft' || coupon.status === 'expired';

  // 构建 DetailActionBar actions
  const extraActions = transitions.map((target) => ({
    key: `transition-${target}`,
    label: statusActionLabel(coupon.status, target),
    variant: target === 'exhausted' ? 'danger' as const : 'primary' as const,
    onClick: () => handleStatusTransition(target),
  }));

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 32 }}>
      <PageShell title="优惠券详情" subtitle="查看、编辑和管理优惠券信息">
        {/* 操作栏 */}
        <DetailActionBar
          heading={`${coupon.code} — ${coupon.name}`}
          caption={`状态：${statusInfo.label}`}
          actions={[
            { key: 'back', label: '← 返回列表', onClick: handleBack, variant: 'default' },
            { key: 'edit', label: '编辑', onClick: handleEdit, variant: 'primary' },
            ...(canDelete
              ? [{ key: 'delete', label: '删除', onClick: handleDelete, variant: 'danger' as const }]
              : []),
            ...extraActions,
          ]}
        />

        {/* 顶部 KPI 统计 */}
        <div style={{ marginBottom: 24 }}>
          <KpiSummaryCard
            title="关键指标"
            columns={4}
            items={[
              { label: '发放总量', value: coupon.totalQuota.toLocaleString() },
              { label: '已核销', value: coupon.usedCount.toLocaleString(), helper: `领取率 ${rate.toFixed(1)}%` },
              { label: '剩余量', value: coupon.remainingQuota.toLocaleString(), helper: coupon.remainingQuota > 0 ? '可继续使用' : '已用完' },
              { label: '每人限领', value: coupon.usageLimit === 99999 ? '不限' : `${coupon.usageLimit} 次` },
            ]}
          />
        </div>

        {/* 核心信息双栏布局 */}
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: '1fr 1fr', marginBottom: 18 }}>
          {/* 基本信息 */}
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>基本信息</div>
            <InfoCard
              items={[
                { label: '优惠券名称', value: coupon.name },
                { label: '券码', value: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{coupon.code}</span> },
                { label: '优惠类型', value: `${typeInfo.label}${coupon.discountValue > 0 ? ` ${coupon.discountValue}${typeInfo.suffix}` : ''}` },
                { label: '门槛', value: coupon.threshold > 0 ? `满 ¥${coupon.threshold}` : '无门槛' },
                { label: '适用范围', value: COUPON_SCOPE_MAP[coupon.scope] },
                { label: '创建人', value: coupon.createdBy },
                { label: '更新时间', value: coupon.updatedAt },
              ]}
              columns={1}
              layout="vertical"
              variant="compact"
            />
          </div>

          {/* 右栏 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* 领取进度 */}
            <div style={sectionCardStyle}>
              <div style={sectionTitleStyle}>领取进度</div>
              <ProgressCard
                title="领取率"
                value={`${rate.toFixed(1)}%`}
                progress={rate}
                description={`已领 ${coupon.usedCount.toLocaleString()} / 共 ${coupon.totalQuota.toLocaleString()}`}
              />
            </div>

            {/* 有效期 */}
            <div style={sectionCardStyle}>
              <div style={sectionTitleStyle}>有效期</div>
              <div style={{ display: 'flex', gap: 24 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>开始</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, color: '#e2e8f0' }}>
                    🚀 {coupon.startAt}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>结束</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, color: '#e2e8f0' }}>
                    ⏰ {coupon.endAt}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 使用统计 */}
        <div style={{ ...sectionCardStyle, marginBottom: 24 }}>
          <div style={sectionTitleStyle}>使用统计</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>已核销</div>
              <div style={statValueStyle}>{coupon.usedCount.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>剩余量</div>
              <div style={{ ...statValueStyle, color: coupon.remainingQuota === 0 ? '#f87171' : '#4ade80' }}>
                {coupon.remainingQuota.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>领取率</div>
              <div style={{ ...statValueStyle, color: rate >= 90 ? '#f87171' : rate >= 60 ? '#fbbf24' : '#4ade80' }}>
                {rate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* 底部闭环链接 */}
        <DetailClosureBar
          links={[
            { key: 'list', title: '优惠券列表', subtitle: '返回优惠券管理中心', href: '/coupons' },
            { key: 'form', title: '创建新优惠券', subtitle: '新建一张优惠券', href: '/coupons/form' },
          ]}
          heading="相关操作"
          caption="回到列表或创建新券"
        />
      </PageShell>

      {/* 状态流转确认弹窗 */}
      {showDialog && confirmTarget && (
        <div
          style={{
            position: 'fixed', zIndex: 10000, inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => { if (!isConfirming) { setShowDialog(false); setConfirmTarget(null); } }}
        >
          <div
            style={{
              background: '#1e293b', borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw',
              border: '1px solid rgba(148,163,184,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#e2e8f0', margin: '0 0 12px', fontSize: 17 }}>确认状态变更</h3>
            <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              确定要将优惠券「<strong style={{ color: '#cbd5e1' }}>{coupon.name}</strong>」
              的状态变更为「<strong style={{ color: COUPON_STATUS_MAP[confirmTarget].variant === 'danger' ? '#f87171' : '#4ade80' }}>{COUPON_STATUS_MAP[confirmTarget].label}</strong>」吗？
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => { setShowDialog(false); setConfirmTarget(null); }} disabled={isConfirming} style={cancelBtnStyle}>
                取消
              </button>
              <button onClick={confirmTransition} disabled={isConfirming} style={confirmBtnStyle}>
                {isConfirming ? '处理中...' : '确认变更'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 通知容器 */}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </main>
  );
}

export default function CouponDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CouponDetailContent />
    </Suspense>
  );
}

// ---- 加载占位 ----

function LoadingFallback() {
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: 32 }}>
      <Spinner label="加载优惠券详情..." />
    </main>
  );
}
