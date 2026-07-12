/**
 * 门店对比页 — Store Comparison Page (Next.js App Router Page)
 *
 * 功能:
 * - 多门店 KPI 横向对比：营收、订单数、客单价、满意度、设备利用率
 * - 支持 searchParams 传递预选门店 ID 和标杆门店 ID
 * - 区域筛选、状态筛选、多指标排序
 * - 柱状图 / 对比表格
 * - 统计概览：参与对比门店数 / 最高营收 / 最高满意度 / 最高设备利用率
 * - 空状态 / 加载中 / 无对比数据 / 错误回退
 * - JSON-LD + Metadata SEO
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import { CompareStoresClient } from './compare-stores-client';

export const metadata: Metadata = {
  title: '门店对比 — 多门店KPI横向分析',
  description:
    '多维度门店 KPI 横向对比，支持区域筛选、状态筛选、多指标排序，选定标杆门店查看差异。',
  openGraph: {
    title: '门店对比 | KPI 横向分析',
    description: '多门店营收、订单、满意度、设备利用率一键对比',
    type: 'website',
  },
};

interface PageProps {
  searchParams?: Promise<{
    ids?: string;
    baseline?: string;
    region?: string;
    status?: string;
  }>;
}

/** 对比指标配置 */
const COMPARE_METRICS = [
  { key: 'revenue', label: '营收', unit: '¥', color: '#34d399' },
  { key: 'orders', label: '订单数', unit: '', color: '#60a5fa' },
  { key: 'avgOrderValue', label: '客单价', unit: '¥', color: '#fbbf24' },
  { key: 'satisfaction', label: '满意度', unit: '%', color: '#a78bfa' },
  { key: 'deviceUtilization', label: '设备利用率', unit: '%', color: '#fb923c' },
];

/** 模拟对比统计数据 */
const MOCK_COMPARE_STATS = {
  totalStores: 8,
  totalBaseline: '标杆门店',
  highestRevenue: '¥285,600.00',
  highestRevenueStore: '旗舰店',
  highestSatisfaction: '96.5%',
  highestSatisfactionStore: '朝阳分店',
  highestUtilization: '92.3%',
  highestUtilizationStore: '旗舰店',
};

/** 加载占位 */
function CompareStoresLoadingFallback() {
  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      {/* 筛选区 */}
      <LoadingSkeleton variant="card" rows={2} label="加载筛选区..." />
      <div style={{ height: 24 }} />

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={2} label={`加载统计 ${i}`} />
        ))}
      </div>

      {/* 对比表格 */}
      <LoadingSkeleton variant="card" rows={8} label="加载对比数据..." />

      {/* 图表区 */}
      <div style={{ height: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <LoadingSkeleton variant="card" rows={6} label="加载营收图表" />
        <LoadingSkeleton variant="card" rows={6} label="加载满意度图表" />
      </div>
    </div>
  );
}

/** 错误回退 */
function CompareStoresErrorFallback() {
  return (
    <EmptyState
      title="对比数据加载失败"
      description="无法加载门店对比数据。请检查数据源是否正常，稍后重试。"
      actionLabel="重试"
      actionHref="/stores/compare"
    />
  );
}

/** 空状态 — 无门店参与对比 */
function CompareStoresEmptyState() {
  return (
    <EmptyState
      title="暂无对比门店"
      description="请选择至少两家门店进行对比分析。您可以在筛选器中搜索并添加门店。"
      actionLabel="选择门店"
      actionHref="/stores"
    />
  );
}

export default async function CompareStoresPage({ searchParams }: PageProps) {
  // 从 searchParams 中提取预选门店 ID 和标杆门店 ID
  let preselectedIds: string[] = [];
  let baselineId: string | undefined;
  let region: string | undefined;
  let statusFilter: string | undefined;

  if (searchParams) {
    const sp = await searchParams;
    if (sp.ids) preselectedIds = sp.ids.split(',').filter(Boolean);
    if (sp.baseline) baselineId = sp.baseline;
    if (sp.region) region = sp.region;
    if (sp.status) statusFilter = sp.status;
  }

  const hasPreselected = preselectedIds.length > 0;

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '门店对比工具',
            applicationCategory: 'BusinessApplication',
            description:
              '多维度门店 KPI 横向对比工具，支持区域筛选、状态筛选、多指标排序，选定标杆门店查看差异。',
            browserRequirements: '需要现代浏览器',
          }),
        }}
      />

      {/* 页面顶部信息 */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '24px 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700, margin: 0 }}>
              门店对比
            </h1>
            <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
              多门店 KPI 横向对比 · 支持区域筛选、多指标排序
            </p>
          </div>

          {region || statusFilter ? (
            <div style={{ display: 'flex', gap: 6 }}>
              {region && (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(96,165,250,0.1)',
                    border: '1px solid rgba(96,165,250,0.2)',
                    color: '#60a5fa',
                    fontSize: 12,
                  }}
                >
                  区域: {region}
                </span>
              )}
              {statusFilter && (
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.2)',
                    color: '#34d399',
                    fontSize: 12,
                  }}
                >
                  状态: {statusFilter === 'active' ? '营业中' : statusFilter}
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* 指标定义提示 */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
          }}
        >
          {COMPARE_METRICS.map((m) => (
            <div
              key={m.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(148,163,184,0.08)',
                fontSize: 12,
                color: '#94a3b8',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: m.color,
                }}
              />
              {m.label}
              {m.unit && <span style={{ color: '#64748b' }}>({m.unit})</span>}
            </div>
          ))}
        </div>

        {/* 对比概览统计 */}
        {hasPreselected && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
              marginBottom: 24,
            }}
          >
            {[
              { label: '对比门店', value: `${preselectedIds.length} 家`, color: '#e2e8f0' },
              {
                label: '最高营收',
                value: MOCK_COMPARE_STATS.highestRevenue,
                color: '#34d399',
                sub: MOCK_COMPARE_STATS.highestRevenueStore,
              },
              {
                label: '最高满意度',
                value: MOCK_COMPARE_STATS.highestSatisfaction,
                color: '#a78bfa',
                sub: MOCK_COMPARE_STATS.highestSatisfactionStore,
              },
              {
                label: '最高设备利用率',
                value: MOCK_COMPARE_STATS.highestUtilization,
                color: '#fb923c',
                sub: MOCK_COMPARE_STATS.highestUtilizationStore,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(148,163,184,0.08)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: stat.color, marginBottom: 2 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{stat.label}</div>
                {'sub' in stat && stat.sub ? (
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{stat.sub}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 主对比内容 */}
      <ErrorBoundary fallback={() => <CompareStoresErrorFallback />}>
        <Suspense fallback={<CompareStoresLoadingFallback />}>
          {hasPreselected ? (
            <CompareStoresClient preselectedIds={preselectedIds} baselineId={baselineId} />
          ) : (
            <CompareStoresEmptyState />
          )}
        </Suspense>
      </ErrorBoundary>

      {/* 使用说明 */}
      <div
        style={{
          marginTop: 24,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(148,163,184,0.08)',
          fontSize: 12,
          color: '#94a3b8',
          lineHeight: 1.6,
          maxWidth: 1200,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <strong style={{ color: '#e2e8f0' }}>使用说明</strong>
        <br />
        可通过 URL 参数快速预选对比门店：<code style={{ color: '#f59e0b' }}>?ids=store1,store2,store3</code>
        <br />
        指定标杆门店：<code style={{ color: '#f59e0b' }}>&amp;baseline=store1</code>，系统会自动计算各门店与标杆的差异值。
        <br />
        支持区域筛选：<code style={{ color: '#f59e0b' }}>&amp;region=beijing</code>，状态筛选：<code style={{ color: '#f59e0b' }}>&amp;status=active</code>。
        <br />
        点击指标名称可切换排序顺序，选定门店的差异百分比以彩色标签显示。
      </div>
    </>
  );
}
