/**
 * AnnouncementDetailPage — 公告详情页组件
 * 角色视角: 👔店长 / 📢运营
 * 功能: 公告内容展示、编辑入口、状态流转（发布/归档/删除）
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { AnnouncementBadge, CATEGORY_LABELS } from './AnnouncementBadge';
import type { AnnouncementCategory, AnnouncementStatus } from './AnnouncementBadge';

/* ── Types ── */
export interface AnnouncementDetail {
  id: string;
  title: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  content: string;
  priority: 'high' | 'normal' | 'low';
  publishedAt: string;
  author: string;
  readCount: number;
  attachments: { name: string; url: string }[];
}

export interface AnnouncementDetailPageProps {
  announcement: AnnouncementDetail | null;
}

/* ── Component ── */
export function AnnouncementDetailPage({ announcement }: AnnouncementDetailPageProps): React.ReactElement {
  if (!announcement) {
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📢</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginBottom: 8 }}>公告未找到</h1>
        <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>请检查链接是否正确，或返回公告列表查看</p>
        <Link href="/announcements" style={{ color: '#6366f1', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          ← 返回公告列表
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20, fontSize: 13, color: '#9ca3af' }}>
        <Link href="/announcements" style={{ color: '#6366f1', textDecoration: 'none' }}>公告管理</Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <span>{announcement.title}</span>
      </div>

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 32, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <AnnouncementBadge type="category" value={announcement.category} />
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: announcement.priority === 'high' ? '#ef4444' : announcement.priority === 'normal' ? '#f59e0b' : '#6b7280',
          }}>
            {announcement.priority === 'high' ? '高优先级' : announcement.priority === 'normal' ? '普通' : '低优先级'}
          </span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>{announcement.title}</h1>

        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#6b7280', marginBottom: 24, flexWrap: 'wrap' }}>
          <span>👤 {announcement.author}</span>
          <span>📅 {announcement.publishedAt}</span>
          <span>👁️ {announcement.readCount.toLocaleString()} 次阅读</span>
        </div>

        {/* Content */}
        <div style={{
          fontSize: 15,
          lineHeight: 1.8,
          color: '#374151',
          whiteSpace: 'pre-wrap',
          borderTop: '1px solid #f3f4f6',
          paddingTop: 24,
        }}>
          {announcement.content}
        </div>

        {/* Attachments */}
        {announcement.attachments.length > 0 && (
          <div style={{ marginTop: 24, borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 12px' }}>📎 附件</h3>
            {announcement.attachments.map((att, i) => (
              <a
                key={i}
                href={att.url}
                style={{
                  display: 'block',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#f9fafb',
                  color: '#6366f1',
                  fontSize: 13,
                  textDecoration: 'none',
                  marginBottom: 6,
                }}
              >
                {att.name}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <Link
          href={`/announcements/${announcement.id}/edit`}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            color: '#374151',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          编辑
        </Link>
        {announcement.status === 'draft' && (
          <button
            onClick={() => {
              if (confirm('确认发布此公告？')) alert('发布成功（Mock）');
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#10b981',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            发布
          </button>
        )}
        {announcement.status === 'published' && (
          <button
            onClick={() => {
              if (confirm('确认归档此公告？')) alert('归档成功（Mock）');
            }}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#f59e0b',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            归档
          </button>
        )}
        <button
          onClick={() => {
            if (confirm('确认删除此公告？此操作不可恢复。')) alert('删除成功（Mock）');
          }}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#ef4444',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          删除
        </button>
      </div>
    </div>
  );
}
