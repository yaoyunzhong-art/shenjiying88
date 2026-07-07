'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 版本条目类型 */
export type VersionEntryType = 'major' | 'minor' | 'patch' | 'beta' | 'hotfix';

/** 单个版本条目 */
export interface VersionEntry {
  /** 版本号 */
  version: string;
  /** 发布时间 */
  date: string;
  /** 类型 */
  type: VersionEntryType;
  /** 标题 */
  title: string;
  /** 变更明细 */
  changes: {
    type: 'feature' | 'enhance' | 'fix' | 'deprecate' | 'security';
    description: string;
  }[];
  /** 作者 */
  author?: string;
  /** 是否当前版本 */
  isCurrent?: boolean;
}

/** VersionTimeline 属性 */
export interface VersionTimelineProps {
  /** 版本列表 */
  versions: VersionEntry[];
  /** 标题 */
  title?: string;
  /** 最多显示条目数 0=全部 */
  maxEntries?: number;
  /** 空状态文本 */
  emptyText?: string;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

// ==================== 样式 ====================

const TYPE_COLORS: Record<VersionEntryType, string> = {
  major: '#dc2626',
  minor: '#2563eb',
  patch: '#16a34a',
  beta: '#9333ea',
  hotfix: '#ea580c',
};

const TYPE_LABELS: Record<VersionEntryType, string> = {
  major: '大版本',
  minor: '小版本',
  patch: '补丁',
  beta: '测试版',
  hotfix: '热修复',
};

const CHANGE_STYLES: Record<VersionEntry['changes'][number]['type'], { label: string; color: string; bg: string }> = {
  feature: { label: '新增', color: '#16a34a', bg: '#dcfce7' },
  enhance: { label: '优化', color: '#2563eb', bg: '#dbeafe' },
  fix: { label: '修复', color: '#ea580c', bg: '#fff7ed' },
  deprecate: { label: '弃用', color: '#9333ea', bg: '#f3e8ff' },
  security: { label: '安全', color: '#dc2626', bg: '#fef2f2' },
};

const CONTAINER_STYLE: React.CSSProperties = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '16px',
};

const TITLE_STYLE: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  marginBottom: '20px',
  color: '#1e293b',
};

const TIMELINE_STYLE: React.CSSProperties = {
  position: 'relative',
  paddingLeft: '28px',
};

const LINE_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: '10px',
  top: '8px',
  bottom: '8px',
  width: '2px',
  backgroundColor: '#e2e8f0',
};

const ENTRY_STYLE: React.CSSProperties = {
  position: 'relative',
  marginBottom: '24px',
};

const DOT_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: '-22px',
  top: '6px',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  border: '2px solid #fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
};

const HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
  marginBottom: '4px',
};

const VERSION_TEXT_STYLE: React.CSSProperties = {
  fontWeight: 600,
  fontSize: '15px',
  color: '#1e293b',
};

const DATE_STYLE: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
};

const TITLE_TEXT_STYLE: React.CSSProperties = {
  fontSize: '13px',
  color: '#475569',
  marginBottom: '8px',
};

const CHANGES_CONTAINER: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
};

const CHANGE_BADGE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  lineHeight: '1.5',
};

const EMPTY_STYLE: React.CSSProperties = {
  padding: '32px',
  textAlign: 'center',
  color: '#94a3b8',
  fontSize: '14px',
};

// ==================== 组件 ====================

export function VersionTimeline({
  versions,
  title,
  maxEntries = 0,
  emptyText = '暂无版本记录',
  className,
  style,
}: VersionTimelineProps) {
  const displayVersions = maxEntries > 0 ? versions.slice(0, maxEntries) : versions;

  if (displayVersions.length === 0) {
    return (
      <div style={{ ...CONTAINER_STYLE, ...style }} className={className} role="region" aria-label={title || '版本时间线'}>
        {title && <div style={TITLE_STYLE}>{title}</div>}
        <div style={EMPTY_STYLE} role="status">{emptyText}</div>
      </div>
    );
  }

  return (
    <div style={{ ...CONTAINER_STYLE, ...style }} className={className} role="region" aria-label={title || '版本时间线'}>
      {title && <div style={TITLE_STYLE}>{title}</div>}
      <div style={TIMELINE_STYLE} role="list" aria-label="版本列表">
        <div style={LINE_STYLE} aria-hidden="true" />
        {displayVersions.map((entry, idx) => (
          <div key={entry.version} style={ENTRY_STYLE} role="listitem" aria-label={`版本 ${entry.version}`}>
            <div
              style={{
                ...DOT_STYLE,
                backgroundColor: entry.isCurrent ? TYPE_COLORS[entry.type] : '#fff',
                borderColor: TYPE_COLORS[entry.type],
              }}
              aria-hidden="true"
            />
            <div style={HEADER_STYLE}>
              <span style={VERSION_TEXT_STYLE}>v{entry.version}</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#fff',
                  backgroundColor: TYPE_COLORS[entry.type],
                  padding: '1px 6px',
                  borderRadius: '3px',
                }}
              >
                {TYPE_LABELS[entry.type]}
              </span>
              {entry.isCurrent && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#fff',
                    backgroundColor: '#6366f1',
                    padding: '1px 6px',
                    borderRadius: '3px',
                  }}
                >
                  当前
                </span>
              )}
              <span style={DATE_STYLE}>{entry.date}</span>
              {entry.author && <span style={DATE_STYLE}>by {entry.author}</span>}
            </div>
            <div style={TITLE_TEXT_STYLE}>{entry.title}</div>
            <div style={CHANGES_CONTAINER}>
              {entry.changes.map((change, ci) => {
                const cs = CHANGE_STYLES[change.type];
                return (
                  <span
                    key={ci}
                    style={{
                      ...CHANGE_BADGE,
                      color: cs.color,
                      backgroundColor: cs.bg,
                    }}
                    title={change.description}
                  >
                    <strong>{cs.label}</strong> {change.description}
                  </span>
                );
              })}
            </div>
            {idx < displayVersions.length - 1 && <div style={{ height: '0' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VersionTimeline;
