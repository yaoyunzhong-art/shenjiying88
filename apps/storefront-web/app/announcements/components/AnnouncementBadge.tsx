/**
 * AnnouncementBadge — 公告类型/状态徽标
 */
'use client';

import React from 'react';

export type AnnouncementCategory = 'system' | 'operation' | 'promotion' | 'emergency';
export type AnnouncementStatus = 'published' | 'draft' | 'archived';

export const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  system: '系统通知',
  operation: '运营公告',
  promotion: '促销活动',
  emergency: '紧急通知',
};

export const CATEGORY_COLORS: Record<AnnouncementCategory, string> = {
  system: '#6366f1',
  operation: '#f59e0b',
  promotion: '#10b981',
  emergency: '#ef4444',
};

export const STATUS_LABELS: Record<AnnouncementStatus, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
};

export const STATUS_COLORS: Record<AnnouncementStatus, string> = {
  published: '#10b981',
  draft: '#9ca3af',
  archived: '#6b7280',
};

export function AnnouncementBadge({
  type,
  value,
}: {
  type: 'category' | 'status';
  value: string;
}): React.ReactElement {
  const colors = type === 'category' ? CATEGORY_COLORS : STATUS_COLORS;
  const labels = type === 'category' ? CATEGORY_LABELS : STATUS_LABELS;
  const color = colors[value as keyof typeof colors] ?? '#6b7280';
  const label = labels[value as keyof typeof labels] ?? value;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        backgroundColor: color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
