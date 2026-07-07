/**
 * 销售报表列表组件 — ReportsPage
 * 角色视角: 👔店长 / 📊运营 / 💰财务
 * 功能: 搜索、报表类型筛选、日期范围、分页
 */
'use client';

import React from 'react';
import type { ReportStatus, ReportType } from './ReportStatusBadge';
import { REPORT_TYPES, REPORT_STATUS_LABEL, REPORT_STATUS_COLOR } from './ReportStatusBadge';

/* ── 报表 Item 类型 ── */
export interface ReportItem {
  id: string;
  title: string;
  type: ReportType;
  period: string;
  createdAt: string;
  status: ReportStatus;
  summary: string;
}

/* ── Props ── */
export interface ReportsPageProps {
  items: ReportItem[] | null | undefined;
  total: number;
  page: number;
  pageSize: number;
  searchQuery?: string;
  typeFilter?: ReportType | 'all';
  statusFilter?: ReportStatus | 'all';
}

/* ── 日期格式化 ── */
function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/* ── 生成页码 ── */
export function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

/* ── 计算总页数 ── */
export function calcTotalPages(total: number, pageSize: number): number {
  const s = typeof pageSize !== 'number' || pageSize < 1 ? 20 : Math.min(pageSize, 500);
  const t = typeof total !== 'number' || total < 0 ? 0 : total;
  return Math.max(1, Math.ceil(t / s));
}

/* ── 过滤 items ── */
export function filterReports(
  items: ReportItem[] | null | undefined,
  searchQuery: string,
  typeFilter: ReportType | 'all',
  statusFilter: ReportStatus | 'all',
): ReportItem[] {
  const safe = !items || !Array.isArray(items) ? [] : items;
  return safe.filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !item.title.toLowerCase().includes(q) &&
        !item.type.toLowerCase().includes(q) &&
        !item.summary.toLowerCase().includes(q)
      ) return false;
    }
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    return true;
  });
}

/* ── 分页 items ── */
export function paginateReports(
  filtered: ReportItem[],
  page: number,
  pageSize: number,
): ReportItem[] {
  const p = typeof page !== 'number' || page < 1 ? 1 : page;
  const s = typeof pageSize !== 'number' || pageSize < 1 ? 20 : Math.min(pageSize, 500);
  const start = (p - 1) * s;
  return filtered.slice(start, start + s);
}

/* ── Component ── */
export function ReportsPage({
  items,
  total,
  page,
  pageSize,
  searchQuery = '',
  typeFilter = 'all',
  statusFilter = 'all',
}: ReportsPageProps): React.ReactElement {
  const safeItems: ReportItem[] = items && Array.isArray(items) ? items : [];
  const safePageSize = typeof pageSize !== 'number' || pageSize < 1 ? 20 : Math.min(pageSize, 500);
  const safeTotal = typeof total !== 'number' || total < 0 ? 0 : total;
  const safeTotalPages = calcTotalPages(safeTotal, safePageSize);
  const safePage = typeof page !== 'number' || page < 1 ? 1 : Math.min(page, safeTotalPages);
  const filtered = filterReports(items, searchQuery, typeFilter, statusFilter);
  const pagedItems = paginateReports(filtered, safePage, safePageSize);

  /* 空数据 */
  if (safeItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }} data-testid="reports-empty">
        <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
        <p style={{ fontSize: 16, fontWeight: 500 }}>暂无报表数据</p>
        <p style={{ fontSize: 14 }}>请先运行销售统计任务生成报表</p>
      </div>
    );
  }

  /* 搜索结果为空 */
  if (filtered.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }} data-testid="reports-no-match">
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
        <p style={{ fontSize: 16, fontWeight: 500 }}>未找到匹配的报表</p>
        <p style={{ fontSize: 14 }}>试试调整搜索条件或筛选器</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 4 }}>
          📊 销售报表
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          查看各周期销售数据报表，支持搜索、筛选与导出
        </p>
      </div>

      {/* 搜索过滤栏 */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20,
        padding: 16, borderRadius: 12, background: '#f9fafb',
        border: '1px solid #e5e7eb',
      }} data-testid="reports-filter-bar">
        {/* 搜索框 */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            placeholder="🔍 搜索报表名称/摘要..."
            defaultValue={searchQuery}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid #d1d5db', fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
            }}
            data-testid="reports-search-input"
          />
        </div>

        {/* 类型筛选 */}
        <select
          defaultValue={typeFilter}
          style={{
            padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db',
            fontSize: 14, background: '#fff', cursor: 'pointer',
          }}
          data-testid="reports-type-filter"
        >
          <option value="all">全部类型</option>
          {REPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* 状态筛选 */}
        <select
          defaultValue={statusFilter}
          style={{
            padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db',
            fontSize: 14, background: '#fff', cursor: 'pointer',
          }}
          data-testid="reports-status-filter"
        >
          <option value="all">全部状态</option>
          {Object.entries(REPORT_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* 统计条 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12, fontSize: 13, color: '#6b7280',
      }}>
        <span data-testid="reports-count">
          共 {filtered.length} 条结果
          {filtered.length < safeItems.length && `（已筛选自 ${safeItems.length} 条）`}
        </span>
        <span>第 {safePage} / {safeTotalPages} 页</span>
      </div>

      {/* 卡片列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-testid="reports-list">
        {pagedItems.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 16, borderRadius: 12, background: '#fff',
              border: '1px solid #e5e7eb',
              transition: 'box-shadow 0.15s',
            }}
            data-testid={`report-card-${item.id}`}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 8,
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
                  {item.title}
                </h3>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 13, color: '#6b7280' }}>
                  <span>{REPORT_TYPES.find((t) => t.value === item.type)?.label || item.type}</span>
                  <span>·</span>
                  <span>📅 {item.period}</span>
                  <span>·</span>
                  <span>🕐 {formatDate(item.createdAt)}</span>
                </div>
              </div>
              <span style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                fontSize: 12, fontWeight: 600,
                background: REPORT_STATUS_COLOR[item.status]?.bg || '#f3f4f6',
                color: REPORT_STATUS_COLOR[item.status]?.fg || '#374151',
              }}>
                {REPORT_STATUS_LABEL[item.status] || item.status}
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
              {item.summary}
            </p>
          </div>
        ))}
      </div>

      {/* 分页 */}
      {safeTotalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 8, marginTop: 24,
        }} data-testid="reports-pagination">
          <button
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: '1px solid #d1d5db', background: '#fff',
              fontSize: 14, cursor: safePage > 1 ? 'pointer' : 'not-allowed',
              opacity: safePage > 1 ? 1 : 0.5,
            }}
            disabled={safePage <= 1}
            data-testid="reports-page-prev"
          >
            ← 上一页
          </button>

          {generatePageNumbers(safePage, safeTotalPages).map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} style={{ color: '#9ca3af', fontSize: 14 }}>...</span>
            ) : (
              <button
                key={p}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: safePage === p ? 'none' : '1px solid #d1d5db',
                  background: safePage === p ? '#2563eb' : '#fff',
                  color: safePage === p ? '#fff' : '#374151',
                  fontWeight: safePage === p ? 600 : 400,
                  fontSize: 14, cursor: 'pointer',
                }}
                data-testid={`reports-page-${p}`}
              >
                {p}
              </button>
            ),
          )}

          <button
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: '1px solid #d1d5db', background: '#fff',
              fontSize: 14, cursor: safePage < safeTotalPages ? 'pointer' : 'not-allowed',
              opacity: safePage < safeTotalPages ? 1 : 0.5,
            }}
            disabled={safePage >= safeTotalPages}
            data-testid="reports-page-next"
          >
            下一页 →
          </button>
        </div>
      )}
    </div>
  );
}
