'use client';

import React from 'react';

// ---- Types ----

export type StepStatus = 'waiting' | 'processing' | 'completed' | 'error';

export interface StepItem {
  /** Step title */
  title: string;
  /** Step description / subtitle */
  description?: string;
  /** Custom icon (replaces step number) */
  icon?: React.ReactNode;
  /** Step status; defaults derived from `current` prop */
  status?: StepStatus;
  /** Whether the step is clickable */
  clickable?: boolean;
}

export type StepsSize = 'sm' | 'md' | 'lg';

export type StepsOrientation = 'horizontal' | 'vertical';

export interface StepsProps {
  /** Ordered list of steps */
  items: StepItem[];
  /** 0-based index of the current active step */
  current?: number;
  /** Visual size */
  size?: StepsSize;
  /** Direction */
  orientation?: StepsOrientation;
  /** Callback when a clickable step is clicked */
  onStepClick?: (index: number) => void;
  /** Whether to show connecting lines */
  showConnector?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Test id */
  'data-testid'?: string;
}

// ---- Style helpers ----

const SIZE_CONFIG: Record<StepsSize, { dot: number; fontSize: number; iconFont: number; gap: number }> = {
  sm: { dot: 24, fontSize: 12, iconFont: 12, gap: 8 },
  md: { dot: 32, fontSize: 14, iconFont: 14, gap: 12 },
  lg: { dot: 40, fontSize: 16, iconFont: 16, gap: 16 },
};

const STATUS_COLORS: Record<StepStatus, { bg: string; fg: string; line: string }> = {
  waiting: { bg: '#e5e7eb', fg: '#9ca3af', line: '#e5e7eb' },
  processing: { bg: '#6366f1', fg: '#ffffff', line: '#c7d2fe' },
  completed: { bg: '#22c55e', fg: '#ffffff', line: '#22c55e' },
  error: { bg: '#ef4444', fg: '#ffffff', line: '#ef4444' },
};

// ---- Sub components ----

interface StepDotProps {
  index: number;
  total: number;
  status: StepStatus;
  size: StepsSize;
  icon?: React.ReactNode;
  orientation: StepsOrientation;
  clickable: boolean;
  onClick?: () => void;
  showConnector: boolean;
}

const StepDot: React.FC<StepDotProps> = ({
  index,
  total,
  status,
  size,
  icon,
  orientation,
  clickable,
  onClick,
  showConnector,
}) => {
  const cfg = SIZE_CONFIG[size];
  const colors = STATUS_COLORS[status];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    ...(orientation === 'horizontal'
      ? { flexDirection: 'column', flex: total > 1 && showConnector ? 1 : undefined }
      : { flexDirection: 'row' }),
    ...(clickable ? { cursor: 'pointer' } : {}),
  };

  const dotWrapStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: cfg.dot,
    height: cfg.dot,
    borderRadius: '50%',
    backgroundColor: colors.bg,
    color: colors.fg,
    fontSize: cfg.iconFont,
    fontWeight: 600,
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
    transition: 'background-color 0.2s, transform 0.2s',
    ...(clickable && status === 'waiting'
      ? { border: `2px dashed ${colors.line}`, backgroundColor: '#fff', color: '#9ca3af' }
      : {}),
  };

  const connectorBefore = showConnector && index > 0;
  const connectorAfter = showConnector && index < total - 1;

  const lineStyle: React.CSSProperties = {
    backgroundColor: colors.line,
    transition: 'background-color 0.3s',
    ...(orientation === 'horizontal'
      ? { height: 2, flex: 1, minWidth: 16 }
      : { width: 2, flex: 1, minHeight: 16 }),
  };

  const isLastVertical = orientation === 'vertical' && index === total - 1;

  return (
    <div
      style={containerStyle}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      data-step-index={index}
    >
      {/* Connector before */}
      {connectorBefore && !isLastVertical && orientation === 'vertical' && <div style={lineStyle} />}
      {connectorBefore && orientation === 'horizontal' && <div style={lineStyle} />}

      {/* Dot row for vertical: line + dot */}
      <div style={{ display: 'flex', alignItems: 'center', ...(orientation === 'vertical' ? { flexDirection: 'row', alignItems: 'flex-start' } : {}) }}>
        {connectorBefore && orientation === 'horizontal' && <div style={{ width: cfg.gap, minWidth: cfg.gap }} />}

        <div style={dotWrapStyle}>
          {icon ? icon : status === 'completed' ? (
            <svg width={cfg.iconFont} height={cfg.iconFont} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : status === 'error' ? (
            <span>&times;</span>
          ) : (
            <span>{index + 1}</span>
          )}
        </div>

        {connectorAfter && orientation === 'horizontal' && <div style={{ width: cfg.gap, minWidth: cfg.gap }} />}
      </div>

      {/* Connector after (horizontal or vertical) */}
      {connectorAfter && orientation === 'horizontal' && <div style={lineStyle} />}
      {connectorAfter && orientation === 'vertical' && <div style={lineStyle} />}
    </div>
  );
};

// ---- Main component ----

function deriveStatus(
  index: number,
  current: number,
  explicitStatus?: StepStatus,
): StepStatus {
  if (explicitStatus) return explicitStatus;
  if (index < current) return 'completed';
  if (index === current) return 'processing';
  return 'waiting';
}

export const Steps: React.FC<StepsProps> = ({
  items,
  current = 0,
  size = 'md',
  orientation = 'horizontal',
  onStepClick,
  showConnector = true,
  className,
  style,
  'data-testid': dataTestId,
}) => {
  const cfg = SIZE_CONFIG[size];

  const wrapperStyle: React.CSSProperties = {
    display: 'flex',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    ...(orientation === 'horizontal'
      ? { flexDirection: 'row', alignItems: 'flex-start' }
      : { flexDirection: 'column' }),
    gap: orientation === 'vertical' ? 0 : undefined,
    ...style,
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    ...(orientation === 'horizontal'
      ? { flexDirection: 'column', alignItems: 'center', flex: showConnector ? 1 : undefined, minWidth: 80, textAlign: 'center' as const }
      : { flexDirection: 'row', alignItems: 'flex-start' }),
  };

  const textStyle = (status: StepStatus): React.CSSProperties => ({
    ...(orientation === 'horizontal' ? { marginTop: cfg.gap } : { marginLeft: cfg.gap }),
  });

  const titleStyle = (status: StepStatus): React.CSSProperties => ({
    fontSize: cfg.fontSize,
    fontWeight: status === 'processing' || status === 'completed' ? 600 : 400,
    color: status === 'waiting' ? '#9ca3af' : status === 'error' ? '#ef4444' : '#111827',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: orientation === 'horizontal' ? 120 : undefined,
  });

  const descStyle: React.CSSProperties = {
    fontSize: cfg.fontSize - 2,
    color: '#6b7280',
    lineHeight: 1.4,
    marginTop: 2,
    maxWidth: orientation === 'horizontal' ? 140 : undefined,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  return (
    <div
      style={wrapperStyle}
      className={className}
      data-testid={dataTestId}
      role="list"
      aria-label="Steps"
    >
      {items.map((item, idx) => {
        const derived = deriveStatus(idx, current, item.status);
        const isClickable = item.clickable ?? false;

        return (
          <div
            key={`step-${idx}`}
            style={itemStyle}
            data-testid={dataTestId ? `${dataTestId}-step-${idx}` : undefined}
            role="listitem"
          >
            <StepDot
              index={idx}
              total={items.length}
              status={derived}
              size={size}
              icon={item.icon}
              orientation={orientation}
              clickable={isClickable}
              onClick={() => onStepClick?.(idx)}
              showConnector={showConnector}
            />
            <div style={textStyle(derived)}>
              <div style={titleStyle(derived)}>{item.title}</div>
              {item.description && <div style={descStyle}>{item.description}</div>}
            </div>
            {/* Connector line for horizontal: after text */}
            {orientation === 'horizontal' && showConnector && idx < items.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 0,
                  borderTop: `2px solid ${STATUS_COLORS[derived].line}`,
                  marginTop: cfg.dot / 2 + cfg.gap,
                  marginLeft: cfg.gap,
                  marginRight: cfg.gap,
                  transition: 'border-color 0.3s',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Steps;
