/**
 * audit-logs/page.tsx — 审计日志列表页 (ToB 安全审计)
 * 角色视角: 👔 安全审计员 / 超级管理员
 * 功能: 审计日志查询、筛选、导出
 */
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DataTable,
  StatusBadge,
  Badge,
  SearchFilterInput,
  Pagination,
  StatCard,
  LoadingSkeleton,
} from '@m5/ui';
import type { DataTableColumn } from '@m5/ui';
import {
  MOCK_AUDIT_LOGS,
  STATUS_LABELS,
  STATUS_VARIANTS,
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  type AuditLog,
  type AuditLogStatus,
  type AuditLogCategory,
} from './audit-logs-data';

const LOGS_PER_PAGE = 10;

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AuditLogStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<AuditLogCategory | 'all'>('all');
  const [page, setPage] = useState(0);
  const [loading] = useState(true);

  const filtered = useMemo(() => {
    let items = MOCK_AUDIT_LOGS;

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(
        (log) =>
          log.action.toLowerCase().includes(lower) ||
          log.message.toLowerCase().includes(lower) ||
          log.actor.userName.toLowerCase().includes(lower) ||
          log.logCode.toLowerCase().includes(lower)
      );
    }

    if (statusFilter !== 'all') items = items.filter((log) => log.status === statusFilter);
    if (categoryFilter !== 'all') items = items.filter((log) => log.category === categoryFilter);

    return items;
  }, [searchTerm, statusFilter, categoryFilter]);

  const paged = useMemo(() => {
    const start = page * LOGS_PER_PAGE;
    return filtered.slice(start, start + LOGS_PER_PAGE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / LOGS_PER_PAGE);

  const stats = useMemo(() => {
    const success = MOCK_AUDIT_LOGS.filter((l) => l.status === 'success').length;
    const failed = MOCK_AUDIT_LOGS.filter((l) => l.status === 'failed').length;
    const critical = MOCK_AUDIT_LOGS.filter((l) => l.severity === 'critical').length;
    return { total: MOCK_AUDIT_LOGS.length, success, failed, critical };
  }, []);

  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: 'timestamp',
      header: '时间',
      render: (item) => (
        <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>
          {new Date(item.timestamp).toLocaleString('zh-CN')}
        </span>
      ),
    },
    {
      key: 'logCode',
      header: '日志编号',
      render: (item) => (
        <code style={{ fontSize: 12, color: '#60a5fa' }}>{item.logCode}</code>
      ),
    },
    {
      key: 'action',
      header: '操作',
      render: (item) => (
        <div>
          <div style={{ fontWeight: 500, color: '#f8fafc' }}>{item.action}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{item.message}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: '类别',
      render: (item) => (
        <Badge variant="neutral">{CATEGORY_LABELS[item.category]}</Badge>
      ),
    },
    {
      key: 'severity',
      header: '级别',
      render: (item) => (
        <span
          style={{
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 4,
            background: `${SEVERITY_COLORS[item.severity]}20`,
            color: SEVERITY_COLORS[item.severity],
          }}
        >
          {SEVERITY_LABELS[item.severity]}
        </span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (item) => (
        <StatusBadge
          variant={STATUS_VARIANTS[item.status]}
          label={STATUS_LABELS[item.status]}
        />
      ),
    },
    {
      key: 'actor',
      header: '操作人',
      render: (item) => (
        <div>
          <div style={{ fontSize: 13 }}>{item.actor.userName}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{item.actor.role}</div>
        </div>
      ),
    },
    {
      key: 'tenant',
      header: '租户',
      render: (item) => (
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          {item.tenant?.tenantName || '-'}
        </span>
      ),
    },
    {
      key: 'duration',
      header: '耗时',
      render: (item) => (
        <span
          style={{
            fontSize: 12,
            color: item.response && item.response.duration > 1000 ? '#f97316' : '#94a3b8',
          }}
        >
          {item.response?.duration || 0}ms
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <Link
          href={`/audit-logs/${item.id}`}
          style={{
            fontSize: 13,
            color: '#60a5fa',
            textDecoration: 'none',
            padding: '4px 8px',
            borderRadius: 4,
            background: 'rgba(96, 165, 250, 0.1)',
          }}
        >
          详情
        </Link>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px 32px', color: '#e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>审计日志</h1>
        <button
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: '#94a3b8',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          导出日志
        </button>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="日志总数" value={stats.total.toString()} />
        <StatCard label="成功操作" value={stats.success.toString()} accent="#4ade80" />
        <StatCard label="失败操作" value={stats.failed.toString()} accent="#ef4444" />
        <StatCard label="严重告警" value={stats.critical.toString()} accent="#f97316" />
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <SearchFilterInput
          placeholder="搜索操作/日志编号/操作人..."
          value={searchTerm}
          onChange={(v) => {
            setSearchTerm(v);
            setPage(0);
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as AuditLogStatus | 'all');
            setPage(0);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.25)',
            background: 'rgba(15,23,42,0.6)',
            color: '#e2e8f0',
            fontSize: 14,
          }}
        >
          <option value="all">全部状态</option>
          <option value="success">成功</option>
          <option value="failed">失败</option>
          <option value="partial">部分成功</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as AuditLogCategory | 'all');
            setPage(0);
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,0.25)',
            background: 'rgba(15,23,42,0.6)',
            color: '#e2e8f0',
            fontSize: 14,
          }}
        >
          <option value="all">全部类别</option>
          <option value="auth">认证授权</option>
          <option value="data">数据操作</option>
          <option value="config">配置变更</option>
          <option value="security">安全相关</option>
          <option value="business">业务操作</option>
        </select>

        <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>
          共 {filtered.length} 条记录
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : (
        <DataTable columns={columns} rows={paged} rowKey={(log: AuditLog) => log.id} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={page}
          total={filtered.length}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
