/**
 * 门店首页 — P-40 Storefront Home (完整版)
 * 角色: 所有访客/会员
 * 功能: 门店信息、活动推荐、快速入口、设备展示
 */
'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import {
  PageShell,
  Button,
  Card,
  Tag,
} from '@m5/ui';

// ============================================================
// 类型
// ============================================================

interface QuickEntry {
  icon: string;
  label: string;
  href: string;
  color: string;
}

interface PromotionBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  color: string;
}

// ============================================================
// 常量
// ============================================================

const QUICK_ENTRIES: QuickEntry[] = [
  { icon: '💰', label: '自助充值', href: '/self-recharge', color: '#f59e0b' },
  { icon: '🤝', label: '团队预约', href: '/group-booking', color: '#8b5cf6' },
  { icon: '🎮', label: '设备预定', href: '/device-reservation', color: '#06b6d4' },
  { icon: '🛒', label: '前台收银', href: '/cashier', color: '#34d399' },
  { icon: '🎫', label: '会员中心', href: '/member-center', color: '#f472b6' },
  { icon: '🏪', label: '门店信息', href: '/stores', color: '#64748b' },
  { icon: '📋', label: '我的订单', href: '/orders', color: '#fbbf24' },
  { icon: '🎉', label: '活动中心', href: '/campaigns', color: '#ff6b6b' },
];

const BANNERS: PromotionBanner[] = [
  { id: '1', title: '新会员首充', subtitle: '充100送15 · 充500送100', badge: '限时', color: '#f59e0b' },
  { id: '2', title: '团建特惠', subtitle: '10人以上团队预约享8折', badge: '热推', color: '#8b5cf6' },
  { id: '3', title: '周末畅玩', subtitle: '设备全天不限时 ¥98起', badge: '周末', color: '#06b6d4' },
  { id: '4', title: '生日派对', subtitle: '生日当天免费畅玩+大礼包', badge: '会员', color: '#34d399' },
];

const FEATURED_DEVICES = [
  { icon: '🕹️', name: '街机', desc: '24台最新街机', price: '¥20/时', tag: '热推' },
  { icon: '🥽', name: 'VR体验', desc: '最新VR设备', price: '¥48/时', tag: '科技' },
  { icon: '🎯', name: '模拟机', desc: '射击/赛车/舞蹈', price: '¥38/时', tag: '刺激' },
  { icon: '🎱', name: '台球', desc: '专业球台', price: '¥30/时', tag: '经典' },
  { icon: '🏎️', name: '卡丁车', desc: '专业赛道', price: '¥68/时', tag: '热门' },
  { icon: '🎲', name: '桌游', desc: '上百种桌游', price: '¥15/时', tag: '休闲' },
];

const STORE_INFO = {
  name: '神机营电竞乐园 · 旗舰店',
  address: '北京市朝阳区建国路88号',
  phone: '010-88886666',
  hours: '10:00-22:00',
};

// ============================================================
// 组件
// ============================================================

export default function StorefrontHomePage() {
  const [currentBanner, setCurrentBanner] = useState(0);

  // 自动轮播
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const _banner = BANNERS[currentBanner];
  const _bannerColor = _banner?.color ?? '#f59e0b';

  return (
    <main style={{ minHeight: '100vh', paddingBottom: 80, background: '#0f172a' }}>

      {/* ===== 头部 ===== */}
      <header style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8))',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '20px 16px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                🦞 {STORE_INFO.name}
              </h1>
              <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
                {STORE_INFO.address} · {STORE_INFO.hours}
              </p>
            </div>
            <Link href="/member-center" style={{ textDecoration: 'none' }}>
              <Button style={{
                borderRadius: 20, height: 36, fontSize: 13,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none', color: '#0f172a', fontWeight: 600,
              }}>
                我的
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px' }}>

        {/* ===== 轮播横幅 ===== */}
        <Link href="/self-recharge" style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
          <div style={{
            borderRadius: 20, padding: '28px 24px', overflow: 'hidden',
            background: `linear-gradient(135deg, ${(_banner?.color) ?? '#f59e0b'}30, ${(_banner?.color) ?? '#f59e0b'}10)`,
            border: `1px solid ${(_banner?.color) ?? '#f59e0b'}30`,
            position: 'relative', cursor: 'pointer', transition: 'all 0.5s',
          }}>
            <Tag style={{
              position: 'absolute', top: 12, right: 12,
              background: _bannerColor,
              color: '#0f172a', border: 'none', fontWeight: 700, fontSize: 11,
              borderRadius: 8,
            }}>
              {_banner?.badge}
            </Tag>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 6 }}>
              {_banner?.title}
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>
              {_banner?.subtitle}
            </div>
            {/* 指示点 */}
            <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
              {BANNERS.map((_, i) => (
                <div key={i} style={{
                  width: i === currentBanner ? 20 : 6, height: 6, borderRadius: 3,
                  background: i === currentBanner ? _bannerColor : '#475569',
                  transition: 'all 0.3s',
                }} />
              ))}
            </div>
          </div>
        </Link>

        {/* ===== 快捷入口 ===== */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', marginBottom: 12 }}>
            ⚡ 快速入口
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}>
            {QUICK_ENTRIES.map(entry => (
              <Link key={entry.label} href={entry.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '16px 8px', borderRadius: 14,
                  background: `${entry.color}10`,
                  border: `1px solid ${entry.color}20`,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: 24 }}>{entry.icon}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500, textAlign: 'center' }}>
                    {entry.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ===== 特色设备 ===== */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
              🎮 特色设备
            </h2>
            <Link href="/device-reservation" style={{ color: '#f59e0b', fontSize: 13, textDecoration: 'none' }}>
              查看全部 ›
            </Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}>
            {FEATURED_DEVICES.map(device => (
              <div key={device.name} style={{
                padding: '16px 12px', borderRadius: 14,
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{device.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 2 }}>{device.name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{device.desc}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24', marginTop: 6 }}>{device.price}</div>
                <Tag style={{
                  marginTop: 4, fontSize: 10,
                  background: '#f59e0b20', color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: 6,
                }}>
                  {device.tag}
                </Tag>
              </div>
            ))}
          </div>
        </div>

        {/* ===== 门店信息 ===== */}
        <Card style={{
          borderRadius: 16, marginBottom: 16,
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>🏪</span>
            <div>
              <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 15 }}>{STORE_INFO.name}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{STORE_INFO.address}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#94a3b8' }}>
            <span>📞 {STORE_INFO.phone}</span>
            <span>🕐 {STORE_INFO.hours}</span>
          </div>
        </Card>
      </div>
    </main>
  );
}

