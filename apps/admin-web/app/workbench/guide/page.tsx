/**
 * 导购员智能辅助面板 — Sales Guide Smart Assistant (Next.js App Router Page)
 * 角色视角: 🛒 导购员
 * 功能: 今日业绩面板 / 当前顾客画像 / AI 推荐商品 / 待跟进会员提醒 / 会员升级建议
 */
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  SalesGuideTool,
  MemberFollowUpTaskPanel,
  TierUpgradePanel,
  DataTable,
  DetailActionBar,
  Pagination,
  QuickStats,
  Tabs,
  StatusBadge,
  PageShell,
  usePagination,
  useSearchFilter,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
  type CustomerProfile,
  type RecommendedProduct,
  type GuideAlert,
  type DailyPerformance,
  type FollowUpRecord,
  type TierInfo,
} from '@m5/ui';
import { useDetailActions } from '../../components/use-detail-actions';

// ============================================================
// 类型
// ============================================================

interface RankedProduct extends RecommendedProduct {
  rank: number;
  category: string;
  matchScore: number; // AI 匹配度 0-100
}

interface CustomerQueueItem {
  id: string;
  name: string;
  memberTier: string;
  estimatedWait: number;
  preferredCategory: string;
  isVIP: boolean;
}

interface QuickReply {
  id: string;
  label: string;
  text: string;
  category: 'greeting' | 'recommendation' | 'price' | 'closing';
}

interface TierUpgradeRecommendation {
  memberId: string;
  memberName: string;
  currentTier: string;
  nextTier: string;
  progressPercent: number;
  remainingSpend: number;
  validUntil: string;
}

// ============================================================
// 常量映射
// ============================================================

const TIER_LABEL: Record<string, string> = {
  bronze: '青铜',
  silver: '白银',
  gold: '黄金',
  platinum: '铂金',
  diamond: '钻石',
};

const TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
  diamond: '#b9f2ff',
};

const PRIORITY_LABEL: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const PRIORITY_VARIANT: Record<string, 'error' | 'warning' | 'neutral'> = {
  high: 'error',
  medium: 'warning',
  low: 'neutral',
};

const CATEGORY_ICONS: Record<string, string> = {
  plush: '🧸',
  figure: '🎎',
  card: '🃏',
  blind: '🎁',
  badge: '🎖️',
  keychain: '🔑',
  collectible: '💎',
  default: '🏷️',
};

// ============================================================
// Mock 数据
// ============================================================

const MOCK_PERFORMANCE: DailyPerformance = {
  customersServed: 28,
  totalSales: 15_860,
  conversionRate: 0.72,
  avgSpend: 566,
};

const MOCK_CUSTOMER: CustomerProfile | null = {
  id: 'cm-001',
  name: '林小婉',
  phone: '138****5678',
  memberTier: 'gold',
  totalSpent: 8_960,
  visitCount: 24,
  lastVisit: '2026-07-05',
  preferences: ['宝可梦', '盲盒', '毛绒玩具'],
  tags: ['高活跃', '偏好复购', '每月访店≥4次'],
};

const MOCK_RECOMMENDATIONS: RankedProduct[] = [
  {
    id: 'r1', rank: 1, name: '宝可梦 伊布进化系列 盲盒', price: 69, originalPrice: 89,
    reason: '顾客上次购买了皮卡丘系列，推荐同世界观伊布进化', stock: 45, category: 'blind', matchScore: 96,
  },
  {
    id: 'r2', rank: 2, name: '星之卡比 30cm 限定毛绒', price: 198, originalPrice: 258,
    reason: '毛绒类顾客偏好度高 + 限定款溢价空间大', stock: 12, category: 'plush', matchScore: 88,
  },
  {
    id: 'r3', rank: 3, name: '迪士尼 米奇系列盲盒 Vol.5', price: 59,
    reason: '基于盲盒品类消费记录，推荐最新系列', stock: 78, category: 'blind', matchScore: 82,
  },
  {
    id: 'r4', rank: 4, name: '鬼灭之刃 日轮刀钥匙扣', price: 35,
    reason: '年轻顾客高点击率商品，性价比引流款', stock: 120, category: 'keychain', matchScore: 75,
  },
  {
    id: 'r5', rank: 5, name: '新世紀福音战士 明日香手办', price: 299,
    reason: '高客单价 ACG 粉丝向商品，适合升级推荐', stock: 8, category: 'figure', matchScore: 68,
  },
  {
    id: 'r6', rank: 6, name: '三丽鸥 Hello Kitty 徽章套装', price: 45,
    reason: '女性顾客偏好三丽鸥系列，徽章易携带复购', stock: 200, category: 'badge', matchScore: 65,
  },
];

const MOCK_CUSTOMER_QUEUE: CustomerQueueItem[] = [
  { id: 'q1', name: '张子轩', memberTier: 'silver', estimatedWait: 2, preferredCategory: 'Figure', isVIP: false },
  { id: 'q2', name: '王雨桐', memberTier: 'platinum', estimatedWait: 5, preferredCategory: '毛绒', isVIP: true },
  { id: 'q3', name: '陈逸飞', memberTier: 'bronze', estimatedWait: 8, preferredCategory: '卡片', isVIP: false },
  { id: 'q4', name: '赵思琪', memberTier: 'diamond', estimatedWait: 12, preferredCategory: '盲盒', isVIP: true },
  { id: 'q5', name: '刘浩然', memberTier: 'gold', estimatedWait: 15, preferredCategory: '手办', isVIP: false },
];

const MOCK_FOLLOW_UP_TASKS: FollowUpRecord[] = [
  {
    memberName: '林小婉', memberPhone: '138****5678', memberTier: 'gold',
    title: '回访林小婉 — 上次咨询伊布盲盒到货', description: '跟进新品到货回访',
    priority: 'high' as const, status: 'pending' as const, category: 'general' as const,
    dueDate: '2026-07-11 18:00', assignee: '李婷',
  },
  {
    memberName: '张子轩', memberPhone: '139****1234', memberTier: 'silver',
    title: '张子轩生日回馈 — 赠送积分', description: '生日专属积分赠送',
    priority: 'medium' as const, status: 'pending' as const, category: 'birthday' as const,
    dueDate: '2026-07-11 14:00', assignee: '李婷',
  },
  {
    memberName: '王雨桐', memberPhone: '136****8888', memberTier: 'platinum',
    title: '王雨桐铂金会员专属折扣到期提醒', description: '折扣到期前提醒续费',
    priority: 'medium' as const, status: 'pending' as const, category: 'renewal' as const,
    dueDate: '2026-07-12 10:00', assignee: '李婷',
  },
  {
    memberName: '赵思琪', memberPhone: '137****2222', memberTier: 'diamond',
    title: '赵思琪投诉跟进 — 商品质量问题', description: '质量问题回访',
    priority: 'high' as const, status: 'pending' as const, category: 'complaint' as const,
    dueDate: '2026-07-10 12:00', assignee: '李婷',
  },
  {
    memberName: '陈逸飞', memberPhone: '150****7777', memberTier: 'bronze',
    title: '陈逸飞首购满减券到期提醒', description: '首购券到期前提醒',
    priority: 'low' as const, status: 'pending' as const, category: 'promotion' as const,
    dueDate: '2026-07-13 23:59', assignee: '李婷',
  },
];

const MOCK_ALERTS: GuideAlert[] = [
  { id: 'a1', type: 'vip_visit', message: '铂金会员王雨桐已到店，请优先接待', priority: 'high', createdAt: '2026-07-11 01:20' },
  { id: 'a2', type: 'birthday', message: '会员张子轩今日生日，建议推送专属优惠', priority: 'medium', createdAt: '2026-07-11 00:00' },
  { id: 'a3', type: 'follow_up', message: '林小婉（Gold）连续 7 天未到店，建议回访激活', priority: 'medium', createdAt: '2026-07-11 01:15' },
  { id: 'a4', type: 'restock', message: '伊布盲盒库存仅剩 12 件，建议推荐替代商品', priority: 'low', createdAt: '2026-07-11 00:45' },
];

const MOCK_TIER_UPGRADE: TierUpgradeRecommendation = {
  memberId: 'cm-001',
  memberName: '林小婉',
  currentTier: 'gold',
  nextTier: 'platinum',
  progressPercent: 72,
  remainingSpend: 3120,
  validUntil: '2026-08-15',
};

const QUICK_REPLIES: QuickReply[] = [
  { id: 'qr1', label: '迎宾语', text: '下午好！欢迎光临，需要我为您介绍一下新到的盲盒系列吗？', category: 'greeting' },
  { id: 'qr2', label: '推荐话术', text: '根据您的偏好，本周新到了宝可梦伊布进化盲盒，很多像您一样喜欢皮卡丘的顾客都在购买哦~', category: 'recommendation' },
  { id: 'qr3', label: '价格说明', text: '这套商品现在有会员专享价，金卡会员可以享受 9 折优惠，折后仅 178 元。', category: 'price' },
  { id: 'qr4', label: '促成交', text: '这款限定版库存不多，目前店里只剩 12 件了。您今天购买还可以累计双倍积分。', category: 'closing' },
  { id: 'qr5', label: '升级推荐', text: '您目前已消费 8960 元，距离升级铂金会员仅差 3120 元。升级后可享受 85 折和专属生日礼。', category: 'recommendation' },
  { id: 'qr6', label: '告别语', text: '感谢您的光临！这是您今天购买的积分小票，欢迎下次再来~', category: 'closing' },
];

// ============================================================
// 列定义
// ============================================================

function buildRecommendationColumns(): DataTableColumn<RankedProduct>[] {
  return [
    {
      key: 'rank',
      title: '#',
      dataKey: 'rank',
      sortable: true,
      width: '40px',
    },
    {
      key: 'name',
      title: '推荐商品',
      dataKey: 'name',
      sortable: true,
    },
    {
      key: 'price',
      title: '价格 (¥)',
      sortable: true,
      align: 'right',
      render: (item: RankedProduct) => {
        if (item.originalPrice) {
          return (
            <span>
              <span style={{ color: '#f87171', fontWeight: 600 }}>¥{item.price}</span>
              {' '}
              <span style={{ color: '#64748b', textDecoration: 'line-through', fontSize: 12 }}>¥{item.originalPrice}</span>
            </span>
          );
        }
        return <span>¥{item.price}</span>;
      },
    },
    {
      key: 'matchScore',
      title: 'AI 匹配度',
      sortable: true,
      render: (item: RankedProduct) => {
        const color = item.matchScore >= 85 ? '#4ade80' : item.matchScore >= 70 ? '#facc15' : '#94a3b8';
        return <span style={{ color, fontWeight: 600, fontSize: 13 }}>{item.matchScore}%</span>;
      },
    },
    {
      key: 'stock',
      title: '库存',
      dataKey: 'stock',
      sortable: true,
      align: 'right',
    },
    {
      key: 'reason',
      title: '推荐理由',
      dataKey: 'reason',
    },
  ];
}

function buildQueueColumns(): DataTableColumn<CustomerQueueItem>[] {
  return [
    {
      key: 'name',
      title: '顾客',
      dataKey: 'name',
      sortable: true,
    },
    {
      key: 'memberTier',
      title: '会员等级',
      sortable: true,
      render: (item: CustomerQueueItem) => (
        <span style={{ color: TIER_COLORS[item.memberTier] ?? '#94a3b8', fontWeight: 600, fontSize: 13 }}>
          {TIER_LABEL[item.memberTier] ?? item.memberTier}
        </span>
      ),
    },
    {
      key: 'estimatedWait',
      title: '预计等待',
      sortable: true,
      render: (item: CustomerQueueItem) => `${item.estimatedWait} 分钟`,
    },
    {
      key: 'preferredCategory',
      title: '偏好类目',
      dataKey: 'preferredCategory',
    },
    {
      key: 'isVIP',
      title: 'VIP',
      render: (item: CustomerQueueItem) => item.isVIP
        ? <StatusBadge label="VIP" variant="warning" size="sm" />
        : null,
    },
  ];
}

// ============================================================
// 页面组件
// ============================================================

export default function GuideWorkbenchPage(): React.ReactElement {
  const router = useRouter();

  // --- 顾客队列 ---
  const queueColumns = useMemo(() => buildQueueColumns(), []);
  const [queueSort, setQueueSort] = useState<DataTableSortConfig | null>(null);
  const sortedQueue = useSortedItems(MOCK_CUSTOMER_QUEUE, queueColumns, queueSort);

  // --- AI 推荐 ---
  const [recommendationSort, setRecommendationSort] = useState<DataTableSortConfig | null>({ key: 'rank', direction: 'asc' });
  const recColumns = useMemo(() => buildRecommendationColumns(), []);
  const sortedRecommendations = useSortedItems(MOCK_RECOMMENDATIONS, recColumns, recommendationSort);
  const recPagination = usePagination({ initialPageSize: 4 });
  const recPageItems = recPagination.paginate(sortedRecommendations);

  // --- 提醒 tab ---
  const [alertTab, setAlertTab] = useState<'ALL' | 'high' | 'medium' | 'low'>('ALL');
  const sortedAlerts = useMemo(
    () => {
      const items = alertTab === 'ALL' ? MOCK_ALERTS : MOCK_ALERTS.filter((a) => a.priority === alertTab);
      return items;
    },
    [alertTab],
  );

  // --- 统计 ---
  const stats = useMemo(() => ({
    served: MOCK_PERFORMANCE.customersServed,
    sales: MOCK_PERFORMANCE.totalSales,
    conversion: MOCK_PERFORMANCE.conversionRate,
    avgSpend: MOCK_PERFORMANCE.avgSpend,
    pendingFollowUps: MOCK_FOLLOW_UP_TASKS.filter((t) => t.priority === 'high' || t.priority === 'urgent').length,
    queueCount: MOCK_CUSTOMER_QUEUE.length,
  }), []);

  const { actions } = useDetailActions({
    workspace: 'guide-workbench',
    detailId: 'overview',
    record: { performance: MOCK_PERFORMANCE, alerts: MOCK_ALERTS, followUps: MOCK_FOLLOW_UP_TASKS },
    shareTitle: '导购员工作台',
    shareText: '今日业绩 / 顾客画像 / AI 推荐 / 待跟进',
  });

  // --- 快捷回复点击 ---
  const [copiedReply, setCopiedReply] = useState<string | null>(null);
  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedReply(text.slice(0, 20));
      setTimeout(() => setCopiedReply(null), 2000);
    });
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="导购员智能辅助面板"
        subtitle="朝阳大悦城旗舰店 — 实时顾客画像、AI 推荐、业绩追踪一站式导购辅助。"
      >
        {/* ===== 今日业绩概览 ===== */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>今日业绩</h2>
          <SalesGuideTool
            guideName="李婷"
            performance={MOCK_PERFORMANCE}
            currentCustomer={MOCK_CUSTOMER}
            recommendations={MOCK_RECOMMENDATIONS.slice(0, 3)}
            alerts={MOCK_ALERTS}
          />
        </section>

        {/* ===== 快速统计 ===== */}
        <section style={{ marginBottom: 24 }}>
          <QuickStats
            items={[
              { label: '接待顾客', value: stats.served, helper: '今日累计' },
              { label: '达成销售额', value: `¥${stats.sales.toLocaleString()}`, helper: `客单价 ¥${stats.avgSpend}` },
              { label: '转化率', value: `${(stats.conversion * 100).toFixed(0)}%`, helper: '同店同比 +5.2%', valueColor: '#4ade80' },
              { label: '队列中顾客', value: stats.queueCount, helper: '待接待', valueColor: '#facc15' },
              { label: '待处理跟进', value: stats.pendingFollowUps, valueColor: '#f87171', helper: '高优先级' },
            ]}
          />
        </section>

        {/* ===== 顾客队列 + 快捷回复 ===== */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>顾客排队 & 快捷话术</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* 排队列表 */}
            <div style={{
              borderRadius: 16,
              padding: 16,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>待接待顾客</div>
              <DataTable
                columns={queueColumns}
                items={sortedQueue}
                rowKey={(item) => item.id}
                sort={queueSort}
                onSortChange={setQueueSort}
                compact
              />
            </div>
            {/* 快捷回复 */}
            <div style={{
              borderRadius: 16,
              padding: 16,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>快捷话术</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply.id}
                    onClick={() => handleCopy(reply.text)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid rgba(148, 163, 184, 0.18)',
                      background: copiedReply?.startsWith(reply.text.slice(0, 20))
                        ? 'rgba(74, 222, 128, 0.15)'
                        : 'rgba(15, 23, 42, 0.5)',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                      fontSize: 13,
                      transition: 'background 0.2s',
                    }}
                    title="点击复制话术"
                  >
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{reply.label}</div>
                    <div style={{ color: '#94a3b8', fontSize: 12 }}>{reply.text}</div>
                  </button>
                ))}
              </div>
              {copiedReply && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#4ade80' }}>
                  ✅ 已复制到剪贴板
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ===== AI 智能推荐 ===== */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>
            🤖 AI 智能推荐 <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>基于顾客画像 & CRM 数据</span>
          </h2>
          <DataTable
            title={`共 ${MOCK_RECOMMENDATIONS.length} 件推荐商品（按 AI 匹配度排序）`}
            columns={recColumns}
            items={recPageItems}
            rowKey={(item) => item.id}
            sort={recommendationSort}
            onSortChange={setRecommendationSort}
            compact
          />
          <Pagination
            page={recPagination.page}
            pageSize={recPagination.pageSize}
            total={sortedRecommendations.length}
            onPageChange={recPagination.setPage}
            onPageSizeChange={recPagination.setPageSize}
          />
        </section>

        {/* ===== AI 推荐理由聚合 ===== */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>推荐理由摘要</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {MOCK_RECOMMENDATIONS.slice(0, 6).map((rec) => (
              <div
                key={rec.id}
                style={{
                  borderRadius: 12,
                  padding: 14,
                  background: 'rgba(15, 23, 42, 0.3)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span>{CATEGORY_ICONS[rec.category] ?? CATEGORY_ICONS.default}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{rec.name}</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                  {rec.reason}
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: rec.matchScore >= 85 ? '#4ade80' : '#facc15', fontWeight: 600, fontSize: 13 }}>
                    匹配 {rec.matchScore}%
                  </span>
                  <span style={{ color: '#f87171', fontSize: 13, fontWeight: 600 }}>¥{rec.price}</span>
                  {rec.originalPrice && (
                    <span style={{ color: '#64748b', fontSize: 12, textDecoration: 'line-through' }}>
                      ¥{rec.originalPrice}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 待跟进提醒 ===== */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>
            提醒 & 待跟进
          </h2>
          <div style={{ marginBottom: 8 }}>
            <Tabs
              items={[
                { key: 'ALL' as const, label: '全部', count: MOCK_ALERTS.length },
                { key: 'high' as const, label: '高优先级', count: MOCK_ALERTS.filter((a) => a.priority === 'high').length },
                { key: 'medium' as const, label: '中优先级', count: MOCK_ALERTS.filter((a) => a.priority === 'medium').length },
                { key: 'low' as const, label: '低优先级', count: MOCK_ALERTS.filter((a) => a.priority === 'low').length },
              ]}
              activeKey={alertTab}
              onChange={(key) => setAlertTab(key as typeof alertTab)}
              variant="pills"
              size="sm"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sortedAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  borderRadius: 12,
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.3)',
                  border: `1px solid ${
                    alert.priority === 'high'
                      ? 'rgba(248, 113, 113, 0.3)'
                      : alert.priority === 'medium'
                      ? 'rgba(250, 204, 21, 0.25)'
                      : 'rgba(148, 163, 184, 0.18)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <StatusBadge
                  label={PRIORITY_LABEL[alert.priority] ?? alert.priority}
                  variant={(PRIORITY_VARIANT[alert.priority] ?? 'neutral') as 'error' | 'warning' | 'neutral'}
                  size="sm"
                  dot
                />
                <div style={{ flex: 1, color: '#e2e8f0', fontSize: 14 }}>{alert.message}</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>{alert.createdAt}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 待跟进会员任务 ===== */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>待跟进会员任务</h2>
          <MemberFollowUpTaskPanel
            tasks={MOCK_FOLLOW_UP_TASKS}
            staffName="李婷"
            totalPending={MOCK_FOLLOW_UP_TASKS.length}
            overdueCount={1}
          />
        </section>

        {/* ===== 会员升级建议 ===== */}
        {MOCK_TIER_UPGRADE && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e2e8f0' }}>会员升级建议</h2>
            <TierUpgradePanel
              currentTier={{ name: '黄金会员', color: '#ffd700', threshold: 5000 }}
              nextTier={{ name: '铂金会员', color: '#e5e4e2', threshold: 12000 }}
              currentValue={MOCK_TIER_UPGRADE.progressPercent}
              unit="元"
              estimatedDays={30}
              metric="spend"
            />
          </section>
        )}

        {/* ===== 底部操作栏 ===== */}
        <DetailActionBar
          actions={actions}
          heading="导购辅助面板收口"
          caption="导出今日话术 / 分享工作台快照 / 同步跟进清单"
        />
      </PageShell>
    </main>
  );
}
