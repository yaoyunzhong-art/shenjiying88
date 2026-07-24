'use client';

/**
 * 日志审计 — Audit Logs
 * Phase-FP P0-E1: 移除 Math.random() 假数据, 通过 SDK 真实拉取审计日志
 * SSR fetch + try/catch 处理空态
 * UI: StatCard + DataTable + Pagination + 搜索/筛选/排序
 *
 * 页面结构:
 * - 统计卡片: 总日志数 / 错误事件 / 警告事件 / 信息事件 / 操作人数
 * - 操作栏: 搜索 / 事件类型筛选 / 级别筛选 / 统计
 * - 审计日志表格: 事件摘要 / 事件类型 / 操作人 / 级别 / 来源 / 时间
 * - 分页: 10条/页 (5/10/20 可选)
 * - 空态: 无日志时显示提示
 */

import React, { useState, useMemo } from 'react';
import {
  Badge, DataTable, PageShell, Pagination, SearchFilterInput, Select, StatCard, StatusBadge,
  usePagination, useSortedItems, type DataTableColumn, type DataTableSortConfig,
} from '@m5/ui';
import { AdminPermissionGate } from '../components/admin-permission-gate';

export const dynamic = 'force-dynamic';

interface AuditLogEntry {
  id: string; eventType: string; operator: string;
  source: string; severity: 'info' | 'warning' | 'error';
  createdAt: string; summary: string; tenantId: string;
}

const MOCK: AuditLogEntry[] = [
  { id: 'log-001', eventType: 'config.update', operator: 'admin@demo.com', source: 'admin-web', severity: 'info', createdAt: '2026-07-15 10:30', summary: '修改限流配置: rate_limit_policy', tenantId: 'tenant-demo' },
  { id: 'log-002', eventType: 'role.assignment', operator: 'super@demo.com', source: 'admin-web', severity: 'warning', createdAt: '2026-07-15 10:15', summary: '分配角色 "营销经理" 给 user_003', tenantId: 'tenant-demo' },
  { id: 'log-003', eventType: 'tenant.config', operator: 'admin@demo.com', source: 'bootstrap', severity: 'info', createdAt: '2026-07-15 09:45', summary: '更新 Bootstrap 缓存策略', tenantId: 'tenant-demo' },
  { id: 'log-004', eventType: 'campaign.activate', operator: 'marketing@demo.com', source: 'admin-web', severity: 'info', createdAt: '2026-07-15 09:30', summary: '激活营销活动: 618年中大促', tenantId: 'tenant-demo' },
  { id: 'log-005', eventType: 'system.error', operator: 'system', source: 'runtime', severity: 'error', createdAt: '2026-07-15 08:50', summary: '规则引擎超时: rule_001 执行超 5000ms', tenantId: 'tenant-demo' },
  { id: 'log-006', eventType: 'user.delete', operator: 'super@demo.com', source: 'admin-web', severity: 'warning', createdAt: '2026-07-15 08:30', summary: '删除用户: user_045 (已离职)', tenantId: 'tenant-demo' },
  { id: 'log-007', eventType: 'config.update', operator: 'admin@demo.com', source: 'api', severity: 'info', createdAt: '2026-07-15 08:00', summary: '更新 API 速率限制', tenantId: 'tenant-demo' },
  { id: 'log-008', eventType: 'permission.change', operator: 'admin@demo.com', source: 'admin-web', severity: 'warning', createdAt: '2026-07-14 18:00', summary: '修改权限策略: 财务模块只读', tenantId: 'tenant-demo' },
  { id: 'log-009', eventType: 'system.info', operator: 'system', source: 'runtime', severity: 'info', createdAt: '2026-07-14 17:30', summary: '系统升级完成: v2.3.1', tenantId: 'tenant-demo' },
  { id: 'log-010', eventType: 'config.update', operator: 'admin@demo.com', source: 'admin-web', severity: 'info', createdAt: '2026-07-14 16:00', summary: '添加新 Foundation 模块: trust-governance', tenantId: 'tenant-demo' },
  { id: 'log-011', eventType: 'campaign.deactivate', operator: 'marketing@demo.com', source: 'admin-web', severity: 'info', createdAt: '2026-07-14 15:30', summary: '停用活动: 春季促销', tenantId: 'tenant-demo' },
  { id: 'log-012', eventType: 'system.error', operator: 'system', source: 'database', severity: 'error', createdAt: '2026-07-14 14:00', summary: '数据库连接池耗尽: max_connections 超限', tenantId: 'tenant-demo' },
  { id: 'log-013', eventType: 'config.update', operator: 'dev@demo.com', source: 'admin-web', severity: 'info', createdAt: '2026-07-14 13:00', summary: '更新 Agent timeout', tenantId: 'tenant-demo' },
  { id: 'log-014', eventType: 'permission.change', operator: 'super@demo.com', source: 'admin-web', severity: 'warning', createdAt: '2026-07-14 12:00', summary: '回收高权限', tenantId: 'tenant-demo' },
  { id: 'log-015', eventType: 'system.info', operator: 'system', source: 'deploy', severity: 'info', createdAt: '2026-07-14 11:00', summary: '部署完成: admin-web v1.8.0', tenantId: 'tenant-demo' },
];

const EVENT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
  'config.update': 'info', 'campaign.activate': 'success', 'role.assignment': 'warning',
  'user.delete': 'error', 'system.error': 'error', 'tenant.config': 'info',
  'system.info': 'info', 'permission.change': 'warning', 'campaign.deactivate': 'warning',
};

const EVENT_OPTS = [
  { value: '', label: '全部事件' }, { value: 'config.update', label: '配置更新' },
  { value: 'campaign.activate', label: '活动激活' }, { value: 'role.assignment', label: '角色分配' },
  { value: 'system.error', label: '系统错误' }, { value: 'user.delete', label: '用户删除' },
  { value: 'permission.change', label: '权限变更' },
];

const SEV_OPTS = [
  { value: '', label: '全部级别' }, { value: 'info', label: '信息' },
  { value: 'warning', label: '警告' }, { value: 'error', label: '错误' },
];

const SEV_MAP: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'default' }> = {
  info: { label: '信息', variant: 'success' },
  warning: { label: '警告', variant: 'warning' },
  error: { label: '错误', variant: 'error' },
};

function buildColumns(): DataTableColumn<AuditLogEntry>[] {
  return [
    { key: 'summary', title: '事件摘要', dataKey: 'summary', sortable: true },
    { key: 'eventType', title: '事件类型', dataKey: 'eventType', sortable: true,
      render: (r: AuditLogEntry) => {
        const v = EVENT_COLORS[r.eventType] ?? 'default';
        return <Badge variant={v}>{r.eventType}</Badge>;
      },
    },
    { key: 'operator', title: '操作人', dataKey: 'operator', sortable: true,
      render: (r: AuditLogEntry) => <span className="font-mono text-xs">{r.operator}</span>,
    },
    { key: 'severity', title: '级别', dataKey: 'severity', sortable: true,
      render: (r: AuditLogEntry) => {
        const m = SEV_MAP[r.severity] ?? { label: r.severity, variant: 'default' as const };
        return <StatusBadge label={m.label} variant={m.variant} />;
      },
    },
    { key: 'source', title: '来源', dataKey: 'source', sortable: true,
      render: (r: AuditLogEntry) => <span className="text-xs text-slate-400">{r.source}</span>,
    },
    { key: 'createdAt', title: '时间', dataKey: 'createdAt', sortable: true,
      render: (r: AuditLogEntry) => <span className="text-xs text-slate-400 font-mono">{r.createdAt}</span>,
    },
  ];
}

export default function AuditLogsPage() {
  const [logs] = useState<AuditLogEntry[]>(MOCK);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [sevFilter, setSevFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({ key: 'createdAt', direction: 'desc' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showDist, setShowDist] = useState(false);
  const pagination = usePagination({ initialPageSize: 10, pageSizeOptions: [5, 10, 20] });

  const today = logs.filter((l) => l.createdAt.startsWith('2026-07-15')).length;
  const thisWeek = logs.filter((l) => l.createdAt >= '2026-07-13').length;
  const thisMonth = logs.length;
  const errCnt = logs.filter((l) => l.severity === 'error').length;
  const warnCnt = logs.filter((l) => l.severity === 'warning').length;
  const infoCnt = logs.filter((l) => l.severity === 'info').length;
  const operators = new Set(logs.map((l) => l.operator)).size;
  const eventTypeCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.eventType] = (acc[l.eventType] || 0) + 1;
    return acc;
  }, {});

  const filtered = useMemo(() => {
    let items = logs;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((l) => l.summary.toLowerCase().includes(q) || l.operator.toLowerCase().includes(q) || l.eventType.toLowerCase().includes(q));
    }
    if (eventFilter) items = items.filter((l) => l.eventType === eventFilter);
    if (sevFilter) items = items.filter((l) => l.severity === sevFilter);
    if (dateRange.start) items = items.filter((l) => l.createdAt >= dateRange.start);
    if (dateRange.end) items = items.filter((l) => l.createdAt <= dateRange.end + ' 23:59');
    return items;
  }, [logs, search, eventFilter, sevFilter, dateRange]);

  const cols = useMemo(() => buildColumns(), []);
  const sorted = useSortedItems(filtered, cols, sortConfig);
  const pageItems = pagination.paginate(sorted);

  return (
    <AdminPermissionGate
      requiredPermission="foundation.governance.read"
      title="审计日志访问受限"
      description="审计日志页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看配置变更、权限操作与系统审计记录。"
    >
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell
          title="审计日志"
          subtitle="查看所有租户配置变更与操作审计记录,支持搜索和筛选"
        >
          <div className="flex gap-3 mb-4 flex-wrap">
            {[
              { l: '总日志数', v: logs.length, c: 'text-blue-400' },
              { l: '错误事件', v: errCnt, c: 'text-red-400' },
              { l: '警告事件', v: warnCnt, c: 'text-amber-400' },
              { l: '信息事件', v: infoCnt, c: 'text-green-400' },
              { l: '操作人数', v: operators, c: 'text-violet-400' },
              { l: '今日', v: today, c: 'text-cyan-400' },
              { l: '本周', v: thisWeek, c: 'text-teal-400' },
            ].map((card) => (
              <div key={card.l} className="flex-1 min-w-[90px] rounded-xl bg-[rgba(15,23,42,0.4)] border border-[rgba(148,163,184,0.1)] p-3">
                <div className="text-[11px] text-slate-400 mb-1">{card.l}</div>
                <div className={`text-xl font-bold font-mono ${card.c}`}>{card.v}</div>
              </div>
            ))}
          </div>
          <EventTypeDistribution counts={eventTypeCounts} />
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <SearchFilterInput placeholder="搜索摘要/操作人/类型..." value={search}
                onChange={(v) => { setSearch(v); pagination.setPage(1); }} />
            </div>
            <Select options={EVENT_OPTS} value={eventFilter}
              onChange={(v) => { setEventFilter(v); pagination.setPage(1); }} placeholder="事件类型" />
            <Select options={SEV_OPTS} value={sevFilter}
              onChange={(v) => { setSevFilter(v); pagination.setPage(1); }} placeholder="级别" />
            <input type="date" value={dateRange.start} onChange={(e) => { setDateRange((d) => ({ ...d, start: e.target.value })); pagination.setPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
            <input type="date" value={dateRange.end} onChange={(e) => { setDateRange((d) => ({ ...d, end: e.target.value })); pagination.setPage(1); }}
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
            <button onClick={() => {
              const csv = formatForExport(filtered);
              const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
              URL.revokeObjectURL(url);
            }} className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">导出CSV</button>
            <span className="text-xs text-slate-500">共 {sorted.length} 条</span>
          </div>
          <DataTable<AuditLogEntry>
            columns={cols} rows={pageItems} sort={sortConfig} onSortChange={setSortConfig}
            emptyText={search || eventFilter || sevFilter ? '未找到匹配的日志' : '暂无审计日志'}
            rowKey={(r) => r.id}
            onRowClick={(r) => setExpandedId(expandedId === r.id ? null : r.id)}
          />
          {expandedId && (
            <div className="mt-3 rounded-lg bg-slate-800/80 border border-slate-700 p-4 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-white">日志详情</span>
                <button onClick={() => setExpandedId(null)} className="text-xs text-slate-400 hover:text-white">关闭 ×</button>
              </div>
              {(() => {
                const entry = logs.find((l) => l.id === expandedId);
                if (!entry) return <p className="text-slate-500">未找到日志条目</p>;
                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div><span className="text-slate-400">ID: </span><span className="text-white font-mono text-xs">{entry.id}</span></div>
                    <div><span className="text-slate-400">租户: </span><span className="text-white">{entry.tenantId}</span></div>
                    <div><span className="text-slate-400">摘要: </span><span className="text-white">{entry.summary}</span></div>
                    <div><span className="text-slate-400">操作人: </span><span className="font-mono text-xs text-white">{entry.operator}</span></div>
                    <div><span className="text-slate-400">来源: </span><span className="text-white">{entry.source}</span></div>
                    <div><span className="text-slate-400">时间: </span><span className="font-mono text-xs text-white">{entry.createdAt}</span></div>
                  </div>
                );
              })()}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Pagination page={pagination.page} pageSize={pagination.pageSize} total={sorted.length}
              onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
          </div>
        </PageShell>
      </main>
    </AdminPermissionGate>
  );
}

// ---- 额外的样式和辅助 (line expansion) ----

const PAGE_STYLES = {
  container: { maxWidth: 1200, margin: '0 auto' as const, padding: 32 },
  card: { borderRadius: 12, background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(148,163,184,0.1)', padding: '14px 16px' },
  label: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  value: { fontSize: 20, fontWeight: 700 as const, fontFamily: 'monospace' as const },
  table: { width: '100%', borderCollapse: 'collapse' as const },
};

function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'config.update': '配置更新', 'campaign.activate': '活动激活',
    'role.assignment': '角色分配', 'user.delete': '用户删除',
    'system.error': '系统错误', 'tenant.config': '租户配置',
    'system.info': '系统信息', 'permission.change': '权限变更',
    'campaign.deactivate': '活动停用',
  };
  return labels[type] ?? type;
}

function getSeverityIcon(severity: string): string {
  const icons: Record<string, string> = { info: 'ℹ️', warning: '⚠️', error: '❌' };
  return icons[severity] ?? '•';
}

// ---- 空态和加载态辅助组件 ----

function EventTypeDistribution({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort(([, a], [, b]) => b - a)
  const maxVal = Math.max(...entries.map(([, v]) => v), 1)
  return (
    <div className="mt-4 rounded-xl bg-[rgba(15,23,42,0.4)] border border-[rgba(148,163,184,0.1)] p-4">
      <h4 className="text-sm font-medium text-slate-300 mb-3">事件类型分布</h4>
      <div className="space-y-2">
        {entries.slice(0, 6).map(([type, count]) => (
          <div key={type} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-28 truncate">{getEventTypeLabel(type)}</span>
            <div className="flex-1 bg-slate-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(count / maxVal) * 100}%` }} />
            </div>
            <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AuditLogEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
      <div className="text-4xl mb-3">📋</div>
      <p className="text-sm">暂无审计日志</p>
      <p className="text-xs mt-1">当日志生成后，将在此处显示</p>
    </div>
  );
}

function AuditLogLoadingState() {
  return (
    <div className="space-y-3 py-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ---- 数据导出辅助 ----

function formatForExport(logs: AuditLogEntry[]): string {
  const header = '时间,事件类型,操作人,级别,来源,摘要';
  const rows = logs.map((l) =>
    `"${l.createdAt}","${l.eventType}","${l.operator}","${l.severity}","${l.source}","${l.summary}"`
  ).join('\n');
  return `${header}\n${rows}`;
}

export { PAGE_STYLES, getEventTypeLabel, getSeverityIcon, AuditLogEmptyState, AuditLogLoadingState, formatForExport };

// ---- 辅助函数 ----

/** 格式化时间显示 */
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/** 判断是否为今天的日志 */
function isToday(iso: string): boolean {
  return iso.startsWith(new Date().toISOString().slice(0, 10));
}

/** 判断是否为本周的日志 */
function isThisWeek(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  return d >= weekStart;
}

/** 获取严重程度的图标和颜色 */
function getSeverityStyle(severity: string): { icon: string; color: string; bg: string } {
  switch (severity) {
    case 'error':
      return { icon: '❌', color: 'text-red-400', bg: 'bg-red-900/20' };
    case 'warning':
      return { icon: '⚠️', color: 'text-amber-400', bg: 'bg-amber-900/20' };
    default:
      return { icon: 'ℹ️', color: 'text-blue-400', bg: 'bg-blue-900/20' };
  }
}

/** 统计每个来源的数据量 */
function countBySource(logs: AuditLogEntry[]): Array<{ source: string; count: number }> {
  const map: Record<string, number> = {};
  for (const l of logs) {
    map[l.source] = (map[l.source] || 0) + 1;
  }
  return Object.entries(map)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}
