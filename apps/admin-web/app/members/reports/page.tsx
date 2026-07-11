'use client';

import { useState, useMemo, useCallback } from 'react';

import {
  DataTable,
  DetailActionBar,
  PageShell,
  Tabs,
  usePagination,
  useSortedItems,
  type DataTableColumn,
  type DataTableSortConfig,
} from '@m5/ui';

import {
  MEMBER_TIER_MAP,
  MEMBER_LIFECYCLE_MAP,
  MOCK_MEMBER_REPORT_SUMMARY,
  MOCK_MEMBER_REPORT_BY_MARKET,
  MOCK_MEMBER_REPORT_BY_TIER,
  MOCK_MEMBER_REPORT_BY_LIFECYCLE,
  type MemberReportSummary,
  type MemberReportByMarket,
  type MemberReportByTier,
  type MemberReportByLifecycle,
  type MemberTier,
} from '../../members-data';
import { useDetailActions } from '../../components/use-detail-actions';

// ---- 报表视图 ---- > ---

type ReportTab = 'overview' | 'by-market' | 'by-tier' | 'by-lifecycle' | 'trends';

// ---- 辅助函数 ----

function formatCurrency(amount: number): string {
  if (amount >= 100000000) return `¥${(amount / 100000000).toFixed(2)}亿`;
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function percentage(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

function lifecycleColor(stage: string): string {
  const map: Record<string, string> = {
    new: '#fbbf24',
    growing: '#4ade80',
    loyal: '#818cf8',
    declining: '#fb923c',
    lost: '#f87171',
  };
  return map[stage] ?? '#94a3b8';
}

function tierColor(tier: MemberTier): string {
  const map: Record<MemberTier, string> = {
    diamond: '#f0abfc',
    gold: '#fbbf24',
    silver: '#94a3b8',
    bronze: '#d97706',
    standard: '#64748b',
  };
  return map[tier] ?? '#94a3b8';
}

// ---- 页面组件 ----

export default function MemberReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>(null);

  const summary = MOCK_MEMBER_REPORT_SUMMARY;
  const byMarket = MOCK_MEMBER_REPORT_BY_MARKET;
  const byTier = MOCK_MEMBER_REPORT_BY_TIER;
  const byLifecycle = MOCK_MEMBER_REPORT_BY_LIFECYCLE;

  // 市场分析表格列
  const marketColumns: DataTableColumn<MemberReportByMarket>[] = useMemo(
    () => [
      {
        key: 'marketLabel',
        title: '市场',
        dataKey: 'marketLabel',
        sortable: true,
        render: (item) => (
          <span className="font-medium" style={{ color: '#e2e8f0' }}>
            {item.marketLabel}
          </span>
        ),
      },
      {
        key: 'marketCode',
        title: '代码',
        dataKey: 'marketCode',
        sortable: true,
        render: (item) => (
          <code style={{ color: '#93c5fd', fontSize: 12 }}>{item.marketCode}</code>
        ),
      },
      {
        key: 'totalMembers',
        title: '会员总数',
        dataKey: 'totalMembers',
        sortable: true,
        align: 'right',
        render: (item) => formatNumber(item.totalMembers),
      },
      {
        key: 'activeMembers',
        title: '活跃',
        dataKey: 'activeMembers',
        sortable: true,
        align: 'right',
        render: (item) => (
          <span style={{ color: '#86efac' }}>{formatNumber(item.activeMembers)}</span>
        ),
      },
      {
        key: 'newMembersThisMonth',
        title: '本月新增',
        dataKey: 'newMembersThisMonth',
        sortable: true,
        align: 'right',
        render: (item) => (
          <span style={{ color: '#93c5fd' }}>{formatNumber(item.newMembersThisMonth)}</span>
        ),
      },
      {
        key: 'totalRevenue',
        title: '总收入',
        dataKey: 'totalRevenue',
        sortable: true,
        align: 'right',
        render: (item) => (
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>
            {formatCurrency(item.totalRevenue)}
          </span>
        ),
      },
      {
        key: 'avgSpend',
        title: '人均消费',
        dataKey: 'avgSpend',
        sortable: true,
        align: 'right',
        render: (item) => formatCurrency(item.avgSpend),
      },
    ],
    []
  );

  // 等级分析表格列
  const tierColumns: DataTableColumn<MemberReportByTier>[] = useMemo(
    () => [
      {
        key: 'tier',
        title: '等级',
        sortable: true,
        sortValue: (item) => item.tier,
        render: (item) => (
          <span style={{ fontWeight: 600, color: tierColor(item.tier) }}>
            {item.tierLabel}
          </span>
        ),
      },
      {
        key: 'memberCount',
        title: '会员数',
        dataKey: 'memberCount',
        sortable: true,
        align: 'right',
        render: (item) => formatNumber(item.memberCount),
      },
      {
        key: 'totalRevenue',
        title: '总收入',
        dataKey: 'totalRevenue',
        sortable: true,
        align: 'right',
        render: (item) => (
          <span style={{ color: '#fbbf24', fontWeight: 600 }}>
            {formatCurrency(item.totalRevenue)}
          </span>
        ),
      },
      {
        key: 'avgRevenue',
        title: '人均贡献',
        dataKey: 'avgRevenue',
        sortable: true,
        align: 'right',
        render: (item) => formatCurrency(item.avgRevenue),
      },
      {
        key: 'retentionRate',
        title: '留存率',
        dataKey: 'retentionRate',
        sortable: true,
        align: 'right',
        render: (item) => (
          <span style={{ color: item.retentionRate >= 0.7 ? '#86efac' : '#fca5a5' }}>
            {percentage(item.retentionRate)}
          </span>
        ),
      },
    ],
    []
  );

  // 生命周期表格列
  const lifecycleColumns: DataTableColumn<MemberReportByLifecycle>[] = useMemo(
    () => [
      {
        key: 'stage',
        title: '生命周期',
        sortable: true,
        sortValue: (item) => item.stage,
        render: (item) => (
          <span style={{ color: lifecycleColor(item.stage), fontWeight: 600 }}>
            {MEMBER_LIFECYCLE_MAP[item.stage]?.label ?? item.stage}
          </span>
        ),
      },
      {
        key: 'count',
        title: '会员数量',
        dataKey: 'count',
        sortable: true,
        align: 'right',
        render: (item) => formatNumber(item.count),
      },
      {
        key: 'percentage',
        title: '占比',
        dataKey: 'percentage',
        sortable: true,
        align: 'right',
        render: (item) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: 'flex-end',
            }}
          >
            <div
              style={{
                width: 80,
                height: 6,
                borderRadius: 3,
                background: 'rgba(71, 85, 105, 0.5)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${item.percentage * 100}%`,
                  height: '100%',
                  borderRadius: 3,
                  background: lifecycleColor(item.stage),
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span style={{ color: '#e2e8f0', minWidth: 40, textAlign: 'right' }}>
              {percentage(item.percentage)}
            </span>
          </div>
        ),
      },
    ],
    []
  );

  const { actions } = useDetailActions({
    workspace: 'members',
    detailId: 'reports',
    record: { summary, byMarket, byTier, byLifecycle },
    shareTitle: '会员报表',
    shareText: '会员报表概览分析',
  });

  const pagination = usePagination({
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20],
  });

  const sortedMarketItems = useSortedItems(byMarket, marketColumns, sortConfig);
  const sortedTierItems = useSortedItems(byTier, tierColumns, sortConfig);
  const sortedLifecycleItems = useSortedItems(byLifecycle, lifecycleColumns, sortConfig);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="会员报表"
        subtitle="会员数据的多维分析报表，覆盖会员概览、市场分布、等级分布和生命周期分析"
      >
        {/* 标签页 */}
        <div style={{ marginBottom: 24 }}>
          <Tabs
            items={[
              { key: 'overview', label: '概览' },
              { key: 'by-market', label: '市场分布' },
              { key: 'by-tier', label: '等级分析' },
              { key: 'by-lifecycle', label: '生命周期' },
              { key: 'trends', label: '趋势分析' },
            ]}
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as ReportTab)}
            variant="pills"
            size="sm"
          />
        </div>

        {/* ---- 概览 ---- */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 核心指标 */}
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              }}
            >
              <MetricCard
                label="会员总数"
                value={formatNumber(summary.totalMembers)}
                trend="stable"
                subtitle="累计注册"
              />
              <MetricCard
                label="活跃会员"
                value={formatNumber(summary.activeMembers)}
                trend="up"
                subtitle={`${percentage(summary.activeMembers / summary.totalMembers)} 活跃率`}
              />
              <MetricCard
                label="本月新增"
                value={formatNumber(summary.newMembersThisMonth)}
                trend="up"
                subtitle={`环比 ${((summary.newMembersThisMonth / (summary.totalMembers * 0.01)) * 3).toFixed(1)}%`}
              />
              <MetricCard
                label="本月流失"
                value={formatNumber(summary.churnedMembersThisMonth)}
                trend="down"
                subtitle={`流失率 ${percentage(summary.churnedMembersThisMonth / summary.totalMembers)}`}
              />
            </div>

            {/* 更多指标 */}
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              }}
            >
              <MetricCard
                label="累计发放积分"
                value={formatNumber(summary.totalPointsIssued)}
                color="#818cf8"
                subtitle="积分"
              />
              <MetricCard
                label="累计兑换积分"
                value={formatNumber(summary.totalPointsRedeemed)}
                color="#a78bfa"
                subtitle={`兑换率 ${percentage(summary.totalPointsRedeemed / summary.totalPointsIssued)}`}
              />
              <MetricCard
                label="平均客单价"
                value={formatCurrency(summary.avgOrderValue)}
                color="#fbbf24"
                subtitle="元/单"
              />
              <MetricCard
                label="复购率"
                value={percentage(summary.repeatPurchaseRate)}
                color="#86efac"
                subtitle="60天复购统计"
              />
            </div>

            {/* 概览说明 */}
            <section
              style={{
                borderRadius: 16,
                padding: 24,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
              }}
            >
              <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
                报表说明
              </h3>
              <div
                style={{
                  fontSize: 13,
                  color: '#cbd5e1',
                  lineHeight: 1.8,
                }}
              >
                <p style={{ margin: 0 }}>
                  当前报表基于全市场会员数据生成，覆盖 {MOCK_MEMBER_REPORT_BY_MARKET.length} 个市场、
                  {MOCK_MEMBER_REPORT_BY_TIER.length} 个会员等级。
                </p>
                <p style={{ margin: '8px 0 0' }}>
                  数据更新频率：T+1（次日凌晨刷新）。本月数据截止至当前统计周期。
                </p>
                <p style={{ margin: '8px 0 0' }}>
                  可使用「市场分布」「等级分析」「生命周期」标签查看更细维度的分析数据，
                  支持导出 CSV 格式报表。
                </p>
              </div>
            </section>
          </div>
        )}

        {/* ---- 市场分布 ---- */}
        {activeTab === 'by-market' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 市场概览指标 */}
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              }}
            >
              <MetricCard
                label="覆盖市场"
                value={String(byMarket.length)}
                color="#93c5fd"
                subtitle="个市场区域"
              />
              <MetricCard
                label="跨市场总会员"
                value={formatNumber(byMarket.reduce((s, m) => s + m.totalMembers, 0))}
                color="#e2e8f0"
                subtitle="合计"
              />
              <MetricCard
                label="跨市场总收入"
                value={formatCurrency(byMarket.reduce((s, m) => s + m.totalRevenue, 0))}
                color="#fbbf24"
                subtitle="合计"
              />
            </div>

            <DataTable
              title="市场会员数据明细"
              columns={marketColumns}
              items={sortedMarketItems}
              rowKey={(item) => item.marketCode}
              sort={sortConfig}
              onSortChange={setSortConfig}
              striped
              compact
            />

            {/* 市场详情展开 */}
            <div
              style={{
                display: 'grid',
                gap: 12,
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              }}
            >
              {byMarket.map((market) => {
                const activeRate = market.activeMembers / market.totalMembers;
                return (
                  <div
                    key={market.marketCode}
                    style={{
                      borderRadius: 12,
                      padding: 16,
                      background: 'rgba(30, 41, 59, 0.45)',
                      border: '1px solid rgba(148, 163, 184, 0.14)',
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>
                      {market.marketLabel}
                      <code style={{ fontSize: 11, marginLeft: 8, color: '#64748b' }}>
                        {market.marketCode}
                      </code>
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
                      <div>
                        总会员：<strong style={{ color: '#e2e8f0' }}>{formatNumber(market.totalMembers)}</strong>
                      </div>
                      <div>
                        活跃率：
                        <strong style={{ color: activeRate >= 0.7 ? '#86efac' : '#fca5a5' }}>
                          {percentage(activeRate)}
                        </strong>
                      </div>
                      <div>
                        本月新增：<strong style={{ color: '#93c5fd' }}>{formatNumber(market.newMembersThisMonth)}</strong>
                      </div>
                      <div>
                        人均消费：<strong style={{ color: '#fbbf24' }}>{formatCurrency(market.avgSpend)}</strong>
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          paddingTop: 8,
                          borderTop: '1px solid rgba(148, 163, 184, 0.12)',
                        }}
                      >
                        总收入：<strong style={{ color: '#fbbf24', fontSize: 16 }}>{formatCurrency(market.totalRevenue)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- 等级分析 ---- */}
        {activeTab === 'by-tier' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 等级概览 */}
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              }}
            >
              <MetricCard
                label="等级数量"
                value={String(byTier.length)}
                color="#93c5fd"
                subtitle="级"
              />
              <MetricCard
                label="累计会员"
                value={formatNumber(byTier.reduce((s, t) => s + t.memberCount, 0))}
                color="#e2e8f0"
                subtitle="覆盖会员"
              />
              <MetricCard
                label="累计收入"
                value={formatCurrency(byTier.reduce((s, t) => s + t.totalRevenue, 0))}
                color="#fbbf24"
                subtitle="全部等级"
              />
              <MetricCard
                label="平均留存率"
                value={percentage(
                  byTier.reduce((s, t) => s + t.retentionRate, 0) / byTier.length
                )}
                color="#86efac"
                subtitle="加权平均"
              />
            </div>

            <DataTable
              title="等级会员数据明细"
              columns={tierColumns}
              items={sortedTierItems}
              rowKey={(item) => item.tier}
              sort={sortConfig}
              onSortChange={setSortConfig}
              striped
              compact
            />

            {/* 等级健康度 */}
            <section
              style={{
                borderRadius: 16,
                padding: 20,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
                等级健康度
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {byTier.map((tier) => (
                  <div key={tier.tier}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: tierColor(tier.tier), fontWeight: 600 }}>
                        {tier.tierLabel}
                      </span>
                      <span style={{ color: '#94a3b8' }}>
                        {formatNumber(tier.memberCount)} 人
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        fontSize: 12,
                        color: '#94a3b8',
                      }}
                    >
                      {/* 活跃度横条 */}
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          borderRadius: 4,
                          background: 'rgba(71, 85, 105, 0.5)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${(tier.retentionRate * 100).toFixed(0)}%`,
                            height: '100%',
                            borderRadius: 4,
                            background: tier.retentionRate >= 0.7 ? '#86efac' : tier.retentionRate >= 0.5 ? '#fde68a' : '#fca5a5',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
                      <span style={{ minWidth: 60, textAlign: 'right' }}>
                        留存率 {percentage(tier.retentionRate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ---- 生命周期 ---- */}
        {activeTab === 'by-lifecycle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 生命周期流向 */}
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              }}
            >
              {byLifecycle.map((item) => {
                const lcColor = lifecycleColor(item.stage);
                return (
                  <div
                    key={item.stage}
                    style={{
                      borderRadius: 16,
                      padding: 18,
                      background: 'rgba(15, 23, 42, 0.38)',
                      border: `1px solid ${lcColor}30`,
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background: `${lcColor}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                        fontSize: 16,
                      }}
                    >
                      <span style={{ color: lcColor, fontSize: 16 }}>
                        {item.stage === 'new' ? '🆕' : item.stage === 'growing' ? '📈' : item.stage === 'loyal' ? '💎' : item.stage === 'declining' ? '📉' : '❌'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: lcColor, fontWeight: 600, marginBottom: 4 }}>
                      {item.stageLabel}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>
                      {formatNumber(item.count)}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      {percentage(item.percentage)}
                    </div>
                  </div>
                );
              })}
            </div>

            <DataTable
              title="生命周期分布明细"
              columns={lifecycleColumns}
              items={sortedLifecycleItems}
              rowKey={(item) => item.stage}
              sort={sortConfig}
              onSortChange={setSortConfig}
              striped
              compact
            />

            {/* 生命周期说明 */}
            <section
              style={{
                borderRadius: 16,
                padding: 20,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
              }}
            >
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
                生命周期定义
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  fontSize: 13,
                  color: '#94a3b8',
                  lineHeight: 1.7,
                }}
              >
                <div>
                  <span style={{ color: lifecycleColor('new'), fontWeight: 600 }}>新会员</span>
                  ：注册时间 &lt; 30 天，尚未形成稳定消费习惯
                </div>
                <div>
                  <span style={{ color: lifecycleColor('growing'), fontWeight: 600 }}>成长中</span>
                  ：注册 30-180 天，消费频次逐步提升
                </div>
                <div>
                  <span style={{ color: lifecycleColor('loyal'), fontWeight: 600 }}>忠实会员</span>
                  ：注册 &gt; 180 天，近 30 天有活跃消费
                </div>
                <div>
                  <span style={{ color: lifecycleColor('declining'), fontWeight: 600 }}>衰退期</span>
                  ：近 60 天未产生消费，需要激活策略
                </div>
                <div>
                  <span style={{ color: lifecycleColor('lost'), fontWeight: 600 }}>已流失</span>
                  ：近 90 天未产生消费，需要召回策略
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ---- 趋势分析 ---- */}
        {activeTab === 'trends' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 趋势概览 */}
            <div
              style={{
                display: 'grid',
                gap: 14,
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              }}
            >
              <MetricCard
                label="本月会员增长率"
                value={`+${((summary.newMembersThisMonth / (summary.totalMembers - summary.newMembersThisMonth)) * 100).toFixed(1)}%`}
                trend="up"
                color="#4ade80"
                subtitle="相较于上月"
              />
              <MetricCard
                label="会员留存率"
                value={percentage(
                  (summary.totalMembers - summary.churnedMembersThisMonth) /
                    summary.totalMembers
                )}
                trend="stable"
                color="#93c5fd"
                subtitle="整体留存"
              />
              <MetricCard
                label="会员活跃度"
                value={percentage(summary.activeMembers / summary.totalMembers)}
                trend="up"
                color="#fbbf24"
                subtitle="当前活跃率"
              />
            </div>

            {/* 趋势图表占位 */}
            <section
              style={{
                borderRadius: 16,
                padding: 32,
                background: 'rgba(15, 23, 42, 0.35)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 8px' }}>
                会员趋势图表
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, maxWidth: 480, margin: '0 auto' }}>
                趋势分析图表正在建设中，后续将支持以下分析维度：会员新增/流失趋势、等级迁移分析、
                生命周期流动图、市场对比分析、复购率变化趋势。
              </p>

              {/* 趋势数据预览 */}
              <div
                style={{
                  marginTop: 24,
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  maxWidth: 600,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.5)',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>本月新增趋势</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#4ade80', marginTop: 4 }}>
                    ↑ {formatNumber(summary.newMembersThisMonth)}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    环比 +8.2%
                  </div>
                </div>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.5)',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>本月流失趋势</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fca5a5', marginTop: 4 }}>
                    ↑ {formatNumber(summary.churnedMembersThisMonth)}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    环比 -3.1%
                  </div>
                </div>
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: 'rgba(30, 41, 59, 0.5)',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>净增量</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#818cf8', marginTop: 4 }}>
                    +{formatNumber(summary.newMembersThisMonth - summary.churnedMembersThisMonth)}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    新增-流失
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        <DetailActionBar
          actions={actions}
          heading="报表导出"
          caption="复制、导出或分享当前报表视图"
        />
      </PageShell>
    </main>
  );
}

// ---- MetricCard 子组件 ----

function MetricCard({
  label,
  value,
  trend,
  color,
  subtitle,
}: {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
  subtitle?: string;
}) {
  const borderColor = color
    ? `${color}28`
    : trend === 'up'
      ? 'rgba(74, 222, 128, 0.2)'
      : trend === 'down'
        ? 'rgba(248, 113, 113, 0.2)'
        : 'rgba(148, 163, 184, 0.18)';

  const valueColor =
    color ??
    (trend === 'up'
      ? '#4ade80'
      : trend === 'down'
        ? '#fca5a5'
        : '#e2e8f0');

  const arrowIcon =
    trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 18,
        background: 'rgba(15, 23, 42, 0.38)',
        border: `1px solid ${borderColor}`,
      }}
    >
      <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: valueColor,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {trend && (
          <span
            style={{
              fontSize: 16,
              color: valueColor,
            }}
          >
            {arrowIcon}
          </span>
        )}
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
