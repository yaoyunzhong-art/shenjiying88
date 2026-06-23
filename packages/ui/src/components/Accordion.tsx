'use client';

import React, { useState, useCallback } from 'react';

export interface AccordionItem {
  key: string;
  title: string;
  content: React.ReactNode;
  disabled?: boolean;
  subtitle?: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow multiple items to be open simultaneously */
  multiple?: boolean;
  /** Default expanded item keys */
  defaultExpanded?: string[];
  /** Controlled expanded keys */
  expanded?: string[];
  /** Change handler for controlled mode */
  onExpandedChange?: (keys: string[]) => void;
  /** Visual variant */
  variant?: 'default' | 'bordered' | 'minimal';
  /** Size */
  size?: 'sm' | 'md';
}

export function Accordion({
  items,
  multiple = false,
  defaultExpanded = [],
  expanded: controlledExpanded,
  onExpandedChange,
  variant = 'default',
  size = 'md',
}: AccordionProps) {
  const [internalExpanded, setInternalExpanded] = useState<string[]>(defaultExpanded);

  const isControlled = controlledExpanded !== undefined;
  const expandedKeys = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = useCallback(
    (key: string) => {
      const current = expandedKeys;
      let next: string[];
      if (current.includes(key)) {
        next = current.filter((k) => k !== key);
      } else if (multiple) {
        next = [...current, key];
      } else {
        next = [key];
      }
      if (!isControlled) {
        setInternalExpanded(next);
      }
      onExpandedChange?.(next);
    },
    [expandedKeys, multiple, isControlled, onExpandedChange],
  );

  if (items.length === 0) return null;

  const fontSize = size === 'sm' ? 13 : 14;
  const titlePaddingV = size === 'sm' ? 8 : 12;
  const titlePaddingH = size === 'sm' ? 12 : 16;
  const contentPadding = size === 'sm' ? 12 : 16;
  const iconSize = size === 'sm' ? 14 : 16;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    ...(variant === 'bordered'
      ? {
          border: '1px solid rgba(148,163,184,0.14)',
          borderRadius: 12,
          overflow: 'hidden',
        }
      : {}),
  };

  return (
    <div style={containerStyle} role="region" aria-label="Accordion">
      {items.map((item, idx) => {
        const isExpanded = expandedKeys.includes(item.key);
        const isDisabled = item.disabled === true;
        const isFirst = idx === 0;
        const isLast = idx === items.length - 1;

        const itemContainerStyle: React.CSSProperties = {
          borderBottom:
            variant !== 'bordered' && !isLast
              ? '1px solid rgba(148,163,184,0.10)'
              : variant === 'bordered' && !isLast
                ? '1px solid rgba(148,163,184,0.10)'
                : 'none',
          ...(variant === 'minimal' && isExpanded
            ? { background: 'rgba(37,99,235,0.04)' }
            : {}),
        };

        const headerStyle: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          padding: `${titlePaddingV}px ${titlePaddingH}px`,
          fontSize,
          fontWeight: 500,
          color: isDisabled ? '#64748b' : '#e2e8f0',
          textAlign: 'left' as const,
          gap: 10,
          transition: 'background 0.15s ease',
          opacity: isDisabled ? 0.5 : 1,
          ...(variant === 'default' && isExpanded
            ? { background: 'rgba(37,99,235,0.06)' }
            : {}),
          ...(variant === 'bordered' && isExpanded
            ? { background: 'rgba(37,99,235,0.08)' }
            : {}),
        };

        const chevronStyle: React.CSSProperties = {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: iconSize,
          height: iconSize,
          transition: 'transform 0.2s ease',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          flexShrink: 0,
        };

        const titleAreaStyle: React.CSSProperties = {
          flex: 1,
          minWidth: 0,
        };

        const subtitleStyle: React.CSSProperties = {
          fontSize: fontSize - 2,
          color: '#64748b',
          marginTop: 2,
          fontWeight: 400,
        };

        const contentStyle: React.CSSProperties = {
          maxHeight: isExpanded ? '2000px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, padding 0.3s ease',
          padding: isExpanded
            ? `0 ${contentPadding}px ${contentPadding}px ${contentPadding}px`
            : `0 ${contentPadding}px`,
          color: '#cbd5e1',
          fontSize: fontSize - 1,
          lineHeight: 1.6,
        };

        return (
          <div key={item.key} style={itemContainerStyle} data-testid={`accordion-item-${item.key}`}>
            <button
              type="button"
              role="button"
              aria-expanded={isExpanded}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) handleToggle(item.key);
              }}
              style={headerStyle}
              data-testid={`accordion-header-${item.key}`}
            >
              <div style={titleAreaStyle}>
                <div>{item.title}</div>
                {item.subtitle && <div style={subtitleStyle}>{item.subtitle}</div>}
              </div>
              <span style={chevronStyle} aria-hidden="true">
                <svg
                  width={iconSize}
                  height={iconSize}
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                >
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </span>
            </button>
            <div
              role="region"
              aria-hidden={!isExpanded}
              style={contentStyle}
              data-testid={`accordion-content-${item.key}`}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
