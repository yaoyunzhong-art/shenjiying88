'use client';

import Link from 'next/link';
import { StatusBadge } from '@m5/ui';
import {
  accessMeta,
  readinessMeta,
  type CapabilityTenantContext
} from '../lyt-capability-access';
import { StoreCapabilityActionStrip } from './store-capability-action-strip';
import { useStoreCapabilityGating } from './use-store-capability-gating';

interface StoreCapabilityGatingBannerProps {
  title: string;
  description: string;
  targetCapabilities: readonly string[];
  surfaceHref: string;
  surfaceLabel: string;
  defaultStoreId?: string;
  tenantContext?: CapabilityTenantContext;
}

export function StoreCapabilityGatingBanner({
  title,
  description,
  targetCapabilities,
  surfaceHref,
  surfaceLabel,
  defaultStoreId = 'store-001',
  tenantContext
}: StoreCapabilityGatingBannerProps) {
  const {
    storeId,
    snapshot,
    isLoading,
    visibleEntrypoints,
    visibleActions,
    degradedCount,
    blockedCount,
    hiddenCount,
    recommendedEntrypoint
  } = useStoreCapabilityGating({
    targetCapabilities,
    defaultStoreId,
    tenantContext
  });

  return (
    <section
      style={{
        marginBottom: 16,
        borderRadius: 16,
        padding: 18,
        background: 'rgba(15, 23, 42, 0.35)',
        border: '1px solid rgba(148, 163, 184, 0.18)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>{title}</div>
          <div style={{ marginTop: 6, color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>{description}</div>
          <div style={{ marginTop: 8, color: '#94a3b8', fontSize: 13 }}>
            目标门店：{storeId}。数据源：
            {isLoading ? '同步中' : snapshot?.deliveryMode === 'api' ? '真实 access view' : 'fallback access view'}。
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Link href={surfaceHref} style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }}>
            {surfaceLabel}
          </Link>
          <Link href={`/stores/${storeId}/capability-access`} style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 600 }}>
            查看能力矩阵
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 16 }}>
        <article style={metricCardStyle}>
          <div style={metricLabelStyle}>降级入口</div>
          <div style={metricValueStyle}>{degradedCount}</div>
          <div style={metricHintStyle}>允许进入，但需保留治理提示</div>
        </article>
        <article style={metricCardStyle}>
          <div style={metricLabelStyle}>阻塞入口</div>
          <div style={{ ...metricValueStyle, color: '#fca5a5' }}>{blockedCount}</div>
          <div style={metricHintStyle}>优先补齐配置与映射后再开放</div>
        </article>
        <article style={metricCardStyle}>
          <div style={metricLabelStyle}>隐藏入口</div>
          <div style={{ ...metricValueStyle, color: '#cbd5e1' }}>{hiddenCount}</div>
          <div style={metricHintStyle}>未启用能力对门店角色保持隐藏</div>
        </article>
      </div>

      {isLoading ? (
        <div style={{ marginTop: 14, color: '#cbd5e1', fontSize: 13 }}>正在同步模块能力治理...</div>
      ) : null}

      <StoreCapabilityActionStrip
        title="模块动作条"
        actions={visibleActions}
        emptyHint="当前模块没有可执行动作，请先检查门店 capability access。"
        style={{ marginTop: 16, marginBottom: 0, padding: 0, background: 'transparent', border: 'none' }}
      />

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 16 }}>
        {visibleEntrypoints.map((entry) => (
          <article
            key={entry.key}
            style={{
              borderRadius: 14,
              padding: 16,
              background: 'rgba(15, 23, 42, 0.38)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
              <div>
                <div style={{ color: '#f8fafc', fontSize: 15, fontWeight: 700 }}>{entry.label}</div>
                <div style={{ marginTop: 5, color: '#94a3b8', fontSize: 13 }}>{entry.description}</div>
              </div>
              <StatusBadge label={accessMeta[entry.access].label} variant={accessMeta[entry.access].variant} size="sm" />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatusBadge label={readinessMeta[entry.readiness].label} variant={readinessMeta[entry.readiness].variant} size="sm" />
              <span style={{ color: '#cbd5e1', fontSize: 13 }}>{entry.capability}</span>
            </div>
            <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>{entry.reason}</div>
            {entry.isNavigable ? (
              <Link href={entry.href} style={{ color: entry.access === 'enabled' ? '#93c5fd' : '#fbbf24', textDecoration: 'none', fontWeight: 600 }}>
                {entry.actionLabel}
              </Link>
            ) : (
              <div style={{ color: '#fca5a5', fontSize: 13 }}>{entry.hint}</div>
            )}
          </article>
        ))}
      </div>

      {!visibleEntrypoints.length && !isLoading ? (
        <div style={{ marginTop: 14, color: '#94a3b8', fontSize: 13 }}>
          当前模块相关 capability 暂无可见入口，请先到完整能力矩阵查看 blocked / hidden 原因。
        </div>
      ) : null}

      {recommendedEntrypoint ? (
        <div style={{ marginTop: 14, color: '#94a3b8', fontSize: 13 }}>
          推荐入口：{recommendedEntrypoint.label}，状态为 {accessMeta[recommendedEntrypoint.access].label}。
        </div>
      ) : null}
    </section>
  );
}

const metricCardStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: 14,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)'
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#cbd5e1'
};

const metricValueStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 24,
  fontWeight: 700,
  color: '#f8fafc'
};

const metricHintStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12,
  color: '#94a3b8'
};
