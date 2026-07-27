'use client'

import type * as React from 'react'
import { DataTable, DetailActionBar, StatusBadge, type DataTableColumn } from '@m5/ui'
import {
  type IdentityAccessValidationResult,
} from '@m5/types'
import { formatIdentityCheckLabel, summarizeIdentityValidation } from '../identity-access-view-model'
import { useDetailActions } from '../components/use-detail-actions'
import type { IdentityAccessPageSnapshot } from './identity-access-data'
import SnapshotRefreshButton from '../components/snapshot-refresh-button'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

interface IdentityAccessWorkspaceClientProps {
  snapshot: IdentityAccessPageSnapshot
}

interface IdentityCheckRow {
  key: string
  result: IdentityAccessValidationResult | null
}

export default function IdentityAccessWorkspaceClient({
  snapshot,
}: IdentityAccessWorkspaceClientProps) {
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const actor = snapshot.workspace.context.actor
  const checkRows: IdentityCheckRow[] = [
    { key: 'role', result: snapshot.workspace.roleValidation },
    { key: 'permission', result: snapshot.workspace.permissionValidation },
    { key: 'tenant-scope', result: snapshot.workspace.tenantScopeValidation },
  ]
  const { actions } = useDetailActions({
    workspace: 'identity-access',
    detailId: actor?.actorId ?? 'overview',
    record: snapshot.workspace,
    shareTitle: '身份与授权工作台',
    shareText: '查看当前 actor / 角色 / 权限 / 租户边界',
  })

  const columns: DataTableColumn<IdentityCheckRow>[] = [
    {
      key: 'check',
      title: '校验项',
      render: (item) => formatIdentityCheckLabel(item.result?.check ?? 'role'),
    },
    {
      key: 'status',
      title: '状态',
      render: (item) => (
        <StatusBadge
          label={item.result?.status === 'allowed' ? '通过' : '拒绝'}
          variant={item.result?.status === 'allowed' ? 'success' : 'danger'}
          dot
          size="sm"
        />
      ),
    },
    {
      key: 'summary',
      title: '摘要',
      render: (item) => (
        <span style={{ fontSize: 12, color: '#cbd5f5' }}>{summarizeIdentityValidation(item.result)}</span>
      ),
    },
    {
      key: 'enforcedBy',
      title: '执行链路',
      render: (item) => (
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {item.result?.authorization?.enforcedBy?.join(' · ') ?? 'IdentityAccessService'}
        </span>
      ),
    },
  ]

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section style={heroStyle}>
        <div>
          <div style={heroTitleStyle}>身份与授权</div>
          <div style={heroCaptionStyle}>
            首屏读取服务端快照，当前来源标签为 {snapshot.sourceLabel}，consumer 为 {snapshot.consumerDescriptor.consumer}。
          </div>
          <div style={heroMetaStyle}>
            generatedAt: {snapshot.generatedAt} · workspace {snapshot.workspaceDeliveryMode} / workbench {snapshot.bootstrapDeliveryMode}
          </div>
        </div>
        <SnapshotRefreshButton
  onRefresh={handleRefresh}
  isRefreshing={isRefreshing}
  variant="dark"
  idleLabel="刷新"
  loadingLabel="刷新中..."
/>
      </section>

      <section style={panelStyle}>
        <div style={sectionTitleStyle}>Actor 上下文</div>
        <div style={summaryGridStyle}>
          <SummaryCard title="Actor ID" value={actor?.actorId ?? 'anonymous'} detail={actor?.actorType ?? 'anonymous'} />
          <SummaryCard title="角色" value={`${snapshot.workspace.context.roles.length}`} detail={snapshot.workspace.context.roles.join(' · ') || '—'} />
          <SummaryCard
            title="权限"
            value={`${snapshot.workspace.context.permissions.length}`}
            detail={snapshot.workspace.context.permissions.join(' · ') || '—'}
          />
          <SummaryCard
            title="有效租户"
            value={snapshot.workspace.context.effectiveTenantId ?? '—'}
            detail={`${snapshot.workspace.context.effectiveBrandId ?? '—'} / ${snapshot.workspace.context.effectiveStoreId ?? '—'}`}
          />
        </div>
      </section>

      <section style={dependencyLayoutStyle}>
        <div style={summaryCardStyle}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>治理 consumer</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#93c5fd', marginBottom: 6 }}>
            {snapshot.consumerDescriptor.consumer}
          </div>
          <div style={{ fontSize: 12, color: '#cbd5f5' }}>{snapshot.consumerDescriptor.responsibility}</div>
        </div>
        <div style={summaryCardStyle}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>依赖模块数</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#93c5fd', marginBottom: 6 }}>
            {snapshot.foundationDependencies.length}
          </div>
          <div style={{ fontSize: 12, color: '#cbd5f5' }}>{snapshot.foundationDependencies.join(' · ')}</div>
        </div>
      </section>

      <section style={panelStyle}>
        <div style={sectionTitleStyle}>身份校验</div>
        <DataTable
          title="角色 / 权限 / 租户边界"
          columns={columns}
          items={checkRows}
          rowKey={(item) => item.key}
          striped
          compact
        />
      </section>

      <section style={dependencyLayoutStyle}>
        <div style={panelStyle}>
          <div style={sectionTitleStyle}>依赖模块</div>
          <div style={pillWrapStyle}>
            {snapshot.foundationDependencies.map((item) => (
              <span key={item} style={pillStyle}>
                {item}
              </span>
            ))}
          </div>
        </div>
        <div style={panelStyle}>
          <div style={sectionTitleStyle}>交接契约</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {snapshot.handoffContracts.map((item) => (
              <div key={item} style={listItemStyle}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <DetailActionBar
        actions={actions}
        heading="工作台收口动作"
        caption="复制 / 导出 / 分享当前工作台快照"
      />
    </div>
  )
}

function SummaryCard({ title, value, detail }: { title: string; value: string; detail: React.ReactNode }) {
  return (
    <div style={summaryCardStyle}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#93c5fd', marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#cbd5f5' }}>{detail}</div>
    </div>
  )
}

const heroStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
}

const heroTitleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: '#e2e8f0',
  marginBottom: 6,
}

const heroCaptionStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#cbd5f5',
  marginBottom: 6,
}

const heroMetaStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
}


const panelStyle: React.CSSProperties = {
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: 14,
  padding: 18,
  background: 'rgba(15,23,42,0.62)'
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#e2e8f0',
  marginBottom: 14
}

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
}

const summaryCardStyle: React.CSSProperties = {
  border: '1px solid rgba(148,163,184,0.18)',
  borderRadius: 12,
  padding: 16,
  background: 'rgba(15,23,42,0.4)'
}

const dependencyLayoutStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
}

const pillWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8
}

const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 999,
  background: 'rgba(59,130,246,0.14)',
  color: '#bfdbfe',
  fontSize: 12,
  fontWeight: 600
}

const listItemStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#cbd5f5',
  lineHeight: 1.5
}
