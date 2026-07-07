'use client';

import React from 'react';

export interface FeedbackEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  content: string;
  category: 'service' | 'product' | 'experience' | 'other';
  createdAt: string;
  resolved: boolean;
  reply?: string;
}

export interface FeedbackListProps {
  entries: FeedbackEntry[];
  maxItems?: number;
  onFeedbackClick?: (entry: FeedbackEntry) => void;
  onResolve?: (entryId: string) => void;
  emptyText?: string;
}

const CATEGORY_LABELS: Record<FeedbackEntry['category'], string> = {
  service: '服务',
  product: '产品',
  experience: '体验',
  other: '其他',
};

export function FeedbackList({
  entries,
  maxItems = 10,
  onFeedbackClick,
  onResolve,
  emptyText = '暂无反馈数据',
}: FeedbackListProps) {
  const displayEntries = entries.slice(0, maxItems);

  if (displayEntries.length === 0) {
    return (
      <div role="region" aria-label="反馈列表" data-testid="feedback-list-empty" style={{ padding: 32, textAlign: 'center', color: '#999', fontSize: 14 }}>
        {emptyText}
      </div>
    );
  }

  return (
    <div role="list" aria-label="反馈列表" data-testid="feedback-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {displayEntries.map((entry) => (
        <div
          key={entry.id}
          role="listitem"
          data-testid={`feedback-entry-${entry.id}`}
          onClick={() => onFeedbackClick?.(entry)}
          style={{
            padding: 12,
            borderRadius: 8,
            background: '#fff',
            border: '1px solid #f0f0f0',
            cursor: onFeedbackClick ? 'pointer' : 'default',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1677ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                {entry.userName.charAt(0)}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{entry.userName}</span>
              <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: '#e6f4ff', color: '#1677ff' }}>
                {CATEGORY_LABELS[entry.category]}
              </span>
              {entry.resolved && (
                <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: '#f6ffed', color: '#52c41a' }}>
                  已处理
                </span>
              )}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: entry.rating >= 4 ? '#52c41a' : entry.rating >= 3 ? '#faad14' : '#f5222d' }}>
              {'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#333' }}>{entry.content}</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: '#bbb' }}>{entry.createdAt}</span>
            {!entry.resolved && onResolve && (
              <button
                data-testid={`resolve-btn-${entry.id}`}
                onClick={(e) => { e.stopPropagation(); onResolve(entry.id); }}
                style={{ fontSize: 12, padding: '2px 10px', border: '1px solid #1677ff', borderRadius: 4, background: 'transparent', color: '#1677ff', cursor: 'pointer' }}
              >
                标记处理
              </button>
            )}
          </div>

          {entry.reply && (
            <div style={{ marginTop: 8, padding: 8, background: '#fafafa', borderRadius: 6, borderLeft: '3px solid #1677ff', fontSize: 13, color: '#666' }}>
              <strong>回复：</strong> {entry.reply}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
