'use client';

import { useParams } from 'next/navigation';
import React, { useMemo, useState, useEffect } from 'react';

import {
  DetailShell,
  InfoRow,
  QuickStats,
  type DetailShellAction,
} from '@m5/ui';

// ---- 类型 ----

type CouponType = 'discount' | 'cash' | 'free_shipping' | 'voucher';
type CouponStatus = 'active' | 'expired' | 'disabled';

interface CouponDetail {
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
  storeName: string;
  storeId: string;
  status: CouponStatus;
  description: string;
  usageLimit: number;
  usedLimit: number;
}

const TYPE_LABELS: Record<CouponType, string> = {
  discount: '打折券',
  cash: '代金券',
  free_shipping: '免运费',
  voucher: '礼品券',
};



// ---- Mock 数据 ----

const MOCK_COUPON_DETAILS: Record<string, CouponDetail> = {
  cp1: {
    id: 'cp1', name: '新客首单8折', type: 'discount', value: '8折',
    minAmount: '满0元可用', maxAmount: '最高折扣 ¥50',
    totalIssued: 500, usedCount: 187,
    validFrom: '2026-06-01', validTo: '2026-07-31',
    storeName: 'Demo Store 旗舰店', storeId: 'store-1',
    status: 'active',
    description: '新用户首次下单享受8折优惠，适用于所有商品品类。每人限用1次。',
    usageLimit: 1, usedLimit: 187,
  },
  cp2: {
    id: 'cp2', name: '满300减50', type: 'cash', value: '¥50',
    minAmount: '满300元', maxAmount: '—',
    totalIssued: 300, usedCount: 89,
    validFrom: '2026-06-01', validTo: '2026-06-30',
    storeName: 'Demo Store 旗舰店', storeId: 'store-1',
    status: 'active',
    description: '单笔订单满300元减50元。不可与其他优惠券叠加使用。',
    usageLimit: 1, usedLimit: 89,
  },
  cp5: {
    id: 'cp5', name: '端午节礼券', type: 'voucher', value: '¥100',
    minAmount: '满200元', maxAmount: '—',
    totalIssued: 150, usedCount: 98,
    validFrom: '2026-06-01', validTo: '2026-06-15',
    storeName: 'Demo Store 社区店', storeId: 'store-2',
    status: 'expired',
    description: '端午节限定礼品券，可兑换指定商品组合。数量有限，先到先得。',
    usageLimit: 1, usedLimit: 98,
  },
  cp3: {
    id: 'cp3', name: '会员专享免运费', type: 'free_shipping', value: '免运费',
    minAmount: '满99元', maxAmount: '—',
    totalIssued: 1000, usedCount: 412,
    validFrom: '2026-06-01', validTo: '2026-12-31',
    storeName: 'Demo Store 旗舰店', storeId: 'store-1',
    status: 'active',
    description: '会员专享免运费权益，下单满99元即享包邮服务。',
    usageLimit: 99, usedLimit: 412,
  },
  cp8: {
    id: 'cp8', name: '开业庆代价券', type: 'cash', value: '¥30',
    minAmount: '满150元', maxAmount: '—',
    totalIssued: 400, usedCount: 15,
    validFrom: '2026-05-20', validTo: '2026-07-20',
    storeName: 'Demo Store 社区店', storeId: 'store-2',
    status: 'disabled',
    description: '新店开业优惠，全场通用。每人限领1张。',
    usageLimit: 1, usedLimit: 15,
  },
};

// ---- 页面 ----

export default function CouponDetailPage() {
  const params = useParams();
  const couponId = params?.id as string;
  const coupon = useMemo(() => MOCK_COUPON_DETAILS[couponId], [couponId]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'disable' | 'enable' | 'delete'>('disable');

  if (loading) return <DetailShell title="加载中..." subtitle=""><div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>加载中...</div></DetailShell>;
  if (error) return <DetailShell title="数据获取失败" subtitle=""><div style={{ textAlign: 'center', padding: 48, color: '#f87171' }}>数据获取失败: {error}</div></DetailShell>;

  if (!coupon) {
    return (
      <DetailShell title="优惠券不存在" subtitle="">
        <div style={{ textAlign: 'center', padding: 48, color: '#64748b', fontSize: 14 }}>
          未找到该优惠券（ID: {couponId}），可能已被删除
        </div>
      </DetailShell>
    );
  }

  const redeemRate = coupon.totalIssued > 0
    ? Math.round((coupon.usedCount / coupon.totalIssued) * 100)
    : 0;
  const remaining = coupon.totalIssued - coupon.usedCount;

  const actions: DetailShellAction[] = [];
  if (coupon.status === 'active') {
    actions.push({
      key: 'disable',
      label: '停用优惠券',
      onClick: () => { setConfirmAction('disable'); setShowConfirm(true); },
    });
  } else if (coupon.status === 'disabled') {
    actions.push({
      key: 'enable',
      label: '重新启用',
      onClick: () => { setConfirmAction('enable'); setShowConfirm(true); },
    });
  }
  actions.push({
    key: 'delete',
    label: '删除',
    onClick: () => { setConfirmAction('delete'); setShowConfirm(true); },
  });

  return (
    <DetailShell
      title={coupon.name}
      subtitle={`有效期: ${coupon.validFrom} → ${coupon.validTo}`}
      actions={actions}
    >
      {/* 关键指标 */}
      <QuickStats
        items={[
          { label: '总发放', value: coupon.totalIssued.toLocaleString() },
          { label: '已核销', value: coupon.usedCount.toLocaleString() },
          { label: '剩余可用', value: remaining.toLocaleString(), valueColor: remaining > 0 ? '#4ade80' : '#f87171' },
          { label: '核销率', value: `${redeemRate}%`, valueColor: redeemRate > 50 ? '#4ade80' : '#facc15' },
          { label: '每人限用', value: coupon.usageLimit > 99 ? '不限' : `${coupon.usageLimit} 次` },
          { label: '累计使用', value: `${coupon.usedLimit.toLocaleString()} 人次` },
        ]}
      />

      {/* 基本信息 */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.4)',
        borderRadius: 12,
        border: '1px solid rgba(148, 163, 184, 0.1)',
        padding: 20,
        marginTop: 24,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>
          基本信息
        </h3>
        <InfoRow label="券 ID" value={coupon.id} />
        <InfoRow label="券名称" value={coupon.name} />
        <InfoRow label="类型" value={TYPE_LABELS[coupon.type]} />
        <InfoRow label="面值" value={coupon.value} />
        <InfoRow label="使用门槛" value={coupon.minAmount} />
        <InfoRow label="最高抵扣" value={coupon.maxAmount} />
        <InfoRow label="有效期" value={`${coupon.validFrom} → ${coupon.validTo}`} />
        <InfoRow label="所属门店" value={coupon.storeName} />
        <InfoRow label="券描述" value={coupon.description} />
      </div>

      {/* 确认对话框 */}
      {showConfirm && (
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
          onClick={() => setShowConfirm(false)}
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
              {confirmAction === 'disable'
                ? '确认停用此优惠券？'
                : confirmAction === 'enable'
                  ? '确认重新启用此优惠券？'
                  : '确认删除此优惠券？'}
            </h3>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
              {confirmAction === 'disable'
                ? `停用后优惠券 "${coupon.name}" 将不可继续使用，已领取但未使用的券将失效。`
                : confirmAction === 'enable'
                  ? `重新启用后优惠券 "${coupon.name}" 将继续生效。`
                  : `删除操作不可撤销，优惠券 "${coupon.name}" 将永久移除。`}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid rgba(148,163,184,0.2)',
                  background: 'transparent',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                取消
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: confirmAction === 'delete' ? '#ef4444' : '#3b82f6',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {confirmAction === 'disable' ? '停用' : confirmAction === 'enable' ? '启用' : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DetailShell>
  );
}
