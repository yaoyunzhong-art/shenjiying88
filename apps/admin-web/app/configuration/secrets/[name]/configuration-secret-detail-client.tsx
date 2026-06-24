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
import type { ConfigurationSecretMetadata } from '@m5/types';
import {
  buildConfigurationSecretDeepLinks,
  type ConfigurationSecretDetailDelivery
} from '../../../configuration-secret-view-model';
import {
  SECRET_STATUS_LABEL,
  SECRET_STATUS_VARIANT,
  summarizeSecret
} from '../../../configuration-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface ConfigurationSecretDetailClientProps {
  snapshot: ConfigurationSecretDetailDelivery;
}

export default function ConfigurationSecretDetailClient({
  snapshot
}: ConfigurationSecretDetailClientProps) {
  if (snapshot.notFound || !snapshot.secret) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <SecretBoard secret={snapshot.secret} snapshot={snapshot} />;
}

function SecretBoard({
  secret,
  snapshot
}: {
  secret: ConfigurationSecretMetadata;
  snapshot: ConfigurationSecretDetailDelivery;
}) {
  const links = buildConfigurationSecretDeepLinks(secret, {
    tenantId: snapshot.query.tenantId,
    brandId: snapshot.query.brandId,
    storeId: snapshot.query.storeId,
    marketCode: snapshot.query.marketCode
  });
  const status = secret.status ?? 'active';
  const label = SECRET_STATUS_LABEL[status] ?? status;
  const { actions } = useDetailActions({
    workspace: 'configuration',
    detailId: secret.name,
    record: secret
  });
  const variant = SECRET_STATUS_VARIANT[status] ?? 'neutral';
  const consumers = secret.consumers ?? [];

  const relatedColumns: DataTableColumn<ConfigurationSecretMetadata>[] = [
    {
      key: 'name',
      title: '名称',
      dataKey: 'name',
      sortable: true,
      render: (item) => (
        <Link
          href={`/configuration/secrets/${encodeURIComponent(item.name)}`}
          style={{ color: '#93c5fd' }}
        >
          {item.name}
        </Link>
      )
    },
    {
      key: 'status',
      title: '状态',
      render: (item) => {
        const itemStatus = item.status ?? 'active';
        const itemLabel = SECRET_STATUS_LABEL[itemStatus] ?? itemStatus;
        const itemVariant = SECRET_STATUS_VARIANT[itemStatus] ?? 'neutral';
        return (
          <StatusBadge label={itemLabel} variant={itemVariant} dot size="sm" />
        );
      }
    },
    {
      key: 'consumers',
      title: '共享消费方',
      render: (item) => (item.consumers ?? []).join(', ') || '—'
    },
    {
      key: 'version',
      title: '版本',
      dataKey: 'version',
      render: (item) => `${item.version ?? 1}`
    }
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'configuration', detailLabel: secret.name })}
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
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Secret</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginTop: 4 }}>
              {secret.name}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5f5' }}>{summarizeSecret(secret)}</div>
          </div>
          <StatusBadge label={label} variant={variant} dot />
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
          <Row label="Name" value={secret.name} />
          <Row label="Status" value={label} />
          <Row label="Source" value={secret.source ?? '—'} />
          <Row label="Version" value={`${secret.version ?? 1}`} />
          <Row label="Expires At" value={secret.expiresAt ?? '—'} />
          <Row label="Rotation Due At" value={secret.rotationDueAt ?? '—'} />
          <Row label="Rotated At" value={secret.rotatedAt ?? '—'} />
          <Row label="Rotated By" value={secret.rotatedBy ?? '—'} />
        </PanelCard>
        <PanelCard title={`消费方（${consumers.length}）`}>
          {consumers.length === 0 ? (
            <span style={{ fontSize: 12, color: '#94a3b8' }}>暂无消费方记录</span>
          ) : (
            consumers.map((consumer) => (
              <ConsumerRow key={consumer} consumer={consumer} />
            ))
          )}
        </PanelCard>
        <PanelCard title="治理上下文">
          <Row label="Tenant" value={snapshot.query.tenantId ?? '—'} />
          <Row label="Brand" value={snapshot.query.brandId ?? '—'} />
          <Row label="Store" value={snapshot.query.storeId ?? '—'} />
          <Row label="Market" value={snapshot.query.marketCode ?? '—'} />
          <Row label="Posture · rotation due" value={`${snapshot.overview.posture.secrets.rotationDue}`} />
          <Row label="Posture · expired" value={`${snapshot.overview.posture.secrets.expired}`} />
          <Row label="Posture · shared consumers" value={`${snapshot.overview.posture.secrets.sharedConsumers}`} />
        </PanelCard>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'approvals',
            title: '治理审批中心',
            subtitle:
              secret.status === 'rotation-due' || secret.status === 'expired'
                ? '该密钥需要审批：查看 PENDING/ALL 列表'
                : '查看密钥/证书相关的审批单',
            context:
              secret.status === 'rotation-due' || secret.status === 'expired'
                ? '聚焦 PENDING/ALL'
                : '聚焦配置治理',
            href: links.approvalsHref,
            variant:
              secret.status === 'rotation-due' || secret.status === 'expired' ? 'danger' : 'default'
          },
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `查看该密钥在审计日志中的留痕（purpose=configuration-secret:${secret.name}）`,
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
          title={`共享消费方的相关密钥（${snapshot.related.length}）`}
          columns={relatedColumns}
          items={snapshot.related}
          rowKey={(item) => item.name}
          striped
          compact
        />
      ) : null}
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: ConfigurationSecretDetailDelivery }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'configuration', detailLabel: snapshot.name || '未找到' })}
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
        <div style={{ fontSize: 16, fontWeight: 700 }}>未找到密钥 {snapshot.name || '（空）'}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#fecaca' }}>
          Delivery: {snapshot.deliveryMode} · 当前 metadata 中没有匹配该 name 的密钥。
        </div>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回配置治理工作台',
            subtitle: '查看所有密钥',
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

function ConsumerRow({ consumer }: { consumer: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 8,
        background: 'rgba(30,41,59,0.65)'
      }}
    >
      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>{consumer}</span>
      <span style={{ fontSize: 11, color: '#64748b' }}>consumer</span>
    </div>
  );
}

// DeepLinkCard has been removed in favor of <DetailClosureBar> from @m5/ui.
