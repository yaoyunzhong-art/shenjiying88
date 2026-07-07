'use client';

import React, { useCallback, useMemo, useState } from 'react';
import type {
  AiABTestComparisonPanelProps,
  ABTestComparison,
  VariantStats,
  TestVariant,
} from './types';

// ── Inline Card helper ──────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 12,
        background: '#fff',
        padding: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Inline Badge helper ─────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
        background: color ?? '#e2e8f0',
        color: color ? '#fff' : '#475569',
      }}
    >
      {children}
    </span>
  );
}

// ── Pie-style progress bar (horizontal) ─────────────────────────────────────

function VariantBar({
  stats,
  color,
  label,
}: {
  stats: VariantStats;
  color: string;
  label: string;
}) {
  const rate = stats.totalExecutions > 0
    ? (stats.successCount / stats.totalExecutions) * 100
    : 0;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 4,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {stats.totalExecutions} 次 · 采纳 {stats.adoptionCount}
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: '#e2e8f0',
          overflow: 'hidden',
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: `${rate}%`,
            height: '100%',
            borderRadius: 4,
            background: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 4,
          fontSize: 11,
          color: '#64748b',
        }}
      >
        <span>成功率 {rate.toFixed(1)}%</span>
        <span>平均 {stats.avgDurationMs}ms</span>
        <span>置信度 {(stats.avgConfidence * 100).toFixed(0)}%</span>
        <span>节省 {stats.avgValueDelta.toFixed(1)}</span>
      </div>
    </div>
  );
}

// ── Single comparison card ────────────────────────────────────────────────

function ComparisonCard({
  comparison,
  onAdoptVariant,
  compact,
}: {
  comparison: ABTestComparison;
  onAdoptVariant?: (experimentId: string, variant: TestVariant) => void;
  compact?: boolean;
}) {
  const [adopting, setAdopting] = useState(false);

  const handleAdopt = useCallback(
    (variant: TestVariant) => {
      if (onAdoptVariant && !adopting) {
        setAdopting(true);
        onAdoptVariant(comparison.experimentId, variant);
        setTimeout(() => setAdopting(false), 1200);
      }
    },
    [onAdoptVariant, comparison.experimentId, adopting],
  );

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });

  const daysRunning = Math.round(
    (new Date(comparison.endedAt).getTime() -
      new Date(comparison.startedAt).getTime()) /
      86400000,
  );

  const badgeColor = comparison.isSignificant ? '#22c55e' : '#94a3b8';

  return (
    <Card
      style={{
        padding: compact ? 14 : 20,
        border: comparison.isSignificant
          ? '2px solid #22c55e'
          : '1px solid #e2e8f0',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: compact ? 10 : 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            {comparison.experimentName}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {comparison.ruleName} · {fmtDate(comparison.startedAt)} –{' '}
            {fmtDate(comparison.endedAt)}（{daysRunning} 天）
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge color={badgeColor}>
            p={comparison.pValue.toFixed(comparison.isSignificant ? 3 : 2)}
            {comparison.isSignificant ? ' ✅' : ' 不显著'}
          </Badge>
        </div>
      </div>

      {/* Variant comparison */}
      <div
        style={{
          display: 'flex',
          gap: compact ? 10 : 16,
          flexDirection: compact ? 'column' : 'row',
        }}
      >
        <VariantBar stats={comparison.variantA} color="#3b82f6" label="A 组（当前）" />
        <VariantBar stats={comparison.variantB} color="#8b5cf6" label="B 组（实验）" />
      </div>

      {/* Summary + actions */}
      <div
        style={{
          marginTop: compact ? 10 : 14,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, flex: 1 }}>
          {comparison.liftSummary}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {comparison.isSignificant && comparison.recommendedVariant ? (
            <button
              onClick={() => handleAdopt(comparison.recommendedVariant!)}
              disabled={adopting}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background: adopting ? '#cbd5e1' : '#22c55e',
                color: adopting ? '#64748b' : '#fff',
                fontWeight: 600,
                fontSize: 12,
                cursor: adopting ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {adopting ? '采纳中...' : `采纳 ${comparison.recommendedVariant} 方案`}
            </button>
          ) : (
            <span
              style={{
                fontSize: 11,
                color: '#94a3b8',
                fontStyle: 'italic',
              }}
            >
              待更多数据
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────

export function AiABTestComparisonPanel({
  comparisons,
  onAdoptVariant,
  compact = false,
}: AiABTestComparisonPanelProps) {
  const [showOnlySignificant, setShowOnlySignificant] = useState(false);
  const [sortBy, setSortBy] = useState<'pValue' | 'lift' | 'date'>('date');

  const filtered = useMemo(() => {
    let list = [...comparisons];
    if (showOnlySignificant) {
      list = list.filter((c) => c.isSignificant);
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case 'pValue':
          return a.pValue - b.pValue;
        case 'lift': {
          const aLift = Math.abs(a.variantB.avgValueDelta - a.variantA.avgValueDelta);
          const bLift = Math.abs(b.variantB.avgValueDelta - b.variantA.avgValueDelta);
          return bLift - aLift;
        }
        case 'date':
        default:
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      }
    });
    return list;
  }, [comparisons, showOnlySignificant, sortBy]);

  const sortOptions: { value: typeof sortBy; label: string }[] = [
    { value: 'date', label: '最近实验' },
    { value: 'pValue', label: '显著程度' },
    { value: 'lift', label: '提升幅度' },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
          AI A/B 实验对比
        </span>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={showOnlySignificant}
              onChange={(e) => setShowOnlySignificant(e.target.checked)}
              style={{ accentColor: '#22c55e' }}
            />
            仅显著
          </label>

          <div style={{ display: 'flex', gap: 4 }}>
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  background: sortBy === opt.value ? '#2563eb' : '#fff',
                  color: sortBy === opt.value ? '#fff' : '#374151',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 40,
              color: '#94a3b8',
              fontSize: 13,
            }}
          >
            暂无匹配的 A/B 实验数据
          </div>
        ) : (
          filtered.map((c) => (
            <ComparisonCard
              key={c.experimentId}
              comparison={c}
              onAdoptVariant={onAdoptVariant}
              compact={compact}
            />
          ))
        )}
      </div>
    </div>
  );
}
