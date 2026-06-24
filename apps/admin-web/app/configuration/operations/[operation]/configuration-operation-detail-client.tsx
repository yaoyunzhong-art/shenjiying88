'use client';

import Link from 'next/link';
import {
  StatusBadge,
  type DataTableColumn,
  DataTable,
  DetailActionBar,
  DetailClosureBar,
  WorkspaceBreadcrumb,
  type DetailClosureLink
} from '@m5/ui';
import type { ConfigurationGovernanceMetadataEntry } from '@m5/types';
import {
  buildConfigurationOperationDeepLinks,
  getConfigurationOperationApprovalLabel,
  getConfigurationOperationApprovalVariant,
  type ConfigurationOperationDetailDelivery
} from '../../../configuration-operation-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface ConfigurationOperationDetailClientProps {
  snapshot: ConfigurationOperationDetailDelivery;
}

export default function ConfigurationOperationDetailClient({
  snapshot
}: ConfigurationOperationDetailClientProps) {
  if (snapshot.notFound) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  if (!snapshot.entry) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <OperationBoard entry={snapshot.entry} snapshot={snapshot} />;
}

function OperationBoard({
  entry,
  snapshot
}: {
  entry: ConfigurationGovernanceMetadataEntry;
  snapshot: ConfigurationOperationDetailDelivery;
}) {
  const links = buildConfigurationOperationDeepLinks(entry);
  const approval = entry.approval;
  const approvalVariant = getConfigurationOperationApprovalVariant(approval.status);
  const approvalLabel = getConfigurationOperationApprovalLabel(approval.status);
  const { actions } = useDetailActions({
    workspace: 'configuration',
    detailId: entry.operation,
    record: entry
  });

  const executionRows: Array<{ key: string; value: string }> = [
    { key: 'attempts', value: `${approval.execution.attempts}` },
    { key: 'executed', value: approval.execution.executed ? '是' : '否' },
    { key: 'executionStatus', value: approval.execution.executionStatus ?? '—' },
    { key: 'executedAt', value: approval.execution.executedAt ?? '—' },
    { key: 'executedBy', value: approval.execution.executedBy ?? '—' }
  ];

  const relatedColumns: DataTableColumn<ConfigurationGovernanceMetadataEntry>[] = [
    {
      key: 'operation',
      title: 'Operation',
      dataKey: 'operation',
      sortable: true,
      render: (item) => (
        <Link href={`/configuration/operations/${encodeURIComponent(item.operation)}`} style={{ color: '#93c5fd' }}>
          {item.operation}
        </Link>
      )
    },
    {
      key: 'roles',
      title: 'Roles',
      render: (item) => item.rbac.requiredRoles.join(', ')
    },
    {
      key: 'approval',
      title: 'Approval',
      render: (item) =>
        item.approval.required ? (
          <StatusBadge
            label={getConfigurationOperationApprovalLabel(item.approval.status)}
            variant={getConfigurationOperationApprovalVariant(item.approval.status)}
            dot
            size="sm"
          />
        ) : (
          <StatusBadge label="无需审批" variant="neutral" dot size="sm" />
        )
    }
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'configuration', detailLabel: entry.operation })}
      />
      <div
        style={{
          border: '1px solid rgba(148,163,184,0.2)',
          borderRadius: 12,
          padding: 18,
          background: 'rgba(15,23,42,0.6)',
          color: '#e2e8f0'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Operation</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginTop: 4 }}>{entry.operation}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5f5' }}>
              资源 {entry.rbac.resource} · 动作 {entry.rbac.action}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <StatusBadge
              label={approval.required ? '需要审批' : '无需审批'}
              variant={approval.required ? 'warning' : 'neutral'}
              dot
            />
            <StatusBadge label={approvalLabel} variant={approvalVariant} dot />
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8' }}>
          Delivery: {snapshot.deliveryMode} · 生成时间 {new Date(snapshot.generatedAt).toLocaleString('zh-CN')}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
        }}
      >
        <PanelCard title="RBAC 边界">
          <Row label="Resource" value={entry.rbac.resource} />
          <Row label="Action" value={entry.rbac.action} />
          <Row label="Roles" value={entry.rbac.requiredRoles.join(', ') || '—'} />
          <Row label="Permissions" value={entry.rbac.requiredPermissions.join(', ') || '—'} />
        </PanelCard>
        <PanelCard title="审批边界">
          <Row label="Required" value={approval.required ? '是' : '否'} />
          <Row label="Status" value={approvalLabel} />
          <Row label="Submitted" value={approval.submitted ? '是' : '否'} />
          <Row label="Persisted" value={approval.persisted ? '是' : '否'} />
          <Row label="Approval ID" value={approval.approvalId ?? '—'} />
          <Row label="Ticket" value={approval.ticket ?? '—'} />
          <Row label="Requested By" value={approval.requestedBy ?? '—'} />
          <Row label="Decided By" value={approval.decidedBy ?? '—'} />
          <Row label="Decided At" value={approval.decidedAt ?? '—'} />
          <Row label="Updated At" value={approval.updatedAt ?? '—'} />
          <Row label="Version" value={approval.version !== null ? `${approval.version}` : '—'} />
        </PanelCard>
        <PanelCard title="执行轨迹">
          {executionRows.map((row) => (
            <Row key={row.key} label={row.key} value={row.value} />
          ))}
        </PanelCard>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'approvals',
            title: '治理审批中心',
            subtitle: approval.required ? '查看该操作的审批单与执行状态' : '查看配置治理相关审批单',
            context: approval.required ? '聚焦 PENDING/ALL' : '聚焦配置治理',
            href: links.approvalsHref,
            variant: approval.required ? 'warning' : 'default'
          },
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `查看该操作在审计日志中的留痕（purpose=configuration-${snapshot.operation}）`,
            context: 'focused source+purpose',
            href: links.auditHref
          },
          {
            key: 'foundation',
            title: 'Foundation 模块',
            subtitle: '回到 Foundation 总览查看 configuration-governance 模块健康度',
            context: '聚焦模块 drilldown',
            href: links.foundationHref
          },
          {
            key: 'workspace',
            title: '配置治理工作台',
            subtitle: '返回配置治理总览，切换租户/品牌/门店维度',
            context: '回到总览',
            href: links.workspaceHref
          }
        ] satisfies DetailClosureLink[]}
      />

      <DetailActionBar actions={actions} />

      {snapshot.related.length > 0 ? (
        <DataTable
          title={`相关操作（${snapshot.related.length}）`}
          columns={relatedColumns}
          items={snapshot.related}
          rowKey={(item) => item.operation}
          striped
          compact
        />
      ) : null}
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: ConfigurationOperationDetailDelivery }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'configuration', detailLabel: snapshot.operation || '未找到' })}
      />
      <div
        style={{
          border: '1px solid rgba(248,113,113,0.4)',
          borderRadius: 12,
          padding: 18,
          background: 'rgba(127,29,29,0.25)',
          color: '#fecaca'
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>未找到操作 {snapshot.operation || '（空）'}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#fecaca' }}>
          Delivery: {snapshot.deliveryMode} · 当前 metadata 中没有匹配该 operation 的条目。
        </div>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回配置治理工作台',
            subtitle: '查看所有配置项',
            href: '/configuration'
          }
        ]}
      />
    </div>
  );
}

function PanelCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 12,
        padding: 16,
        background: 'rgba(15,23,42,0.6)',
        color: '#e2e8f0'
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'grid', gap: 6 }}>{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#cbd5f5', fontFamily: 'monospace', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

// DeepLinkCard has been removed in favor of <DetailClosureBar> from @m5/ui.
