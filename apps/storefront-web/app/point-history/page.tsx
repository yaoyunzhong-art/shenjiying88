'use client';

import React, { useState } from 'react';
import { MemberPointHistory, type PointChangeType } from '@m5/ui';

const INITIAL_RECORDS = [
  { id: 'p1', type: 'earn_purchase' as const, amount: 350, balanceAfter: 2350, description: '订单 #ORD-20260710-003 消费 ¥350', createdAt: '2026-07-10T15:30:00Z', orderId: 'ORD-20260710-003' },
  { id: 'p2', type: 'earn_signin' as const, amount: 10, balanceAfter: 2000, description: '连续签到第7天奖励', createdAt: '2026-07-10T08:00:00Z' },
  { id: 'p3', type: 'earn_review' as const, amount: 50, balanceAfter: 1990, description: '订单评价奖励 - 设备检查服务', createdAt: '2026-07-09T12:15:00Z' },
  { id: 'p4', type: 'spend_redeem' as const, amount: -300, balanceAfter: 1940, description: '兑换 ¥30 全场通用券 ×1', createdAt: '2026-07-09T10:00:00Z' },
  { id: 'p5', type: 'earn_purchase' as const, amount: 520, balanceAfter: 2240, description: '订单 #ORD-20260708-012 消费 ¥520', createdAt: '2026-07-08T14:20:00Z', orderId: 'ORD-20260708-012' },
  { id: 'p6', type: 'earn_referral' as const, amount: 200, balanceAfter: 1720, description: '推荐好友注册成功奖励', createdAt: '2026-07-07T09:00:00Z' },
  { id: 'p7', type: 'expire' as const, amount: -80, balanceAfter: 1520, description: '2025年Q3积分过期', createdAt: '2026-07-06T00:00:00Z' },
  { id: 'p8', type: 'spend_redeem' as const, amount: -200, balanceAfter: 1600, description: '兑换 双人电影票 ×1', createdAt: '2026-07-05T18:30:00Z' },
  { id: 'p9', type: 'earn_promotion' as const, amount: 100, balanceAfter: 1800, description: '暑期狂欢活动额外奖励', createdAt: '2026-07-04T10:00:00Z' },
  { id: 'p10', type: 'earn_purchase' as const, amount: 180, balanceAfter: 1700, description: '订单 #ORD-20260703-005 消费 ¥180', createdAt: '2026-07-03T16:45:00Z', orderId: 'ORD-20260703-005' },
  { id: 'p11', type: 'admin_adjust' as const, amount: 200, balanceAfter: 1520, description: '活动补发积分补偿', createdAt: '2026-07-02T09:00:00Z' },
  { id: 'p12', type: 'earn_signin' as const, amount: 5, balanceAfter: 1320, description: '连续签到第2天奖励', createdAt: '2026-07-01T08:00:00Z' },
];

export default function PointHistoryPage() {
  const [activeFilter, setActiveFilter] = useState<PointChangeType | 'all'>('all');

  const totalPoints = INITIAL_RECORDS.reduce((sum, r) => sum + r.amount, 0);
  const totalEarnedThisMonth = INITIAL_RECORDS
    .filter((r) => r.amount > 0)
    .reduce((sum, r) => sum + r.amount, 0);
  const totalSpentThisMonth = INITIAL_RECORDS
    .filter((r) => r.amount < 0)
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);
  const expiringSoon = 120;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">积分明细</h1>
        <p className="mt-1 text-sm text-gray-500">查看您的积分变动记录，了解每笔积分的来源与去向</p>
      </div>

      <MemberPointHistory
        records={INITIAL_RECORDS}
        totalPoints={totalPoints}
        totalEarnedThisMonth={totalEarnedThisMonth}
        totalSpentThisMonth={totalSpentThisMonth}
        expiringSoon={expiringSoon}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
    </div>
  );
}
