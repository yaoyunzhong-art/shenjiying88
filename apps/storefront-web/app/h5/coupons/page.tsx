/**
 * H5优惠券页面 - Coupons Page (H5端)
 * Phase-FP T-FP-029 · 2026-07-03
 * 角色视角: 👤 会员
 * 功能: 查看和使用优惠券
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { couponService, type Coupon, type CouponStatus, TYPE_CONFIG } from '../../../lib/coupon-service';
import {
  getMainContainerStyle,
  getToggleChipStyle,
  getCardStyle,
  getEmptyStateStyle,
  getEmptyStateEmojiStyle,
  H5Header,
  H5NavBar,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_MUTED,
  COLOR_BORDER,
} from '../h5-style';

type FilterStatus = CouponStatus | 'ALL';

export default function H5CouponsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const filtered = useMemo(() => {
    if (filter === 'ALL') return coupons;
    return coupons.filter((c) => c.status === filter);
  }, [coupons, filter]);

  const stats = useMemo(() => ({
    total: coupons.length,
    unused: coupons.filter((c) => c.status === 'unused').length,
    used: coupons.filter((c) => c.status === 'used').length,
    expired: coupons.filter((c) => c.status === 'expired').length,
  }), [coupons]);

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    setLoading(true);
    const result = await couponService.getCoupons();
    if (result.success && result.data) {
      setCoupons(result.data.coupons);
    }
    setLoading(false);
  }

  return (
    <main style={getMainContainerStyle()}>
      <H5Header title="我的优惠券">
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 8, background: 'rgba(16,185,129,0.1)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>{stats.unused}</div>
            <div style={{ fontSize: 11, color: COLOR_TEXT_MUTED }}>可用</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 8, background: 'rgba(59,130,246,0.1)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa' }}>{stats.used}</div>
            <div style={{ fontSize: 11, color: COLOR_TEXT_MUTED }}>已用</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>{stats.expired}</div>
            <div style={{ fontSize: 11, color: COLOR_TEXT_MUTED }}>过期</div>
          </div>
        </div>
      </H5Header>

      {/* 筛选标签 */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
        {[
          { key: 'unused', label: '可用' },
          { key: 'used', label: '已用' },
          { key: 'expired', label: '过期' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as CouponStatus)}
            style={getToggleChipStyle(filter === item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 优惠券列表 */}
      <section style={{ padding: '0 16px' }}>
        {filtered.length === 0 ? (
          <div style={getEmptyStateStyle()}>
            <div style={getEmptyStateEmojiStyle()}>🎫</div>
            <div>暂无优惠券</div>
          </div>
        ) : (
          filtered.map((coupon) => {
            const config = TYPE_CONFIG[coupon.type];
            const isDisabled = coupon.status !== 'unused';

            return (
              <div
                key={coupon.id}
                style={getCardStyle({ disabled: isDisabled })}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  {/* 左侧面值 */}
                  <div style={{ textAlign: 'center', minWidth: 80, paddingRight: 12, borderRight: COLOR_BORDER }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: config.color }}>{coupon.value}</div>
                    <div style={{ fontSize: 11, color: COLOR_TEXT_MUTED }}>{coupon.typeName}</div>
                  </div>
                  {/* 右侧信息 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: COLOR_TEXT_PRIMARY, marginBottom: 4 }}>{coupon.name}</div>
                    <div style={{ fontSize: 12, color: COLOR_TEXT_MUTED, marginBottom: 4 }}>{coupon.minAmount}</div>
                    <div style={{ fontSize: 11, color: COLOR_TEXT_MUTED }}>有效期至 {coupon.validTo}</div>
                    <div style={{ fontSize: 11, color: COLOR_TEXT_MUTED }}>{coupon.storeName}</div>
                  </div>
                  {/* 状态/操作 */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {coupon.status === 'unused' ? (
                      <button
                        onClick={() => router.push('/stores')}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          background: `${config.color}20`,
                          border: `1px solid ${config.color}40`,
                          color: config.color,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        立即使用
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: coupon.status === 'used' ? '#60a5fa' : '#f87171' }}>
                        {coupon.status === 'used' ? '已使用' : '已过期'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      <H5NavBar activeKey="coupons" />
    </main>
  );
}
