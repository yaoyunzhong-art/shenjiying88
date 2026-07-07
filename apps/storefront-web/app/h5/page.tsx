/**
 * h5/page.tsx — H5移动端首页框架
 * Phase-FP T-FP-026 · 2026-07-02
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MobileLayout,
  H5Card,
  H5Badge,
  H5SearchBar,
  H5Button,
  BottomTabBar,
  useH5Back,
} from '../../components/h5-components';

interface BannerItem {
  id: string;
  title: string;
  image: string;
  link?: string;
}

interface QuickAction {
  icon: string;
  label: string;
  href: string;
  color: string;
}

const BANNERS: BannerItem[] = [
  {
    id: 'b1',
    title: '新用户专享福利',
    image: 'https://picsum.photos/seed/banner1/750/300',
  },
  {
    id: 'b2',
    title: '限时折扣来袭',
    image: 'https://picsum.photos/seed/banner2/750/300',
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  { icon: '🏪', label: '门店查询', href: '/store-locator', color: '#667eea' },
  { icon: '🎫', label: '优惠券', href: '/h5/coupons', color: '#f59e0b' },
  { icon: '📋', label: '我的订单', href: '/h5/orders', color: '#10b981' },
  { icon: '💰', label: '积分兑换', href: '/h5/points', color: '#ef4444' },
  { icon: '⭐', label: '我的收藏', href: '/h5/favorites', color: '#8b5cf6' },
  { icon: '📞', label: '联系客服', href: '/h5/contact', color: '#06b6d4' },
];

const RECOMMENDED_STORES = [
  {
    id: 's01',
    name: '深圳南山旗舰店',
    city: '深圳',
    rating: 4.8,
    distance: '1.2km',
    image: 'https://picsum.photos/seed/store1/200/150',
  },
  {
    id: 's02',
    name: '广州天河城店',
    city: '广州',
    rating: 4.6,
    distance: '3.5km',
    image: 'https://picsum.photos/seed/store2/200/150',
  },
  {
    id: 's03',
    name: '上海浦东店',
    city: '上海',
    rating: 4.7,
    distance: '5.8km',
    image: 'https://picsum.photos/seed/store3/200/150',
  },
];

const HOT_CAMPAIGNS = [
  {
    id: 'c1',
    title: '夏日清凉季',
    subtitle: '全场8折起',
    badge: '热卖',
    color: '#ef4444',
  },
  {
    id: 'c2',
    title: '新人专属礼包',
    subtitle: '注册即送100元券',
    badge: '新人',
    color: '#10b981',
  },
  {
    id: 'c3',
    title: '会员日特惠',
    subtitle: '每月15日双倍积分',
    badge: '会员',
    color: '#f59e0b',
  },
];

export default function H5HomePage() {
  const [searchValue, setSearchValue] = useState('');
  const pathname = '/h5';

  return (
    <MobileLayout
      title="神机营 SaaS"
      subtitle="让商业更智能"
      showBack={false}
      showNav={true}
    >
      {/* 搜索栏 */}
      <div style={{ marginBottom: 16 }}>
        <H5SearchBar
          value={searchValue}
          onChange={setSearchValue}
          placeholder="搜索门店、商品..."
        />
      </div>

      {/* Banner轮播 (简化版) */}
      <div
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 20,
          position: 'relative',
          height: 140,
        }}
      >
        {BANNERS[0] && (
          <Image
            src={BANNERS[0].image}
            alt={BANNERS[0].title}
            fill
            style={{ objectFit: 'cover' }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '20px 16px 12px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
            {BANNERS[0]?.title ?? ''}
          </span>
        </div>
        {/* 指示器 */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 16,
            display: 'flex',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#fff',
            }}
          />
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.4)',
            }}
          />
        </div>
      </div>

      {/* 快捷入口 */}
      <H5Card style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${action.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}
              >
                {action.icon}
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{action.label}</span>
            </Link>
          ))}
        </div>
      </H5Card>

      {/* 热门活动 */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            热门活动
          </h2>
          <Link
            href="/h5/campaigns"
            style={{ fontSize: 13, color: '#667eea', textDecoration: 'none' }}
          >
            查看全部 →
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {HOT_CAMPAIGNS.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/h5/campaigns/${campaign.id}`}
              style={{ textDecoration: 'none', flexShrink: 0 }}
            >
              <div
                style={{
                  width: 160,
                  padding: 14,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${campaign.color}20, ${campaign.color}10)`,
                  border: `1px solid ${campaign.color}30`,
                }}
              >
                <H5Badge variant="error" size="sm">
                  {campaign.badge}
                </H5Badge>
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#f8fafc',
                      marginBottom: 4,
                    }}
                  >
                    {campaign.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{campaign.subtitle}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 推荐门店 */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: 0 }}>
            附近门店
          </h2>
          <Link
            href="/store-locator"
            style={{ fontSize: 13, color: '#667eea', textDecoration: 'none' }}
          >
            查看全部 →
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {RECOMMENDED_STORES.map((store) => (
            <Link
              key={store.id}
              href={`/store-locator/${store.id}`}
              style={{ textDecoration: 'none', flexShrink: 0 }}
            >
              <H5Card
                style={{
                  width: 140,
                  padding: 0,
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'relative', height: 90 }}>
                  <Image
                    src={store.image}
                    alt={store.name}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: 10 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#f8fafc',
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {store.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: '#64748b',
                    }}
                  >
                    <span>⭐ {store.rating}</span>
                    <span>{store.distance}</span>
                  </div>
                </div>
              </H5Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 会员卡片 */}
      <H5Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#fff',
            }}
          >
            会
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>
              黄金会员
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              当前积分: 1,280
            </div>
          </div>
          <H5Button variant="outline" size="sm">
            立即续费
          </H5Button>
        </div>
      </H5Card>
    </MobileLayout>
  );
}
