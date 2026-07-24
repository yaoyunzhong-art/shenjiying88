'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { PageShell, StatusBadge, ConfirmActionDialog } from '@m5/ui';
import {
  announcementService,
  type Announcement,
  type AnnouncementStatus,
  type AnnouncementCategory,
} from '../../../lib/announcement-service';
import {
  getCachedEnterpriseUser,
  getEnterpriseAccessToken,
  hasEnterprisePermission,
} from '../../enterprise/lib/enterprise-session';

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

export default function AnnouncementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const announcementId = params.id as string;

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [canManageAnnouncement, setCanManageAnnouncement] = useState(false);

  useEffect(() => {
    const token = getEnterpriseAccessToken();
    const cachedUser = getCachedEnterpriseUser();
    if (!token || !cachedUser) {
      router.push('/enterprise/login');
      return;
    }
    if (!hasEnterprisePermission(cachedUser, 'announcement:read')) {
      router.push('/enterprise/console?denied=announcement.read');
      return;
    }
    setCanManageAnnouncement(
      hasEnterprisePermission(cachedUser, 'announcement:update') ||
        hasEnterprisePermission(cachedUser, 'announcement:publish') ||
        hasEnterprisePermission(cachedUser, 'announcement:archive'),
    );
    fetchAnnouncement();
  }, [router, announcementId]);

  async function fetchAnnouncement() {
    setLoading(true);
    setError('');
    try {
      const result = await announcementService.getAnnouncement(announcementId);
      if (result.success && result.data) {
        setAnnouncement(result.data);
      } else {
        setError(result.error?.message ?? '公告不存在');
      }
    } catch {
      setError('获取公告详情失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusTransition(newStatus: AnnouncementStatus) {
    const currentUser = getCachedEnterpriseUser();
    const requiredPermission = newStatus === 'published' ? 'announcement:publish' : 'announcement:archive';
    if (
      !hasEnterprisePermission(currentUser, requiredPermission) &&
      !hasEnterprisePermission(currentUser, 'announcement:update')
    ) {
      setError(`缺少 ${requiredPermission} 权限`);
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const result = await announcementService.updateStatus(announcementId, newStatus);
      if (result.success && result.data) {
        setAnnouncement(result.data);
      } else {
        setError(result.error?.message ?? '状态更新失败');
      }
    } catch {
      setError('状态更新失败');
    } finally {
      setActionLoading(false);
    }
  }

  function getNextStatuses(current: AnnouncementStatus): { status: AnnouncementStatus; label: string; color: string }[] {
    switch (current) {
      case 'draft':
        return [{ status: 'published', label: '发布公告', color: '#22c55e' }];
      case 'published':
        return [{ status: 'archived', label: '归档公告', color: '#f59e0b' }];
      case 'archived':
        return [];
    }
  }

  function formatDateTime(iso: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }}>
        <div style={{ color: '#94a3b8', fontSize: 14 }}>加载中...</div>
      </main>
    );
  }

  if (error && !announcement) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 16 }}>{error}</div>
          <Link
            href="/announcements"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: 'rgba(102, 126, 234, 0.2)',
              border: '1px solid rgba(102, 126, 234, 0.4)',
              color: '#a5b4fc',
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            返回公告列表
          </Link>
        </div>
      </main>
    );
  }

  if (!announcement) return null;

  const nextStatuses = getNextStatuses(announcement.status);

  return (
    <PageShell
      title={announcement.title}
      subtitle={`公告详情 · ${announcement.id}`}
      actions={
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/announcements"
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              background: 'rgba(148, 163, 184, 0.1)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              color: '#94a3b8',
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            返回列表
          </Link>
          {canManageAnnouncement && nextStatuses.map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatusTransition(action.status)}
              disabled={actionLoading}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                background: `${action.color}22`,
                border: `1px solid ${action.color}44`,
                color: action.color,
                fontSize: 14,
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              {actionLoading ? '处理中...' : action.label}
            </button>
          ))}
        </div>
      }
    >
      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* 状态与元信息 */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <StatusBadge label={STATUS_LABELS[announcement.status]} variant={STATUS_VARIANTS[announcement.status]} size="md" />
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500, background: `${CATEGORY_COLORS[announcement.category]}22`, color: CATEGORY_COLORS[announcement.category] }}>
          {CATEGORY_LABELS[announcement.category]}
        </span>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          发布人: {announcement.author}
        </span>
        <span style={{ fontSize: 13, color: '#94a3b8' }}>
          阅读量: {announcement.readCount.toLocaleString()}
        </span>
      </div>

      {/* 公告正文卡片 */}
      <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {announcement.content}
        </div>
      </div>

      {/* 时间信息 */}
      <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: '0 0 20px' }}>时间信息</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>创建时间</div>
            <div style={{ fontSize: 14, color: '#f8fafc', fontFamily: 'monospace' }}>{formatDateTime(announcement.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>发布时间</div>
            <div style={{ fontSize: 14, color: '#f8fafc', fontFamily: 'monospace' }}>{announcement.publishedAt ? formatDateTime(announcement.publishedAt) : '未发布'}</div>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>更新时间</div>
            <div style={{ fontSize: 14, color: '#f8fafc', fontFamily: 'monospace' }}>{formatDateTime(announcement.updatedAt)}</div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
