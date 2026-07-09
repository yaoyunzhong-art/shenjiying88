/**
 * 会员等级分布可视化仪表板 — Member Tier Distribution Dashboard
 * 店长/运营视角：展示会员等级分布饼图/柱状图/趋势分析
 * C类 - 数据可视化组件页面
 */
'use client';

import React, { useMemo } from 'react';
import {
  PageShell,
  StatCard,
  Card,
  MemberTierDistribution,
  MemberLevelDistribution,
  DonutChart,
  SparklineChart,
  KpiSummaryCard,
  EmptyState,
  LoadingSkeleton,
} from '@m5/ui';

// ==================== Mock 数据 ====================

const MOCK_TIERS = [
  { tier: '钻石会员', key: 'diamond', count: 86, growth: 0.12, color: '#7c3aed', icon: '💎' },
  { tier: '铂金会员', key: 'platinum', count: 215, growth: 0.08, color: '#3b82f6', icon: '⭐' },
  { tier: '黄金会员', key: 'gold', count: 378, growth: -0.03, color: '#f59e0b', icon: '🥇' },
  { tier: '银卡会员', key: 'silver', count: 425, growth: 0.05, color: '#6b7280', icon: '🥈' },
  { tier: '普通会员', key: 'basic', count: 182, growth: 0.21, color: '#22c55e', icon: '🟢' },
];

const MOCK_LEVELS = [
  { name: '钻石会员', count: 86, color: '#7c3aed' },
  { name: '铂金会员', count: 215, color: '#3b82f6' },
  { name: '黄金会员', count: 378, color: '#f59e0b' },
  { name: '银卡会员', count: 425, color: '#6b7280' },
  { name: '普通会员', count: 182, color: '#22c55e' },
];

const MOCK_TREND_DATA = [
  { label: '1月', value: 320 },
  { label: '2月', value: 345 },
  { label: '3月', value: 380 },
  { label: '4月', value: 410 },
  { label: '5月', value: 395 },
  { label: '6月', value: 425 },
];

const MOCK_DONUT_DATA = MOCK_TIERS.map((t) => ({
  name: t.tier,
  value: t.count,
  color: t.color,
}));

// ==================== 页面组件 ====================

export default function MemberTierDistributionPage() {
  const totalMembers = useMemo(
    () => MOCK_TIERS.reduce((acc, t) => acc + t.count, 0),
    []
  );

  const highValueMembers = useMemo(
    () => MOCK_TIERS.filter((t) => t.key === 'diamond' || t.key === 'platinum')
      .reduce((acc, t) => acc + t.count, 0),
    []
  );

  return (
    <PageShell
      title="会员等级分布"
      subtitle="可视化分析会员结构，洞察高价值人群分布趋势"
      breadcrumbs={[
        { label: '首页', href: '/' },
        { label: '会员管理', href: '/members' },
        { label: '等级分布', href: '/members/tier-distribution' },
      ]}
    >
      {/* 统计卡片区 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KpiSummaryCard
          title="总会员数"
          value={totalMembers.toLocaleString()}
          unit="人"
          trend={5.2}
        />
        <KpiSummaryCard
          title="高价值会员"
          value={highValueMembers.toLocaleString()}
          unit="人"
          trend={8.7}
          description="钻石 + 铂金"
        />
        <KpiSummaryCard
          title="黄金会员"
          value={MOCK_TIERS[2].count.toLocaleString()}
          unit="人"
          trend={-3.0}
          description="环比下降"
        />
        <KpiSummaryCard
          title="本月新增"
          value={23}
          unit="人"
          trend={15.3}
          description="预估"
        />
      </div>

      {/* 分布图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="等级分布（饼图）" bordered>
          <DonutChart
            data={MOCK_DONUT_DATA}
            width={320}
            height={280}
            showLegend
            showPercent
            innerRadius={60}
          />
        </Card>

        <Card title="等级分布（柱状图）" bordered>
          <MemberTierDistribution
            tiers={MOCK_TIERS}
            width={400}
            height={280}
            showTotal
            showTrends
            onTierClick={(tier) => {
              console.log(`[TierDistribution] 点击等级:`, tier.key);
            }}
          />
        </Card>
      </div>

      {/* 第二行：等级柱状 + 趋势 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="等级占比（水平柱状）" bordered>
          <MemberLevelDistribution
            data={MOCK_LEVELS}
            width={400}
            height={300}
            showValues
            showPercentage
          />
        </Card>

        <Card title="高价值会员增长趋势" bordered>
          <SparklineChart
            data={MOCK_TREND_DATA}
            width={400}
            height={280}
            color="#3b82f6"
            showArea
            showLabels
          />
        </Card>
      </div>

      {/* 等级构成分析 */}
      <Card title="等级构成分析" bordered>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">等级</th>
                <th className="pb-2 font-medium">人数</th>
                <th className="pb-2 font-medium">占比</th>
                <th className="pb-2 font-medium">环比增长</th>
                <th className="pb-2 font-medium">标签</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TIERS.map((tier) => (
                <tr key={tier.key} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 flex items-center gap-2">
                    <span>{tier.icon}</span>
                    <span style={{ color: tier.color }} className="font-medium">
                      {tier.tier}
                    </span>
                  </td>
                  <td className="py-3">{tier.count.toLocaleString()}</td>
                  <td className="py-3">
                    {((tier.count / totalMembers) * 100).toFixed(1)}%
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        (tier.growth ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {(tier.growth ?? 0) >= 0 ? '↑' : '↓'}
                      {Math.abs(tier.growth ?? 0).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs text-white"
                      style={{ backgroundColor: tier.color }}
                    >
                      {tier.key === 'diamond' || tier.key === 'platinum'
                        ? '高价值'
                        : tier.key === 'gold'
                        ? '中价值'
                        : '待提升'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
