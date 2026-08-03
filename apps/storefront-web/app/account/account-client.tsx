/**
 * AccountClient — 个人中心客户端组件
 * 功能: 会员信息卡片、积分余额、订单历史、快捷入口
 */

'use client';

import { useState } from 'react';
import { Card, StatusBadge, Tabs } from '@m5/ui';

interface OrderHistory {
  id: string;
  date: string;
  type: string;
  amount: number;
  status: 'completed' | 'pending' | 'cancelled' | 'refunding';
}

const MOCK_ORDERS: OrderHistory[] = [
  { id: 'ORD-001', date: '2026-07-15', type: 'VR体验30分钟', amount: 128, status: 'completed' },
  { id: 'ORD-002', date: '2026-07-14', type: '代币包(100枚)', amount: 50, status: 'completed' },
  { id: 'ORD-003', date: '2026-07-12', type: '会员月卡续费', amount: 299, status: 'completed' },
  { id: 'ORD-004', date: '2026-07-10', type: '饮品套餐', amount: 35, status: 'pending' },
  { id: 'ORD-005', date: '2026-07-08', type: '团建活动定金', amount: 500, status: 'refunding' },
];

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  completed: { label: '已完成', variant: 'success' },
  pending: { label: '进行中', variant: 'warning' },
  cancelled: { label: '已取消', variant: 'danger' },
  refunding: { label: '退款中', variant: 'neutral' },
};

export default function AccountClient() {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* 会员信息 */}
      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fff', fontWeight: 700 }}>张</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>张先生</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>金牌会员 · 138****1234</div>
            <div style={{ fontSize: 12, color: '#22c55e', marginTop: 2 }}>已累计消费 ¥3,280</div>
          </div>
        </div>
      </Card>

      {/* 积分/余额 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>积分</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#eab308', margin: '6px 0' }}>1,280</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>即将过期: 50分</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>余额</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e', margin: '6px 0' }}>¥128</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>充值送 ¥20</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>优惠券</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6', margin: '6px 0' }}>3</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>即将到期: 1张</div>
        </Card>
      </div>

      {/* Tab */}
      <Tabs
        items={[
          { key: 'profile', label: '👤 个人信息' },
          { key: 'orders', label: '📋 订单记录', count: MOCK_ORDERS.length },
        ]}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as typeof activeTab)}
        variant="pills"
      />

      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[{ label: '昵称', value: '张先生' }, { label: '手机', value: '138****1234' }, { label: '会员等级', value: '金牌' }, { label: '注册时间', value: '2025-03-15' }, { label: '常用门店', value: '朝阳大悦城店' }, { label: '偏好', value: 'VR体验 · 饮品' }].map(f => (
            <div key={f.label} style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(15,23,42,0.3)' }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{f.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{f.value}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'orders' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {MOCK_ORDERS.map(order => (
            <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: 'rgba(15,23,42,0.3)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{order.type}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{order.date} · {order.id}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700 }}>¥{order.amount}</span>
                <StatusBadge label={STATUS_LABELS[order.status]!.label} variant={STATUS_LABELS[order.status]!.variant} size="sm" dot />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
