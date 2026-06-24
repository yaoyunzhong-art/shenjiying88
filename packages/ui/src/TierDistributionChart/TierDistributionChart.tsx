import React, { useMemo } from 'react';

export interface TierData {
  key: string;
  label: string;
  count: number;
  color: string;
}

export interface TierDistributionChartProps {
  /** Tier segments */
  tiers: TierData[];
  /** Total count for percentage calculation */
  total: number;
  /** Chart title */
  title?: string;
  /** Canvas size in px (default 240) */
  size?: number;
  /** Show total count in center of donut */
  showTotalInCenter?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Empty state text */
  emptyText?: string;
  /** Optional className */
  className?: string;
  /** Test id */
  'data-testid'?: string;
}

const DEFAULT_SIZE = 240;
const DEFAULT_EMPTY = '暂无等级分布数据';

/**
 * TierDistributionChart — a donut/radial chart for visualizing member tier
 * distribution. Uses pure SVG arcs with a doughnut hole. Suitable for
 * AI dashboards, role workbenches, and membership analytics.
 */
export function TierDistributionChart({
  tiers,
  total,
  title,
  size = DEFAULT_SIZE,
  showTotalInCenter = false,
  loading = false,
  emptyText = DEFAULT_EMPTY,
  className = '',
  'data-testid': dataTestId = 'tier-dist-chart',
}: TierDistributionChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size * 0.38;
  const innerRadius = size * 0.24;

  // Build arc data
  const arcs = useMemo(() => {
    if (!tiers.length || !total) return [];

    let currentAngle = -Math.PI / 2; // start at 12 o'clock
    return tiers.map((tier) => {
      const fraction = tier.count / total;
      const angle = fraction * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      // Outer arc path
      const x1 = cx + outerRadius * Math.cos(startAngle);
      const y1 = cy + outerRadius * Math.sin(startAngle);
      const x2 = cx + outerRadius * Math.cos(endAngle);
      const y2 = cy + outerRadius * Math.sin(endAngle);
      const largeArc = angle > Math.PI ? 1 : 0;

      // If fraction is 0, skip path
      const path =
        fraction > 0
          ? [
              `M ${x1} ${y1}`,
              `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
              `L ${cx + innerRadius * Math.cos(endAngle)} ${cy + innerRadius * Math.sin(endAngle)}`,
              `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${cx + innerRadius * Math.cos(startAngle)} ${cy + innerRadius * Math.sin(startAngle)}`,
              'Z',
            ].join(' ')
          : '';

      return { ...tier, fraction, path, startAngle, endAngle };
    });
  }, [tiers, total, cx, cy, outerRadius, innerRadius]);

  if (loading) {
    return (
      <div
        data-testid={`${dataTestId}-loading`}
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: '50%',
            background: '#e5e7eb',
            animation: 'pulse 2s infinite',
          }}
        />
      </div>
    );
  }

  if (!tiers.length || !total) {
    return (
      <div
        data-testid={`${dataTestId}-empty`}
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: 14,
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      className={className}
      data-testid={dataTestId}
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {title && (
        <div
          data-testid={`${dataTestId}-title`}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#374151',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          {title}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Donut chart */}
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} data-testid={`${dataTestId}-svg`}>
            {arcs.map((arc) =>
              arc.path ? (
                <path
                  key={arc.key}
                  data-testid={`${dataTestId}-segment-${arc.key}`}
                  d={arc.path}
                  fill={arc.color}
                  stroke="#fff"
                  strokeWidth={1}
                />
              ) : null
            )}
          </svg>

          {/* Center total */}
          {showTotalInCenter && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: size,
                height: size,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                data-testid={`${dataTestId}-total`}
                style={{ fontSize: size * 0.12, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}
              >
                {total}
              </div>
              <div
                data-testid={`${dataTestId}-total-label`}
                style={{ fontSize: size * 0.06, color: '#9ca3af' }}
              >
                总会员
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {arcs.map((arc) => {
            const pct = ((arc.count / total) * 100).toFixed(1);
            return (
              <div
                key={arc.key}
                data-testid={`${dataTestId}-legend-${arc.key}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 0',
                  fontSize: 13,
                  color: '#374151',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: arc.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {arc.label}
                </span>
                <span style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>
                  {arc.count}
                </span>
                <span style={{ color: '#9ca3af', whiteSpace: 'nowrap', fontSize: 12 }}>
                  ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TierDistributionChart;
