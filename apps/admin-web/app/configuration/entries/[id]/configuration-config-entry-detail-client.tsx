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
import type {
  ConfigurationConfigEntry,
  ConfigurationConfigEntryRevision
} from '@m5/types';
import {
  buildConfigurationConfigEntryDeepLinks,
  type ConfigurationConfigEntryDetailDelivery
} from '../../../configuration-config-entry-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface ConfigurationConfigEntryDetailClientProps {
  snapshot: ConfigurationConfigEntryDetailDelivery;
}

export default function ConfigurationConfigEntryDetailClient({
  snapshot
}: ConfigurationConfigEntryDetailClientProps) {
  if (snapshot.notFound || !snapshot.entry) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <EntryBoard entry={snapshot.entry} snapshot={snapshot} />;
}

function EntryBoard({
  entry,
  snapshot
}: {
  entry: ConfigurationConfigEntry;
  snapshot: ConfigurationConfigEntryDetailDelivery;
}) {
  const links = buildConfigurationConfigEntryDeepLinks(entry, {
    tenantId: snapshot.query.tenantId,
    brandId: snapshot.query.brandId,
    storeId: snapshot.query.storeId,
    marketCode: snapshot.query.marketCode
  });
  const status = entry.status ?? 'active';
  const tags = entry.tags ?? [];
  const { actions } = useDetailActions({
    workspace: 'configuration',
    detailId: entry.id,
    record: entry
  });

  const relatedColumns: DataTableColumn<ConfigurationConfigEntry>[] = [
    {
      key: 'id',
      title: 'ID',
      dataKey: 'id',
      sortable: true,
      render: (item) => (
        <Link
          href={`/configuration/entries/${encodeURIComponent(item.id)}`}
          style={{ color: '#93c5fd', fontFamily: 'monospace' }}
        >
          {item.id}
        </Link>
      )
    },
    {
      key: 'key',
      title: 'Key',
      dataKey: 'key',
      render: (item) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.key}</span>
      )
    },
    {
      key: 'namespace',
      title: 'Namespace',
      render: (item) => item.namespace ?? '—'
    },
    {
      key: 'schemaRef',
      title: 'Schema',
      render: (item) => item.schemaRef ?? '—'
    },
    {
      key: 'version',
      title: 'Version',
      dataKey: 'version',
      render: (item) => `${item.version ?? 1}`
    }
  ];

  const revisionColumns: DataTableColumn<ConfigurationConfigEntryRevision>[] = [
    {
      key: 'version',
      title: 'Version',
      dataKey: 'version',
      render: (item) => `v${item.version}`
    },
    {
      key: 'changedBy',
      title: 'Changed By',
      render: (item) => item.changedBy ?? '—'
    },
    {
      key: 'changeReason',
      title: 'Reason',
      render: (item) => item.changeReason ?? '—'
    },
    {
      key: 'createdAt',
      title: 'Created',
      dataKey: 'createdAt',
      render: (item) => new Date(item.createdAt).toLocaleString('zh-CN')
    }
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'configuration', detailLabel: entry.id })}
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
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Config Entry</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginTop: 4 }}>
              {entry.id}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5f5', fontFamily: 'monospace' }}>
              {entry.key}
            </div>
            {tags.length > 0 ? (
              <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
                tags: {tags.join(', ')}
              </div>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <StatusBadge label={status} variant="info" dot />
            <StatusBadge label={`v${entry.version ?? 1}`} variant="neutral" dot />
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
        <PanelCard title="元数据">
          <Row label="ID" value={entry.id} />
          <Row label="Key" value={entry.key} />
          <Row label="Namespace" value={entry.namespace ?? '—'} />
          <Row label="Value Type" value={entry.valueType ?? '—'} />
          <Row label="Schema Ref" value={entry.schemaRef ?? '—'} />
          <Row label="Status" value={status} />
          <Row label="Version" value={`v${entry.version ?? 1}`} />
          <Row label="Updated At" value={new Date(entry.updatedAt).toLocaleString('zh-CN')} />
          <Row label="Created By" value={entry.createdBy ?? '—'} />
        </PanelCard>
        <PanelCard title="作用域">
          <Row label="Scope Type" value={entry.scopeType ?? '—'} />
          <Row label="Tenant" value={entry.tenantId ?? '—'} />
          <Row label="Brand" value={entry.brandId ?? '—'} />
          <Row label="Store" value={entry.storeId ?? '—'} />
          <Row label="Market" value={entry.marketProfileId ?? '—'} />
          <Row label="Portal" value={entry.portalSiteId ?? '—'} />
        </PanelCard>
        <PanelCard title="当前值">
          <pre
            style={{
              margin: 0,
              padding: 10,
              borderRadius: 8,
              background: 'rgba(15,23,42,0.7)',
              border: '1px solid rgba(148,163,184,0.2)',
              color: '#f8fafc',
              fontSize: 12,
              fontFamily: 'monospace',
              overflowX: 'auto',
              maxHeight: 240
            }}
          >
            {formatValue(entry.value)}
          </pre>
        </PanelCard>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'approvals',
            title: '治理审批中心',
            subtitle:
              entry.status === 'pending-review' || entry.status === 'deprecated'
                ? '该配置项需要审批：查看 PENDING 列表'
                : '查看配置治理相关的审批单',
            context:
              entry.status === 'pending-review' || entry.status === 'deprecated'
                ? '聚焦 PENDING'
                : '聚焦配置治理',
            href: links.approvalsHref,
            variant:
              entry.status === 'pending-review' || entry.status === 'deprecated'
                ? 'danger'
                : 'default'
          },
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `查看该配置项在审计日志中的留痕（purpose=configuration-entry:${entry.id}）`,
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

      {snapshot.revisions.length > 0 ? (
        <DataTable
          title={`修订记录（${snapshot.revisions.length}）`}
          columns={revisionColumns}
          items={snapshot.revisions}
          rowKey={(item) => `v${item.version}`}
          striped
          compact
        />
      ) : null}

      {snapshot.related.length > 0 ? (
        <DataTable
          title={`同 namespace/schema 的相关配置项（${snapshot.related.length}）`}
          columns={relatedColumns}
          items={snapshot.related}
          rowKey={(item) => item.id}
          striped
          compact
        />
      ) : null}
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: ConfigurationConfigEntryDetailDelivery }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'configuration', detailLabel: snapshot.id || '未找到' })}
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
        <div style={{ fontSize: 16, fontWeight: 700 }}>未找到配置项 {snapshot.id || '（空）'}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#fecaca' }}>
          Delivery: {snapshot.deliveryMode} · 当前 metadata 中没有匹配该 id 的配置项。
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

function formatValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '—';
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
