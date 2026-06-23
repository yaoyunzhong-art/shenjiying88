'use client';

import React from 'react';

// --------------- Breadcrumb types ---------------
export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Optional href — turns item into a link */
  href?: string;
  /** Optional click handler */
  onClick?: () => void;
}

export interface BreadcrumbProps {
  /** Ordered list of breadcrumb segments */
  items: BreadcrumbItem[];
  /** Custom separator (default '/') */
  separator?: React.ReactNode;
  /** Maximum items before collapsing to ellipsis */
  maxItems?: number;
  /** Test id for the nav wrapper */
  'data-testid'?: string;
}

// --------------- Breadcrumb ---------------
export function Breadcrumb({
  items,
  separator = '/',
  maxItems = 0,
  'data-testid': testId,
}: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null;
  }

  let visible = items;

  // Collapse middle items when maxItems is set
  if (maxItems > 0 && items.length > maxItems) {
    const breakpoint = Math.max(1, maxItems - 2);
    const head = items.slice(0, breakpoint);
    const tail = items.slice(-1);
    visible = [
      ...head,
      { label: '…' },
      ...tail,
    ];
  }

  return (
    <nav aria-label="Breadcrumb" data-testid={testId ?? 'breadcrumb'}>
      <ol
        style={{
          listStyle: 'none',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: 0,
          margin: 0,
          gap: 4,
        }}
      >
        {visible.map((item, idx) => {
          const isLast = idx === visible.length - 1;
          const isEllipsis = item.label === '…';

          return (
            <li
              key={`${item.label}-${idx}`}
              data-testid={
                isEllipsis
                  ? 'breadcrumb-ellipsis'
                  : `breadcrumb-item-${idx}`
              }
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {isEllipsis ? (
                <span aria-hidden="true" style={{ color: '#6b7280' }}>
                  {item.label}
                </span>
              ) : isLast ? (
                <span
                  aria-current="page"
                  style={{
                    fontWeight: 600,
                    color: '#111827',
                  }}
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  onClick={item.onClick}
                  style={{
                    color: '#4f46e5',
                    textDecoration: 'none',
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4f46e5',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit',
                  }}
                >
                  {item.label}
                </button>
              )}
              {!isLast && (
                <span
                  aria-hidden="true"
                  data-testid={`breadcrumb-sep-${idx}`}
                  style={{ color: '#9ca3af', marginLeft: 4, marginRight: 4 }}
                >
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
