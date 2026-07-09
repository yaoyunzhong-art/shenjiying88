'use client';

import React from 'react';

export type FabPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'top-right'
  | 'top-left'
  | 'bottom-center'
  | 'top-center';

export type FabSize = 'sm' | 'md' | 'lg';

export interface FloatingActionButtonProps {
  /** Primary icon or content */
  icon?: React.ReactNode;
  /** Click handler */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Position preset. Default: 'bottom-right' */
  position?: FabPosition;
  /** Button size. Default: 'md' */
  size?: FabSize;
  /** Badge count (number shows badge) */
  badge?: number;
  /** Badge max count. Default: 99 */
  badgeMax?: number;
  /** Background color. Default: '#3b82f6' */
  backgroundColor?: string;
  /** Text/icon color. Default: '#ffffff' */
  color?: string;
  /** Hover background color. Default: '#2563eb' */
  hoverBackgroundColor?: string;
  /** Whether to show a label next to the icon */
  label?: string;
  /** Label position. Default: 'left' when position contains 'right' */
  labelPosition?: 'left' | 'right' | 'top' | 'bottom';
  /** Tooltip text on hover */
  tooltip?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Extra className */
  className?: string;
  /** Inline style override */
  style?: React.CSSProperties;
  /** ARIA label */
  'aria-label'?: string;
  /** Test id */
  'data-testid'?: string;
}

const POSITION_STYLES: Record<FabPosition, React.CSSProperties> = {
  'bottom-right': { bottom: 24, right: 24 },
  'bottom-left': { bottom: 24, left: 24 },
  'top-right': { top: 24, right: 24 },
  'top-left': { top: 24, left: 24 },
  'bottom-center': { bottom: 24, left: '50%', transform: 'translateX(-50%)' },
  'top-center': { top: 24, left: '50%', transform: 'translateX(-50%)' },
};

const SIZE_MAP: Record<FabSize, number> = {
  sm: 36,
  md: 48,
  lg: 60,
};

const SIZE_FONT: Record<FabSize, number> = {
  sm: 14,
  md: 18,
  lg: 24,
};

/**
 * FloatingActionButton — a floating action button (FAB) for primary actions.
 *
 * Supports positioning, badge, label, tooltip, custom sizes and colors.
 */
export function FloatingActionButton({
  icon,
  onClick,
  position = 'bottom-right',
  size = 'md',
  badge,
  badgeMax = 99,
  backgroundColor = '#3b82f6',
  color = '#ffffff',
  hoverBackgroundColor = '#2563eb',
  label,
  labelPosition,
  tooltip,
  disabled = false,
  className,
  style,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}: FloatingActionButtonProps) {
  const [hovered, setHovered] = React.useState(false);
  const btnSize = SIZE_MAP[size];
  const iconSize = SIZE_FONT[size];
  const pos = POSITION_STYLES[position];

  const resolvedLabelPosition = labelPosition ?? (
    position.includes('right') ? 'left' : 'right'
  );

  const displayBadge = badge !== undefined && badge > 0
    ? badge > badgeMax ? `${badgeMax}+` : String(badge)
    : undefined;

  const content = (
    <button
      data-testid={dataTestId}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel ?? (typeof label === 'string' ? label : 'Floating action')}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={tooltip}
      style={{
        position: 'fixed',
        ...pos,
        width: label ? undefined : btnSize,
        height: label ? undefined : btnSize,
        minWidth: label ? undefined : btnSize,
        minHeight: label ? undefined : btnSize,
        borderRadius: label ? '24px' : '50%',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: label ? '8px 16px' : 0,
        backgroundColor: disabled ? '#9ca3af' : hovered ? hoverBackgroundColor : backgroundColor,
        color,
        fontSize: iconSize,
        boxShadow: disabled ? 'none' : '0 4px 14px rgba(0,0,0,0.25)',
        transition: 'background-color 0.2s, box-shadow 0.2s, transform 0.15s',
        transform: hovered && !disabled ? 'scale(1.08)' : 'scale(1)',
        zIndex: 1050,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {icon}
      {label && (
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.2,
            order: resolvedLabelPosition === 'right' ? 1 : -1,
          }}
        >
          {label}
        </span>
      )}
    </button>
  );

  return (
    <>
      {content}
      {displayBadge && (
        <span
          data-testid={dataTestId ? `${dataTestId}-badge` : undefined}
          style={{
            position: 'fixed',
            ...pos,
            top: pos.top
              ? `calc(${typeof pos.top === 'number' ? `${pos.top}px` : pos.top} - 4px)`
              : undefined,
            bottom: pos.bottom
              ? `calc(${typeof pos.bottom === 'number' ? `${pos.bottom}px` : pos.bottom} + ${btnSize - 8}px)`
              : undefined,
            left: pos.left
              ? `calc(${typeof pos.left === 'number' ? `${pos.left}px` : pos.left} + ${btnSize - 12}px)`
              : pos.left,
            right: pos.right
              ? `calc(${typeof pos.right === 'number' ? `${pos.right}px` : pos.right} - 4px)`
              : undefined,
            transform: 'translate(50%, -50%)',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: '#ef4444',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            zIndex: 1051,
            lineHeight: 1,
          }}
        >
          {displayBadge}
        </span>
      )}
    </>
  );
}
