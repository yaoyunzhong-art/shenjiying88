'use client';

import React, { useEffect, useState } from 'react';
import { PageShell } from '@m5/ui';
import {
  MOCK_AVAILABLE_COUPONS,
  MOCK_ALLIANCE_COUPONS,
  MOCK_MY_COUPONS,
  STEPPED_RULES,
  formatDate,
  getStatusLabel,
  getStatusColor,
  type Coupon,
  type AllianceCoupon,
  type CouponStatus,
} from './coupon-center-data';
import {
  getAvailableCoupons,
  getMyCoupons,
  claimCoupon,
  useCoupon,
  getAllianceCoupons,
  evaluateDiscount,
  getAIRecommendedCoupon,
} from './coupon-center-service';

type TabType = 'available' | 'mine' | 'alliance';

export default function CouponCenterPage() {
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>(MOCK_AVAILABLE_COUPONS);
  const [myCoupons, setMyCoupons] = useState<(Coupon | AllianceCoupon)[]>(MOCK_MY_COUPONS);
  const [allianceCoupons, setAllianceCoupons] = useState<AllianceCoupon[]>(MOCK_ALLIANCE_COUPONS);

  const [orderAmount, setOrderAmount] = useState<number>(0);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiRecommended, setAIRecommended] = useState<Coupon | null>(null);

  useEffect(() => {
    getAvailableCoupons().then(setAvailableCoupons);
    getMyCoupons().then(setMyCoupons);
    getAllianceCoupons().then(setAllianceCoupons);
  }, []);

  const handleClaim = async (couponId: string) => {
    const result = await claimCoupon(couponId);
    if (result.success) {
      const coupon = availableCoupons.find(c => c.couponId === couponId);
      if (coupon) {
        setAvailableCoupons(prev => prev.filter(c => c.couponId !== couponId));
        setMyCoupons(prev => [{ ...coupon, status: 'claimed' as CouponStatus }, ...prev]);
      }
    }
  };

  const handleUse = async (couponId: string) => {
    const result = await useCoupon(couponId, 'ORD-' + Date.now());
    if (result.success) {
      setMyCoupons(prev =>
        prev.map(c => (c.couponId === couponId ? { ...c, status: 'used' as CouponStatus } : c))
      );
    }
  };

  const handleAIRecommend = () => {
    const recommended = getAIRecommendedCoupon(orderAmount, availableCoupons);
    setAIRecommended(recommended);
    setShowAIModal(true);
  };

  const discountResult = evaluateDiscount(orderAmount);

  const renderCouponCard = (coupon: Coupon | AllianceCoupon, isAlliance = false) => {
    const isClaimed = coupon.status === 'claimed';
    const isUsed = coupon.status === 'used';
    const isExpired = coupon.status === 'expired';
    const canClaim = !isClaimed && !isUsed && !isExpired;
    const canUse = isClaimed;

    const discountText =
      'type' in coupon && coupon.type === 'discount'
        ? `${Math.round((1 - coupon.discountValue) * 100)}折`
        : 'type' in coupon && coupon.type === 'shipping'
          ? '免运费'
          : 'type' in coupon && coupon.type === 'gift'
            ? '礼品券'
            : `减${coupon.discountValue}元`;

    return (
      <div
        key={coupon.couponId}
        style={{
          background: 'rgba(15,23,42,0.8)',
          border: `1px solid ${getStatusColor(coupon.status as CouponStatus)}33`,
          borderRadius: 12,
          padding: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isAlliance && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              padding: '2px 8px',
              fontSize: 10,
              color: '#fff',
              borderRadius: '0 12px 0 8px',
            }}
          >
            联盟券
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 70,
              height: 70,
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#fff',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {discountText}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', margin: '0 0 4px' }}>
              {coupon.name}
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 6px' }}>
              {coupon.description}
            </p>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
              {formatDate(coupon.validFrom)} - {formatDate(coupon.validUntil)}
            </p>
          </div>
        </div>

        {isAlliance && 'partnerStores' in coupon && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              padding: '8px 10px',
              background: 'rgba(139,92,246,0.1)',
              borderRadius: 6,
            }}
          >
            <span style={{ fontSize: 12, color: '#a78bfa' }}>
              跨店 · {coupon.partnerStores.length}家参与
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {coupon.partnerStores.slice(0, 4).map((store, i) => (
                <span key={i} style={{ fontSize: 14 }}>
                  {store.logo || '🏪'}
                </span>
              ))}
              {coupon.partnerStores.length > 4 && (
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  +{coupon.partnerStores.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {(coupon as Coupon).tags?.map((tag, i) => (
            <span
              key={i}
              style={{
                padding: '2px 8px',
                fontSize: 10,
                borderRadius: 4,
                background: 'rgba(59,130,246,0.15)',
                color: '#60a5fa',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 12,
              color: getStatusColor(coupon.status as CouponStatus),
              fontWeight: 500,
            }}
          >
            {getStatusLabel(coupon.status as CouponStatus)}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            {canClaim && (
              <button
                onClick={() => handleClaim(coupon.couponId)}
                style={{
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                立即领取
              </button>
            )}
            {canUse && (
              <button
                onClick={() => handleUse(coupon.couponId)}
                style={{
                  padding: '6px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                去使用
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSteppedDiscount = () => (
    <div
      style={{
        background: 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 16px' }}>
        满减阶梯计算
      </h2>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          type="number"
          value={orderAmount || ''}
          onChange={e => setOrderAmount(Number(e.target.value))}
          placeholder="输入订单金额"
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 14,
            borderRadius: 6,
            border: '1px solid rgba(148,163,184,0.2)',
            background: 'rgba(15,23,42,0.8)',
            color: '#f8fafc',
            outline: 'none',
          }}
        />
        <button
          onClick={handleAIRecommend}
          style={{
            padding: '10px 16px',
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          AI推荐
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {STEPPED_RULES.map((rule, i) => {
          const isActive = orderAmount >= rule.threshold;
          const isBest =
            discountResult.rule?.threshold === rule.threshold && isActive;
          return (
            <div
              key={i}
              style={{
                padding: 12,
                borderRadius: 8,
                background: isBest
                  ? 'rgba(34,197,94,0.15)'
                  : isActive
                    ? 'rgba(59,130,246,0.1)'
                    : 'rgba(15,23,42,0.6)',
                border: `1px solid ${isBest ? '#22c55e' : isActive ? '#3b82f6' : 'rgba(148,163,184,0.1)'}`,
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: isActive ? '#22c55e' : '#94a3b8',
                  margin: '0 0 4px',
                }}
              >
                {rule.label}
              </p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                {isActive ? '可享' : '未达'}
              </p>
            </div>
          );
        })}
      </div>

      {orderAmount > 0 && (
        <div
          style={{
            padding: 16,
            background: 'rgba(34,197,94,0.1)',
            borderRadius: 8,
            border: '1px solid rgba(34,197,94,0.2)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 4px' }}>
            输入金额 ¥{orderAmount} 预计优惠
          </p>
          <p style={{ fontSize: 28, fontWeight: 700, color: '#22c55e', margin: 0 }}>
            -¥{discountResult.discount}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <PageShell title="优惠券中心" description="领取优惠券，享受更多优惠">
      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          borderBottom: '1px solid rgba(148,163,184,0.12)',
          paddingBottom: 12,
        }}
      >
        {(['available', 'mine', 'alliance'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 400,
              borderRadius: 6,
              background: activeTab === tab ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: activeTab === tab ? '#60a5fa' : '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'available' ? '可领取' : tab === 'mine' ? '我的券' : '联盟券'}
          </button>
        ))}
      </div>

      {/* Stepped Discount Calculator */}
      {activeTab === 'available' && renderSteppedDiscount()}

      {/* Coupon Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {activeTab === 'available' && availableCoupons.map(c => renderCouponCard(c))}
        {activeTab === 'mine' && myCoupons.map(c => renderCouponCard(c))}
        {activeTab === 'alliance' && allianceCoupons.map(c => renderCouponCard(c, true))}
      </div>

      {activeTab === 'available' && availableCoupons.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          暂无可领取的优惠券
        </div>
      )}
      {activeTab === 'mine' && myCoupons.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          还没有领取任何优惠券
        </div>
      )}
      {activeTab === 'alliance' && allianceCoupons.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          暂无可用的联盟券
        </div>
      )}

      {/* AI Modal */}
      {showAIModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAIModal(false)}
        >
          <div
            style={{
              background: 'rgba(30,41,59,0.98)',
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: '90%',
              border: '1px solid rgba(139,92,246,0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#f8fafc',
                margin: '0 0 16px',
                textAlign: 'center',
              }}
            >
              🤖 AI智能推荐
            </h3>
            {aiRecommended ? (
              <div>
                <p style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', margin: '0 0 16px' }}>
                  根据您的订单金额 ¥{orderAmount}，我们推荐：
                </p>
                {renderCouponCard(aiRecommended)}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
                暂未找到适合您的优惠券
              </p>
            )}
            <button
              onClick={() => setShowAIModal(false)}
              style={{
                width: '100%',
                marginTop: 16,
                padding: '10px 16px',
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 6,
                background: 'rgba(148,163,184,0.1)',
                color: '#e2e8f0',
                border: '1px solid rgba(148,163,184,0.2)',
                cursor: 'pointer',
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
