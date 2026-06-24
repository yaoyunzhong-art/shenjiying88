'use client';

import React from 'react';

// ---- Types ----

export type TimelineItemVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface TimelineItem {
  /** Unique key for the item */
  key: string;
  /** Timestamp or heading text */
  heading: string;
  /** Optional subtitle / secondary text */
  subtitle?: string;
  /** Body content */
  content?: React.ReactNode;
  /** Visual variant for the dot + connecting line */
  variant?: TimelineItemVariant;
  /** Custom icon instead of the default dot */
  icon?: React.ReactNode;
  /** Whether this item represents a pending / future state */
  pending?: boolean;
}

export interface TimelineProps {
  /** Ordered list of timeline items (top to bottom) */
  items: TimelineItem[];
  /** Test id */
  'data-testid'?: string;
}

// ---- Variant styles ----

const VARIANT_STYLES: Record<TimelineItemVariant, { dot: string; line: string; heading: string }> = {
  default: {
    dot: 'rgba(148,163,184,0.6)',
    line: '1px solid rgba(148,163,184,0.18)',
    heading: '#e2e8f0',
  },
  success: {
    dot: '#34d399',
    line: '1px solid rgba(52,211,153,0.25)',
    heading: '#a7f3d0',
  },
  warning: {
    dot: '#fbbf24',
    line: '1px solid rgba(251,191,36,0.25)',
    heading: '#fde68a',
  },
  error: {
    dot: '#f87171',
    line: '1px solid rgba(248,113,113,0.25)',
    heading: '#fca5a5',
  },
  info: {
    dot: '#60a5fa',
    line: '1px solid rgba(96,165,250,0.25)',
    heading: '#93c5fd',
  },
};

// ---- Component ----

export const Timeline: React.FC<TimelineProps> = ({ items, 'data-testid': testId }) => {
  if (items.length === 0) {
    return (
      <div
        data-testid={testId}
        style={{ color: '#64748b', fontSize: 14, padding: '16px 0' }}
      >
        No timeline events.
      </div>
    );
  }

  return (
    <div
      data-testid={testId}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const variant = item.pending ? ('default' as const) : (item.variant ?? 'default');
        const styles = VARIANT_STYLES[variant];

        return (
          <div
            key={item.key}
            data-testid={`timeline-item-${item.key}`}
            style={{ display: 'flex', gap: 14, minHeight: 48 }}
          >
            {/* Dot + line column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flexShrink: 0,
                width: 16,
              }}
            >
              {/* Dot */}
              <div
                data-testid={`timeline-dot-${item.key}`}
                style={{
                  width: item.pending ? 10 : 12,
                  height: item.pending ? 10 : 12,
                  borderRadius: '50%',
                  backgroundColor: item.pending ? 'transparent' : styles.dot,
                  border: item.pending
                    ? `2px dashed ${styles.dot}`
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 4,
                }}
              >
                {item.icon && !item.pending && (
                  <span style={{ fontSize: 8, lineHeight: 1 }}>{item.icon}</span>
                )}
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  style={{
                    width: 0,
                    flex: 1,
                    borderLeft: styles.line,
                    minHeight: 12,
                  }}
                />
              )}
            </div>

            {/* Content column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                paddingBottom: isLast ? 0 : 16,
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                data-testid={`timeline-heading-${item.key}`}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: item.pending ? '#64748b' : styles.heading,
                  opacity: item.pending ? 0.6 : 1,
                }}
              >
                {item.heading}
              </div>

              {item.subtitle && (
                <div
                  data-testid={`timeline-subtitle-${item.key}`}
                  style={{
                    fontSize: 11,
                    color: '#64748b',
                    opacity: item.pending ? 0.5 : 1,
                  }}
                >
                  {item.subtitle}
                </div>
              )}

              {item.content && (
                <div
                  data-testid={`timeline-content-${item.key}`}
                  style={{
                    fontSize: 13,
                    color: '#94a3b8',
                    lineHeight: 1.5,
                    marginTop: 4,
                    opacity: item.pending ? 0.5 : 1,
                  }}
                >
                  {item.content}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
