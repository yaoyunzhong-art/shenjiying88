'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageShell, StatusBadge } from '@m5/ui';
import {
  announcementService,
  type Announcement,
  type AnnouncementStatus,
  type AnnouncementCategory,
} from '../../lib/announcement-service';

const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  system: '系统',
  promotion: '促销',
  operation: '运营',
  emergency: '应急',
  training: '培训',
};

const CATEGORY_COLORS: Record<AnnouncementCategory, string> = {
  system: '#6366f1',
  promotion: '#f59e0b',
  operation: '#22c55e',
  emergency: '#ef4444',
  training: '#3b82f6',
};

const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
};

const STATUS_VARIANTS: Record<AnnouncementStatus, 'warning' | 'success' | 'error'> = {
  draft: 'warning',
  published: 'success',
  archived: 'error',
};

export default function AnnouncementsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AnnouncementCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await announcementService.listAnnouncements({
        page,
        pageSize,
        keyword: keyword || undefined,
        category: (categoryFilter as AnnouncementCategory) || undefined,
        status: (statusFilter as AnnouncementStatus) || undefined,
      });
      if (res.success && res.data) {
        setItems(res.data.items);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, keyword, categoryFilter, statusFilter]);

  useEffect(() => {
    const token = localStorage.getItem('enterprise_access_token');
    if (!token) {
      router.push('/enterprise/login');
      return;
    }
    fetchData();
  }, [router, fetchData]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchData();
  }

  function totalPages() {
    return Math.max(1, Math.ceil(total / pageSize));
  }

  return (
    <PageShell
      title="公告管理"
      subtitle={`共 ${total} 条公告`}
      actions={
        <Link
          href="/announcements/new"
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: '#fff',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          + 发布公告
        </Link>
      }
    >
      {/* 搜索与筛选栏 */}
      <div style={{ marginBottom: 24 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索公告标题、内容或作者..."
            style={{
              flex: 1,
              minWidth: 200,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#f8fafc',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value as AnnouncementCategory | ''); setPage(1); }}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#f8fafc',
              fontSize: 14,
              outline: 'none',
            }}
          >
            <option value="">全部分类</option>
            <option value="system">系统</option>
            <option value="promotion">促销</option>
            <option value="operation">运营</option>
            <option value="emergency">应急</option>
            <option value="training">培训</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as AnnouncementStatus | ''); setPage(1); }}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#f8fafc',
              fontSize: 14,
              outline: 'none',
            }}
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="archived">已归档</option>
          </select>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: 'rgba(102, 126, 234, 0.2)',
              border: '1px solid rgba(102, 126, 234, 0.4)',
              color: '#a5b4fc',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            搜索
          </button>
        </form>
      </div>

      {/* 公告列表 */}
      <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>加载中...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>暂无公告数据</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>标题</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>分类</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>优先级</th>
                <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>状态</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>发布人</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>阅读</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: index < items.length - 1 ? '1px solid rgba(148, 163, 184, 0.08)' : 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <Link href={`/announcements/${item.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontSize: 14, color: '#f8fafc', fontWeight: 500 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.summary}
                      </div>
                    </Link>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        background: `${CATEGORY_COLORS[item.category]}22`,
                        color: CATEGORY_COLORS[item.category],
                      }}
                    >
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: '#cbd5e1' }}>
                    {item.priority === 'urgent' ? '🔥 紧急' : item.priority === 'high' ? '⚠️ 高' : item.priority === 'normal' ? '普通' : '低'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <StatusBadge
                      label={STATUS_LABELS[item.status]}
                      variant={STATUS_VARIANTS[item.status]}
                      size="sm"
                    />
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: '#cbd5e1' }}>{item.author}</td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: 13, color: '#64748b', fontFamily: 'monospace' }}>
                    {item.readCount.toLocaleString()}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <Link
                      href={`/announcements/${item.id}`}
                      style={{ fontSize: 13, color: '#667eea', textDecoration: 'none' }}
                    >
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      {total > pageSize && (
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              background: page === 1 ? 'rgba(148, 163, 184, 0.1)' : 'rgba(102, 126, 234, 0.2)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: page === 1 ? '#64748b' : '#a5b4fc',
              fontSize: 13,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            上一页
          </button>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            第 {page} / {totalPages()} 页 (共 {total} 条)
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages()}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              background: page >= totalPages() ? 'rgba(148, 163, 184, 0.1)' : 'rgba(102, 126, 234, 0.2)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: page >= totalPages() ? '#64748b' : '#a5b4fc',
              fontSize: 13,
              cursor: page >= totalPages() ? 'not-allowed' : 'pointer',
            }}
          >
            下一页
          </button>
        </div>
      )}
    </PageShell>
  );
}
