'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Card,
  Button,
  Tag,
  Progress,
  Statistic,
  Descriptions,
  List,
  message,
  Skeleton,
  Empty,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  GiftOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  ShopOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import type { MemberInfo } from '../../lib/member-auth-service';
import { createBusinessClient, getDefaultApiBaseUrl } from '@m5/sdk';

const { Title, Text } = Typography;

type MembershipTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic';

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

const TIER_ORDER: MembershipTier[] = ['basic', 'bronze', 'silver', 'gold', 'diamond'];

interface RecentOrder {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
  date: string;
  items: number;
}

interface MemberBenefits {
  label: string;
  value: string;
  icon: React.ReactNode;
}

// 权益数据
const getBenefits = (tier: MembershipTier): MemberBenefits[] => {
  const baseBenefits: MemberBenefits[] = [
    { label: '积分倍率', value: `${getPointsMultiplier(tier)}x`, icon: <GiftOutlined /> },
    { label: '生日礼遇', value: getBirthdayGift(tier), icon: <CalendarOutlined /> },
    { label: '专属折扣', value: `${getDiscountRate(tier)}%`, icon: <PercentageOutlined /> },
  ];

  if (tier === 'diamond' || tier === 'gold') {
    baseBenefits.push({ label: '生日特权', value: '双倍积分+礼品', icon: <StarOutlined /> });
  }

  return baseBenefits;
};

const getPointsMultiplier = (tier: MembershipTier): number => {
  const multipliers: Record<MembershipTier, number> = {
    diamond: 3,
    gold: 2,
    silver: 1.5,
    bronze: 1.2,
    basic: 1,
  };
  return multipliers[tier];
};

const getDiscountRate = (tier: MembershipTier): number => {
  const rates: Record<MembershipTier, number> = {
    diamond: 15,
    gold: 10,
    silver: 8,
    bronze: 5,
    basic: 0,
  };
  return rates[tier];
};

const getBirthdayGift = (tier: MembershipTier): string => {
  const gifts: Record<MembershipTier, string> = {
    diamond: '高端礼品+双倍积分',
    gold: '精致礼品+双倍积分',
    silver: '优惠券+积分',
    bronze: '优惠券',
    basic: '积分',
  };
  return gifts[tier];
};

const getNextTier = (tier: MembershipTier): MembershipTier | null => {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx < TIER_ORDER.length - 1) return TIER_ORDER[idx + 1] as MembershipTier;
  return null;
};

const getTierProgress = (points: number, tier: MembershipTier): { percent: number; nextTier: MembershipTier | null; nextTierLabel: string } => {
  const thresholds: Record<MembershipTier, number> = {
    diamond: 0,
    gold: 50000,
    silver: 10000,
    bronze: 2000,
    basic: 0,
  };

  const next = getNextTier(tier);
  if (!next) {
    return { percent: 100, nextTier: null, nextTierLabel: '已达最高等级' };
  }

  const currentThreshold = thresholds[tier] || 0;
  const nextThreshold = thresholds[next];

  if (nextThreshold <= currentThreshold) return { percent: 100, nextTier: null, nextTierLabel: '' };

  const progress = Math.min(100, Math.max(0, ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100));

  return {
    percent: Math.floor(progress),
    nextTier: next,
    nextTierLabel: TIER_LABELS[next],
  };
};

// 从本地存储读取最近订单
async function fetchRecentOrders(memberId: string): Promise<RecentOrder[]> {
  try {
    const client = createBusinessClient(getDefaultApiBaseUrl());
    const raw = await client.orders.list({ memberId, limit: 5 });
    if (Array.isArray(raw)) {
      return raw.map((order: any) => ({
        id: order.id || order.orderId || '',
        orderNo: order.orderNo || '',
        amount: order.totalAmount ?? order.amount ?? 0,
        status: order.status === 'PAID' || order.status === 'COMPLETED' ? '已完成' : order.status || '已完成',
        date: order.createdAt ? order.createdAt.slice(0, 10) : '',
        items: order.itemCount ?? order.items ?? 0,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export default function MemberCenterPage() {
  const router = useRouter();
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [rechargeLoading, setRechargeLoading] = useState(false);

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
      // 模拟余额
      setBalance(Math.floor(Math.random() * 500) + 50);

      // 加载最近订单
      const memberId = info.memberId;
      if (memberId) {
        fetchRecentOrders(memberId).then(orders => {
          setRecentOrders(orders);
        }).catch(() => {
          // 静默失败，保持空数组
        });
      }
    } catch {
      router.push('/member-login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('member_access_token');
    localStorage.removeItem('member_refresh_token');
    localStorage.removeItem('member_info');
    message.success('已安全退出');
    router.push('/member-login');
  }, [router]);

  const handleRecharge = useCallback(() => {
    setRechargeLoading(true);
    message.loading({ content: '正在跳转充值页面...', key: 'recharge' });
    setTimeout(() => {
      setRechargeLoading(false);
      message.success({ content: '充值功能即将上线', key: 'recharge' });
    }, 1500);
  }, []);

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: '24px 16px', background: '#0f172a' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <Skeleton active avatar paragraph={{ rows: 4 }} />
          <div style={{ height: 24 }} />
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </main>
    );
  }

  if (!member) return null;

  const tier = member.tier ?? 'basic';
  const tierColor = TIER_COLORS[tier];
  const benefits = getBenefits(tier);
  const { percent, nextTier, nextTierLabel } = getTierProgress(member.points, tier);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 16px', paddingBottom: 80, background: '#0f172a' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 20 }}>
          <Title level={4} style={{ color: '#f8fafc', margin: 0 }}>会员中心</Title>
        </div>

        {/* 会员信息卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              style={{
                borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
              }}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* 头像 */}
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${tierColor}40, ${tierColor}20)`,
                    border: `3px solid ${tierColor}60`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    fontWeight: 700,
                    color: tierColor,
                  }}
                >
                  {member.nickname?.charAt(0) ?? '会'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
                    {member.nickname || '会员'}
                  </div>
                  <Tag
                    color={tierColor}
                    style={{
                      borderRadius: 20,
                      padding: '2px 12px',
                      fontSize: 13,
                      border: `1px solid ${tierColor}60`,
                    }}
                  >
                    {TIER_LABELS[tier]}
                  </Tag>
                  <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>
                    <EnvironmentOutlined style={{ marginRight: 4 }} />
                    {member.storeName || '暂无关联门店'}
                  </div>
                </div>
                <Button
                  danger
                  type="text"
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  style={{ color: '#f87171' }}
                >
                  退出
                </Button>
              </div>

              {/* 手机号 */}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <Descriptions
                  size="small"
                  column={1}
                  labelStyle={{ color: '#64748b', fontSize: 13 }}
                  contentStyle={{ color: '#94a3b8', fontSize: 13 }}
                >
                  <Descriptions.Item label="手机号">{member.mobile}</Descriptions.Item>
                  <Descriptions.Item label="会员ID">{member.memberId}</Descriptions.Item>
                </Descriptions>
              </div>
            </Card>
          </Col>

          {/* 积分 & 余额 */}
          <Col xs={24} lg={12}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card
                  style={{
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    textAlign: 'center',
                  }}
                  styles={{ body: { padding: '20px 16px' } }}
                >
                  <Statistic
                    title={<span style={{ color: '#fbbf24', fontSize: 13 }}>我的积分</span>}
                    value={member.points}
                    valueStyle={{ color: '#fbbf24', fontSize: 32, fontWeight: 700 }}
                  />
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>可兑换优惠券及礼品</div>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  style={{
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
                    border: '1px solid rgba(52, 211, 153, 0.2)',
                    textAlign: 'center',
                  }}
                  styles={{ body: { padding: '20px 16px' } }}
                >
                  <Statistic
                    title={<span style={{ color: '#34d399', fontSize: 13 }}>账户余额</span>}
                    value={balance}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#34d399', fontSize: 32, fontWeight: 700 }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CreditCardOutlined />}
                      loading={rechargeLoading}
                      onClick={handleRecharge}
                      style={{
                        borderRadius: 20,
                        background: 'linear-gradient(135deg, #34d399, #10b981)',
                        border: 'none',
                        fontSize: 12,
                      }}
                    >
                      积分充值
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        {/* 等级升级进度条 */}
        <Card
          style={{
            marginTop: 16,
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
          }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: '#94a3b8', fontSize: 14 }}>
              {nextTier ? (
                <>
                  距离 <Tag color={TIER_COLORS[nextTier]} style={{ borderRadius: 12, fontSize: 12 }}>{nextTierLabel}</Tag> 还差
                </>
              ) : (
                <span style={{ color: '#fbbf24' }}>🎉 已达最高等级</span>
              )}
            </span>
            <span style={{ color: tierColor, fontWeight: 600, fontSize: 14 }}>{percent}%</span>
          </div>
          <Progress
            percent={percent}
            strokeColor={tierColor}
            trailColor="rgba(148, 163, 184, 0.15)"
            showInfo={false}
            size="small"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>{TIER_LABELS[tier]}</span>
            {nextTier && (
              <span style={{ fontSize: 11, color: '#64748b' }}>{nextTierLabel}</span>
            )}
          </div>
        </Card>

        {/* 会员权益展示 */}
        <Title level={5} style={{ color: '#f8fafc', marginTop: 20, marginBottom: 12 }}>
          <GiftOutlined style={{ marginRight: 8 }} />
          会员权益
        </Title>
        <Row gutter={[12, 12]}>
          {benefits.map((benefit) => (
            <Col xs={8} key={benefit.label}>
              <Card
                size="small"
                style={{
                  borderRadius: 12,
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(148, 163, 184, 0.08)',
                }}
                styles={{ body: { textAlign: 'center', padding: '16px 8px' } }}
              >
                <div style={{ fontSize: 20, color: tierColor, marginBottom: 6 }}>{benefit.icon}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{benefit.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{benefit.value}</div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 最近消费记录 */}
        <Title level={5} style={{ color: '#f8fafc', marginTop: 20, marginBottom: 12 }}>
          <ShoppingCartOutlined style={{ marginRight: 8 }} />
          最近消费记录
        </Title>
        <Card
          style={{
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
          }}
          styles={{ body: { padding: 0 } }}
        >
          {recentOrders.length > 0 ? (
            <List
              dataSource={recentOrders}
              renderItem={(order) => (
                <List.Item
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: 14, marginBottom: 4 }}>
                      {order.orderNo}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>
                      {order.date} · {order.items}件商品
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#f8fafc', fontSize: 16, fontWeight: 600 }}>
                      ¥{order.amount.toFixed(2)}
                    </div>
                    <Tag
                      color="success"
                      style={{ borderRadius: 10, fontSize: 11, marginTop: 2 }}
                    >
                      {order.status}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty description={<span style={{ color: '#64748b' }}>暂无消费记录</span>} />
          )}
        </Card>

        {/* 功能菜单 */}
        <Title level={5} style={{ color: '#f8fafc', marginTop: 20, marginBottom: 12 }}>
          <CreditCardOutlined style={{ marginRight: 8 }} />
          快捷功能
        </Title>
        <Card
          style={{
            borderRadius: 16,
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            overflow: 'hidden',
          }}
          styles={{ body: { padding: 0 } }}
        >
          {[
            { icon: <ShoppingCartOutlined />, label: '我的订单', href: '/orders' },
            { icon: <GiftOutlined />, label: '我的优惠券', href: '/member-card' },
            { icon: <CreditCardOutlined />, label: '会员卡', href: '/member-card' },
            { icon: <StarOutlined />, label: '我的收藏', href: '/favorites' },
            { icon: <ShopOutlined />, label: '所属门店', href: '/stores' },
          ].map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: index < 4 ? '1px solid rgba(148, 163, 184, 0.08)' : 'none',
                textDecoration: 'none',
                color: '#e2e8f0',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(148, 163, 184, 0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 18, marginRight: 14, color: tierColor }}>{item.icon}</span>
              <span style={{ flex: 1, fontSize: 15, color: '#e2e8f0' }}>{item.label}</span>
              <span style={{ color: '#475569', fontSize: 16 }}>›</span>
            </Link>
          ))}
        </Card>

        {/* 底部导航 */}
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-around',
            padding: '10px 0',
            paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
            background: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
            backdropFilter: 'blur(12px)',
            zIndex: 100,
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
                gap: 3,
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
