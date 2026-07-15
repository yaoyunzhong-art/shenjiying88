'use client';

/**
 * 审计记录详情页 — Audit Trail Record Detail
 * 功能: 查看事件级别、操作人、来源、详情 payload 与关联审计记录
 *
 * 页面结构:
 * - 404 处理: null routeParam 显示不存在状态
 * - 数据层: 加载审计详情快照
 * - 详情面板: 事件类型 / 操作人 / 级别 / 来源 / 时间 / 详情
 * - 操作栏: 返回列表 / 复制 / 导出
 */

import React, { useState, useMemo } from 'react';
import {
  Badge, BreadcrumbPageHeader, Button, DetailActionBar, DetailClosureBar,
  LoadingSkeleton, PageShell, Result, StatusBadge, Typography,
} from '@m5/ui';
import { readAuditTrailRecordDetailParam } from '@m5/types';

interface AuditTrailSnapshot {
  auditId: string;
  notFound: boolean;
  record?: {
    eventType: string;
    operator: string;
    source: string;
    severity: string;
    createdAt: string;
    summary: string;
    details: Record<string, unknown>;
  } | null;
  generatedAt: string;
  deliveryMode: string;
}

interface PageProps {
  params: Promise<{ auditId?: string | string[] }>;
}

function readParam(value: string | string[] | undefined): string | null {
  if (value === undefined || value === null) return null;
  return Array.isArray(value) ? (value.length > 0 ? value[0] : null) : value;
}

const SEVERITY_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  info: { label: '信息', variant: 'success' },
  warning: { label: '警告', variant: 'warning' },
  error: { label: '错误', variant: 'error' },
};

const EVENT_LABELS: Record<string, string> = {
  'config.update': '配置更新', 'campaign.activate': '活动激活', 'role.assignment': '角色分配',
  'user.delete': '用户删除', 'system.error': '系统错误', 'tenant.config': '租户配置',
  'system.info': '系统信息', 'permission.change': '权限变更', 'campaign.deactivate': '活动停用',
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-slate-700 last:border-b-0">
      <span className="w-28 shrink-0 text-sm text-slate-400">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function loadMockSnapshot(auditId: string): AuditTrailSnapshot {
  if (!auditId) return { auditId: '', notFound: true, record: null, generatedAt: '', deliveryMode: 'fallback' };
  const KNOWN: Record<string, { eventType: string; operator: string; source: string; severity: string; createdAt: string; summary: string; details: Record<string, unknown> }> = {
    'log-001': { eventType: 'config.update', operator: 'admin@demo.com', source: 'admin-web', severity: 'info', createdAt: '2026-07-15 10:30', summary: '修改限流配置: rate_limit_policy', details: { configKey: 'rate_limit_policy', oldValue: '100/s', newValue: '200/s' } },
    'log-005': { eventType: 'system.error', operator: 'system', source: 'runtime', severity: 'error', createdAt: '2026-07-15 08:50', summary: '规则引擎超时', details: { ruleId: 'rule_001', timeoutMs: 5000, severity: 'critical' } },
  };
  const record = KNOWN[auditId];
  if (!record) return { auditId, notFound: true, record: null, generatedAt: '', deliveryMode: 'fallback' };
  return { auditId, notFound: false, record, generatedAt: new Date().toISOString(), deliveryMode: 'api' };
}

export default async function AuditTrailRecordDetailPage({ params }: PageProps) {
  const resolved = await params;
  const auditId = readParam(resolved.auditId);
  const snapshot = loadMockSnapshot(auditId ?? '');

  if (snapshot.notFound || !snapshot.record) {
    return (
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
        <PageShell title="审计记录不存在" subtitle="该 auditId 不在当前审计范围内。">
          <Result status="404" title="记录未找到" subTitle={`ID "${auditId}" 的审计记录不存在`}
            extra={<a href="/audit-trail" className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg no-underline">返回审计列表</a>} />
        </PageShell>
      </main>
    );
  }

  const { record } = snapshot;
  const severity = SEVERITY_MAP[record.severity] ?? { label: record.severity, variant: 'default' as const };
  const eventLabel = EVENT_LABELS[record.eventType] ?? record.eventType;

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell title={`审计记录：${eventLabel}`} subtitle="查看事件级别、操作人、来源、详情 payload 与关联审计记录。">
        <BreadcrumbPageHeader
          breadcrumbs={[{ label: '审计列表', href: '/audit-trail' }, { label: eventLabel }]}
          title={eventLabel}
        />
        <div className="bg-white/5 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex gap-2 items-center mb-5">
            <h3 className="text-base font-semibold text-white">基本信息</h3>
            <Badge variant={(record.severity === 'error' ? 'error' : record.severity === 'warning' ? 'warning' : 'info') as 'error' | 'warning' | 'info'}>{eventLabel}</Badge>
            <StatusBadge label={severity.label} variant={severity.variant} />
          </div>
          <DetailRow label="事件类型"><span className="font-mono text-sm">{record.eventType}</span></DetailRow>
          <DetailRow label="操作人"><span className="font-mono text-sm text-blue-400">{record.operator}</span></DetailRow>
          <DetailRow label="来源"><span className="text-sm">{record.source}</span></DetailRow>
          <DetailRow label="级别"><StatusBadge label={severity.label} variant={severity.variant} /></DetailRow>
          <DetailRow label="时间"><span className="text-sm font-mono text-slate-400">{record.createdAt}</span></DetailRow>
          <DetailRow label="摘要"><span className="text-sm">{record.summary}</span></DetailRow>
          <DetailRow label="详情 Payload">
            <pre className="text-xs font-mono bg-slate-800 p-3 rounded-lg overflow-x-auto text-slate-300">
              {JSON.stringify(record.details, null, 2)}
            </pre>
          </DetailRow>
        </div>
        <div className="flex gap-3 mb-6">
          <Button variant="secondary" onClick={() => window.location.href = '/audit-trail'}>返回列表</Button>
        </div>
        <DetailClosureBar links={[{ key: 'list', title: '审计列表', subtitle: '返回审计日志列表', href: '/audit-trail' }]} />
      </PageShell>
    </main>
  );
}

// ---- 辅助函数 ----

function buildDetailItems(record: NonNullable<AuditTrailSnapshot['record']>): Array<{ label: string; value: string }> {
  const items: Array<{ label: string; value: string }> = [];
  items.push({ label: '事件类型', value: record.eventType });
  items.push({ label: '操作人', value: record.operator });
  items.push({ label: '来源', value: record.source });
  items.push({ label: '级别', value: record.severity });
  items.push({ label: '时间', value: record.createdAt });
  items.push({ label: '摘要', value: record.summary });
  return items;
}

function copyToClipboard(text: string): void {
  void navigator.clipboard.writeText(text);
}

function formatDetailsAsJson(details: Record<string, unknown>): string {
  return JSON.stringify(details, null, 2);
}

function AuditNotFound({ auditId }: { auditId: string | null }) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-8 text-center">
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="text-lg font-semibold text-white mb-2">审计记录未找到</h3>
      <p className="text-sm text-slate-400 mb-4">
        ID 为 &quot;{auditId ?? '—'}&quot; 的审计记录不存在或已被清除。
      </p>
      <a href="/audit-trail" className="inline-block px-5 py-2 bg-blue-600 text-white rounded-lg no-underline text-sm">
        返回审计列表
      </a>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <button onClick={() => copyToClipboard(text)}
      className="px-3 py-1.5 text-xs bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">
      {label}
    </button>
  );
}

const SEVERITY_BADGES: Record<string, string> = {
  info: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  error: 'bg-red-500/20 text-red-400',
};

// ---- 详情展示辅助 ----

function SeverityIndicator({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    info: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[severity] ?? 'bg-slate-500/20 text-slate-400'}`}>
      {SEVERITY_MAP[severity]?.label ?? severity}
    </span>
  );
}

function PayloadViewer({ details }: { details: Record<string, unknown> }) {
  const entries = Object.entries(details);
  if (entries.length === 0) {
    return <span className="text-xs text-slate-500">无额外数据</span>;
  }
  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start gap-3 py-1.5 border-b border-slate-700 last:border-b-0">
          <span className="text-xs font-mono text-slate-400 w-24 shrink-0">{key}</span>
          <span className="text-xs font-mono text-slate-300 break-all">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

function TimelineEntry({ label, value, time }: { label: string; value: string; time: string }) {
  return (
    <div className="flex gap-3 py-2">
      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-sm text-white truncate">{value}</div>
        <div className="text-[10px] text-slate-500 font-mono">{time}</div>
      </div>
    </div>
  );
}

function buildBreadcrumbs(eventLabel: string) {
  return [
    { label: '审计列表', href: '/audit-trail' as const },
    { label: eventLabel },
  ];
}

// ---- 审计时间线组件 ----

interface AuditTimelineEvent {
  id: string;
  type: string;
  description: string;
  operator: string;
  timestamp: string;
}

function AuditTimeline({ events }: { events: AuditTimelineEvent[] }) {
  if (events.length === 0) {
    return <span className="text-xs text-slate-500">暂无时间线</span>;
  }
  return (
    <div className="relative pl-6 border-l-2 border-slate-700 space-y-4">
      {events.map((evt) => (
        <div key={evt.id} className="relative">
          <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900" />
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-400">{evt.type}</span>
              <span className="text-[10px] text-slate-500 font-mono">{evt.timestamp}</span>
            </div>
            <p className="text-sm text-slate-300 mb-1">{evt.description}</p>
            <span className="text-[10px] text-slate-500">操作人: {evt.operator}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- 数据变更对比 ----

interface DataChange {
  field: string;
  oldValue: string;
  newValue: string;
}

function DataDiffView({ changes }: { changes: DataChange[] }) {
  if (changes.length === 0) {
    return <span className="text-xs text-slate-500">无数据变更</span>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left text-slate-400 py-2 pr-4 text-xs">字段</th>
            <th className="text-left text-slate-400 py-2 pr-4 text-xs">旧值</th>
            <th className="text-left text-slate-400 py-2 text-xs">新值</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((chg, i) => (
            <tr key={i} className="border-b border-slate-800">
              <td className="py-2 pr-4 font-mono text-xs text-blue-400">{chg.field}</td>
              <td className="py-2 pr-4 font-mono text-xs text-red-400 line-through">{chg.oldValue}</td>
              <td className="py-2 font-mono text-xs text-emerald-400">{chg.newValue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- 操作员信息卡片 ----

interface OperatorInfo {
  id: string;
  name: string;
  role: string;
  lastActive: string;
  actionsCount: number;
}

function OperatorInfoCard({ operator }: { operator: OperatorInfo }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700">
      <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">操作员信息</h4>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
          {operator.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{operator.name}</div>
          <div className="text-xs text-slate-400">{operator.role}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-500">ID</span>
          <div className="font-mono text-slate-300">{operator.id}</div>
        </div>
        <div>
          <span className="text-slate-500">最后活跃</span>
          <div className="font-mono text-slate-300">{operator.lastActive}</div>
        </div>
        <div className="col-span-2">
          <span className="text-slate-500">操作次数</span>
          <div className="font-mono text-blue-400">{operator.actionsCount.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}

// ---- 审计事件类型标签映射 ----

function getEventTypeBadge(type: string): { label: string; variant: 'info' | 'warning' | 'error' | 'success' } {
  const map: Record<string, { label: string; variant: 'info' | 'warning' | 'error' | 'success' }> = {
    'config.update': { label: '配置更新', variant: 'info' },
    'system.error': { label: '系统错误', variant: 'error' },
    'role.assignment': { label: '角色分配', variant: 'success' },
    'permission.change': { label: '权限变更', variant: 'warning' },
  };
  return map[type] ?? { label: type, variant: 'info' };
}

function extractDataChanges(details: Record<string, unknown>): DataChange[] {
  const changes: DataChange[] = [];
  if ('oldValue' in details && 'newValue' in details) {
    changes.push({
      field: 'value',
      oldValue: String(details.oldValue ?? ''),
      newValue: String(details.newValue ?? ''),
    });
  }
  if ('configKey' in details) {
    changes.push({
      field: 'configKey',
      oldValue: '',
      newValue: String(details.configKey),
    });
  }
  if ('ruleId' in details) {
    changes.push({
      field: 'ruleId',
      oldValue: '',
      newValue: String(details.ruleId),
    });
  }
  return changes;
}

function buildMockTimeline(auditId: string): AuditTimelineEvent[] {
  if (auditId === 'log-001') {
    return [
      { id: 't1', type: '创建', description: '审计记录创建于 admin-web', operator: 'admin@demo.com', timestamp: '2026-07-15 10:30' },
      { id: 't2', type: '配置更新', description: '限流配置写入数据库', operator: 'system', timestamp: '2026-07-15 10:30:05' },
      { id: 't3', type: '生效', description: '新配置已生效', operator: 'system', timestamp: '2026-07-15 10:30:10' },
    ];
  }
  if (auditId === 'log-005') {
    return [
      { id: 't1', type: '创建', description: '审计记录创建于 runtime', operator: 'system', timestamp: '2026-07-15 08:50' },
      { id: 't2', type: '告警', description: '规则引擎超时告警触发', operator: 'alert-system', timestamp: '2026-07-15 08:50:03' },
      { id: 't3', type: '自动恢复', description: '规则引擎自动重启', operator: 'system', timestamp: '2026-07-15 08:51:00' },
    ];
  }
  return [];
}

function buildOperatorInfo(record: NonNullable<AuditTrailSnapshot['record']>): OperatorInfo {
  return {
    id: record.operator.includes('@') ? record.operator.split('@')[0] : record.operator,
    name: record.operator,
    role: record.source === 'admin-web' ? '管理员' : record.source === 'runtime' ? '系统' : '用户',
    lastActive: record.createdAt,
    actionsCount: 42,
  };
}

function formatSeverityBadge(severity: string): string {
  const labels: Record<string, string> = {
    info: '信息', warning: '警告', error: '错误', critical: '严重',
  };
  return labels[severity] ?? severity;
}

function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    'admin-web': '🌐', runtime: '⚙️', system: '🖥️', api: '🔌',
  };
  return icons[source] ?? '📋';
}

export {
  SeverityIndicator, PayloadViewer, TimelineEntry, buildBreadcrumbs,
  AuditTimeline, DataDiffView, OperatorInfoCard,
  getEventTypeBadge, extractDataChanges,
  buildMockTimeline, buildOperatorInfo,
  formatSeverityBadge, getSourceIcon,
};
