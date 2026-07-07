/**
 * 会员卡页面 — Member Card Page (小程序/H5)
 * Phase-FP T-FP-029 · 2026-07-03
 * 角色视角: 👤 会员
 * 功能: 会员卡展示、等级权益、优惠券列表
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  memberCardService,
  type MemberCard,
  type MemberCoupon,
  type MemberTier,
  TIER_CONFIG,
} from '../../lib/member-card-service';

// ====== 会员卡组件 ======

function MemberCardDisplay({ card }: { card: MemberCard }) {
  const tierConfig = TIER_CONFIG[card.tier];

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 20,
        background: `linear-gradient(135deg, ${tierConfig.color}30 0%, ${tierConfig.color}10 100%)`,
        border: `1px solid ${tierConfig.color}40`,
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰 */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `${tierConfig.color}20`,
        }}
      />

      {/* 卡号 */}
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
        会员卡号
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#f8fafc',
          fontFamily: 'monospace',
          letterSpacing: 2,
          marginBottom: 16,
        }}
      >
        {card.cardNumber}
      </div>

      {/* 会员等级 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            background: `${tierConfig.color}30`,
            border: `1px solid ${tierConfig.color}50`,
            color: tierConfig.color,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {tierConfig.name}
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          {card.points.toLocaleString()} 积分
        </div>
      </div>

      {/* 升级进度 */}
      {card.pointsToNextTier > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: '#94a3b8' }}>距离 {card.nextTierName}</span>
            <span style={{ color: tierConfig.color }}>
              还需 {card.pointsToNextTier.toLocaleString()} 积分
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(
                  ((TIER_CONFIG[card.tier].minPoints) /
                    (TIER_CONFIG[card.tier].minPoints + card.pointsToNextTier)) *
                    100,
                  100,
                )}%`,
                background: `linear-gradient(90deg, ${tierConfig.color}, ${tierConfig.color}aa)`,
                borderRadius: 3,
              }}
            />
          </div>
        </div>
      )}

      {/* 有效期 */}
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid rgba(148,163,184,0.1)',
          fontSize: 11,
          color: '#64748b',
        }}
      >
        有效期至 {card.expiresAt}
      </div>
    </div>
  );
}

// ====== 权益组件 ======

function BenefitsCard({ benefits, tier }: { benefits: string[]; tier: MemberTier }) {
  const tierConfig = TIER_CONFIG[tier];

  return (
    <div
      style={{
        borderRadius: 16,
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#f8fafc',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ color: tierConfig.color }}>✦</span>
        {tierConfig.name}专属权益
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {benefits.map((benefit, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#94a3b8',
            }}
          >
            <span style={{ color: '#4ade80', fontSize: 12 }}>✓</span>
            {benefit}
          </div>
        ))}
      </div>
    </div>
  );
}

// ====== 优惠券卡片 ======

function CouponCard({
  coupon,
  onUse,
}: {
  coupon: MemberCoupon;
  onUse?: (coupon: MemberCoupon) => void;
}) {
  const isExpired = coupon.status === 'expired';
  const isUsed = coupon.status === 'used';
  const isDisabled = isExpired || isUsed;

  const getTypeColor = () => {
    switch (coupon.type) {
      case 'discount':
        return '#3b82f6';
      case 'cash':
        return '#f59e0b';
      case 'free_shipping':
        return '#10b981';
      case 'voucher':
        return '#8b5cf6';
      default:
        return '#64748b';
    }
  };

  const typeColor = getTypeColor();

  return (
    <div
      style={{
        borderRadius: 12,
        background: isDisabled ? 'rgba(15, 23, 42, 0.4)' : 'rgba(15, 23, 42, 0.8)',
        border: `1px solid ${isDisabled ? 'rgba(148,163,184,0.08)' : typeColor + '40'}`,
        padding: 16,
        marginBottom: 12,
        opacity: isDisabled ? 0.6 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 左侧装饰条 */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: isDisabled ? '#64748b' : typeColor,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* 左侧：券信息 */}
        <div style={{ flex: 1, paddingLeft: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                background: `${typeColor}20`,
                color: typeColor,
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              {coupon.typeName}
            </span>
            {isUsed && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(100,116,139,0.2)',
                  color: '#94a3b8',
                  fontSize: 11,
                }}
              >
                已使用
              </span>
            )}
            {isExpired && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(239,68,68,0.2)',
                  color: '#f87171',
                  fontSize: 11,
                }}
              >
                已过期
              </span>
            )}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
            {coupon.name}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {coupon.minAmount} · {coupon.storeName}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
            有效期至 {coupon.validTo}
          </div>
        </div>

        {/* 右侧：面值 & 操作 */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: isDisabled ? '#64748b' : typeColor,
            }}
          >
            {coupon.value}
          </div>
          {!isDisabled && onUse && (
            <button
              onClick={() => onUse(coupon)}
              style={{
                marginTop: 8,
                padding: '6px 16px',
                borderRadius: 6,
                background: `${typeColor}20`,
                border: `1px solid ${typeColor}40`,
                color: typeColor,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              立即使用
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ====== 主页面 ======

type CouponFilter = 'ALL' | 'unused' | 'used' | 'expired';

export default function MemberCardPage() {
  const router = useRouter();
  const [card, setCard] = useState<MemberCard | null>(null);
  const [coupons, setCoupons] = useState<MemberCoupon[]>([]);
  const [couponStats, setCouponStats] = useState({
    total: 0,
    unusedCount: 0,
    usedCount: 0,
    expiredCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CouponFilter>('ALL');

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('member_access_token');
    if (!token) {
      router.push('/member-login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cardResult, couponResult] = await Promise.all([
        memberCardService.getMemberCard(),
        memberCardService.getMemberCoupons(),
      ]);

      if (cardResult.success && cardResult.data) {
        setCard(cardResult.data);
      }

      if (couponResult.success && couponResult.data) {
        setCoupons(couponResult.data.coupons);
        setCouponStats({
          total: couponResult.data.total,
          unusedCount: couponResult.data.unusedCount,
          usedCount: couponResult.data.usedCount,
          expiredCount: couponResult.data.expiredCount,
        });
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = coupons.filter((c) => {
    if (filter === 'ALL') return true;
    return c.status === filter;
  });

  const handleUseCoupon = useCallback(
    (coupon: MemberCoupon) => {
      // 跳转到门店列表选择使用
      router.push('/stores');
    },
    [router],
  );

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>加载中...</div>
      </main>
    );
  }

  if (!card) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>无法获取会员信息</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: '16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
            我的会员卡
          </h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>查看会员权益和优惠券</p>
        </div>

        {/* 会员卡 */}
        <MemberCardDisplay card={card} />

        {/* 会员权益 */}
        <BenefitsCard benefits={card.benefits} tier={card.tier} />

        {/* 优惠券区域 */}
        <div
          style={{
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            padding: 16,
          }}
        >
          {/* 标题和统计 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc' }}>我的优惠券</h2>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                共 {couponStats.total} 张
              </span>
            </div>

            {/* 统计数字 */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>
                  {couponStats.unusedCount}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>可用</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa' }}>
                  {couponStats.usedCount}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>已用</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#f87171' }}>
                  {couponStats.expiredCount}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>过期</div>
              </div>
            </div>

            {/* 筛选标签 */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: '全部' },
                { key: 'unused', label: '可用' },
                { key: 'used', label: '已用' },
                { key: 'expired', label: '过期' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key as CouponFilter)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 16,
                    border: 'none',
                    fontSize: 12,
                    cursor: 'pointer',
                    background:
                      filter === item.key
                        ? 'rgba(99, 102, 241, 0.2)'
                        : 'rgba(148, 163, 184, 0.1)',
                    color: filter === item.key ? '#a5b4fc' : '#94a3b8',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 优惠券列表 */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filteredCoupons.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 32,
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                暂无优惠券
              </div>
            ) : (
              filteredCoupons.map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onUse={handleUseCoupon}
                />
              ))
            )}
          </div>
        </div>

        {/* 底部导航 */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-around',
            padding: '12px 0',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          {[
            { icon: '🏠', label: '首页', href: '/' },
            { icon: '🏬', label: '门店', href: '/stores' },
            { icon: '🎫', label: '会员卡', href: '/member-card', active: true },
            { icon: '👤', label: '我的', href: '/member-center' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'none',
                color: item.active ? '#f59e0b' : '#64748b',
              }}
            >
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 11 }}>{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </main>
  );
}
