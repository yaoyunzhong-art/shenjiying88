'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Empty } from 'antd';
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

export default function MemberCenterPage() {
  const router = useRouter();
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize] = useState(MEMBERS_PER_PAGE);

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
  if (!member && !loading) {
    return null;
  }

  const tier = member.tier ?? 'basic';
  const tierColor = TIER_COLORS[tier];

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {/* 头部信息卡 */}
        <div
          style={{
            borderRadius: 20,
            padding: 24,
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            marginBottom: 20,
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

          {/* 手机号 */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>手机号：</span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{member.mobile}</span>
          </div>
        </div>

        {/* 积分卡片 */}
        <div
          style={{
            borderRadius: 16,
            padding: 20,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, color: '#fbbf24', marginBottom: 8 }}>我的积分</div>
          <div style={{ fontSize: 40, fontWeight: 700, color: '#fbbf24' }}>
            {member.points?.toLocaleString() ?? 0}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>可兑换优惠券及礼品</div>
        </div>

        {/* 功能菜单 */}
        <div
          style={{
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            overflow: 'hidden',
          }}
        >
          {[
            { icon: '📋', label: '我的订单', href: '/orders' },
            { icon: '🎫', label: '我的优惠券', href: '/member-card' },
            { icon: '💳', label: '会员卡', href: '/member-card' },
            { icon: '⭐', label: '我的收藏', href: '/favorites' },
            { icon: '🏪', label: '所属门店', href: '/stores' },
          ].map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: index < 3 ? '1px solid rgba(148, 163, 184, 0.08)' : 'none',
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
      </div>
    </main>
  );
}
