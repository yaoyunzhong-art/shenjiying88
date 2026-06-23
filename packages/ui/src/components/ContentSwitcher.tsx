'use client';

import React, { useState, useCallback } from 'react';

export interface ContentSwitcherSegment {
  /** Unique segment key */
  key: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Optional badge count */
  badge?: number;
  /** Disabled state */
  disabled?: boolean;
}

export interface ContentSwitcherProps {
  /** Segments to display */
  segments: ContentSwitcherSegment[];
  /** Currently selected segment key — controlled mode */
  selected?: string;
  /** Default selected segment key — uncontrolled mode */
  defaultSelected?: string;
  /** Called when selected segment changes */
  onSelect?: (key: string) => void;
  /** Visual variant */
  variant?: 'bar' | 'pills';
  /** Size */
  size?: 'sm' | 'md';
  /** Full width fills container */
  fullWidth?: boolean;
  /** Test id */
  'data-testid'?: string;
}

const SIZE_STYLES: Record<NonNullable<ContentSwitcherProps['size']>, { height: number; fontSize: number; paddingX: number; gap: number }> = {
  sm: { height: 32, fontSize: 13, paddingX: 12, gap: 2 },
  md: { height: 40, fontSize: 14, paddingX: 16, gap: 4 },
};

/**
 * ContentSwitcher — a segment control for toggling between content views.
 *
 * Used for filter toggles, view switching, and tab-like navigation inside cards/panels.
 * Supports bar (underline) and pills (filled) visual variants.
 */
export function ContentSwitcher({
  segments,
  selected: controlledSelected,
  defaultSelected,
  onSelect,
  variant = 'bar',
  size = 'md',
  fullWidth = false,
  'data-testid': dataTestId,
}: ContentSwitcherProps) {
  const [internalSelected, setInternalSelected] = useState<string>(
    defaultSelected ?? segments[0]?.key ?? '',
  );

  const selected = controlledSelected ?? internalSelected;

  const handleSelect = useCallback(
    (key: string) => {
      if (controlledSelected === undefined) {
        setInternalSelected(key);
      }
      onSelect?.(key);
    },
    [controlledSelected, onSelect],
  );

  const sizeStyle = SIZE_STYLES[size];

  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeStyle.gap,
    width: fullWidth ? '100%' : undefined,
    ...(variant === 'pills'
      ? {
          background: 'rgba(148, 163, 184, 0.08)',
          borderRadius: 12,
          padding: 3,
        }
      : {}),
  };

  return (
    <div data-testid={dataTestId} style={containerStyle} role="tablist">
      {segments.map((seg) => {
        const isSelected = selected === seg.key;
        const isDisabled = seg.disabled ?? false;

        const segmentStyle: React.CSSProperties = {
          ...(variant === 'bar'
            ? barSegmentStyle(isSelected, isDisabled, sizeStyle)
            : pillSegmentStyle(isSelected, isDisabled, sizeStyle)),
          flex: fullWidth ? 1 : undefined,
        };

        return (
          <button
            key={seg.key}
            role="tab"
            aria-selected={isSelected}
            aria-disabled={isDisabled}
            data-segment-key={seg.key}
            data-selected={isSelected ? 'true' : 'false'}
            disabled={isDisabled}
            onClick={() => {
              if (!isDisabled) handleSelect(seg.key);
            }}
            style={segmentStyle}
          >
            {seg.icon ? <span style={{ display: 'flex', alignItems: 'center', marginRight: 6 }}>{seg.icon}</span> : null}
            <span>{seg.label}</span>
            {seg.badge !== undefined && seg.badge > 0 ? (
              <span style={badgeStyle}>{seg.badge > 99 ? '99+' : seg.badge}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

type SizeStyle = { height: number; fontSize: number; paddingX: number; gap: number };

function barSegmentStyle(
  isSelected: boolean,
  disabled: boolean,
  size: SizeStyle,
): React.CSSProperties {
  return {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: size.height,
    padding: `0 ${size.paddingX}px`,
    fontSize: size.fontSize,
    fontWeight: isSelected ? 600 : 400,
    color: disabled
      ? 'rgba(148, 163, 184, 0.2)'
      : isSelected
        ? '#f8fafc'
        : '#94a3b8',
    background: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${isSelected ? '#38bdf8' : 'transparent'}`,
    borderRadius: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
    opacity: disabled ? 0.4 : 1,
  };
}

function pillSegmentStyle(
  isSelected: boolean,
  disabled: boolean,
  size: SizeStyle,
): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: size.height,
    padding: `0 ${size.paddingX}px`,
    fontSize: size.fontSize,
    fontWeight: isSelected ? 600 : 400,
    color: disabled
      ? 'rgba(148, 163, 184, 0.2)'
      : isSelected
        ? '#f8fafc'
        : '#94a3b8',
    background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
    border: 'none',
    borderRadius: 10,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s, color 0.15s',
    opacity: disabled ? 0.4 : 1,
  };
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  fontSize: 11,
  fontWeight: 700,
  color: '#0f172a',
  background: '#38bdf8',
  borderRadius: 9,
  marginLeft: 4,
};
