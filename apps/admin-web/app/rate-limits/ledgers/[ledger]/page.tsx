'use client';

/**
 * 配额账本详情 — Rate Limits Ledger Detail Page
 * 功能: 查看主题、策略、已用额度与重置时间
 *
 * 页面结构:
 * - params 解析路由参数, 读取账本 ID
 * - 数据层加载账本快照
 * - 404: 账本不存在时显示 guide
 * - 详情面板: 主题 Key / 策略编码 / 已用额度 / 限额 / 重置时间 / 状态
 * - 返回链接至 Rate Limits 列表
 */

import React from 'react';
import {
  Badge, BreadcrumbPageHeader, DetailClosureBar, PageShell, Progress, Result, StatusBadge,
} from '@m5/ui';
import { readRateLimitsLedgerDetailParam } from '@m5/types';

interface LedgerSnapshot {
  ledgerId: string;
  notFound: boolean;
  record?: {
    subjectKey: string;
    policyCode: string;
    usedQuota: number;
    limit: number;
    windowSize: string;
    resetAt: string;
    status: 'active' | 'exhausted' | 'pending';
    updatedAt: string;
    remaining: number;
  } | null;
}

interface PageProps { params: Promise<{ ledger?: string | string[] }>; }

function readParam(value: string | string[] | undefined): string | null {
  if (value === undefined || value === null) return null;
  return Array.isArray(value) ? (value.length > 0 ? value[0] : null) : value;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-slate-700 last:border-b-0">
      <span className="w-28 shrink-0 text-sm text-slate-400">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'error' | 'pending' }> = {
  active: { label: '正常', variant: 'success' },
  exhausted: { label: '已耗尽', variant: 'error' },
  pending: { label: '等待重置', variant: 'pending' },
};

const KNOWN_LEDGERS: Record<string, { subjectKey: string; policyCode: string; usedQuota: number; limit: number; windowSize: string; resetAt: string; status: 'active' | 'exhausted' | 'pending'; updatedAt: string; remaining: number }> = {
  'ledger-demo-001': { subjectKey: 'tenant-demo:api:read', policyCode: 'READ_QPS_100', usedQuota: 45678, limit: 100000, windowSize: '1h', resetAt: '2026-07-15 11:00', status: 'active', updatedAt: '2026-07-15 10:30', remaining: 54322 },
  'ledger-demo-002': { subjectKey: 'tenant-demo:api:write', policyCode: 'WRITE_QPS_50', usedQuota: 50000, limit: 50000, windowSize: '1h', resetAt: '2026-07-15 11:00', status: 'exhausted', updatedAt: '2026-07-15 10:15', remaining: 0 },
  'ledger-demo-003': { subjectKey: 'tenant-demo:campaign:trigger', policyCode: 'CAMPAIGN_TRIGGER_1000', usedQuota: 800, limit: 1000, windowSize: '24h', resetAt: '2026-07-16 00:00', status: 'active', updatedAt: '2026-07-15 10:00', remaining: 200 },
};

function loadMockLedger(ledgerId: string): LedgerSnapshot {
  if (!ledgerId) return { ledgerId: '', notFound: true, record: null };
  const record = KNOWN_LEDGERS[ledgerId];
  if (!record) return { ledgerId, notFound: true, record: null };
  return { ledgerId, notFound: false, record };
}

export default async function RateLimitsLedgerDetailPage({ params }: PageProps) {
  const resolved = await params;
  const ledgerId = readParam(resolved.ledger);
  const snapshot = loadMockLedger(ledgerId ?? '');

  if (snapshot.notFound || !snapshot.record) {
    return (
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
        <PageShell title="配额账本不存在" subtitle="该账本不在当前 rate-limits 范围内。">
          <Result status="404" title="账本未找到" subTitle={`账本 "${ledgerId}" 不存在`}
            extra={<a href="/rate-limits/ledgers" className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg no-underline">返回账本列表</a>} />
        </PageShell>
      </main>
    );
  }

  const { record } = snapshot;
  const statusCfg = STATUS_MAP[record.status] ?? { label: record.status, variant: 'default' as const };
  const usagePercent = record.limit > 0 ? Math.round((record.usedQuota / record.limit) * 100) : 0;

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell title={`配额账本：${record.subjectKey}`} subtitle="查看主题、策略、已用额度与重置时间。">
        <BreadcrumbPageHeader breadcrumbs={[{ label: '配额账本', href: '/rate-limits/ledgers' }, { label: record.subjectKey }]} title={record.subjectKey} />
        <div className="bg-white/5 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex gap-2 items-center mb-5">
            <h3 className="text-base font-semibold text-white">基本信息</h3>
            <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
          </div>
          <DetailRow label="主题 Key"><span className="font-mono text-sm text-blue-400">{record.subjectKey}</span></DetailRow>
          <DetailRow label="策略编码"><span className="font-mono text-sm">{record.policyCode}</span></DetailRow>
          <DetailRow label="状态"><StatusBadge label={statusCfg.label} variant={statusCfg.variant} /></DetailRow>
          <DetailRow label="已用额度"><span className="font-mono text-sm">{record.usedQuota.toLocaleString()}</span></DetailRow>
          <DetailRow label="总限额"><span className="font-mono text-sm">{record.limit.toLocaleString()}</span></DetailRow>
          <DetailRow label="剩余额度">
            <span className={`font-mono text-sm ${record.remaining === 0 ? 'text-red-400' : 'text-green-400'}`}>
              {record.remaining.toLocaleString()}
            </span>
          </DetailRow>
        </div>
        <div className="bg-white/5 border border-slate-700 rounded-xl p-6 mb-6">
          <h3 className="text-base font-semibold text-white mb-3">额度使用情况</h3>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-slate-300 w-16">{record.usedQuota.toLocaleString()}</span>
            <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                style={{ width: `${usagePercent}%` }} />
            </div>
            <span className="text-sm text-slate-300 w-16 text-right">{record.limit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>使用率: {usagePercent}%</span>
            <span>窗口: {record.windowSize}</span>
            <span>重置: {record.resetAt}</span>
          </div>
        </div>
        <DetailRow label="窗口大小"><span className="text-sm">{record.windowSize}</span></DetailRow>
        <DetailRow label="重置时间"><span className="text-sm font-mono text-slate-400">{record.resetAt}</span></DetailRow>
        <DetailRow label="更新时间"><span className="text-sm font-mono text-slate-400">{record.updatedAt}</span></DetailRow>
        <div className="mt-6"><DetailClosureBar links={[{ key: 'list', title: '配额账本列表', subtitle: '返回 Rate Limits 配额管理', href: '/rate-limits/ledgers' }]} /></div>
      </PageShell>
    </main>
  );
}

// ---- 辅助函数 ----

function getUsageColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 70) return 'bg-amber-500';
  if (percent >= 40) return 'bg-blue-500';
  return 'bg-emerald-500';
}

function getTextColor(percent: number): string {
  if (percent >= 90) return 'text-red-400';
  if (percent >= 70) return 'text-amber-400';
  return 'text-blue-400';
}

function LedgerNotFound({ ledgerId }: { ledgerId: string | null }) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-8 text-center">
      <div className="text-5xl mb-4">📊</div>
      <h3 className="text-lg font-semibold text-white mb-2">配额账本未找到</h3>
      <p className="text-sm text-slate-400 mb-4">
        账本 &quot;{ledgerId ?? '—'}&quot; 不在当前 rate-limits 范围内。
      </p>
      <a href="/rate-limits/ledgers" className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg no-underline text-sm">
        返回账本列表
      </a>
    </div>
  );
}

function UsageBar({ used, limit, percent }: { used: number; limit: number; percent: number }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">使用量</span>
        <span className={`text-xs font-mono ${getTextColor(percent)}`}>{percent}%</span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full transition-all ${getUsageColor(percent)}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="flex justify-between text-xs font-mono text-slate-400">
        <span>{used.toLocaleString()} 次</span>
        <span>{limit.toLocaleString()} 次</span>
      </div>
    </div>
  );
}

function formatWindowSize(size: string): string {
  const labels: Record<string, string> = { '1h': '1 小时', '24h': '24 小时', '1s': '1 秒', '1m': '1 分钟' };
  return labels[size] ?? size;
}

interface DetailItem { label: string; value: string; color?: string; }

// ---- 深度辅助组件 ----

function QuotaGauge({ used, limit, percent }: { used: number; limit: number; percent: number }) {
  const color = percent >= 90 ? 'stroke-red-500' : percent >= 70 ? 'stroke-amber-500' : 'stroke-blue-500';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - percent / 100);
  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="8" />
        <circle cx="50" cy="50" r="40" fill="none" className={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className={`text-lg font-bold font-mono mt-2 ${percent >= 90 ? 'text-red-400' : percent >= 70 ? 'text-amber-400' : 'text-blue-400'}`}>
        {percent}%
      </span>
      <span className="text-[10px] text-slate-500">使用率</span>
    </div>
  );
}

function LedgerMetaGrid({ record }: { record: NonNullable<LedgerSnapshot['record']> }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-slate-800 rounded-lg p-3">
        <div className="text-[10px] text-slate-500 mb-1">已用</div>
        <div className="font-mono text-lg">{record.usedQuota.toLocaleString()}</div>
      </div>
      <div className="bg-slate-800 rounded-lg p-3">
        <div className="text-[10px] text-slate-500 mb-1">限额</div>
        <div className="font-mono text-lg">{record.limit.toLocaleString()}</div>
      </div>
      <div className="bg-slate-800 rounded-lg p-3">
        <div className="text-[10px] text-slate-500 mb-1">剩余</div>
        <div className={`font-mono text-lg ${record.remaining === 0 ? 'text-red-400' : 'text-emerald-400'}`}>{record.remaining.toLocaleString()}</div>
      </div>
      <div className="bg-slate-800 rounded-lg p-3">
        <div className="text-[10px] text-slate-500 mb-1">窗口</div>
        <div className="font-mono text-lg text-blue-400">{record.windowSize}</div>
      </div>
    </div>
  );
}

const QUOTA_STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'error'> = {
  active: 'success', exhausted: 'error', pending: 'warning',
};

// ---- 新增: 速率消耗趋势 ----

interface ConsumptionDataPoint {
  timestamp: string;
  consumed: number;
  limit: number;
}

function buildMockConsumptionTrend(ledgerId: string): ConsumptionDataPoint[] {
  if (ledgerId === 'ledger-demo-001') {
    return [
      { timestamp: '10:00', consumed: 3000, limit: 10000 },
      { timestamp: '10:05', consumed: 4200, limit: 10000 },
      { timestamp: '10:10', consumed: 5100, limit: 10000 },
      { timestamp: '10:15', consumed: 6800, limit: 10000 },
      { timestamp: '10:20', consumed: 7200, limit: 10000 },
      { timestamp: '10:25', consumed: 8100, limit: 10000 },
      { timestamp: '10:30', consumed: 9500, limit: 10000 },
    ];
  }
  if (ledgerId === 'ledger-demo-002') {
    return [
      { timestamp: '10:00', consumed: 5000, limit: 5000 },
      { timestamp: '10:05', consumed: 5000, limit: 5000 },
      { timestamp: '10:10', consumed: 5000, limit: 5000 },
      { timestamp: '10:15', consumed: 5000, limit: 5000 },
    ];
  }
  return [
    { timestamp: '10:00', consumed: 50, limit: 1000 },
    { timestamp: '10:05', consumed: 120, limit: 1000 },
    { timestamp: '10:10', consumed: 200, limit: 1000 },
  ];
}

function ConsumptionTrendChart({ dataPoints }: { dataPoints: ConsumptionDataPoint[] }) {
  if (dataPoints.length === 0) {
    return <span className="text-xs text-slate-500">暂无趋势数据</span>;
  }
  const maxValue = Math.max(...dataPoints.map((d) => d.consumed), ...dataPoints.map((d) => d.limit));
  const barHeight = 120;
  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1 h-[120px]" style={{ height: barHeight }}>
        {dataPoints.map((dp, i) => {
          const h = maxValue > 0 ? (dp.consumed / maxValue) * barHeight : 0;
          const pct = dp.limit > 0 ? Math.round((dp.consumed / dp.limit) * 100) : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div className="w-full max-w-[24px] rounded-t-sm transition-all"
                style={{
                  height: `${h}px`,
                  backgroundColor: pct > 90 ? 'rgba(239,68,68,0.6)' : pct > 70 ? 'rgba(251,191,36,0.6)' : 'rgba(59,130,246,0.5)',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1">
        {dataPoints.map((dp, i) => (
          <div key={i} className="flex-1 text-[9px] text-slate-500 text-center font-mono truncate">
            {dp.timestamp}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- 新增: 限额统计卡 ----

interface QuotaSummary {
  totalQuota: number;
  usedQuota: number;
  remainingQuota: number;
  usagePercent: number;
  estimatedExhaustionTime: string;
}

function buildQuotaSummary(record: NonNullable<LedgerSnapshot['record']>): QuotaSummary {
  const usagePercent = record.limit > 0 ? Math.round((record.usedQuota / record.limit) * 100) : 0;
  const remainingQuota = record.limit - record.usedQuota;
  // 估算耗尽时间 (模拟)
  const estimatedExhaustionTime = usagePercent > 80 ? '30 分钟内' : usagePercent > 50 ? '2 小时内' : '> 4 小时';
  return {
    totalQuota: record.limit,
    usedQuota: record.usedQuota,
    remainingQuota: Math.max(0, remainingQuota),
    usagePercent,
    estimatedExhaustionTime,
  };
}

function QuotaSummaryCards({ summary }: { summary: QuotaSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
        <div className="text-[10px] text-slate-500 mb-1">总限额</div>
        <div className="font-mono text-lg text-blue-400">{summary.totalQuota.toLocaleString()}</div>
      </div>
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
        <div className="text-[10px] text-slate-500 mb-1">已使用</div>
        <div className={`font-mono text-lg ${summary.usagePercent > 90 ? 'text-red-400' : summary.usagePercent > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
          {summary.usedQuota.toLocaleString()}
        </div>
      </div>
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
        <div className="text-[10px] text-slate-500 mb-1">剩余</div>
        <div className={`font-mono text-lg ${summary.remainingQuota === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
          {summary.remainingQuota.toLocaleString()}
        </div>
      </div>
      <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
        <div className="text-[10px] text-slate-500 mb-1">预计耗尽</div>
        <div className={`font-mono text-sm ${summary.usagePercent > 80 ? 'text-red-400' : 'text-slate-300'}`}>
          {summary.estimatedExhaustionTime}
        </div>
      </div>
    </div>
  );
}

// ---- 新增: 最近的限流事件 ----

interface RateLimitEvent {
  id: string;
  subjectKey: string;
  timestamp: string;
  reason: string;
  blockedDuration: string;
  severity: 'critical' | 'warning' | 'info';
}

function buildMockRateLimitEvents(ledgerId: string): RateLimitEvent[] {
  if (ledgerId === 'ledger-demo-002') {
    return [
      { id: 'evt-001', subjectKey: 'tenant-demo:api:write', timestamp: '2026-07-15 10:15:30', reason: '写 API 配额耗尽', blockedDuration: '45min', severity: 'critical' },
      { id: 'evt-002', subjectKey: 'tenant-demo:api:write', timestamp: '2026-07-15 10:05:00', reason: '写速率超过 50 QPS 阈值', blockedDuration: '30s', severity: 'warning' },
      { id: 'evt-003', subjectKey: 'tenant-demo:api:write', timestamp: '2026-07-15 09:50:00', reason: '写速率接近限额 90%', blockedDuration: '0s', severity: 'info' },
    ];
  }
  return [
    { id: 'evt-004', subjectKey: 'tenant-demo:api:read', timestamp: '2026-07-15 10:28:00', reason: '读速率接近限额 95%', blockedDuration: '0s', severity: 'info' },
    { id: 'evt-005', subjectKey: 'tenant-demo:api:read', timestamp: '2026-07-15 10:20:00', reason: '读请求瓶颈告警', blockedDuration: '0s', severity: 'warning' },
  ];
}

function RateLimitEventList({ events }: { events: RateLimitEvent[] }) {
  if (events.length === 0) {
    return <span className="text-xs text-slate-500">近期无限流事件</span>;
  }
  return (
    <div className="space-y-2">
      {events.map((evt) => (
        <div key={evt.id} className="flex items-start gap-3 py-2 border-b border-slate-700 last:border-b-0">
          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
            evt.severity === 'critical' ? 'bg-red-500' :
            evt.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
          }`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-300">{evt.subjectKey}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                evt.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                evt.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>{evt.severity}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{evt.reason}</p>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{evt.timestamp}</div>
          </div>
          {evt.blockedDuration !== '0s' && (
            <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded whitespace-nowrap">
              阻断 {evt.blockedDuration}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- 新增: 辅助统计函数 ----

function calculateUsageRate(record: NonNullable<LedgerSnapshot['record']>): number {
  return record.limit > 0 ? Math.round((record.usedQuota / record.limit) * 100) : 0;
}

function getUsageSeverity(percent: number): 'healthy' | 'warning' | 'critical' {
  if (percent >= 90) return 'critical';
  if (percent >= 70) return 'warning';
  return 'healthy';
}

function formatQuotaNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

const USAGE_SEVERITY_COLORS: Record<string, string> = {
  healthy: 'text-emerald-400',
  warning: 'text-amber-400',
  critical: 'text-red-400',
};

export {
  QuotaGauge, LedgerMetaGrid, QUOTA_STATUS_VARIANTS,
  buildMockConsumptionTrend, ConsumptionTrendChart,
  buildQuotaSummary, QuotaSummaryCards,
  buildMockRateLimitEvents, RateLimitEventList,
  calculateUsageRate, getUsageSeverity, formatQuotaNumber,
  USAGE_SEVERITY_COLORS,
};
