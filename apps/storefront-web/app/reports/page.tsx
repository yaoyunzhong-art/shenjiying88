/**
 * 销售报表列表页 — Reports List Page (Next.js App Router Page)
 *
 * 角色视角: 👔店长 / 📊运营 / 💰财务
 *
 * 功能:
 * - 展示各种类型销售报表列表（日活/周报/月报/季报/年报/自定义）
 * - 搜索：按标题/关键词搜索
 * - 类型筛选：日活 / 周报 / 月报 / 季报 / 年报 / 自定义
 * - 状态筛选：已生成 / 生成中 / 失败 / 过期
 * - 分页浏览
 * - 统计概览：报表总数 / 已生成 / 生成中 / 失败
 * - 快速操作：查看详情、重新生成、导出
 * - 空状态 / 加载中 / 搜索无结果 / 错误回退
 * - JSON-LD 结构化数据
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Button, LoadingSkeleton, EmptyState, ErrorBoundary, Tabs } from '@m5/ui';
import { ReportsPage } from './components/ReportsPage';

export const metadata: Metadata = {
  title: '销售报表 - 神机营电竞乐园',
  description:
    '查看各类销售报表，支持日活、周报、月报、季报、年报和自定义报表。按类型、状态筛选，支持搜索和分页浏览。',
  openGraph: {
    title: '销售报表 | 神机营数据分析',
    description: '查看各类销售报表，支持日活、周报、月报、季报和自定义报表',
    type: 'website',
  },
};

/* ── Mock 数据 ── */
const MOCK_REPORTS = [
  {
    id: '1', title: '2026年6月25日销售日活报表', type: 'daily' as const,
    period: '2026-06-25', createdAt: '2026-06-26 00:15', status: 'generated' as const,
    summary: '本日销售额 ¥12,580.00，环比昨日 +8.3%，客单价 ¥286.00，成交单数 44 单。',
  },
  {
    id: '2', title: '2026年第26周销售周报', type: 'weekly' as const,
    period: '2026 W26', createdAt: '2026-06-22 00:20', status: 'generated' as const,
    summary: '本周销售额 ¥72,360.00，环比上周 +5.1%，热销品类：护肤品、彩妆。',
  },
  {
    id: '3', title: '2026年6月销售月报', type: 'monthly' as const,
    period: '2026-06', createdAt: '2026-06-26 01:00', status: 'generating' as const,
    summary: '月报正在生成中，当前已汇总 25 天数据，累计销售额 ¥318,500.00。',
  },
  {
    id: '4', title: '2026年Q2季度销售报告', type: 'quarterly' as const,
    period: '2026 Q2', createdAt: '2026-06-01 02:00', status: 'failed' as const,
    summary: '上季度数据汇总异常，部分门店数据未同步，请重新生成。',
  },
  {
    id: '5', title: '2025年销售年度总览', type: 'yearly' as const,
    period: '2025 FY', createdAt: '2026-01-01 00:00', status: 'expired' as const,
    summary: '2025年度总销售额 ¥4,286,500.00，同比增长 +12.3%。数据已过期，请重新生成。',
  },
  {
    id: '6', title: '618大促活动销售分析', type: 'custom' as const,
    period: '2026-06-18 ~ 2026-06-20', createdAt: '2026-06-21 10:30', status: 'generated' as const,
    summary: '618大促3日累计销售额 ¥85,200.00，同比去年618 +22.5%，活动转化率 8.7%。',
  },
  {
    id: '7', title: '2026年6月24日销售日活报表', type: 'daily' as const,
    period: '2026-06-24', createdAt: '2026-06-25 00:10', status: 'generated' as const,
    summary: '本日销售额 ¥11,620.00，环比昨日 +2.1%，客单价 ¥275.00，成交单数 42 单。',
  },
  {
    id: '8', title: '2026年Q1季度销售报告', type: 'quarterly' as const,
    period: '2026 Q1', createdAt: '2026-04-01 02:00', status: 'generated' as const,
    summary: 'Q1总销售额 ¥1,025,800.00 达成率108%，新增会员 2,360 人。',
  },
];

/** 报表类型定义 */
const REPORT_TYPES = [
  { key: 'all', label: '全部', count: MOCK_REPORTS.length },
  { key: 'daily', label: '日活', count: MOCK_REPORTS.filter((r) => r.type === 'daily').length },
  { key: 'weekly', label: '周报', count: MOCK_REPORTS.filter((r) => r.type === 'weekly').length },
  { key: 'monthly', label: '月报', count: MOCK_REPORTS.filter((r) => r.type === 'monthly').length },
  { key: 'quarterly', label: '季报', count: MOCK_REPORTS.filter((r) => r.type === 'quarterly').length },
  { key: 'yearly', label: '年报', count: MOCK_REPORTS.filter((r) => r.type === 'yearly').length },
];

/** 报表统计摘要 */
function ReportsSummaryCards() {
  const generated = MOCK_REPORTS.filter((r) => r.status === 'generated').length;
  const generating = MOCK_REPORTS.filter((r) => r.status === 'generating').length;
  const failed = MOCK_REPORTS.filter((r) => r.status === 'failed').length;
  const expired = MOCK_REPORTS.filter((r) => r.status === 'expired').length;

  const STATS = [
    { label: '报表总数', value: MOCK_REPORTS.length.toString(), color: '#e2e8f0' },
    { label: '已生成', value: generated.toString(), color: '#34d399' },
    { label: '生成中', value: generating.toString(), color: '#60a5fa' },
    { label: '生成失败', value: failed.toString(), color: '#f87171' },
    { label: '已过期', value: expired.toString(), color: '#94a3b8' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}
    >
      {STATS.map((s) => (
        <div
          key={s.label}
          style={{
            padding: '14px 16px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(148,163,184,0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 2 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/** 报表分类标签 */
function ReportsCategoryTabs() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        flexWrap: 'wrap',
      }}
    >
      {REPORT_TYPES.map((t) => (
        <div
          key={t.key}
          style={{
            padding: '5px 14px',
            borderRadius: 8,
            background: t.key === 'all' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${t.key === 'all' ? 'rgba(245,158,11,0.3)' : 'rgba(148,163,184,0.08)'}`,
            color: t.key === 'all' ? '#f59e0b' : '#cbd5e1',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(245,158,11,0.1)';
            e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
            e.currentTarget.style.color = '#f59e0b';
          }}
          onMouseLeave={(e) => {
            if (t.key !== 'all') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)';
              e.currentTarget.style.color = '#cbd5e1';
            }
          }}
        >
          {t.label} <span style={{ color: '#64748b', fontSize: 11 }}>({t.count})</span>
        </div>
      ))}
    </div>
  );
}

/** 加载占位 */
function ReportsListLoadingFallback() {
  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      {/* 统计 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={2} label={`加载统计 ${i}`} />
        ))}
      </div>

      {/* 分类 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={1} label="加载分类标签" />
        ))}
      </div>

      {/* 搜索 */}
      <LoadingSkeleton variant="card" rows={1} label="加载搜索栏" />
      <div style={{ height: 16 }} />

      {/* 报表列表 */}
      <LoadingSkeleton variant="card" rows={6} label="加载报表列表..." />
    </div>
  );
}

/** 错误回退 */
function ReportsListErrorFallback() {
  return (
    <EmptyState
      title="报表数据加载失败"
      description="无法获取销售报表列表。请检查数据源服务状态，稍后重试。"
      actionLabel="重试"
      actionHref="/reports"
    />
  );
}

/** 空状态 */
function ReportsEmptyState() {
  return (
    <EmptyState
      title="暂无销售报表"
      description="暂未生成任何销售报表。请点击「生成报表」开始创建第一份报表。"
      actionLabel="生成报表"
      actionHref="/reports"
    />
  );
}

export default async function ReportsListPage() {
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '销售报表',
            applicationCategory: 'BusinessApplication',
            description:
              '查看各类销售报表，支持日活、周报、月报、季报、年报和自定义报表。',
          }),
        }}
      />

      {/* 统计摘要 */}
      <ReportsSummaryCards />

      {/* 快速操作入口 */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          maxWidth: 1100,
          marginLeft: 'auto',
          marginRight: 'auto',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Button variant="primary" size="sm" onClick={() => alert('跳转至新建报表页')}>
          📄 新建报表
        </Button>
        <Button variant="ghost" size="sm" onClick={() => alert('跳转至导出中心')}>
          📥 批量导出
        </Button>
        <Button variant="ghost" size="sm" onClick={() => alert('跳转至对比分析页')}>
          📊 对比分析
        </Button>
        <span style={{ color: '#64748b', fontSize: 12, marginLeft: 'auto' }}>
          最近更新：{new Date().toLocaleDateString('zh-CN')}
        </span>
      </div>

      {/* 分类快速筛选 */}
      <ReportsCategoryTabs />

      {/* 搜索与状态筛选 */}
      <div
        style={{
          maxWidth: 1100,
          marginLeft: 'auto',
          marginRight: 'auto',
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="搜索报表标题、摘要..."
          style={{
            flex: 1,
            minWidth: 200,
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.15)',
            background: 'rgba(30,41,59,0.5)',
            color: '#e2e8f0',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <select
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.15)',
            background: 'rgba(30,41,59,0.5)',
            color: '#cbd5e1',
            fontSize: 13,
            outline: 'none',
          }}
        >
          <option value="all">全部状态</option>
          <option value="generated">已生成</option>
          <option value="generating">生成中</option>
          <option value="failed">失败</option>
          <option value="expired">过期</option>
        </select>
        <select
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.15)',
            background: 'rgba(30,41,59,0.5)',
            color: '#cbd5e1',
            fontSize: 13,
            outline: 'none',
          }}
        >
          <option value="10">每页 10 条</option>
          <option value="20">每页 20 条</option>
          <option value="50">每页 50 条</option>
        </select>
      </div>

      {/* 主列表 */}
      <ErrorBoundary fallback={() => <ReportsListErrorFallback />}>
        <Suspense fallback={<ReportsListLoadingFallback />}>
          {MOCK_REPORTS && MOCK_REPORTS.length > 0 ? (
            <ReportsPage
              items={MOCK_REPORTS}
              total={MOCK_REPORTS.length}
              page={1}
              pageSize={10}
            />
          ) : (
            <ReportsEmptyState />
          )}
        </Suspense>
      </ErrorBoundary>

      {/* 底部说明 */}
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
          maxWidth: 1100,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <strong style={{ color: '#e2e8f0' }}>数据说明</strong>
        <br />
        日活报表每日凌晨自动生成。数据可能会有 5-15 分钟的延迟。
        生成失败的报表可点击「重新生成」按钮重试。
        过期报表数据不会被自动删除，需要手动覆盖生成。
      </div>
    </>
  );
}
