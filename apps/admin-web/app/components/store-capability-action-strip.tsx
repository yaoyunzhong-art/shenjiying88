'use client';

import Link from 'next/link';
import type { GatedCapabilityActionItem } from '../lyt-capability-access';

interface StoreCapabilityActionStripProps {
  title: string;
  description?: string;
  actions: readonly GatedCapabilityActionItem[];
  emptyHint?: string;
  style?: React.CSSProperties;
}

export function StoreCapabilityActionStrip({
  title,
  description,
  actions,
  emptyHint = '当前没有可展示的门店动作。',
  style
}: StoreCapabilityActionStripProps) {
  const visibleActions = actions.filter((item) => item.visibility === 'visible');

  return (
    <section
      style={{
        marginBottom: 16,
        borderRadius: 16,
        padding: 18,
        background: 'rgba(15, 23, 42, 0.35)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        ...style
      }}
    >
      <div style={{ color: '#f8fafc', fontSize: 16, fontWeight: 700 }}>{title}</div>
      {description ? <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>{description}</div> : null}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        {visibleActions.map((action) =>
          action.isDisabled ? (
            <div
              key={action.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                padding: '10px 14px',
                background: 'rgba(239,68,68,0.14)',
                color: '#fca5a5',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'not-allowed'
              }}
              title={action.hint}
            >
              {action.label}
            </div>
          ) : (
            <Link
              key={action.key}
              href={action.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                padding: '10px 14px',
                background: action.access === 'enabled' ? 'rgba(59,130,246,0.14)' : 'rgba(245,158,11,0.16)',
                color: action.access === 'enabled' ? '#93c5fd' : '#fbbf24',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600
              }}
              title={action.hint}
            >
              {action.label}
            </Link>
          )
        )}
      </div>
      {!visibleActions.length ? <div style={{ marginTop: 12, color: '#94a3b8', fontSize: 13 }}>{emptyHint}</div> : null}
    </section>
  );
}
