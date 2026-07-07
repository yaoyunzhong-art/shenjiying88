'use client';

/**
 * Phase-43 T174: 营销活动性能分析仪表盘 (admin-web)
 *
 * 功能:
 *  - 实时活动指标面板（曝光/点击/转化/营收）
 *  - 趋势图（7日/30日）
 *  - AI 活动建议（CampaignInsight）
 *  - 渠道对比柱状图
 *  - 转化漏斗
 *
 * 使用 @m5/ui 的 CampaignPerformancePanel 组件
 */

import { useState, useEffect, useCallback, use } from 'react';
import {
  PageShell,
  StatCard,
  CampaignPerformancePanel,
  type CampaignMetric,
  type CampaignDataPoint,
  type CampaignInsight,
} from '@m5/ui';

// ─── 类型定义 ────────────────────────────────────────────

interface ChannelMetrics {
  channel: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cvr: number;
}

interface FunnelStep {
  name: string;
  count: number;
  rate: number;
}

type CampaignStatus = 'active' | 'scheduled' | 'ended' | 'draft';

interface CampaignAnalytics {
  campaignName: string;
  status: CampaignStatus;
  metrics: CampaignMetric[];
  trendData: CampaignDataPoint[];
  insights: CampaignInsight[];
  channelData: ChannelMetrics[];
  funnel: FunnelStep[];
  totalBudget: number;
  spentAmount: number;
  budgetUtilization: number;
}

const STATUS_LABEL: Record<CampaignStatus, string> = {
  active: '进行中',
  scheduled: '已计划',
  ended: '已结束',
  draft: '草稿',
};

// ─── 模拟数据 ─────────────────────────────────────────────

function generateMockAnalytics(id: string): CampaignAnalytics {
  const campaignNames: string[] = [
    '夏季会员拉新活动',
    '端午促销专场',
    '新店开业大酬宾',
    '积分兑换狂欢节',
    '老客回归计划',
    '节假日储值送礼',
    '新品首发特惠',
  ];
  const index = parseInt(id.replace(/\D/g, ''), 10);
  const safeIndex = Number.isNaN(index) ? 0 : index;
  const name: string = campaignNames[safeIndex % campaignNames.length]!;
  const statuses: CampaignStatus[] = ['active', 'ended', 'scheduled'];
  const status: CampaignStatus = statuses[safeIndex % statuses.length]!;

  const impressions = 125000 + Math.floor(Math.random() * 50000);
  const clicks = Math.floor(impressions * (0.035 + Math.random() * 0.025));
  const conversions = Math.floor(clicks * (0.12 + Math.random() * 0.08));
  const revenue = conversions * (120 + Math.floor(Math.random() * 80));

  const metrics: CampaignMetric[] = [
    { label: '曝光量', value: impressions.toLocaleString(), color: '#3b82f6', trend: 'up', delta: '+12.5%' },
    { label: '点击量', value: clicks.toLocaleString(), color: '#8b5cf6', trend: 'up', delta: '+8.3%' },
    { label: '转化数', value: conversions.toLocaleString(), color: '#10b981', trend: 'up', delta: '+15.2%' },
    { label: '营收', value: `¥${revenue.toLocaleString()}`, color: '#f59e0b', trend: 'up', delta: '+22.1%' },
    { label: 'ROI', value: `${(revenue / (80000 + Math.random() * 40000)).toFixed(2)}x`, color: '#06b6d4', trend: 'up', delta: '+5.7%' },
    { label: '获客成本', value: `¥${(12 + Math.random() * 8).toFixed(1)}`, color: '#ef4444', trend: 'down', delta: '-10.3%' },
  ];

  const trendData: CampaignDataPoint[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const baseImp = 3500 + Math.floor(Math.random() * 2000);
    const baseClk = Math.floor(baseImp * (0.03 + Math.random() * 0.04));
    const baseCnv = Math.floor(baseClk * (0.1 + Math.random() * 0.1));
    return {
      date: date.toISOString().slice(0, 10),
      impressions: baseImp,
      clicks: baseClk,
      conversions: baseCnv,
      revenue: baseCnv * (100 + Math.floor(Math.random() * 60)),
    };
  });

  const insights: CampaignInsight[] = [
    { type: 'positive', message: '微信渠道转化率比均值高 23%', recommendation: '建议增加微信渠道投放预算 30%' },
    { type: 'negative', message: '短信渠道 ROI 连续 3 日下降', recommendation: '建议暂停短信投放，优化文案后重新测试' },
    { type: 'info', message: '新用户首单转化率 18.5%', recommendation: '可针对首单用户设计复购激励策略' },
    { type: 'warning', message: '投放预算使用已达 85%', recommendation: '剩余预算紧张，建议调整出价策略' },
  ];

  const channelData: ChannelMetrics[] = [
    { channel: '微信', impressions: 52000, clicks: 2600, conversions: 390, revenue: 62400, ctr: 5.0, cvr: 15.0 },
    { channel: 'App推送', impressions: 38000, clicks: 1520, conversions: 182, revenue: 27300, ctr: 4.0, cvr: 12.0 },
    { channel: '短信', impressions: 25000, clicks: 500, conversions: 40, revenue: 4800, ctr: 2.0, cvr: 8.0 },
    { channel: '抖音', impressions: 15000, clicks: 900, conversions: 108, revenue: 19440, ctr: 6.0, cvr: 12.0 },
    { channel: '小红书', impressions: 8000, clicks: 480, conversions: 72, revenue: 12960, ctr: 6.0, cvr: 15.0 },
  ];

  const funnel: FunnelStep[] = [
    { name: '曝光', count: impressions, rate: 100 },
    { name: '点击', count: clicks, rate: parseFloat(((clicks / impressions) * 100).toFixed(1)) },
    { name: '落地页', count: Math.floor(clicks * 0.85), rate: 85 },
    { name: '加购', count: Math.floor(conversions * 1.6), rate: parseFloat(((conversions * 1.6 / clicks) * 100).toFixed(1)) },
    { name: '下单', count: conversions, rate: parseFloat(((conversions / clicks) * 100).toFixed(1)) },
  ];

  const totalBudget = 200000;
  const spent = totalBudget * (0.75 + Math.random() * 0.15);

  return { campaignName: name, status, metrics, trendData, insights, channelData, funnel, totalBudget, spentAmount: spent, budgetUtilization: spent / totalBudget };
}

// ─── 渠道颜色 ─────────────────────────────────────────────

const CHANNEL_COLORS: Record<string, string> = {
  微信: '#07c160',
  App推送: '#3b82f6',
  短信: '#ef4444',
  抖音: '#333333',
  小红书: '#fe2c55',
};

function calculateCvr(ch: ChannelMetrics): string {
  if (ch.clicks <= 0) return '0.0%';
  return `${((ch.conversions / ch.clicks) * 100).toFixed(1)}%`;
}

function calculateCtr(ch: ChannelMetrics): string {
  if (ch.impressions <= 0) return '0.0%';
  return `${((ch.clicks / ch.impressions) * 100).toFixed(1)}%`;
}

// ─── 组件 ─────────────────────────────────────────────────

export default function CampaignPerformancePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'channels' | 'funnel' | 'insights'>('overview');
  const [selectedDays, setSelectedDays] = useState<7 | 30>(7);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const data = generateMockAnalytics(resolvedParams.id);
        setAnalytics(data);
      } catch {
        setError('加载活动分析数据失败');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [resolvedParams.id]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAnalytics(null);
    const timer = setTimeout(() => {
      try {
        const data = generateMockAnalytics(resolvedParams.id);
        setAnalytics(data);
      } catch {
        setError('加载活动分析数据失败');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [resolvedParams.id]);

  const handleStatusTransition = useCallback(() => {
    if (!analytics) return;
    const transitions: Record<CampaignStatus, CampaignStatus> = {
      draft: 'scheduled',
      scheduled: 'active',
      active: 'ended',
      ended: 'ended',
    };
    const next = transitions[analytics.status];
    setAnalytics({ ...analytics, status: next });
  }, [analytics]);

  if (loading) {
    return (
      <PageShell title="活动性能分析">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
          <div>加载活动性能数据中...</div>
        </div>
      </PageShell>
    );
  }

  if (error || !analytics) {
    return (
      <PageShell title="活动性能分析">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ color: '#ef4444', fontSize: '1.2rem', marginBottom: '1rem' }}>{error || '数据加载失败'}</div>
          <button onClick={retry} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            重新加载
          </button>
        </div>
      </PageShell>
    );
  }

  const tabs: Array<{ key: typeof activeTab; label: string }> = [
    { key: 'overview', label: '概览' },
    { key: 'channels', label: '渠道对比' },
    { key: 'funnel', label: '转化漏斗' },
    { key: 'insights', label: 'AI 洞察' },
  ];

  // breadcrumb segments
  const crumbs: Array<{ label: string; href?: string }> = [
    { label: '营销活动', href: '/marketing' },
    { label: analytics.campaignName, href: `/marketing/${resolvedParams.id}` },
    { label: '性能分析' },
  ];

  return (
    <PageShell title={`${analytics.campaignName} — 性能分析`}>
      <div style={{ padding: '1.5rem 0' }}>
        {/* 面包屑 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: '0.85rem', color: '#6b7280' }}>
          {crumbs.map((item, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <span>/</span>}
              {item.href ? (
                <a href={item.href} style={{ color: '#3b82f6', textDecoration: 'none' }}>{item.label}</a>
              ) : (
                <span style={{ color: '#1f2937' }}>{item.label}</span>
              )}
            </span>
          ))}
        </div>

        {/* 标题区 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{analytics.campaignName}</h1>
            <span style={{ display: 'inline-block', marginTop: 8, padding: '2px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, color: '#fff', backgroundColor: analytics.status === 'active' ? '#065f46' : analytics.status === 'ended' ? '#6b7280' : analytics.status === 'scheduled' ? '#1e40af' : '#92400e' }}>
              {STATUS_LABEL[analytics.status]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {analytics.status !== 'ended' && (
              <button onClick={handleStatusTransition} style={{ padding: '0.5rem 1rem', background: '#065f46', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
                状态推进 →
              </button>
            )}
          </div>
        </div>

        {/* 预算卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatCard label="总预算" value={`¥${analytics.totalBudget.toLocaleString()}`} />
          <StatCard label="已花费" value={`¥${Math.round(analytics.spentAmount).toLocaleString()}`} />
          <StatCard
            label="预算利用率"
            value={`${(analytics.budgetUtilization * 100).toFixed(1)}%`}
            trend={analytics.budgetUtilization > 0.8 ? { value: '↑', positive: true } : undefined}
          />
          <StatCard
            label="预估剩余天数"
            value={`${Math.round((1 - analytics.budgetUtilization) / (analytics.budgetUtilization > 0.01 ? analytics.budgetUtilization / 15 : 1))} 天`}
          />
        </div>

        {/* CampaignPerformancePanel - 核心组件 */}
        <CampaignPerformancePanel
          campaignName={analytics.campaignName}
          status={analytics.status}
          metrics={analytics.metrics}
          trendData={selectedDays === 7 ? analytics.trendData.slice(-7) : analytics.trendData}
          insights={analytics.insights}
        />

        {/* 时间范围切换 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '16px 0' }}>
          <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDays(d)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: selectedDays === d ? 600 : 400,
                  background: selectedDays === d ? '#fff' : 'transparent',
                  color: selectedDays === d ? '#1f2937' : '#6b7280',
                  boxShadow: selectedDays === d ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {d} 日
              </button>
            ))}
          </div>
        </div>

        {/* Tab 切换 */}
        <div style={{ display: 'flex', gap: 2, borderBottom: '2px solid #e5e7eb', marginBottom: 20 }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '10px 20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: activeTab === t.key ? 600 : 400,
                color: activeTab === t.key ? '#1f2937' : '#6b7280',
                background: 'transparent',
                borderBottom: activeTab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
                marginBottom: -2,
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 渠道对比 Tab */}
        {activeTab === 'channels' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>渠道效果对比</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={thStyle}>渠道</th>
                    <th style={thStyle}>曝光</th>
                    <th style={thStyle}>点击</th>
                    <th style={thStyle}>点击率</th>
                    <th style={thStyle}>转化</th>
                    <th style={thStyle}>转化率</th>
                    <th style={thStyle}>营收</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.channelData.map((ch) => (
                    <tr key={ch.channel} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: CHANNEL_COLORS[ch.channel] || '#6b7280', marginRight: 8 }} />
                        {ch.channel}
                      </td>
                      <td style={tdStyle}>{ch.impressions.toLocaleString()}</td>
                      <td style={tdStyle}>{ch.clicks.toLocaleString()}</td>
                      <td style={tdStyle}>{calculateCtr(ch)}</td>
                      <td style={tdStyle}>{ch.conversions.toLocaleString()}</td>
                      <td style={tdStyle}>{calculateCvr(ch)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>¥{ch.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 转化漏斗 Tab */}
        {activeTab === 'funnel' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 600 }}>转化漏斗</h3>
            {analytics.funnel.map((step, i) => {
              const first = analytics.funnel[0];
              const maxCount = first ? first.count : 0;
              const widthPct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
              return (
                <div key={step.name} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{step.name}</span>
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      {step.count.toLocaleString()} (留存率 {step.rate}%)
                    </span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: 8, height: 28, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${widthPct}%`,
                        height: '100%',
                        background: i === 0 ? '#3b82f6' : i === analytics.funnel.length - 1 ? '#10b981' : '#8b5cf6',
                        borderRadius: 8,
                        transition: 'width 0.5s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingRight: 8,
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {widthPct > 10 ? `${step.rate}%` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AI 洞察 Tab */}
        {activeTab === 'insights' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 600 }}>AI 智能建议</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {analytics.insights.map((insight, i) => {
                const iconMap: Record<string, string> = { positive: '✅', negative: '⚠️', info: 'ℹ️', warning: '🔔' };
                const borderMap: Record<string, string> = { positive: '#d1fae5', negative: '#fee2e2', info: '#dbeafe', warning: '#fef3c7' };
                return (
                  <div key={i} style={{ padding: 16, borderRadius: 8, border: `1px solid ${borderMap[insight.type] || '#e5e7eb'}`, background: '#fafafa' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>{iconMap[insight.type] || '📌'}</span>
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{insight.message}</div>
                        {insight.recommendation && (
                          <div style={{ color: '#3b82f6', fontSize: '0.85rem' }}>💡 {insight.recommendation}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, padding: 16, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#0369a1' }}>🤖 AI 分析综述</h4>
              <p style={{ margin: 0, color: '#1e3a5f', fontSize: '0.9rem', lineHeight: 1.6 }}>
                当前活动表现良好，整体指标呈上升趋势。微信和小红书渠道转化率显著高于均值，建议加大投入。
                短信渠道 CTR 偏低，建议优化推送时间和文案。预算使用率达 {(analytics.budgetUtilization * 100).toFixed(0)}%，
                建议合理安排剩余投放节奏。按照当前消耗速度，预计可维持 {Math.round((1 - analytics.budgetUtilization) / (analytics.budgetUtilization > 0.01 ? analytics.budgetUtilization / 15 : 1))} 天。
              </p>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#6b7280',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '0.9rem',
  whiteSpace: 'nowrap',
};
