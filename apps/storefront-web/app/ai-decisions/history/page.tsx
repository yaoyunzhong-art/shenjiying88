/**
 * AI决策规则历史列表页 — Rule Execution History (Next.js App Router Page)
 * 展示历史规则执行记录、搜索/过滤/分页、快速动作
 */
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  StatusBadge,
  Pagination,
  SearchFilterInput,
  FilterChips,
  Spinner,
} from '@m5/ui';

// ============================================================
// Types
// ============================================================

export interface RuleExecutionRecord {
  id: string;
  ruleName: string;
  category: 'governance' | 'member' | 'inventory' | 'promotion' | 'device' | 'payment';
  status: 'passed' | 'warning' | 'failed';
  confidence: number;
  suggestion: string;
  matchedCount: number;
  durationMs: number;
  executedAt: string;
}

// ============================================================
// Mock data
// ============================================================

const MOCK_RECORDS: RuleExecutionRecord[] = (() => {
  const statuses: RuleExecutionRecord['status'][] = ['passed', 'warning', 'failed'];
  const categories: RuleExecutionRecord['category'][] = [
    'governance', 'member', 'inventory', 'promotion', 'device', 'payment',
  ];
  const names = [
    '会员折扣合规校验', '库存流动性检测', '促销重叠检测', '会员流失预警',
    '支付渠道对账', '设备负载检测', '价格一致性校验', '商品上下架审核',
    '库存预警阈值', '优惠券发放校验', '新客标签匹配', '退货风控检查',
    '自动补货触发', '活动排期冲突', '配送时效监控',
  ];
  const result: RuleExecutionRecord[] = [];
  for (let i = 0; i < 48; i++) {
    const idx = i % names.length;
    result.push({
      id: `rule-${String(i + 1).padStart(3, '0')}`,
      ruleName: names[idx]!,
      category: categories[i % categories.length]!,
      status: statuses[i % statuses.length]!,
      confidence: +(0.65 + Math.random() * 0.35).toFixed(2),
      suggestion: `规则「${names[idx]}」执行完成`,
      matchedCount: Math.floor(Math.random() * 200),
      durationMs: Math.floor(Math.random() * 3000) + 50,
      executedAt: new Date(Date.now() - i * 3600000 - Math.random() * 3600000).toISOString(),
    });
  }
  return result;
})();

// ============================================================
// Helpers
// ============================================================

const CATEGORY_LABELS: Record<RuleExecutionRecord['category'], string> = {
  governance: '合规',
  member: '会员',
  inventory: '库存',
  promotion: '促销',
  device: '设备',
  payment: '支付',
};

const STATUS_LABELS: Record<RuleExecutionRecord['status'], string> = {
  passed: '通过',
  warning: '警告',
  failed: '失败',
};

const STATUS_VARIANTS: Record<RuleExecutionRecord['status'], 'success' | 'warning' | 'error'> = {
  passed: 'success',
  warning: 'warning',
  failed: 'error',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ============================================================
// Styles
// ============================================================

const styles = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '24px 20px',
  },
  header: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 24,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  controls: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    borderRadius: 12,
    overflow: 'hidden',
    background: 'rgba(15,23,42,0.25)',
    border: '1px solid rgba(148,163,184,0.1)',
  },
  th: {
    padding: '12px 14px',
    textAlign: 'left' as const,
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    borderBottom: '1px solid rgba(148,163,184,0.12)',
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
  },
  td: {
    padding: '11px 14px',
    fontSize: 13,
    color: '#e2e8f0',
    borderBottom: '1px solid rgba(148,163,184,0.06)',
  },
  tr: {
    transition: 'background 0.15s',
  },
  rowLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'table-row' as const,
  },
  confidenceBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    maxWidth: 80,
  },
  empty: {
    textAlign: 'center' as const,
    padding: '48px 16px',
    color: '#64748b',
    fontSize: 14,
  },
  summaryRow: {
    display: 'flex' as const,
    gap: 16,
    flexWrap: 'wrap' as const,
    marginBottom: 20,
  },
  summaryChip: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 6,
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 13,
    background: 'rgba(15,23,42,0.3)',
    border: '1px solid rgba(148,163,184,0.08)',
    color: '#cbd5e1',
  },
  summaryVal: {
    fontWeight: 700,
  },
  actionBtn: {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid rgba(148,163,184,0.15)',
    background: 'rgba(15,23,42,0.3)',
    color: '#94a3b8',
    fontSize: 12,
    cursor: 'pointer' as const,
    transition: 'all 0.15s',
  },
};

// ============================================================
// Page Component
// ============================================================

export default function AIDecisionHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RuleExecutionRecord['status'] | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<RuleExecutionRecord['category'] | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'executedAt', dir: 'desc' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ---- filtering ----
  const filtered = useMemo(() => {
    let items = [...MOCK_RECORDS];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter(
        (r) =>
          r.ruleName.toLowerCase().includes(q) ||
          r.suggestion.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') {
      items = items.filter((r) => r.status === statusFilter);
    }
    if (categoryFilter !== 'ALL') {
      items = items.filter((r) => r.category === categoryFilter);
    }

    // sort
    items.sort((a, b) => {
      let cmp = 0;
      if (sort.key === 'executedAt') cmp = new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime();
      else if (sort.key === 'ruleName') cmp = a.ruleName.localeCompare(b.ruleName);
      else if (sort.key === 'confidence') cmp = a.confidence - b.confidence;
      else if (sort.key === 'matchedCount') cmp = a.matchedCount - b.matchedCount;
      else if (sort.key === 'durationMs') cmp = a.durationMs - b.durationMs;
      else if (sort.key === 'status') cmp = a.status.localeCompare(b.status);
      return sort.dir === 'desc' ? -cmp : cmp;
    });

    return items;
  }, [searchTerm, statusFilter, categoryFilter, sort]);

  // ---- pagination ----
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ---- summary stats ----
  const summary = useMemo(() => {
    const passed = filtered.filter((r) => r.status === 'passed').length;
    const warning = filtered.filter((r) => r.status === 'warning').length;
    const failed = filtered.filter((r) => r.status === 'failed').length;
    const avgConfidence = filtered.length
      ? filtered.reduce((s, r) => s + r.confidence, 0) / filtered.length
      : 0;
    return { passed, warning, failed, avgConfidence, total: filtered.length };
  }, [filtered]);

  // ---- sort toggle ----
  const handleSort = (key: string) => {
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
    setPage(1);
  };

  const sortIcon = (key: string) => {
    if (sort.key !== key) return ' ↕';
    return sort.dir === 'asc' ? ' ↑' : ' ↓';
  };

  // ---- re-run action ----
  const handleReRun = useCallback(async (id: string) => {
    setActionLoading(id);
    await new Promise((r) => setTimeout(r, 1000));
    setActionLoading(null);
  }, []);

  // Reset page on filter change
  React.useEffect(() => { setPage(1); }, [searchTerm, statusFilter, categoryFilter]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📋 规则执行历史</h1>
          <p style={styles.subtitle}>
            共 {MOCK_RECORDS.length} 条执行记录，显示最近 {filtered.length} 条匹配结果
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryChip}>
          总计 <span style={{ ...styles.summaryVal, color: '#a78bfa' }}>{summary.total}</span>
        </div>
        <div style={styles.summaryChip}>
          通过 <span style={{ ...styles.summaryVal, color: '#4ade80' }}>{summary.passed}</span>
        </div>
        <div style={styles.summaryChip}>
          警告 <span style={{ ...styles.summaryVal, color: '#facc15' }}>{summary.warning}</span>
        </div>
        <div style={styles.summaryChip}>
          失败 <span style={{ ...styles.summaryVal, color: '#ef4444' }}>{summary.failed}</span>
        </div>
        <div style={styles.summaryChip}>
          平均置信度 <span style={{ ...styles.summaryVal, color: '#60a5fa' }}>
            {(summary.avgConfidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ ...styles.controls, marginBottom: 16 }}>
        <SearchFilterInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="搜索规则名称、ID…"
        />
        {/* 状态选择器 — 单选标签组 */}
        {(() => {
          const statusOptions = [
            { label: '全部', value: 'ALL' as const },
            { label: '通过', value: 'passed' as const },
            { label: '警告', value: 'warning' as const },
            { label: '失败', value: 'failed' as const },
          ];
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>状态</span>
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    border: statusFilter === opt.value
                      ? '1.5px solid rgba(96,165,250,0.5)'
                      : '1px solid rgba(148,163,184,0.15)',
                    background: statusFilter === opt.value
                      ? 'rgba(59,130,246,0.12)'
                      : 'rgba(15,23,42,0.3)',
                    color: statusFilter === opt.value ? '#93c5fd' : '#94a3b8',
                    fontSize: 12,
                    cursor: 'pointer',
                    lineHeight: 1.4,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    if (statusFilter !== opt.value) {
                      el.style.background = 'rgba(148,163,184,0.1)';
                      el.style.color = '#cbd5e1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    if (statusFilter !== opt.value) {
                      el.style.background = 'rgba(15,23,42,0.3)';
                      el.style.color = '#94a3b8';
                    }
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          );
        })()}
        {/* 分类选择器 — 单选标签组 */}
        {(() => {
          const categoryOptions = [
            { label: '全部', value: 'ALL' as const },
            { label: '合规', value: 'governance' as const },
            { label: '会员', value: 'member' as const },
            { label: '库存', value: 'inventory' as const },
            { label: '促销', value: 'promotion' as const },
            { label: '设备', value: 'device' as const },
            { label: '支付', value: 'payment' as const },
          ];
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>分类</span>
              {categoryOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCategoryFilter(opt.value)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 999,
                    border: categoryFilter === opt.value
                      ? '1.5px solid rgba(96,165,250,0.5)'
                      : '1px solid rgba(148,163,184,0.15)',
                    background: categoryFilter === opt.value
                      ? 'rgba(59,130,246,0.12)'
                      : 'rgba(15,23,42,0.3)',
                    color: categoryFilter === opt.value ? '#93c5fd' : '#94a3b8',
                    fontSize: 12,
                    cursor: 'pointer',
                    lineHeight: 1.4,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    if (categoryFilter !== opt.value) {
                      el.style.background = 'rgba(148,163,184,0.1)';
                      el.style.color = '#cbd5e1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    if (categoryFilter !== opt.value) {
                      el.style.background = 'rgba(15,23,42,0.3)';
                      el.style.color = '#94a3b8';
                    }
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Table */}
      {paged.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div>未找到匹配的规则执行记录</div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
            试试调整搜索关键词或过滤条件
          </div>
        </div>
      ) : (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} onClick={() => handleSort('ruleName')}>
                  规则名称{sortIcon('ruleName')}
                </th>
                <th style={styles.th}>分类</th>
                <th style={styles.th} onClick={() => handleSort('status')}>
                  状态{sortIcon('status')}
                </th>
                <th style={styles.th} onClick={() => handleSort('confidence')}>
                  置信度{sortIcon('confidence')}
                </th>
                <th style={styles.th} onClick={() => handleSort('matchedCount')}>
                  命中数{sortIcon('matchedCount')}
                </th>
                <th style={styles.th} onClick={() => handleSort('durationMs')}>
                  耗时{sortIcon('durationMs')}
                </th>
                <th style={styles.th} onClick={() => handleSort('executedAt')}>
                  执行时间{sortIcon('executedAt')}
                </th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((record) => (
                <tr
                  key={record.id}
                  style={styles.tr}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(148,163,184,0.04)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600 }}>{record.ruleName}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{record.id}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(148,163,184,0.1)',
                      color: '#94a3b8',
                    }}>
                      {CATEGORY_LABELS[record.category]}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <StatusBadge variant={STATUS_VARIANTS[record.status]} label={STATUS_LABELS[record.status]} />
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, color: record.confidence > 0.85 ? '#4ade80' : record.confidence > 0.7 ? '#facc15' : '#ef4444' }}>
                      {(record.confidence * 100).toFixed(0)}%
                    </div>
                    <div style={{
                      ...styles.confidenceBar,
                      width: `${record.confidence * 80}px`,
                      background: record.confidence > 0.85 ? 'rgba(74,222,128,0.4)' : record.confidence > 0.7 ? 'rgba(250,204,21,0.4)' : 'rgba(239,68,68,0.4)',
                    }} />
                  </td>
                  <td style={{ ...styles.td, fontVariantNumeric: 'tabular-nums' }}>
                    {record.matchedCount}
                  </td>
                  <td style={{ ...styles.td, fontVariantNumeric: 'tabular-nums' }}>
                    {formatDuration(record.durationMs)}
                  </td>
                  <td style={{ ...styles.td, fontSize: 12, color: '#94a3b8' }}>
                    {formatDate(record.executedAt)}
                  </td>
                  <td style={styles.td}>
                    <button
                      style={{
                        ...styles.actionBtn,
                        ...(actionLoading === record.id ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                      }}
                      disabled={actionLoading !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReRun(record.id);
                      }}
                    >
                      {actionLoading === record.id ? '执行中…' : '重新执行'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <Pagination
              page={page}
              total={filtered.length}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#475569' }}>
        规则执行历史自动保留最近30天 · 共 {MOCK_RECORDS.length} 条记录
      </div>
    </div>
  );
}
