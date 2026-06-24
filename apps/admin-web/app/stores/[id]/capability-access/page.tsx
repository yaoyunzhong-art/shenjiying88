import React from 'react';
import type { LytStoreCapabilityAccessItem, LytStoreCapabilityAccessViewResponse } from '@m5/sdk';
import { PageShell, StatusBadge, WorkspaceBreadcrumb, DetailClosureBar } from '@m5/ui';
import {
  accessMeta,
  buildCapabilityEntrypoints,
  loadStoreCapabilityAccessSnapshot,
  readinessMeta
} from '../../../lyt-capability-access';
import { DetailPageActions } from '../../../components/detail-page-actions';
import { buildStandardBreadcrumb, buildStandardClosureLinks } from '../../../components/detail-workspace-registry';

interface StoreCapabilityAccessPageProps {
  params: Promise<{ id: string }>;
}

export default async function StoreCapabilityAccessPage({ params }: StoreCapabilityAccessPageProps) {
  const { id } = await params;
  const { capabilityAccess, deliveryMode }: { capabilityAccess: LytStoreCapabilityAccessViewResponse; deliveryMode: 'api' | 'fallback' } =
    await loadStoreCapabilityAccessSnapshot(id, { storeId: id });

  const enabledCount = capabilityAccess.accessByCapability.filter((item) => item.access === 'enabled').length;
  const degradedCount = capabilityAccess.accessByCapability.filter((item) => item.access === 'degraded').length;
  const blockedCount = capabilityAccess.accessByCapability.filter((item) => item.access === 'blocked').length;
  const entrypoints = buildCapabilityEntrypoints(id, capabilityAccess);
  const visibleEntrypoints = entrypoints.filter((item) => item.visibility === 'visible');
  const hiddenEntrypointCount = entrypoints.length - visibleEntrypoints.length;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'stores', detailLabel: `${capabilityAccess.storeName ?? capabilityAccess.storeId} · Capability Access` })}
      />
      <PageShell
        title={`${capabilityAccess.storeName ?? capabilityAccess.storeId} · Capability Access`}
        description={`${capabilityAccess.storeCode ?? capabilityAccess.storeId} · ${deliveryMode === 'api' ? '真实接入视图' : 'Fallback 演示视图'}`}
        actions={
        <a
          href={`/stores/${id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            padding: '10px 14px',
            background: 'rgba(59,130,246,0.12)',
            color: '#93c5fd',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 600
          }}
        >
          返回门店详情
        </a>
      }
    >
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>连接状态</div>
          <div style={statValueStyle}>{capabilityAccess.connectionStatus}</div>
          <div style={statHintStyle}>resolution: {capabilityAccess.resolutionLevel ?? 'unknown'}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>健康状态</div>
          <div style={statValueStyle}>{capabilityAccess.healthStatus ?? 'unknown'}</div>
          <div style={statHintStyle}>enabled {enabledCount} 项</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>降级能力</div>
          <div style={statValueStyle}>{String(degradedCount)}</div>
          <div style={statHintStyle}>需保留提示但允许继续</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>阻塞能力</div>
          <div style={statValueStyle}>{String(blockedCount)}</div>
          <div style={statHintStyle}>前端应禁用相关动作</div>
        </div>
      </div>

      <section style={panelStyle}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 18, color: '#f8fafc' }}>能力访问矩阵</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>
            该视图直接映射门店 capability readiness 到前端访问状态，用于工作台入口、按钮与路由自动降级。
          </p>
        </div>
        <CapabilityAccessTable rows={capabilityAccess.accessByCapability} />
      </section>

      <section style={panelStyle}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 18, color: '#f8fafc' }}>入口矩阵</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>
            将 capability access 直接映射到前端入口治理策略，形成可进入、降级进入、阻塞和隐藏四类动作闭环。
          </p>
        </div>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {visibleEntrypoints.map((entry) => (
            <article
              key={entry.key}
              style={{
                borderRadius: 16,
                padding: 18,
                background: 'rgba(15, 23, 42, 0.38)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#f8fafc', fontSize: 16, fontWeight: 700 }}>{entry.label}</div>
                  <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 13 }}>{entry.description}</div>
                </div>
                <StatusBadge label={accessMeta[entry.access].label} variant={accessMeta[entry.access].variant} size="sm" />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StatusBadge
                  label={readinessMeta[entry.readiness].label}
                  variant={readinessMeta[entry.readiness].variant}
                  size="sm"
                />
                <span style={{ color: '#cbd5e1', fontSize: 13 }}>{entry.capability}</span>
              </div>
              <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>{entry.reason}</div>
              <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{entry.hint}</div>
              {entry.isNavigable ? (
                <a
                  href={entry.href}
                  style={{
                    display: 'inline-flex',
                    width: 'fit-content',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    padding: '10px 14px',
                    background: entry.access === 'enabled' ? 'rgba(59,130,246,0.14)' : 'rgba(245,158,11,0.16)',
                    color: entry.access === 'enabled' ? '#93c5fd' : '#fbbf24',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  {entry.actionLabel}
                </a>
              ) : (
                <div
                  style={{
                    display: 'inline-flex',
                    width: 'fit-content',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    padding: '10px 14px',
                    background: 'rgba(239,68,68,0.14)',
                    color: '#fca5a5',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  {entry.actionLabel}
                </div>
              )}
            </article>
          ))}
        </div>
        <div style={{ marginTop: 14, color: '#94a3b8', fontSize: 13 }}>
          当前展示 {visibleEntrypoints.length} 个可见入口，另有 {hiddenEntrypointCount} 个入口按 hidden 策略保持隐藏。
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18, color: '#f8fafc' }}>建议动作</h2>
        {capabilityAccess.recommendedNextActions.length ? (
          <ul style={{ margin: 0, paddingLeft: 18, color: '#e2e8f0', display: 'grid', gap: 8 }}>
            {capabilityAccess.recommendedNextActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        ) : (
          <div style={{ color: '#94a3b8', fontSize: 14 }}>当前暂无建议动作</div>
        )}
      </section>

      <DetailPageActions
        workspace="stores"
        detailId={`${id}/capability-access`}
        record={{
          storeId: capabilityAccess.storeId,
          storeName: capabilityAccess.storeName,
          storeCode: capabilityAccess.storeCode,
          deliveryMode,
          enabledCount,
          degradedCount,
          blockedCount,
          entrypointCount: visibleEntrypoints.length,
          hiddenEntrypointCount
        }}
        shareTitle={`门店 · ${capabilityAccess.storeName ?? capabilityAccess.storeId} · Capability Access`}
        shareText={`查看门店 ${id} 的 capability access 详情`}
        caption="复制 / 导出 / 分享当前 capability access 详情"
      />

      <DetailClosureBar
        links={buildStandardClosureLinks({
          workspace: 'stores',
          detailId: `${id}/capability-access`,
          extraLinks: [
            {
              key: 'store',
              title: '返回门店详情',
              subtitle: `回到门店 ${capabilityAccess.storeName ?? id} 详情`,
              href: `/stores/${id}`
            }
          ]
        })}
      />
    </PageShell>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 24,
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  marginBottom: 24
};

const statCardStyle: React.CSSProperties = {
  borderRadius: 16,
  padding: 18,
  background: 'rgba(15, 23, 42, 0.35)',
  border: '1px solid rgba(148, 163, 184, 0.18)'
};

const statLabelStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  marginBottom: 8
};

const statValueStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 6
};

const statHintStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 13
};

function CapabilityAccessTable({ rows }: { rows: LytStoreCapabilityAccessItem[] }) {
  if (!rows.length) {
    return <div style={{ color: '#94a3b8', fontSize: 14 }}>暂无 capability access 记录</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>能力</th>
            <th style={tableHeaderStyle}>Readiness</th>
            <th style={tableHeaderStyle}>访问状态</th>
            <th style={tableHeaderStyle}>原因</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.capability} style={tableRowStyle}>
              <td style={tableCellStyle}>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>{row.capability}</span>
              </td>
              <td style={tableCellStyle}>
                <StatusBadge label={readinessMeta[row.readiness].label} variant={readinessMeta[row.readiness].variant} size="sm" />
              </td>
              <td style={tableCellStyle}>
                <StatusBadge label={accessMeta[row.access].label} variant={accessMeta[row.access].variant} size="sm" />
              </td>
              <td style={tableCellStyle}>
                <span style={{ color: '#cbd5e1', lineHeight: 1.5 }}>{row.reason}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 14px',
  color: '#94a3b8',
  fontSize: 12,
  borderBottom: '1px solid rgba(148, 163, 184, 0.18)'
};

const tableCellStyle: React.CSSProperties = {
  padding: '14px',
  verticalAlign: 'top',
  borderBottom: '1px solid rgba(148, 163, 184, 0.12)'
};

const tableRowStyle: React.CSSProperties = {
  background: 'transparent'
};
