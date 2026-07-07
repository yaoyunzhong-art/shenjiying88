/**
 * 导购员工作台页 — Sales Guide Dashboard (Next.js App Router Page)
 * 角色: 导购员视角，展示个人接待数据、待跟进客户、推荐话术、快速查询会员
 */
'use client';

import React, { useCallback, useState } from 'react';
import { PageShell, SalesClerkTool } from '@m5/ui';
import type {
  DailyReceptionStats,
  FollowUpClient,
  SalesScript,
  MemberQuickLookup,
} from '@m5/ui';

// ============================================================
// Mock data
// ============================================================

const MOCK_STATS: DailyReceptionStats = {
  totalReceptions: 28,
  newLeads: 12,
  conversions: 8,
  conversionRate: 66.7,
  avgResponseMin: 2.3,
};

const MOCK_FOLLOW_UPS: FollowUpClient[] = [
  {
    id: 'fu-1',
    name: '王芳',
    phone: '138****5678',
    tier: 'VIP',
    lastVisit: '2026-06-26',
    reason: '有意向办理年度会员套餐，需跟进报价',
    priority: 'high',
  },
  {
    id: 'fu-2',
    name: '李明',
    phone: '159****2341',
    tier: 'GOLD',
    lastVisit: '2026-06-25',
    reason: '对进口红酒感兴趣，待发送产品目录',
    priority: 'medium',
  },
  {
    id: 'fu-3',
    name: '赵雪',
    phone: '176****9087',
    tier: 'SILVER',
    lastVisit: '2026-06-20',
    reason: '上次购物积分未到账，需跟进解决',
    priority: 'high',
  },
  {
    id: 'fu-4',
    name: '陈伟',
    phone: '182****4532',
    tier: 'REGULAR',
    lastVisit: '2026-06-18',
    reason: '咨询团购优惠方案',
    priority: 'low',
  },
  {
    id: 'fu-5',
    name: '刘洋',
    phone: '136****7890',
    tier: 'VIP',
    lastVisit: '2026-06-15',
    reason: '生日月专属折扣未使用，提醒到店',
    priority: 'medium',
  },
];

const MOCK_SCRIPTS: SalesScript[] = [
  {
    id: 'sc-1',
    scenario: '新客欢迎',
    text: '您好！欢迎光临【朝阳旗舰店】，我是导购员小张。今天店里新到了几款热销商品，我为您介绍一下吧？',
    tags: ['新客', '欢迎', '推荐'],
  },
  {
    id: 'sc-2',
    scenario: '会员推荐',
    text: '先生/女士，您目前的消费记录已经达到银卡会员标准，升级金卡后可以享受全场9折优惠和生日双倍积分，今天开通还有额外赠品哦！',
    tags: ['会员', '升级', '权益'],
  },
  {
    id: 'sc-3',
    scenario: '客诉安抚',
    text: '非常抱歉给您带来不便！我马上为您核实情况，同时为您申请一张专属优惠券以表歉意，请您稍等片刻。',
    tags: ['客诉', '安抚', '优惠券'],
  },
  {
    id: 'sc-4',
    scenario: '离店回访',
    text: '王先生您好，我是朝阳旗舰店的导购员小张。您上次购买的有机蔬菜拼盘口感如何？我们本周新到了一批云南空运的时令蔬菜，给您留一些吗？',
    tags: ['回访', '复购', '关怀'],
  },
  {
    id: 'sc-5',
    scenario: '活动邀约',
    text: '您好！我们【朝阳旗舰店】本周六下午2点举办"夏日品鉴会"，有红酒品鉴、糕点试吃，到场还有伴手礼，诚邀您参加！需要为您预留座位吗？',
    tags: ['活动', '邀约', '线下'],
  },
];

// Mock member database for lookup
const MOCK_MEMBERS: MemberQuickLookup[] = [
  { id: 'm-1', name: '王芳', phone: '13812345678', tier: 'VIP', points: 5860, totalSpent: 28500, visitCount: 68, tags: ['高消费', '常客'] },
  { id: 'm-2', name: '李明', phone: '15911223411', tier: 'GOLD', points: 3200, totalSpent: 15600, visitCount: 34, tags: ['红酒爱好者'] },
  { id: 'm-3', name: '赵雪', phone: '17611229087', tier: 'SILVER', points: 1200, totalSpent: 5800, visitCount: 18, tags: ['生鲜常购'] },
];

export default function SalesGuidePage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleMemberSearch = useCallback(
    async (query: string): Promise<MemberQuickLookup[]> => {
      // Simulate network delay
      await new Promise((r) => setTimeout(r, 500));
      const q = query.toLowerCase();
      return MOCK_MEMBERS.filter(
        (m) =>
          m.name.toLowerCase().includes(q) || m.phone.includes(query),
      );
    },
    [],
  );

  const handleFollowUp = useCallback((clientId: string) => {
    const client = MOCK_FOLLOW_UPS.find((c) => c.id === clientId);
    setToastMessage(`已标记跟进：${client?.name ?? clientId}`);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleScriptCopy = useCallback((scriptId: string) => {
    const script = MOCK_SCRIPTS.find((s) => s.id === scriptId);
    if (script) {
      navigator.clipboard?.writeText(script.text);
      setToastMessage(`话术已复制：${script.scenario}`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  }, []);

  return (
    <PageShell title="导购员工具" description="导购员专属工作台 · 朝阳旗舰店">
      <div style={{ position: 'relative' }}>
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              padding: '12px 24px',
              borderRadius: 12,
              background: '#22c55e',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            {toastMessage}
          </div>
        )}

        <SalesClerkTool
          stats={MOCK_STATS}
          followUpClients={MOCK_FOLLOW_UPS}
          scripts={MOCK_SCRIPTS}
          clerkName="张明"
          storeName="朝阳旗舰店"
          onMemberSearch={handleMemberSearch}
          onFollowUp={handleFollowUp}
          onScriptCopy={handleScriptCopy}
        />
      </div>
    </PageShell>
  );
}
