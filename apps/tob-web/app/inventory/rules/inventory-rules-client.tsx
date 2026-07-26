'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, PageShell, StatusBadge } from '@m5/ui';
import type { InventoryRulesSnapshot, InventoryRuleStatus } from '../inventory-rules-data';

const STATUS_META: Record<InventoryRuleStatus, { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  active: { label: '运行中', variant: 'success' },
  paused: { label: '已暂停', variant: 'warning' },
  draft: { label: '草稿', variant: 'neutral' },
};

export default function InventoryRulesClient({
  snapshot,
}: {
  snapshot: InventoryRulesSnapshot;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  return (
    <PageShell title="库存规则" description="库存治理、补货与调拨控制面规则快照">
      <div style={{ padding: '0 32px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>
            页面由服务端治理快照驱动，客户端只负责展示、返回与刷新。
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => router.push('/inventory')} style={secondaryButtonStyle}>
              返回进销存
            </button>
            <button
              type="button"
              onClick={() =>
                startRefresh(() => {
                  router.refresh();
                })
              }
              disabled={isRefreshing}
              style={{
                ...secondaryButtonStyle,
                opacity: isRefreshing ? 0.65 : 1,
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
              }}
            >
              {isRefreshing ? '刷新中...' : '刷新规则快照'}
            </button>
          </div>
        </div>

        {snapshot.error && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: '1px solid rgba(250,204,21,0.28)',
              background: 'rgba(250,204,21,0.08)',
              color: '#fde68a',
            }}
          >
            {snapshot.error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          }}
        >
          <StatCard label="低库存 SKU" value={String(snapshot.lowStockCount)} color="#fbbf24" />
          <StatCard label="缺货 SKU" value={String(snapshot.outOfStockCount)} color="#f87171" />
          <StatCard label="待处理调拨" value={String(snapshot.pendingTransferCount)} color="#60a5fa" />
          <StatCard label="覆盖门店" value={String(snapshot.storeCount)} color="#4ade80" />
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {snapshot.rules.map((rule) => {
            const statusMeta = STATUS_META[rule.status];
            return (
              <article
                key={rule.id}
                style={{
                  padding: 20,
                  borderRadius: 14,
                  border: '1px solid rgba(148,163,184,0.16)',
                  background: 'rgba(15,23,42,0.55)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18, color: '#f8fafc' }}>{rule.name}</h2>
                    <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 13 }}>{rule.scenario}</p>
                  </div>
                  <StatusBadge label={statusMeta.label} variant={statusMeta.variant} />
                </div>
                <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  <RuleFact label="触发条件" value={rule.trigger} />
                  <RuleFact label="执行动作" value={rule.action} />
                  <RuleFact label="责任人" value={rule.owner} />
                  <RuleFact label="最近复核" value={new Date(rule.lastReviewedAt).toLocaleString('zh-CN')} />
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Badge variant="neutral">来源态证据</Badge>
                  <span style={{ fontSize: 12, color: '#cbd5e1' }}>{rule.evidence}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: 18,
        background: 'rgba(15,23,42,0.38)',
        border: '1px solid rgba(148,163,184,0.18)',
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function RuleFact({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: 12,
        background: 'rgba(30,41,59,0.72)',
        border: '1px solid rgba(148,163,184,0.12)',
      }}
    >
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>{value}</div>
    </div>
  );
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.24)',
  background: 'rgba(15,23,42,0.55)',
  color: '#e2e8f0',
};
