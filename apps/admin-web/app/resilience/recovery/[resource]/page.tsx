'use client';

/**
 * 恢复计划详情 — Resilience Recovery Plan Detail Page
 * 功能: 查看 RTO / RPO、依赖、演练时间窗与 Runbook
 *
 * 页面结构:
 * - params 解析路由参数, 读取资源名
 * - 数据层加载恢复计划快照
 * - 404: 恢复计划不存在时显示 guide
 * - 详情面板: 资源名 / RTO / RPO / 依赖 / 演练时间窗 / Runbook
 * - 返回链接至 Resilience 列表
 */

import React from 'react';
import {
  Badge, BreadcrumbPageHeader, DetailClosureBar, PageShell, Result, StatusBadge,
} from '@m5/ui';
import { readResilienceRecoveryPlanDetailParam } from '@m5/types';

interface RecoverySnapshot {
  resource: string;
  notFound: boolean;
  plan?: {
    resourceName: string;
    rto: string;
    rpo: string;
    dependencies: string[];
    drillWindow: string;
    runbook: string;
    status: 'active' | 'drill' | 'expired';
    lastDrillAt: string;
    description: string;
  } | null;
}

interface PageProps { params: Promise<{ resource?: string | string[] }>; }

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

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  active: { label: '已就绪', variant: 'success' },
  drill: { label: '演练中', variant: 'warning' },
  expired: { label: '已过期', variant: 'default' },
};

const KNOWN_PLANS: Record<string, { resourceName: string; rto: string; rpo: string; dependencies: string[]; drillWindow: string; runbook: string; status: 'active' | 'drill' | 'expired'; lastDrillAt: string; description: string }> = {
  'api-gateway': { resourceName: 'API Gateway', rto: '5min', rpo: '1min', dependencies: ['DNS', 'Load Balancer', 'Config Store'], drillWindow: '每月第一个周三 02:00-04:00', runbook: '/runbooks/api-gateway-recovery.md', status: 'active', lastDrillAt: '2026-06-05', description: 'API 网关自动故障恢复方案' },
  'user-db': { resourceName: '用户数据库', rto: '15min', rpo: '5min', dependencies: ['Primary DB', 'Replica', 'Backup Storage'], drillWindow: '每季度第一个周六 03:00-06:00', runbook: '/runbooks/db-failover.md', status: 'active', lastDrillAt: '2026-05-10', description: '主从切换与数据恢复' },
  'cache-cluster': { resourceName: '缓存集群', rto: '2min', rpo: '0min', dependencies: ['Redis Primary', 'Redis Sentinel', 'Network'], drillWindow: '每周四 04:00-04:30', runbook: '/runbooks/cache-rebuild.md', status: 'drill', lastDrillAt: '2026-07-11', description: '缓存集群重建与预热' },
  'message-queue': { resourceName: '消息队列', rto: '10min', rpo: '2min', dependencies: ['Kafka Brokers', 'ZooKeeper', 'Schema Registry'], drillWindow: '每季度第二个周三 02:00-04:00', runbook: '/runbooks/mq-recovery.md', status: 'expired', lastDrillAt: '2026-03-20', description: '消息队列故障切换' },
};

function loadMockPlan(resource: string): RecoverySnapshot {
  if (!resource) return { resource: '', notFound: true, plan: null };
  const p = KNOWN_PLANS[resource];
  if (!p) return { resource, notFound: true, plan: null };
  return { resource, notFound: false, plan: p };
}

export default async function ResilienceRecoveryPlanDetailPage({ params }: PageProps) {
  const resolved = await params;
  const resource = readParam(resolved.resource);
  const snapshot = loadMockPlan(resource ?? '');

  if (snapshot.notFound || !snapshot.plan) {
    return (
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
        <PageShell title="恢复计划不存在" subtitle="该资源不在当前 resilience 范围内，可能未登记恢复计划。">
          <Result status="404" title="恢复计划未找到" subTitle={`资源 "${resource}" 未登记恢复计划`}
            extra={<a href="/resilience/recovery" className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg no-underline">返回恢复计划列表</a>} />
        </PageShell>
      </main>
    );
  }

  const { plan } = snapshot;
  const statusCfg = STATUS_MAP[plan.status] ?? { label: plan.status, variant: 'default' as const };

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell title={`恢复计划：${plan.resourceName}`} subtitle="查看 RTO / RPO、依赖、演练时间窗与 Runbook。">
        <BreadcrumbPageHeader breadcrumbs={[{ label: '恢复计划', href: '/resilience/recovery' }, { label: plan.resourceName }]} title={plan.resourceName} />
        <div className="bg-white/5 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex gap-2 items-center mb-5">
            <h3 className="text-base font-semibold text-white">基本信息</h3>
            <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
          </div>
          <DetailRow label="资源名"><span className="font-mono text-sm text-blue-400">{plan.resourceName}</span></DetailRow>
          <DetailRow label="状态"><StatusBadge label={statusCfg.label} variant={statusCfg.variant} /></DetailRow>
          <DetailRow label="描述"><span className="text-sm text-slate-300">{plan.description}</span></DetailRow>
          <DetailRow label="RTO"><span className="font-mono text-sm text-emerald-400">{plan.rto}</span></DetailRow>
          <DetailRow label="RPO"><span className="font-mono text-sm text-amber-400">{plan.rpo}</span></DetailRow>
          <DetailRow label="演练时间窗"><span className="text-sm text-slate-400">{plan.drillWindow}</span></DetailRow>
          <DetailRow label="上次演练"><span className="text-sm font-mono text-slate-400">{plan.lastDrillAt}</span></DetailRow>
        </div>
        <div className="bg-white/5 border border-slate-700 rounded-xl p-6 mb-6">
          <h3 className="text-base font-semibold text-white mb-3">依赖关系</h3>
          <div className="flex flex-wrap gap-2">{plan.dependencies.map((dep) => (<Badge key={dep} variant="info">{dep}</Badge>))}</div>
        </div>
        <div className="bg-white/5 border border-slate-700 rounded-xl p-6 mb-6">
          <h3 className="text-base font-semibold text-white mb-3">RTO / RPO 指标</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 rounded-lg p-4"><div className="text-[11px] text-slate-400 mb-1">RTO (恢复时间目标)</div><div className="text-2xl font-bold font-mono text-emerald-400">{plan.rto}</div></div>
            <div className="bg-slate-800 rounded-lg p-4"><div className="text-[11px] text-slate-400 mb-1">RPO (恢复点目标)</div><div className="text-2xl font-bold font-mono text-amber-400">{plan.rpo}</div></div>
          </div>
        </div>
        <DetailRow label="Runbook"><span className="font-mono text-sm text-blue-400">{plan.runbook}</span></DetailRow>
        <div className="mt-6"><DetailClosureBar links={[{ key: 'list', title: '恢复计划列表', subtitle: '返回 Resilience 恢复管理', href: '/resilience/recovery' }]} /></div>
      </PageShell>
    </main>
  );
}

// ---- 辅助函数 ----

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'text-emerald-400',
    drill: 'text-amber-400',
    expired: 'text-red-400',
  };
  return colors[status] ?? 'text-slate-400';
}

function getStatusBg(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/10 border-emerald-500/30',
    drill: 'bg-amber-500/10 border-amber-500/30',
    expired: 'bg-red-500/10 border-red-500/30',
  };
  return colors[status] ?? 'bg-slate-800/30 border-slate-700';
}

function RecoveryNotFound({ resource }: { resource: string | null }) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-8 text-center">
      <div className="text-5xl mb-4">🛡️</div>
      <h3 className="text-lg font-semibold text-white mb-2">恢复计划未找到</h3>
      <p className="text-sm text-slate-400 mb-4">
        资源 &quot;{resource ?? '—'}&quot; 未登记恢复计划。
      </p>
      <a href="/resilience/recovery" className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg no-underline text-sm">
        返回恢复计划列表
      </a>
    </div>
  );
}

function RPOMetric({ rto, rpo }: { rto: string; rpo: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
        <div className="text-[11px] text-slate-400 mb-1">RTO</div>
        <div className="text-2xl font-bold font-mono text-emerald-400">{rto}</div>
        <div className="text-[10px] text-slate-500 mt-1">恢复时间目标</div>
      </div>
      <div className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
        <div className="text-[11px] text-slate-400 mb-1">RPO</div>
        <div className="text-2xl font-bold font-mono text-amber-400">{rpo}</div>
        <div className="text-[10px] text-slate-500 mt-1">恢复点目标</div>
      </div>
    </div>
  );
}

function DrillSchedule({ window: drillWindow, last }: { window: string; last: string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
      <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase">演练计划</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-400">时间窗</span><span className="text-slate-300">{drillWindow}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">上次演练</span><span className="text-slate-300 font-mono">{last}</span></div>
      </div>
    </div>
  );
}

function DependencyBadgeList({ deps }: { deps: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {deps.map((dep) => (
        <span key={dep} className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-400 font-mono">{dep}</span>
      ))}
    </div>
  );
}

// ---- 页面辅助 ----

function RTOProgressBar({ rto, rpo }: { rto: string; rpo: string }) {
  const rtoSeconds = parseTimeToSeconds(rto);
  const rpoSeconds = parseTimeToSeconds(rpo);
  const ratio = rpoSeconds > 0 ? Math.min(rtoSeconds / rpoSeconds, 5) : 5;
  const width = Math.min((ratio / 5) * 100, 100);
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="text-xs text-slate-400 mb-2">RTO / RPO 比率</div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500" style={{ width: `${width}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>RPO: {rpo}</span>
        <span>RTO: {rto}</span>
      </div>
    </div>
  );
}

function parseTimeToSeconds(time: string): number {
  const match = time.match(/^(\d+)(min|s|h)$/);
  if (!match) return 60;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 'min') return value * 60;
  if (unit === 'h') return value * 3600;
  return value;
}

function RecoveryMetricCard({ label, value, sublabel, color }: {
  label: string; value: string; sublabel: string; color: string;
}) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
      <div className="text-[10px] text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-1">{sublabel}</div>
    </div>
  );
}

const RECOVERY_STATUS_LABELS: Record<string, string> = {
  active: '已就绪', drill: '演练中', expired: '已过期',
};

const RECOVERY_STATUS_VARIANTS: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-500/10',
  drill: 'text-amber-400 bg-amber-500/10',
  expired: 'text-red-400 bg-red-500/10',
};

// ---- 新增: 恢复状态卡 ----

function RecoveryStatusCard({ status, label, description, color }: {
  status: string; label: string; description: string; color: string;
}) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-sm font-semibold text-white">{label}</span>
      </div>
      <p className="text-xs text-slate-400">{description}</p>
      <span className="text-[10px] text-slate-500 mt-1 block font-mono">{status}</span>
    </div>
  );
}

// ---- 新增: 重试按钮 ----

interface RetryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

function RetryButton({ onClick, disabled, loading, label }: RetryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
        loading ? 'bg-blue-600/50 text-blue-300 cursor-wait' :
        disabled ? 'bg-slate-700 text-slate-500 cursor-not-allowed' :
        'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'
      }`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {loading ? '恢复中...' : label ?? '执行恢复'}
    </button>
  );
}

async function executeRecovery(resource: string): Promise<{ success: boolean; message: string; duration: number }> {
  await new Promise((r) => setTimeout(r, 500));
  return {
    success: true,
    message: `资源 ${resource} 恢复成功`,
    duration: 2.3,
  };
}

// ---- 新增: 资源健康指标 ----

interface HealthMetric {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  value: string;
  threshold: string;
}

function buildMockHealthMetrics(resource: string): HealthMetric[] {
  const metrics: Record<string, HealthMetric[]> = {
    'api-gateway': [
      { name: '延迟 P99', status: 'healthy', value: '320ms', threshold: '<500ms' },
      { name: '请求成功率', status: 'healthy', value: '99.8%', threshold: '>99%' },
      { name: '并发连接数', status: 'healthy', value: '1,234', threshold: '<5,000' },
      { name: '错误率', status: 'healthy', value: '0.2%', threshold: '<1%' },
    ],
    'user-db': [
      { name: '查询延迟 P99', status: 'degraded', value: '850ms', threshold: '<500ms' },
      { name: '连接池使用率', status: 'healthy', value: '45%', threshold: '<80%' },
      { name: '复制延迟', status: 'healthy', value: '120ms', threshold: '<1s' },
      { name: '磁盘 IO', status: 'degraded', value: '75%', threshold: '<70%' },
    ],
    'cache-cluster': [
      { name: '缓存命中率', status: 'healthy', value: '95%', threshold: '>90%' },
      { name: '内存使用率', status: 'degraded', value: '85%', threshold: '<80%' },
      { name: '响应延迟', status: 'healthy', value: '2ms', threshold: '<10ms' },
    ],
    'message-queue': [
      { name: '队列深度', status: 'down', value: '50,000', threshold: '<10,000' },
      { name: '消费延迟', status: 'down', value: '15min', threshold: '<5min' },
      { name: 'Broker 可用性', status: 'down', value: '0/3', threshold: '3/3' },
    ],
  };
  return metrics[resource] ?? [
    { name: '可用性', status: 'healthy', value: '99.9%', threshold: '>99%' },
    { name: '延迟', status: 'healthy', value: '50ms', threshold: '<100ms' },
  ];
}

function HealthMetricsPanel({ metrics }: { metrics: HealthMetric[] }) {
  if (metrics.length === 0) {
    return <span className="text-xs text-slate-500">暂无健康指标</span>;
  }
  return (
    <div className="space-y-2">
      {metrics.map((m, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-700 last:border-b-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            m.status === 'healthy' ? 'bg-emerald-500' :
            m.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-slate-300 w-28 shrink-0">{m.name}</span>
          <span className={`text-xs font-mono flex-1 ${
            m.status === 'healthy' ? 'text-emerald-400' :
            m.status === 'degraded' ? 'text-amber-400' : 'text-red-400'
          }`}>{m.value}</span>
          <span className="text-[10px] text-slate-500 font-mono">阈值: {m.threshold}</span>
        </div>
      ))}
    </div>
  );
}

// ---- 新增: 健康评分 ----

function computeHealthScore(metrics: HealthMetric[]): number {
  if (metrics.length === 0) return 0;
  const scores = metrics.map((m) => {
    if (m.status === 'healthy') return 100;
    if (m.status === 'degraded') return 50;
    return 0;
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / metrics.length);
}

function getHealthScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function getOverallHealthStatus(metrics: HealthMetric[]): 'healthy' | 'degraded' | 'down' {
  if (metrics.some((m) => m.status === 'down')) return 'down';
  if (metrics.some((m) => m.status === 'degraded')) return 'degraded';
  return 'healthy';
}

// ---- 新增: 演练状态辅助 ----

function isDrillOverdue(lastDrillAt: string, daysThreshold: number = 90): boolean {
  const last = new Date(lastDrillAt).getTime();
  const now = Date.now();
  const diffDays = (now - last) / (1000 * 60 * 60 * 24);
  return diffDays > daysThreshold;
}

function formatDrillStatus(lastDrillAt: string): { label: string; variant: 'success' | 'warning' | 'error' } {
  const overdue = isDrillOverdue(lastDrillAt);
  if (overdue) return { label: '演练已过期', variant: 'error' };
  return { label: '演练正常', variant: 'success' };
}

export {
  RTOProgressBar, RecoveryMetricCard, parseTimeToSeconds,
  RECOVERY_STATUS_LABELS, RECOVERY_STATUS_VARIANTS,
  RecoveryStatusCard, RetryButton, executeRecovery,
  buildMockHealthMetrics, HealthMetricsPanel,
  computeHealthScore, getHealthScoreColor, getOverallHealthStatus,
  isDrillOverdue, formatDrillStatus,
};
