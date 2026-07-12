'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// inline empty state
import type { MemberInfo } from '../../lib/member-auth-service';

type MembershipTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic';

const MEMBERS_PER_PAGE = 20;

const TIER_LABELS: Record<MembershipTier, string> = {
  diamond: '钻石会员',
  gold: '黄金会员',
  silver: '银卡会员',
  bronze: '铜卡会员',
  basic: '普通会员',
};

const TIER_COLORS: Record<MembershipTier, string> = {
  diamond: '#a78bfa',
  gold: '#fbbf24',
  silver: '#94a3b8',
  bronze: '#d97706',
  basic: '#64748b',
};

/** 会员权益配置 */
const TIER_BENEFITS: Record<MembershipTier, { discount: number; birthdayBenefit: string; nextTierName: string; nextTierPoints: number }> = {
  diamond: { discount: 20, birthdayBenefit: '生日当天双倍积分+专属礼包', nextTierName: '已满级', nextTierPoints: 0 },
  gold:    { discount: 15, birthdayBenefit: '生日当天双倍积分',          nextTierName: '钻石会员', nextTierPoints: 20000 },
  silver:  { discount: 10, birthdayBenefit: '生日双倍积分',              nextTierName: '黄金会员', nextTierPoints: 10000 },
  bronze:  { discount: 5,  birthdayBenefit: '生日双倍积分',              nextTierName: '银卡会员', nextTierPoints: 5000 },
  basic:   { discount: 0,  birthdayBenefit: '注册送100积分',             nextTierName: '铜卡会员', nextTierPoints: 1000 },
};

/** 模拟最近消费记录 */
const MOCK_RECENT_CONSUMPTIONS = [
  { id: '1', date: '2026-07-10', description: '标准游戏套餐', amount: 58, paymentMethod: '余额' },
  { id: '2', date: '2026-07-08', description: 'VIP包房3小时', amount: 128, paymentMethod: '微信' },
  { id: '3', date: '2026-07-05', description: '零食套餐B', amount: 35, paymentMethod: '余额' },
];

/** 会员等级进度：diamond 已满级，返回 1.0 */
function getLevelProgress(tier: MembershipTier, points: number): number {
  if (tier === 'diamond') return 1;
  const benefit = TIER_BENEFITS[tier];
  if (tier === 'basic') return Math.min(points / benefit.nextTierPoints, 1);
  // 从倒数第二个等级算起
  const tierOrder: MembershipTier[] = ['basic', 'bronze', 'silver', 'gold', 'diamond'];
  const idx = tierOrder.indexOf(tier);
  if (idx <= 0) return Math.min(points / 1000, 1);
  const prevTier = tierOrder[idx - 1];
  const prevPoints = TIER_BENEFITS[prevTier as keyof typeof TIER_BENEFITS]?.nextTierPoints ?? 0;
  const range = benefit.nextTierPoints - prevPoints;
  if (range <= 0) return 1;
  return Math.min((points - prevPoints) / range, 1);
}

export default function MemberCenterPage() {
  const router = useRouter();
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm] = useState('');
  const [pageSize] = useState(MEMBERS_PER_PAGE);
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem('member_access_token');
    const infoStr = localStorage.getItem('member_info');

    if (!token || !infoStr) {
      router.push('/member-login');
      return;
    }

    try {
      const info = JSON.parse(infoStr) as MemberInfo;
      setMember(info);
      // 模拟余额（实际应从服务端获取）
      const savedBalance = localStorage.getItem('member_balance');
      setBalance(savedBalance ? Number(savedBalance) : 188.5);
    } catch {
      router.push('/member-login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('member_access_token');
    localStorage.removeItem('member_refresh_token');
    localStorage.removeItem('member_info');
    router.push('/member-login');
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>加载中...</div>
      </main>
    );
  }

  // empty state: no member data available
  if (!member) {
    return null;
  }

  const tier = member.tier ?? 'basic';
  const tierColor = TIER_COLORS[tier];
  const benefits = TIER_BENEFITS[tier];
  const levelProgress = getLevelProgress(tier, member.points ?? 0);

  // 模拟最近消费记录
  const recentConsumptions = MOCK_RECENT_CONSUMPTIONS;

  return (
    <main style={{ minHeight: '100vh', paddingBottom: 80, background: '#0f172a' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
        {/* 头部信息卡 */}
        <div
          style={{
            borderRadius: 20,
            padding: 24,
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* 头像 */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${tierColor}40, ${tierColor}20)`,
                border: `2px solid ${tierColor}60`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: tierColor,
              }}
            >
              {member.nickname?.charAt(0) ?? '会'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', marginBottom: 4 }}>
                {member.nickname || '会员'}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: 20,
                  background: `${tierColor}20`,
                  border: `1px solid ${tierColor}40`,
                  color: tierColor,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {TIER_LABELS[tier]}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              退出
            </button>
          </div>

          {/* 手机号与门店 */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8' }}>
              <span><span style={{ color: '#64748b' }}>手机号：</span>{member.mobile}</span>
              {member.storeName && <span><span style={{ color: '#64748b' }}>门店：</span>{member.storeName}</span>}
            </div>
          </div>
        </div>

        {/* 积分 + 余额 双卡片 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              flex: 1,
              borderRadius: 16,
              padding: 16,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: 6 }}>积分</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>
              {member.points?.toLocaleString() ?? 0}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: 16,
              padding: 16,
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 12, color: '#34d399', marginBottom: 6 }}>余额</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#34d399' }}>
              ¥{balance.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 会员等级进度条 */}
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: '#94a3b8' }}>等级进度</span>
            <span style={{ color: tierColor }}>{TIER_LABELS[tier]}</span>
          </div>
          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 4,
              background: 'rgba(148, 163, 184, 0.15)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(levelProgress * 100).toFixed(0)}%`,
                height: '100%',
                borderRadius: 4,
                background: `linear-gradient(90deg, ${tierColor}60, ${tierColor})`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
            {tier === 'diamond'
              ? '已达最高等级，感谢支持！'
              : `距${benefits.nextTierName}还需 ${(benefits.nextTierPoints - (member.points ?? 0)).toLocaleString()} 积分`}
          </div>
        </div>

        {/* 会员权益展示 */}
        <div
          style={{
            borderRadius: 16,
            padding: 16,
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>会员权益</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 12,
                textAlign: 'center',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
              }}
            >
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>折扣</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#818cf8' }}>{benefits.discount}%</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>全场折扣</div>
            </div>
            <div
              style={{
                flex: 1,
                borderRadius: 12,
                padding: 12,
                textAlign: 'center',
                background: 'rgba(244, 114, 182, 0.1)',
                border: '1px solid rgba(244, 114, 182, 0.15)',
              }}
            >
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>生日福利</div>
              <div style={{ fontSize: 11, color: '#f472b6', lineHeight: 1.3, wordBreak: 'break-all' }}>
                {benefits.birthdayBenefit}
              </div>
            </div>
          </div>
        </div>

        {/* 快速充值 + 续费入口 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Link
            href="/member-recharge"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 12px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.15) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: '#fbbf24',
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 20 }}>⚡</span>
            快速充值
          </Link>
          <Link
            href="/member-center-renewal"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '14px 12px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(79, 70, 229, 0.15) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: '#818cf8',
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <span style={{ fontSize: 20 }}>🔄</span>
            立即续费
          </Link>
        </div>

        {/* 消费记录概览 */}
        <div
          style={{
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>最近消费</span>
            <Link
              href="/orders"
              style={{
                fontSize: 12,
                color: '#64748b',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              查看全部 ›
            </Link>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ fontSize: 11, color: '#64748b' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 400 }}>日期</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 400 }}>项目</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 400 }}>金额</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 400 }}>方式</th>
              </tr>
            </thead>
            <tbody>
              {recentConsumptions.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderTop: '1px solid rgba(148, 163, 184, 0.06)',
                    fontSize: 13,
                    color: '#cbd5e1',
                  }}
                >
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{item.date}</td>
                  <td style={{ padding: '12px 16px' }}>{item.description}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#f87171' }}>¥{item.amount}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(148, 163, 184, 0.1)',
                        fontSize: 11,
                      }}
                    >
                      {item.paymentMethod}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 功能菜单 */}
        <div
          style={{
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          {[
            { icon: '📋', label: '我的订单', href: '/orders' },
            { icon: '🎫', label: '我的优惠券', href: '/member-card' },
            { icon: '💳', label: '会员卡', href: '/member-card' },
            { icon: '⭐', label: '我的收藏', href: '/favorites' },
            { icon: '🏪', label: '所属门店', href: '/stores' },
          ].map((item, index, arr) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: index < arr.length - 1 ? '1px solid rgba(148, 163, 184, 0.08)' : 'none',
                textDecoration: 'none',
                color: '#e2e8f0',
              }}
            >
              <span style={{ fontSize: 20, marginRight: 14 }}>{item.icon}</span>
              <span style={{ flex: 1, fontSize: 15 }}>{item.label}</span>
              <span style={{ color: '#64748b', fontSize: 14 }}>›</span>
            </Link>
          ))}
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
          { icon: '👤', label: '我的', href: '/member-center', active: true },
        ].map((item) => (
          <Link
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
          </Link>
        ))}
      </nav>
    </main>
  );
}
