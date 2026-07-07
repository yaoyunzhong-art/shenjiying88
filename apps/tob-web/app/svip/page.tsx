'use client';

import React, { useState, useEffect } from 'react';
import { PageShell } from '@m5/ui';
import { MOCK_PLANS, MOCK_SUBSCRIPTION, MOCK_BENEFITS, formatExpireDate, getBenefitLabel, type SVIPPlan, type SVIPSubscription, type SVIPBenefit } from './svip-data';
import { loadPlans, loadSubscription, subscribe, cancel, renew, loadBenefits } from './svip-service';

const DEMO_USER = 'demo-user';

export default function SvipPage() {
  const [plans, setPlans] = useState<SVIPPlan[]>(MOCK_PLANS);
  const [subscription, setSubscription] = useState<SVIPSubscription | null>(MOCK_SUBSCRIPTION);
  const [benefits, setBenefits] = useState<SVIPBenefit[]>(MOCK_BENEFITS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPlans().then(setPlans);
    loadSubscription(DEMO_USER).then((sub) => {
      if (sub) {
        setSubscription(sub);
        loadBenefits(sub.subscriptionId).then(setBenefits);
      }
    });
  }, []);

  async function handleSubscribe(planId: string) {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const sub = await subscribe(DEMO_USER, planId);
      if (sub) {
        setSubscription(sub);
        loadBenefits(sub.subscriptionId).then(setBenefits);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancel() {
    if (!subscription || isLoading) return;
    setIsLoading(true);
    try {
      const cancelled = await cancel(subscription.subscriptionId);
      if (cancelled) {
        setSubscription(cancelled);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRenew() {
    if (!subscription || isLoading) return;
    setIsLoading(true);
    try {
      const renewed = await renew(subscription.subscriptionId);
      if (renewed) {
        setSubscription(renewed);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const isActive = subscription?.status === 'active';
  const isExpired = subscription?.status === 'expired';

  return (
    <PageShell title="SVIP 会员" description="超级会员特权">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* SVIP Status Hero */}
        <div style={{
          background: isActive
            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)'
            : 'linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)',
          borderRadius: 16,
          padding: 32,
          marginBottom: 24,
          textAlign: 'center',
          boxShadow: isActive ? '0 8px 32px rgba(251, 191, 36, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
        }}>
          {isActive ? (
            <>
              <div style={{
                display: 'inline-block',
                padding: '8px 24px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 999,
                marginBottom: 16,
              }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>SVIP 会员</span>
              </div>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', margin: '0 0 8px' }}>
                会员有效期至
              </p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>
                {subscription?.expireAt ? formatExpireDate(new Date(subscription.expireAt)) : '-'}
              </p>
            </>
          ) : (
            <>
              <div style={{
                display: 'inline-block',
                padding: '8px 24px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 999,
                marginBottom: 16,
              }}>
                <span style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>开通 SVIP</span>
              </div>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                立即开通，享受专属特权
              </p>
            </>
          )}
        </div>

        {/* Plan Cards */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>选择套餐</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {plans.map((plan) => {
              const isSelected = subscription?.planId === plan.planId && isActive;
              return (
                <div
                  key={plan.planId}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)'
                      : 'rgba(30, 41, 59, 0.9)',
                    border: isSelected
                      ? '2px solid #fbbf24'
                      : '1px solid rgba(148, 163, 184, 0.12)',
                    borderRadius: 12,
                    padding: 24,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#f8fafc', margin: '0 0 8px' }}>
                      {plan.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 32, fontWeight: 700, color: '#fbbf24' }}>
                        ¥{plan.price}
                      </span>
                      <span style={{ fontSize: 14, color: '#94a3b8' }}>/ {plan.durationDays}天</span>
                    </div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                    {plan.benefits.map((benefit, idx) => (
                      <li
                        key={idx}
                        style={{
                          fontSize: 14,
                          color: '#cbd5e1',
                          padding: '6px 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span style={{ color: '#22c55e', fontSize: 16 }}>✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSubscribe(plan.planId)}
                    disabled={isLoading || (isSelected && isActive)}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      fontSize: 16,
                      fontWeight: 600,
                      borderRadius: 8,
                      border: 'none',
                      background: isSelected
                        ? 'rgba(251, 191, 36, 0.3)'
                        : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      color: isSelected ? '#fbbf24' : '#0f172a',
                      cursor: isLoading || (isSelected && isActive) ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isSelected && isActive ? '当前套餐' : '立即开通'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Benefits Section */}
        {subscription && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>我的特权</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {benefits.map((benefit) => (
                <div
                  key={benefit.benefitId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: benefit.usedAt
                      ? 'rgba(100, 116, 139, 0.2)'
                      : 'rgba(34, 197, 94, 0.1)',
                    borderRadius: 8,
                    border: benefit.usedAt
                      ? '1px solid rgba(100, 116, 139, 0.3)'
                      : '1px solid rgba(34, 197, 94, 0.3)',
                  }}
                >
                  <div>
                    <span style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: benefit.usedAt ? '#94a3b8' : '#22c55e',
                    }}>
                      {getBenefitLabel(benefit.type)}
                    </span>
                    {benefit.expiresAt && (
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 12 }}>
                        有效期至: {formatExpireDate(new Date(benefit.expiresAt))}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 12,
                    color: benefit.usedAt ? '#ef4444' : '#22c55e',
                    fontWeight: 500,
                  }}>
                    {benefit.usedAt ? '已使用' : '未使用'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Renewal/Cancel Controls */}
        {subscription && (isActive || isExpired) && (
          <div style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
          }}>
            {isActive && (
              <button
                onClick={handleCancel}
                disabled={isLoading}
                style={{
                  padding: '12px 32px',
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 8,
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  background: 'transparent',
                  color: '#ef4444',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                取消订阅
              </button>
            )}
            {(isActive || isExpired) && (
              <button
                onClick={handleRenew}
                disabled={isLoading}
                style={{
                  padding: '12px 32px',
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: '#0f172a',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                续费
              </button>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
