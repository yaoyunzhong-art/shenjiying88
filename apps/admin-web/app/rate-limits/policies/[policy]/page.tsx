'use client';

/**
 * 限流策略详情 — Rate Limits Policy Detail Page
 * 功能: 查看作用域、周期、限额、算法与匹配的配额账本
 * 三态: 加载态 / 空态 / 错误态 (当前为同步 mock，通过 useEffect 模拟异步加载)
 *
 * 页面结构:
 * - params 解析路由参数, 读取策略 ID
 * - 数据层加载策略快照
 * - 404: 策略不存在时显示 guide
 * - 详情面板: 编码 / 名称 / 作用域 / 周期 / 限额 / 算法 / 状态
 * - 关联账本列表
 * - 返回链接至 Rate Limits 列表
 */

import React, { useEffect, useState } from 'react';
import {
  Badge, BreadcrumbPageHeader, DetailClosureBar, PageShell, Result, StatusBadge,
} from '@m5/ui';

interface PolicySnapshot {
  policyId: string;
  notFound: boolean;
  record?: {
    code: string;
    name: string;
    scope: string;
    windowSize: string;
    limit: number;
    algorithm: string;
    status: 'active' | 'inactive' | 'draft';
    description: string;
    createdAt: string;
    updatedAt: string;
    matchedLedgers: number;
  } | null;
}

interface PageProps { params: Promise<{ policy?: string | string[] }>; }

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
  active: { label: '生效中', variant: 'success' },
  inactive: { label: '已停用', variant: 'warning' },
  draft: { label: '草稿', variant: 'default' },
};

const KNOWN_POLICIES: Record<string, { code: string; name: string; scope: string; windowSize: string; limit: number; algorithm: string; status: 'active' | 'inactive' | 'draft'; description: string; createdAt: string; updatedAt: string; matchedLedgers: number }> = {
  'READ_QPS_100': { code: 'READ_QPS_100', name: '读取 QPS 100', scope: 'tenant:api:read', windowSize: '1s', limit: 100, algorithm: 'token-bucket', status: 'active', description: 'API 读取请求速率限制', createdAt: '2026-01-01', updatedAt: '2026-06-15', matchedLedgers: 3 },
  'WRITE_QPS_50': { code: 'WRITE_QPS_50', name: '写入 QPS 50', scope: 'tenant:api:write', windowSize: '1s', limit: 50, algorithm: 'leaky-bucket', status: 'active', description: 'API 写入请求速率限制', createdAt: '2026-01-01', updatedAt: '2026-06-10', matchedLedgers: 2 },
  'CAMPAIGN_TRIGGER_1000': { code: 'CAMPAIGN_TRIGGER_1000', name: '活动触发 1000/天', scope: 'tenant:campaign:trigger', windowSize: '24h', limit: 1000, algorithm: 'fixed-window', status: 'active', description: '营销活动每日触发上限', createdAt: '2026-02-01', updatedAt: '2026-06-20', matchedLedgers: 1 },
  'BURST_5000': { code: 'BURST_5000', name: '突发流量 5000', scope: 'tenant:burst', windowSize: '1m', limit: 5000, algorithm: 'token-bucket', status: 'draft', description: '突发流量峰值控制', createdAt: '2026-03-01', updatedAt: '2026-07-01', matchedLedgers: 0 },
};

function loadMockPolicy(policyId: string): PolicySnapshot {
  if (!policyId) return { policyId: '', notFound: true, record: null };
  const r = KNOWN_POLICIES[policyId];
  if (!r) return { policyId, notFound: true, record: null };
  return { policyId, notFound: false, record: r };
}

export default function RateLimitsPolicyDetailPage({ params }: PageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<PolicySnapshot | null>(null);
  const [policyId, setPolicyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resolved = await params;
        const pid = readParam(resolved.policy);
        setPolicyId(pid);
        const snap = loadMockPolicy(pid ?? '');
        if (!cancelled) {
          setSnapshot(snap);
          queueMicrotask(() => { if (!cancelled) setLoading(false); });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '加载策略详情失败');
          queueMicrotask(() => { if (!cancelled) setLoading(false); });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [params]);

  if (loading) {
    return (
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
          <div style={{ fontSize: 14 }}>加载中...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#ef4444' }}>
          <div style={{ fontSize: 14 }}>错误: {error}</div>
        </div>
      </main>
    );
  }

  if (!snapshot || snapshot.notFound || !snapshot.record) {
    return (
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
        <PageShell title="限流策略不存在" subtitle="该策略不在当前 rate-limits 范围内。">
          <Result status="404" title="策略未找到" subTitle={`策略 "${policyId}" 不存在`}
            extra={<a href="/rate-limits/policies" className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg no-underline">返回策略列表</a>} />
        </PageShell>
      </main>
    );
  }

  const { record } = snapshot;
  const statusCfg = STATUS_MAP[record.status] ?? { label: record.status, variant: 'default' as const };

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell title={`限流策略：${record.code}`} subtitle="查看作用域、周期、限额、算法与匹配的配额账本。">
        <BreadcrumbPageHeader breadcrumbs={[{ label: '限流策略', href: '/rate-limits/policies' }, { label: record.code }]} title={record.name} />
        <div className="bg-white/5 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex gap-2 items-center mb-5">
            <h3 className="text-base font-semibold text-white">基本信息</h3>
            <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
          </div>
          <DetailRow label="策略编码"><span className="font-mono text-sm text-blue-400">{record.code}</span></DetailRow>
          <DetailRow label="策略名称"><span className="text-sm">{record.name}</span></DetailRow>
          <DetailRow label="状态"><StatusBadge label={statusCfg.label} variant={statusCfg.variant} /></DetailRow>
          <DetailRow label="描述"><span className="text-sm text-slate-300">{record.description}</span></DetailRow>
          <DetailRow label="作用域"><span className="font-mono text-sm text-slate-400">{record.scope}</span></DetailRow>
          <DetailRow label="时间窗口"><span className="text-sm">{record.windowSize}</span></DetailRow>
          <DetailRow label="限额"><span className="font-mono text-sm">{record.limit.toLocaleString()} 次</span></DetailRow>
          <DetailRow label="算法"><Badge variant="info">{record.algorithm}</Badge></DetailRow>
          <DetailRow label="匹配账本数"><span className="text-sm">{record.matchedLedgers}</span></DetailRow>
          <DetailRow label="创建时间"><span className="text-sm font-mono text-slate-400">{record.createdAt}</span></DetailRow>
          <DetailRow label="更新时间"><span className="text-sm font-mono text-slate-400">{record.updatedAt}</span></DetailRow>
        </div>
        <div className="bg-white/5 border border-slate-700 rounded-xl p-6 mb-6">
          <h3 className="text-base font-semibold text-white mb-3">策略配置</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <div className="text-[11px] text-slate-400 mb-1">时间窗口</div>
              <div className="text-lg font-bold font-mono text-white">{record.windowSize}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <div className="text-[11px] text-slate-400 mb-1">限额</div>
              <div className="text-lg font-bold font-mono text-blue-400">{record.limit.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <div className="text-[11px] text-slate-400 mb-1">算法</div>
              <div className="text-lg font-bold font-mono text-green-400">{record.algorithm}</div>
            </div>
          </div>
        </div>
        <DetailClosureBar links={[{ key: 'list', title: '限流策略列表', subtitle: '返回 Rate Limits 策略管理', href: '/rate-limits/policies' }]} />
      </PageShell>
    </main>
  );
}

// ---- 辅助函数 ----

function getAlgorithmLabel(algorithm: string): string {
  const labels: Record<string, string> = {
    'token-bucket': '令牌桶',
    'leaky-bucket': '漏桶',
    'fixed-window': '固定窗口',
    'sliding-window': '滑动窗口',
  };
  return labels[algorithm] ?? algorithm;
}

function PolicyNotFound({ policyId }: { policyId: string | null }) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-8 text-center">
      <div className="text-5xl mb-4">⚙️</div>
      <h3 className="text-lg font-semibold text-white mb-2">限流策略未找到</h3>
      <p className="text-sm text-slate-400 mb-4">
        策略 &quot;{policyId ?? '—'}&quot; 不在当前 rate-limits 范围内。
      </p>
      <a href="/rate-limits/policies" className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg no-underline text-sm">
        返回策略列表
      </a>
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 text-center">
      <div className="text-[11px] text-slate-400 mb-1">{title}</div>
      <div className={`text-lg font-bold font-mono ${color}`}>{value}</div>
    </div>
  );
}

function formatScope(scope: string): string {
  const parts = scope.split(':');
  return parts.join(' → ');
}

interface PolicyConfigItem { label: string; value: string; }

// ---- 深层辅助组件 ----

function AlgorithmBadge({ algorithm }: { algorithm: string }) {
  const colors: Record<string, string> = {
    'token-bucket': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'leaky-bucket': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'fixed-window': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'sliding-window': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  };
  const className = colors[algorithm] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono border ${className}`}>
      {getAlgorithmLabel(algorithm)}
    </span>
  );
}

function PolicyConfigPanel({ record }: { record: NonNullable<PolicySnapshot['record']> }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
        <span className="text-xs text-slate-400">时间窗口</span>
        <span className="font-mono text-sm text-white">{record.windowSize}</span>
      </div>
      <div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
        <span className="text-xs text-slate-400">限额</span>
        <span className="font-mono text-sm text-blue-400">{record.limit.toLocaleString()} 次</span>
      </div>
      <div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
        <span className="text-xs text-slate-400">算法</span>
        <AlgorithmBadge algorithm={record.algorithm} />
      </div>
      <div className="flex items-center justify-between bg-slate-800 rounded-lg p-3">
        <span className="text-xs text-slate-400">匹配账本</span>
        <span className="font-mono text-sm text-amber-400">{record.matchedLedgers}</span>
      </div>
    </div>
  );
}

function TimestampRow({ label, timestamp }: { label: string; timestamp: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="font-mono text-xs text-slate-400">{timestamp}</span>
    </div>
  );
}

const SCOPE_SEGMENTS = ['tenant', 'api', 'campaign'];

function parseScope(scope: string): string[] {
  return scope.split(':');
}

export { AlgorithmBadge, PolicyConfigPanel, TimestampRow, parseScope, formatScope };
