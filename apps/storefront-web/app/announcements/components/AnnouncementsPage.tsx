/**
 * AnnouncementsPage — 公告管理列表页组件
 * 角色视角: 👔店长 / 📢运营
 * 功能: 公告搜索、类型筛选、状态筛选、分页
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnnouncementBadge, CATEGORY_LABELS, STATUS_LABELS } from './AnnouncementBadge';
import type { AnnouncementCategory, AnnouncementStatus } from './AnnouncementBadge';

/* ── Types ── */
export interface AnnouncementItem {
  id: string;
  title: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  summary: string;
  priority: 'high' | 'normal' | 'low';
  publishedAt: string;
  author: string;
  readCount: number;
}

export interface AnnouncementsPageProps {
  items: AnnouncementItem[];
  total: number;
  page: number;
  pageSize: number;
  categoryFilter?: string;
  statusFilter?: string;
  searchQuery?: string;
}

/* ── Constants ── */
export const ANNOUNCEMENT_CATEGORIES = ['全部', ...Object.keys(CATEGORY_LABELS)] as const;
export const ANNOUNCEMENT_STATUSES = ['全部', ...Object.keys(STATUS_LABELS)] as const;

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  normal: '#f59e0b',
  low: '#6b7280',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: '高',
  normal: '中',
  low: '低',
};

/* ── Helpers ── */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

/* ── Component ── */
export function AnnouncementsPage({
  items,
  total,
  page,
  pageSize,
  categoryFilter = '',
  statusFilter = '',
  searchQuery = '',
}: AnnouncementsPageProps): React.ReactElement {
  const [search, setSearch] = useState(searchQuery);
  const [category, setCategory] = useState(categoryFilter);
  const [status, setStatus] = useState(statusFilter);

  const filteredItems = items.filter((item) => {
    if (category && category !== '全部' && item.category !== category) return false;
    if (status && status !== '全部' && item.status !== status) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.summary.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>公告管理</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>共 {total} 条公告</p>
        </div>
        <Link
          href="/announcements/new"
          style={{
            padding: '10px 20px',
            backgroundColor: '#6366f1',
            color: '#fff',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          + 发布公告
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="搜索公告标题/摘要…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 260px',
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            fontSize: 14,
            backgroundColor: '#fff',
            outline: 'none',
          }}
        >
          {ANNOUNCEMENT_CATEGORIES.map((c) => (
            <option key={c} value={c === '全部' ? '' : c}>{c === '全部' ? '全部类型' : CATEGORY_LABELS[c as AnnouncementCategory]}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            fontSize: 14,
            backgroundColor: '#fff',
            outline: 'none',
          }}
        >
          {ANNOUNCEMENT_STATUSES.map((s) => (
            <option key={s} value={s === '全部' ? '' : s}>{s === '全部' ? '全部状态' : STATUS_LABELS[s as AnnouncementStatus]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={thStyle}>标题</th>
              <th style={thStyle}>类型</th>
              <th style={thStyle}>优先级</th>
              <th style={thStyle}>状态</th>
              <th style={thStyle}>发布日期</th>
              <th style={thStyle}>作者</th>
              <th style={thStyle}>阅读</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={tdStyle}>
                  <Link href={`/announcements/${item.id}`} style={{ color: '#374151', fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
                    {item.title}
                  </Link>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{item.summary.slice(0, 60)}{item.summary.length > 60 ? '…' : ''}</div>
                </td>
                <td style={tdStyle}><AnnouncementBadge type="category" value={item.category} /></td>
                <td style={tdStyle}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#fff',
                    backgroundColor: PRIORITY_COLORS[item.priority] ?? '#6b7280',
                  }}>
                    {PRIORITY_LABELS[item.priority] ?? item.priority}
                  </span>
                </td>
                <td style={tdStyle}><AnnouncementBadge type="status" value={item.status} /></td>
                <td style={tdStyle}>{formatDate(item.publishedAt)}</td>
                <td style={tdStyle}>{item.author}</td>
                <td style={tdStyle}>{item.readCount.toLocaleString()}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <Link href={`/announcements/${item.id}/edit`} style={actionLinkStyle}>编辑</Link>
                  <button
                    onClick={() => {
                      if (item.status === 'published' && confirm('确定归档此公告？')) {
                        alert('归档成功（Mock）');
                      }
                    }}
                    style={{ ...actionLinkStyle, background: 'none', cursor: 'pointer', border: 'none', font: 'inherit' }}
                    disabled={item.status !== 'published'}
                  >
                    归档
                  </button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                  暂无匹配的公告
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button disabled={page <= 1} style={pageBtnStyle(page <= 1)} onClick={() => {}}>上一页</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = start + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                style={{
                  ...pageBtnStyle(p === page),
                  fontWeight: p === page ? 700 : 400,
                  backgroundColor: p === page ? '#6366f1' : '#fff',
                  color: p === page ? '#fff' : '#374151',
                }}
                onClick={() => {}}
              >
                {p}
              </button>
            );
          })}
          <button disabled={page >= totalPages} style={pageBtnStyle(page >= totalPages)} onClick={() => {}}>下一页</button>
        </div>
      )}
    </div>
  );
}

/* ── Styles ── */
const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 12,
  fontWeight: 600,
  color: '#6b7280',
  textAlign: 'left',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 13,
  color: '#374151',
  verticalAlign: 'middle',
};

const actionLinkStyle: React.CSSProperties = {
  color: '#6366f1',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  marginRight: 12,
};

function pageBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}
