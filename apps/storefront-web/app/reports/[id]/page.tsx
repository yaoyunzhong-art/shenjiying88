/**
 * 销售报表详情页 — Report Detail Page (Next.js App Router)
 *
 * 角色视角: 👔店长 / 📊运营 / 💰财务
 *
 * 功能:
 * - 查看报表详情、指标数据、图表展现
 * - 状态流转：已生成 → 查看 | 生成中 → 刷新 | 失败 → 重新生成
 * - 导出报表（PDF / CSV / Excel）
 * - 删除报表
 * - 报表导航：上一份 / 下一份
 * - 错误回退 / 加载中 / 报表未找到 / 搜索无结果
 * - JSON-LD 结构化数据
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import { ReportDetailClient } from './report-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

/* ── Mock 数据 ── */
const MOCK_REPORTS: Record<string, {
  id: string; title: string; type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  period: string; createdAt: string; status: 'generated' | 'generating' | 'failed' | 'expired';
  summary: string; metrics?: Record<string, string | number>;
}> = {
  '1': {
    id: '1', title: '2026年6月25日销售日活报表', type: 'daily',
    period: '2026-06-25', createdAt: '2026-06-26 00:15', status: 'generated',
    summary: '本日销售额 ¥12,580.00，环比昨日 +8.3%，客单价 ¥286.00，成交单数 44 单。',
    metrics: { '销售额': '¥12,580.00', '客单价': '¥286.00', '订单数': '44', '转化率': '8.3%', '环比昨日': '+8.3%', '同比上周': '+2.1%' },
  },
  '2': {
    id: '2', title: '2026年第26周销售周报', type: 'weekly',
    period: '2026 W26', createdAt: '2026-06-22 00:20', status: 'generated',
    summary: '本周销售额 ¥72,360.00，环比上周 +5.1%，热销品类：护肤品、彩妆。',
    metrics: { '销售额': '¥72,360.00', '热销品类': '护肤品、彩妆', '订单数': '253', '客单价': '¥286.00', '环比上周': '+5.1%' },
  },
  '4': {
    id: '4', title: '2026年Q2季度销售报告', type: 'quarterly',
    period: '2026 Q2', createdAt: '2026-06-01 02:00', status: 'failed',
    summary: '上季度数据汇总异常，部分门店数据未同步，请重新生成。',
    metrics: {},
  },
  '5': {
    id: '5', title: '2025年销售年度总览', type: 'yearly',
    period: '2025 FY', createdAt: '2026-01-01 00:00', status: 'expired',
    summary: '2025年度总销售额 ¥4,286,500.00，同比增长 +12.3%。数据已过期，请重新生成。',
    metrics: { '总销售额': '¥4,286,500.00', '同比增长': '+12.3%', '订单总数': '15,032', '客单价': '¥285.00' },
  },
  '6': {
    id: '6', title: '618大促活动销售分析', type: 'custom',
    period: '2026-06-18 ~ 2026-06-20', createdAt: '2026-06-21 10:30', status: 'generated',
    summary: '618大促3日累计销售额 ¥85,200.00，同比去年618 +22.5%，活动转化率 8.7%。',
    metrics: { '累计销售额': '¥85,200.00', '同比去年618': '+22.5%', '活动转化率': '8.7%', '订单数': '298', '客单价': '¥286.00' },
  },
  '8': {
    id: '8', title: '2026年Q1季度销售报告', type: 'quarterly',
    period: '2026 Q1', createdAt: '2026-04-01 02:00', status: 'generated',
    summary: 'Q1总销售额 ¥1,025,800.00 达成率108%，新增会员 2,360 人。',
    metrics: { '总销售额': '¥1,025,800.00', '达成率': '108%', '新增会员': '2,360', '同比增长': '+15.2%' },
  },
};

/** 动态生成元数据 */
async function generateReportDetailMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const report = MOCK_REPORTS[id];

  if (!report) {
    return { title: '报表未找到 - 神机营电竞乐园' };
  }

  return {
    title: `${report.title} - 神机营电竞乐园`,
    description: report.summary,
    openGraph: {
      title: report.title,
      description: report.summary,
      type: 'website',
    },
  };
}

export { generateReportDetailMetadata as generateMetadata };

/** 报表状态徽章配置 */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  generated: { label: '已生成', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  generating: { label: '生成中', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  failed: { label: '生成失败', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  expired: { label: '已过期', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

/** 报表类型标签 */
const TYPE_LABELS: Record<string, string> = {
  daily: '日活', weekly: '周报', monthly: '月报',
  quarterly: '季报', yearly: '年报', custom: '自定义',
};

/** 加载占位 */
function ReportDetailLoadingFallback() {
  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      {/* 标题区域 */}
      <LoadingSkeleton variant="card" rows={2} label="加载报表标题..." />
      <div style={{ height: 24 }} />

      {/* 指标卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={3} label={`加载指标 ${i}`} />
        ))}
      </div>

      {/* 摘要 */}
      <LoadingSkeleton variant="card" rows={3} label="加载摘要..." />

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={1} label="加载操作按钮" />
        ))}
      </div>
    </div>
  );
}

/** 错误回退 */
function ReportDetailErrorFallback() {
  return (
    <EmptyState
      title="报表详情加载异常"
      description="无法加载报表详情数据，请稍后重试或联系数据管理员。"
      actionLabel="返回报表列表"
      actionHref="/reports"
    />
  );
}

/** 导航条 — 上一份 / 下一份 */
function ReportNavigation({ currentId }: { currentId: string }) {
  const ids = Object.keys(MOCK_REPORTS).sort();
  const currentIndex = ids.indexOf(currentId);
  const prevId = currentIndex > 0 ? ids[currentIndex - 1] : null;
  const nextId = currentIndex < ids.length - 1 ? ids[currentIndex + 1] : null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        maxWidth: 900,
        margin: '0 auto 16px',
      }}
    >
      <div>
        {prevId ? (
          <a
            href={`/reports/${prevId}`}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(148,163,184,0.1)',
              color: '#94a3b8',
              fontSize: 13,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            ← 上一份
          </a>
        ) : (
          <span />
        )}
      </div>
      <div style={{ fontSize: 12, color: '#64748b' }}>
        {currentIndex + 1} / {ids.length}
      </div>
      <div>
        {nextId ? (
          <a
            href={`/reports/${nextId}`}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(148,163,184,0.1)',
              color: '#94a3b8',
              fontSize: 13,
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            下一份 →
          </a>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;

  // ID 合法性校验
  if (!id || typeof id !== 'string') {
    notFound();
  }

  const report = MOCK_REPORTS[id];
  if (!report) {
    redirect('/reports');
  }

  const statusInfo = (STATUS_CONFIG[report.status] ?? STATUS_CONFIG.generated)!;

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Report',
            name: report.title,
            description: report.summary,
            dateCreated: report.createdAt,
            about: report.type,
          }),
        }}
      />

      {/* 元数据信息条 */}
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto 16px',
          padding: '12px 20px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(148,163,184,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              padding: '2px 10px',
              borderRadius: 4,
              background: 'rgba(148,163,184,0.08)',
              color: '#94a3b8',
              fontSize: 12,
            }}
          >
            {TYPE_LABELS[report.type] ?? report.type}
          </span>
          <span style={{ color: '#64748b', fontSize: 13 }}>
            {report.period}
          </span>
          <span style={{ color: '#64748b', fontSize: 13 }}>
            创建于 {report.createdAt}
          </span>
        </div>
        <div
          style={{
            padding: '3px 12px',
            borderRadius: 6,
            background: statusInfo.bg,
            color: statusInfo.color,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {statusInfo.label}
        </div>
      </div>

      {/* 导航 */}
      <ReportNavigation currentId={id} />

      {/* 主内容 */}
      <ErrorBoundary fallback={() => <ReportDetailErrorFallback />}>
        <Suspense fallback={<ReportDetailLoadingFallback />}>
          <ReportDetailClient report={report} />
        </Suspense>
      </ErrorBoundary>

      {/* 底部操作提示 */}
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
          maxWidth: 900,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <strong style={{ color: '#e2e8f0' }}>报表操作提示</strong>
        <br />
        已生成的报表支持导出为 PDF 和 CSV 格式。
        生成中的报表请等待生成完成后查看完整数据。
        失败的报表可点击「重新生成」重试，系统将重新拉取门店数据。
        过期报表数据不会自动删除，需要手动覆盖。
      </div>
    </>
  );
}
