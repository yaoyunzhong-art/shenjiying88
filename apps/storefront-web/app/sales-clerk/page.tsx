/**
 * 导购员工作台 — Sales Clerk Workbench (Next.js App Router Page)
 * 角色视角: 🛍️ 导购员
 * 类型: D-角色操作界面 (导购员工作台)
 * 功能: 聚合当日接待统计、待跟进客户列表、推荐话术、会员快速查询
 */
'use client';

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { SalesClerkTool, PageShell, StatusBadge } from '@m5/ui';
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
//  Mock 店员绩效数据
// ============================================================

interface ClerkPerformance {
  rank: number;
  name: string;
  receptions: number;
  salesAmount: number;
  conversionRate: number;
  avgRating: number;
  trend: 'up' | 'down' | 'stable';
}

const CURRENT_CLERK: ClerkPerformance = {
  rank: 3,
  name: '张三',
  receptions: 47,
  salesAmount: 28600,
  conversionRate: 17.0,
  avgRating: 4.6,
  trend: 'up',
};

const MOCK_CLERK_RANKING: ClerkPerformance[] = [
  { rank: 1, name: '李小红', receptions: 62, salesAmount: 41200, conversionRate: 21.0, avgRating: 4.8, trend: 'up' },
  { rank: 2, name: '王大伟', receptions: 55, salesAmount: 35800, conversionRate: 18.9, avgRating: 4.7, trend: 'up' },
  { rank: 3, name: '张三', receptions: 47, salesAmount: 28600, conversionRate: 17.0, avgRating: 4.6, trend: 'up' },
  { rank: 4, name: '赵晓霞', receptions: 41, salesAmount: 25300, conversionRate: 15.8, avgRating: 4.5, trend: 'stable' },
  { rank: 5, name: '陈浩', receptions: 36, salesAmount: 22100, conversionRate: 14.2, avgRating: 4.3, trend: 'down' },
];

// ============================================================
//  Mock 数据统计
// ============================================================

interface DailyDataStat {
  label: string;
  value: string;
  sublabel: string;
  color: string;
  icon: string;
}

const DAILY_STATS: DailyDataStat[] = [
  { label: '今日业绩', value: '¥28,600', sublabel: '目标进度 57%', color: '#4ade80', icon: '💰' },
  { label: '接待人数', value: '47 人', sublabel: '门店第 3 名', color: '#60a5fa', icon: '👥' },
  { label: '转化率', value: '17.0%', sublabel: '高于均值 2.1%', color: '#fbbf24', icon: '📈' },
  { label: '客单价', value: '¥608', sublabel: '较昨日 +¥42', color: '#a78bfa', icon: '🛒' },
];

// ============================================================
//  子组件: 每日数据统计卡片
// ============================================================

function DailyStatsCards({ stats }: { stats: DailyDataStat[] }) {
  return (
    <div
      data-testid="daily-stats-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            borderRadius: 12,
            padding: '14px 18px',
            background: 'rgba(15,23,42,0.35)',
            border: '1px solid rgba(148,163,184,0.1)',
          }}
          data-testid={`daily-stat-${s.label}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>{s.label}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 2 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 12, color: '#475569' }}>{s.sublabel}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
//  子组件: 店员绩效排行
// ============================================================

function ClerkRankingPanel({
  current,
  rankings,
}: {
  current: ClerkPerformance;
  rankings: ClerkPerformance[];
}) {
  const [expanded, setExpanded] = useState(false);

  const displayRankings = expanded ? rankings : rankings.slice(0, 3);

  return (
    <div
      style={{
        borderRadius: 14,
        padding: '18px 20px',
        background: 'rgba(15,23,42,0.30)',
        border: '1px solid rgba(148,163,184,0.08)',
        marginBottom: 20,
      }}
      data-testid="clerk-ranking-panel"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
          🏆 店员销售排行
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            你排名 <strong style={{ color: '#60a5fa' }}>#{current.rank}</strong>
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: '1px solid rgba(148,163,184,0.15)',
              background: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 12,
            }}
            data-testid="ranking-toggle-btn"
          >
            {expanded ? '收起' : '查看全部'}
          </button>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={rankingStyles.th}>排名</th>
            <th style={rankingStyles.th}>姓名</th>
            <th style={rankingStyles.th}>接待</th>
            <th style={rankingStyles.th}>销售额</th>
            <th style={rankingStyles.th}>转化率</th>
            <th style={rankingStyles.th}>评分</th>
            <th style={rankingStyles.th}>趋势</th>
          </tr>
        </thead>
        <tbody>
          {displayRankings.map((clerk) => (
            <tr
              key={clerk.name}
              style={{
                ...rankingStyles.tr,
                background: clerk.name === current.name ? 'rgba(96,165,250,0.08)' : 'transparent',
              }}
              data-testid={`ranking-row-${clerk.rank}`}
            >
              <td style={rankingStyles.td}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  background: clerk.rank <= 3 ? 'rgba(251,191,36,0.15)' : 'rgba(148,163,184,0.1)',
                  color: clerk.rank <= 3 ? '#fbbf24' : '#64748b',
                }}>
                  {clerk.rank}
                </span>
              </td>
              <td style={rankingStyles.td}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>
                  {clerk.name}
                  {clerk.name === current.name && (
                    <span style={{ fontSize: 11, color: '#60a5fa', marginLeft: 4 }}>(你)</span>
                  )}
                </span>
              </td>
              <td style={{ ...rankingStyles.td, color: '#94a3b8' }}>{clerk.receptions}</td>
              <td style={{ ...rankingStyles.td, color: '#e2e8f0', fontWeight: 600 }}>
                ¥{(clerk.salesAmount / 1000).toFixed(1)}k
              </td>
              <td style={{ ...rankingStyles.td, color: '#4ade80' }}>{clerk.conversionRate}%</td>
              <td style={{ ...rankingStyles.td, color: '#fbbf24' }}>
                {'⭐'.repeat(Math.round(clerk.avgRating / 2))}
              </td>
              <td style={rankingStyles.td}>
                <span style={{
                  fontSize: 16,
                  color: clerk.trend === 'up' ? '#4ade80' : clerk.trend === 'down' ? '#ef4444' : '#94a3b8',
                }}>
                  {clerk.trend === 'up' ? '↑' : clerk.trend === 'down' ? '↓' : '→'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const rankingStyles: Record<string, React.CSSProperties> = {
  th: {
    padding: '8px 10px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#64748b',
    borderBottom: '1px solid rgba(148,163,184,0.1)',
    fontSize: 12,
  },
  tr: {
    borderBottom: '1px solid rgba(148,163,184,0.06)',
  },
  td: {
    padding: '10px 10px',
  },
};

// ============================================================
//  子组件: 值班摘要
// ============================================================

function ShiftSummary() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 20,
        padding: '14px 18px',
        borderRadius: 14,
        background: 'rgba(15,23,42,0.30)',
        border: '1px solid rgba(148,163,184,0.08)',
      }}
      data-testid="shift-summary"
    >
      <div style={{ flex: '1 1 auto', minWidth: 120 }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>今日班次</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>早班 · 08:00-16:00</div>
      </div>
      <div style={{ flex: '1 1 auto', minWidth: 120 }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>在岗时长</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>5h 32min</div>
      </div>
      <div style={{ flex: '1 1 auto', minWidth: 120 }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>休息时间</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>12:00-12:30</div>
      </div>
      <div style={{ flex: '1 1 auto', minWidth: 120, display: 'flex', alignItems: 'center', gap: 8 }}>
        <StatusBadge variant="success" label="● 在岗" />
        <StatusBadge variant="info" label="在线接客" />
      </div>
    </div>
  );
}

// ============================================================
//  子组件: 快速操作栏
// ============================================================

const QUICK_ACTIONS = [
  { icon: '📝', label: '新建客户', testId: 'action-new-customer' },
  { icon: '📋', label: '回访计划', testId: 'action-return-plan' },
  { icon: '📊', label: '业绩排行', testId: 'action-ranking' },
  { icon: '📱', label: '联系客户', testId: 'action-contact' },
];

function QuickActionBar() {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }} data-testid="quick-action-bar">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          data-testid={action.testId}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: '1px solid rgba(148,163,184,0.15)',
            background: 'rgba(15,23,42,0.25)',
            color: '#cbd5e1',
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 500,
            transition: 'all 0.15s',
          }}
        >
          {action.icon} {action.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 页面组件
// ============================================================

import { useTriState } from '../_components/useTriState';
import { TriStateRenderer } from '../_components/TriStateRenderer';

export default function SalesClerkPage() {
  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const [followUps, setFollowUps] = useState(MOCK_FOLLOW_UP_CLIENTS);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    wrapLoad(
      new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 400);
      }),
    ).then(() => {
      setPageReady(true);
    });
  }, []);
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
      <TriStateRenderer
        loading={loading}
        empty={!pageReady && !loading && !error}
        error={error}
        onRetry={() =>
          wrapLoad(
            new Promise<void>((resolve) => {
              setTimeout(() => resolve(), 400);
            }),
          ).then(() => {
            setFollowUps(MOCK_FOLLOW_UP_CLIENTS);
            setPageReady(true);
          })
        }
      >
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

        {/* ---- 值班摘要 ---- */}
        <ShiftSummary />

        {/* ---- 每日数据统计 ---- */}
        <DailyStatsCards stats={DAILY_STATS} />

        {/* ---- 快速操作栏 ---- */}
        <QuickActionBar />

        {/* ---- 店员排行 ---- */}
        <ClerkRankingPanel current={CURRENT_CLERK} rankings={MOCK_CLERK_RANKING} />

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
      </TriStateRenderer>
    </PageShell>
  );
}
