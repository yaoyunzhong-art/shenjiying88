/**
 * 教练工作台页 — Coach Dashboard (Next.js App Router Page)
 * 角色: 教练/导玩员视角，展示接待指标、推广任务、待跟进会员
 */
'use client';

import React, { useState, useCallback } from 'react';
import { CoachDashboard, PageShell } from '@m5/ui';
import type {
  CoachDailyMetrics,
  FollowUpMember,
  PromoTask,
} from '@m5/ui';

// ============================================================
// Mock 教练工作台数据
// ============================================================

const MOCK_METRICS: CoachDailyMetrics = {
  servedCount: 68,
  newMembers: 12,
  promoConversions: 23,
  followUps: 8,
  servedTrend: 5.2,
  memberTrend: 8.0,
  promoTrend: 12.3,
  followUpTrend: -2.1,
};

const MOCK_FOLLOW_UPS: FollowUpMember[] = [
  {
    id: 'fu-1',
    name: '王小刚',
    tier: 'GOLD',
    lastContactAt: '2026-06-25',
    status: 'pending',
    note: '对高端体验套餐感兴趣，需跟进报价',
    phone: '138****1234',
  },
  {
    id: 'fu-2',
    name: '李丽华',
    tier: 'PLATINUM',
    lastContactAt: '2026-06-24',
    status: 'contacted',
    phone: '139****5678',
  },
  {
    id: 'fu-3',
    name: '陈志强',
    tier: 'SILVER',
    lastContactAt: '2026-06-23',
    status: 'converted',
    note: '已购买季卡套餐',
  },
  {
    id: 'fu-4',
    name: '张倩',
    tier: 'DIAMOND',
    lastContactAt: '2026-06-20',
    status: 'pending',
    note: '询问家庭年卡优惠',
    phone: '136****9012',
  },
  {
    id: 'fu-5',
    name: '刘强',
    tier: 'GOLD',
    lastContactAt: '2026-06-18',
    status: 'lost',
  },
];

const MOCK_PROMO_TASKS: PromoTask[] = [
  {
    id: 'pt-1',
    title: '扫码分享有礼',
    type: 'share',
    target: 50,
    completed: 32,
    deadline: '2026-06-30',
  },
  {
    id: 'pt-2',
    title: '老带新裂变活动',
    type: 'referral',
    target: 30,
    completed: 18,
    deadline: '2026-07-05',
  },
  {
    id: 'pt-3',
    title: '门店周年庆促销',
    type: 'event',
    target: 200,
    completed: 145,
    deadline: '2026-07-10',
  },
  {
    id: 'pt-4',
    title: '夏日特惠券派发',
    type: 'coupon',
    target: 100,
    completed: 67,
    deadline: '2026-07-03',
  },
];

// ============================================================
// 教练工作台页面
// ============================================================

export default function CoachPage() {
  const [loading, setLoading] = useState(false);
  const [followUps] = useState<FollowUpMember[]>(MOCK_FOLLOW_UPS);

  /** 模拟刷新数据 */
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <PageShell
      title="教练工作台"
      description="教练/导玩员日常工作台 — 接待指标、推广任务与会员跟进"
    >
      <CoachDashboard
        coachName="张教练"
        storeName="朝阳旗舰店"
        employeeId="EMP-0032"
        dailyMetrics={MOCK_METRICS}
        followUpMembers={followUps}
        promoTasks={MOCK_PROMO_TASKS}
        rank={{ current: 3, total: 12 }}
        lastSyncAt={new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        loading={loading}
      />
    </PageShell>
  );
}
