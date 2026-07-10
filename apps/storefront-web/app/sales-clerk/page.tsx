/**
 * 导购员工作台 — Sales Clerk Workbench (Next.js App Router Page)
 * 角色视角: 🛍️ 导购员
 * 类型: D-角色操作界面 (导购员工作台)
 * 功能: 聚合当日接待统计、待跟进客户列表、推荐话术、会员快速查询
 */
'use client';

import React, { useCallback, useState } from 'react';
import { SalesClerkTool, PageShell } from '@m5/ui';
import type {
  DailyReceptionStats,
  FollowUpClient,
  SalesScript,
  MemberQuickLookup,
} from '@m5/ui';

// ============================================================
// Mock 数据
// ============================================================

const MOCK_STATS: DailyReceptionStats = {
  totalReceptions: 47,
  newLeads: 12,
  conversions: 8,
  conversionRate: 17.0,
  avgResponseMin: 2.3,
};

const MOCK_FOLLOW_UP_CLIENTS: FollowUpClient[] = [
  {
    id: 'fu-1',
    name: '王芳',
    phone: '138****5678',
    tier: 'GOLD',
    lastVisit: '2026-07-10',
    reason: '上次试穿男装，意向购买秋季新款',
    priority: 'high',
  },
  {
    id: 'fu-2',
    name: '李明',
    phone: '139****1234',
    tier: 'VIP',
    lastVisit: '2026-07-08',
    reason: '咨询会员升等权益',
    priority: 'medium',
  },
  {
    id: 'fu-3',
    name: '赵雪',
    phone: '136****9876',
    tier: 'SILVER',
    lastVisit: '2026-07-05',
    reason: '到店取货未买，可推荐关联商品',
    priority: 'low',
  },
  {
    id: 'fu-4',
    name: '张伟',
    phone: '137****4567',
    tier: 'GOLD',
    lastVisit: '2026-07-09',
    reason: '对上次服务不满意，需主动回访',
    priority: 'high',
  },
  {
    id: 'fu-5',
    name: '刘娜',
    phone: '158****3321',
    tier: 'REGULAR',
    lastVisit: '2026-07-01',
    reason: '生日月可推送优惠券',
    priority: 'low',
  },
];

const MOCK_SCRIPTS: SalesScript[] = [
  {
    id: 's-1',
    scenario: '新品推荐开场',
    text: '您好！我们刚到了一批秋季新品，款式很适合您的气质，要不要了解一下？',
    tags: ['开场', '新品'],
  },
  {
    id: 's-2',
    scenario: '会员升等邀请',
    text: '您目前的消费额距离升级金卡只差¥288，升级后可享受全场9折和生日礼包哦！',
    tags: ['会员', '升等'],
  },
  {
    id: 's-3',
    scenario: '挽回不满意顾客',
    text: '非常理解您上次的感受，我们已经进行了改进，特地为您准备了一份专属优惠券，希望能再次为您服务。',
    tags: ['售后', '挽回'],
  },
  {
    id: 's-4',
    scenario: '关联推荐',
    text: '您选的这款上衣搭配我们的新款休闲裤效果特别棒，而且今天有搭配优惠，可以省¥50呢！',
    tags: ['搭配', '促销'],
  },
];

// ============================================================
// Mock 会员查询
// ============================================================

const MOCK_MEMBERS: MemberQuickLookup[] = [
  {
    id: 'm-1',
    name: '陈静', phone: '135****8888',
    tier: 'GOLD', points: 3200, totalSpent: 12680, visitCount: 28, tags: ['高频', '亲子'],
  },
  {
    id: 'm-2',
    name: '周强', phone: '136****7777',
    tier: 'VIP', points: 15800, totalSpent: 58900, visitCount: 72, tags: ['高客单', '商务'],
  },
  {
    id: 'm-3',
    name: '吴丽', phone: '137****6666',
    tier: 'SILVER', points: 890, totalSpent: 3460, visitCount: 12, tags: ['新客', '美容'],
  },
];

const mockMemberSearch = async (query: string): Promise<MemberQuickLookup[]> => {
  await new Promise((r) => setTimeout(r, 300));
  const q = query.toLowerCase();
  return MOCK_MEMBERS.filter(
    (m) =>
      m.name.toLowerCase().includes(q) || m.phone.includes(query) || m.id.includes(query),
  );
};

// ============================================================
// 页面组件
// ============================================================

export default function SalesClerkPage() {
  const [followUps, setFollowUps] = useState(MOCK_FOLLOW_UP_CLIENTS);
  const [scriptCopied, setScriptCopied] = useState<string | null>(null);

  const handleFollowUp = useCallback((clientId: string) => {
    setFollowUps((prev) => prev.filter((c) => c.id !== clientId));
  }, []);

  const handleScriptCopy = useCallback((scriptId: string) => {
    setScriptCopied(scriptId);
    setTimeout(() => setScriptCopied(null), 2000);
  }, []);

  return (
    <PageShell title="导购员工作台">
      <div
        style={{
          padding: '24px 32px',
          maxWidth: 1280,
          margin: '0 auto',
        }}
        data-testid="sales-clerk-page"
      >
        {/* ---- 页面标题 ---- */}
        <div
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
          data-testid="page-header"
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: '#f8fafc',
              }}
            >
              🛍️ 导购员工作台
            </h1>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 14 }}>
              朝阳旗舰店 · 张三 | {new Date().toLocaleDateString('zh-CN')}
            </p>
          </div>
          {scriptCopied && (
            <span
              style={{
                fontSize: 13,
                color: '#4ade80',
                background: 'rgba(74,222,128,0.12)',
                padding: '6px 14px',
                borderRadius: 8,
              }}
              data-testid="copy-toast"
            >
              ✅ 话术已复制
            </span>
          )}
        </div>

        {/* ---- SalesClerkTool 核心组件 ---- */}
        <SalesClerkTool
          stats={MOCK_STATS}
          followUpClients={followUps}
          scripts={MOCK_SCRIPTS}
          clerkName="张三"
          storeName="朝阳旗舰店"
          onMemberSearch={mockMemberSearch}
          onFollowUp={handleFollowUp}
          onScriptCopy={handleScriptCopy}
        />
      </div>
    </PageShell>
  );
}
