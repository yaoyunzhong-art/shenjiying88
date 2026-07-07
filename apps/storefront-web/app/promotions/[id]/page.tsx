'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  DetailShell,
  InfoRow,
  StatusBadge,
  Alert,
  useToast,
  useAlert,
  FormSubmitFeedback,
  type DetailShellAction,
} from '@m5/ui';

// ---- 类型 ----

type PromotionStatus = 'draft' | 'active' | 'paused' | 'ended';
type PromotionType = 'discount' | 'coupon' | 'gift' | 'flash-sale';

interface Promotion {
  id: string;
  title: string;
  type: PromotionType;
  status: PromotionStatus;
  storeName: string;
  storeId: string;
  startDate: string;
  endDate: string;
  budget: number;
  usageCount: number;
  usageLimit: number;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<PromotionType, string> = {
  discount: '折扣',
  coupon: '优惠券',
  gift: '赠品',
  'flash-sale': '秒杀',
};

const TYPE_COLORS: Record<PromotionType, string> = {
  discount: '#60a5fa',
  coupon: '#4ade80',
  gift: '#facc15',
  'flash-sale': '#f472b6',
};

const STATUS_LABELS: Record<PromotionStatus, string> = {
  draft: '草稿',
  active: '进行中',
  paused: '已暂停',
  ended: '已结束',
};

const STATUS_VARIANTS: Record<PromotionStatus, 'default' | 'success' | 'warning' | 'neutral'> = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  ended: 'neutral',
};

// ---- Mock 数据 ----

const MOCK_PROMOTIONS: Record<string, Promotion> = {
  'promo-1': {
    id: 'promo-1', title: '夏日清凉大促', type: 'discount', status: 'active',
    storeName: '旗舰店', storeId: 'store-1',
    startDate: '2026-06-20', endDate: '2026-07-20',
    budget: 50000, usageCount: 187, usageLimit: 500,
    description: '全场商品8折起，覆盖夏季新品和经典热销款。线上线下同步进行，活动期间更有满额赠礼。',
    createdBy: '张店长', createdAt: '2026-06-15', updatedAt: '2026-06-19',
  },
  'promo-2': {
    id: 'promo-2', title: '会员专属折扣', type: 'discount', status: 'active',
    storeName: '旗舰店', storeId: 'store-1',
    startDate: '2026-06-01', endDate: '2026-08-31',
    budget: 120000, usageCount: 943, usageLimit: 2000,
    description: '钻石会员享7折，黄金会员享8折，银卡会员享9折。所有折扣商品不参与其他优惠。',
    createdBy: '张店长', createdAt: '2026-05-25', updatedAt: '2026-05-30',
  },
  'promo-3': {
    id: 'promo-3', title: '满减优惠券', type: 'coupon', status: 'active',
    storeName: '南山分店', storeId: 'store-2',
    startDate: '2026-06-15', endDate: '2026-07-15',
    budget: 30000, usageCount: 56, usageLimit: 300,
    description: '领券满300减50，满500减100。每人限领1张，数量有限先到先得。',
    createdBy: '李经理', createdAt: '2026-06-10', updatedAt: '2026-06-14',
  },
  'promo-4': {
    id: 'promo-4', title: '买一送一活动', type: 'gift', status: 'paused',
    storeName: '福田分店', storeId: 'store-3',
    startDate: '2026-06-10', endDate: '2026-07-10',
    budget: 20000, usageCount: 234, usageLimit: 500,
    description: '指定饮品买一送一。由于库存紧张已暂停，等待补货后恢复。',
    createdBy: '王主管', createdAt: '2026-06-05', updatedAt: '2026-06-18',
  },
  'promo-5': {
    id: 'promo-5', title: '双倍积分活动', type: 'coupon', status: 'ended',
    storeName: '旗舰店', storeId: 'store-1',
    startDate: '2026-05-01', endDate: '2026-05-31',
    budget: 15000, usageCount: 567, usageLimit: 1000,
    description: '活动期间消费享双倍积分，积分可在会员商城兑换礼品。',
    createdBy: '张店长', createdAt: '2026-04-25', updatedAt: '2026-06-01',
  },
  'promo-6': {
    id: 'promo-6', title: '新品首发特价', type: 'flash-sale', status: 'draft',
    storeName: '宝安店', storeId: 'store-4',
    startDate: '2026-07-01', endDate: '2026-07-03',
    budget: 80000, usageCount: 0, usageLimit: 300,
    description: '新品限量首发！前300名下单享5折特惠。仅限线上渠道参与。',
    createdBy: '赵专员', createdAt: '2026-06-20', updatedAt: '2026-06-20',
  },
};

// ---- 状态流转定义 ----

const STATUS_TRANSITIONS: Record<PromotionStatus, Array<{
  label: string;
  to: PromotionStatus;
  variant: DetailShellAction['variant'];
}>> = {
  draft: [
    { label: '启动活动', to: 'active', variant: 'primary' },
  ],
  active: [
    { label: '暂停', to: 'paused', variant: 'secondary' },
    { label: '提前结束', to: 'ended', variant: 'danger' },
  ],
  paused: [
    { label: '恢复活动', to: 'active', variant: 'primary' },
    { label: '终止', to: 'ended', variant: 'danger' },
  ],
  ended: [],
};

// ---- 样式 ----

const infoGroupStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  background: 'rgba(15, 23, 42, 0.25)',
  border: '1px solid rgba(148, 163, 184, 0.1)',
};

const statCardStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: '14px 16px',
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.08)',
};

// ---- 统计卡片 ----

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div style={statCardStyle}>
      <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginTop: 4,
          color: valueColor ?? '#f1f5f9',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ---- 页面主组件 ----

export default function PromotionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { alert, dismiss: clearAlert } = useAlert();

  const [promotion, setPromotion] = useState<Promotion | null>(
    () => MOCK_PROMOTIONS[params.id] ?? null,
  );
  const [transitioning, setTransitioning] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // ---- 状态流转 ----

  const handleTransition = useCallback(
    async (to: PromotionStatus) => {
      if (!promotion) return;
      setTransitioning(true);
      try {
        // 模拟 API 调用
        await new Promise((r) => setTimeout(r, 400));
        setPromotion({ ...promotion, status: to, updatedAt: new Date().toISOString().slice(0, 10) });
        toast.success(`活动状态已变更为「${STATUS_LABELS[to]}」`, { durationMs: 2000 });
      } catch {
        toast.error('状态变更失败，请重试');
      } finally {
        setTransitioning(false);
      }
    },
    [promotion, toast],
  );

  // ---- 删除 ----

  const handleDelete = useCallback(async () => {
    if (!promotion) return;
    setTransitioning(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setDeleteConfirm(false);
      toast.success('活动已删除', { durationMs: 2000 });
      setTimeout(() => router.push('/promotions'), 1200);
    } catch {
      toast.error('删除失败，请重试');
    } finally {
      setTransitioning(false);
    }
  }, [promotion, router, toast]);

  // ---- 操作按钮 ----

  const detailActions: DetailShellAction[] = useMemo(() => {
    if (!promotion) return [];
    const actions: DetailShellAction[] = [];

    // 状态流转按钮
    const transitions = STATUS_TRANSITIONS[promotion.status] ?? [];
    for (const t of transitions) {
      actions.push({
        key: `to-${t.to}`,
        label: t.label,
        variant: t.variant,
        onClick: () => handleTransition(t.to),
      });
    }

    actions.push({
      key: 'delete',
      label: '删除活动',
      variant: 'danger',
      onClick: () => setDeleteConfirm(true),
    });

    return actions;
  }, [promotion, handleTransition]);

  // ---- 信息区域 ----

  const infoSections = useMemo(() => {
    if (!promotion) return [];

    const budgetUsedPct =
      promotion.budget > 0
        ? Math.round((promotion.usageCount / promotion.usageLimit) * 100)
        : 0;

    return [
      {
        title: '活动概览',
        content: (
          <div style={infoGroupStyle}>
            <InfoRow
              label="活动类型"
              value={
                <span style={{ color: TYPE_COLORS[promotion.type] }}>
                  {TYPE_LABELS[promotion.type]}
                </span>
              }
            />
            <InfoRow
              label="状态"
              value={
                <StatusBadge
                  label={STATUS_LABELS[promotion.status]}
                  variant={STATUS_VARIANTS[promotion.status]}
                  size="sm"
                />
              }
            />
            <InfoRow label="所属门店" value={promotion.storeName} />
            <InfoRow label="活动周期" value={`${promotion.startDate} → ${promotion.endDate}`} />
            <InfoRow label="创建人" value={promotion.createdBy} />
            <InfoRow label="创建时间" value={promotion.createdAt} />
            <InfoRow label="最后更新" value={promotion.updatedAt} />
          </div>
        ),
      },
      {
        title: '活动描述',
        content: (
          <div style={infoGroupStyle}>
            <p style={{ margin: 0, color: '#cbd5e1', fontSize: 14, lineHeight: 1.7 }}>
              {promotion.description}
            </p>
          </div>
        ),
      },
    ];
  }, [promotion]);

  // ---- 统计卡片 ----

  const statCards = useMemo(() => {
    if (!promotion) return [];
    const budgetUsedPct =
      promotion.budget > 0
        ? Math.round((promotion.usageCount / promotion.usageLimit) * 100)
        : 0;
    const daysRemaining =
      promotion.status !== 'ended'
        ? Math.max(0, Math.ceil(
            (new Date(promotion.endDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
          ))
        : 0;

    return [
      { label: '预算 (¥)', value: promotion.budget.toLocaleString(), valueColor: '#60a5fa' },
      { label: '已使用 / 上限', value: `${promotion.usageCount} / ${promotion.usageLimit}`, valueColor: '#4ade80' },
      { label: '使用率', value: `${budgetUsedPct}%`, valueColor: budgetUsedPct > 80 ? '#ef4444' : '#facc15' },
      {
        label: '剩余天数',
        value: promotion.status === 'ended' ? '已结束' : `${daysRemaining} 天`,
        valueColor: daysRemaining <= 3 ? '#f87171' : '#94a3b8',
      },
    ];
  }, [promotion]);

  // ---- 404 ----

  if (!promotion) {
    return (
      <DetailShell
        title="活动详情"
        backLabel="返回列表"
        backHref="/promotions"
        loading={false}
      >
        <div
          style={{
            textAlign: 'center',
            padding: 64,
            color: '#64748b',
            fontSize: 14,
          }}
        >
          未找到该活动（ID: {params.id}），可能已被删除
        </div>
      </DetailShell>
    );
  }

  return (
    <>
      {/* Alert 提示 */}
      {alert && (
        <Alert variant={alert.variant} dismissible onDismiss={clearAlert}>
          {alert.message}
        </Alert>
      )}

      <DetailShell
        title={promotion.title}
        subtitle={`${promotion.storeName} · ${promotion.startDate} → ${promotion.endDate}`}
        backLabel="返回促销列表"
        backHref="/promotions"
        actions={detailActions}
        sections={infoSections}
        breadcrumbs={[
          { label: '首页', href: '/' },
          { label: '促销活动', href: '/promotions' },
          { label: promotion.title },
        ]}
        loading={transitioning}
      >
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
          data-testid="promotion-stats"
        >
          {statCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              valueColor={card.valueColor}
            />
          ))}
        </div>

        {/* 状态变更 loading */}
        {transitioning && (
          <FormSubmitFeedback submitting />
        )}

        {/* 删除确认对话框 */}
        {deleteConfirm && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 999,
            }}
            role="dialog"
            aria-modal="true"
            aria-label="确认删除"
            onClick={() => setDeleteConfirm(false)}
          >
            <div
              style={{
                background: '#1e293b',
                borderRadius: 16,
                padding: 24,
                maxWidth: 420,
                width: '90%',
                border: '1px solid rgba(148,163,184,0.14)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#e2e8f0' }}>
                确认删除活动？
              </h3>
              <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
                删除操作不可撤销，活动「{promotion.title}」将永久移除。
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'flex-end',
                  marginTop: 20,
                }}
              >
                <button
                  onClick={() => setDeleteConfirm(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid rgba(148,163,184,0.2)',
                    background: 'transparent',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                  data-testid="cancel-delete-btn"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#ef4444',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                  data-testid="confirm-delete-btn"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}
      </DetailShell>
    </>
  );
}
