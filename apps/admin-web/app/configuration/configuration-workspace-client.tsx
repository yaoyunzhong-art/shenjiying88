'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DataTable,
  DetailActionBar,
  FilterChips,
  Pagination,
  SearchFilterInput,
  StatusBadge,
  Tabs,
  type DataTableColumn,
  type DataTableSortConfig
} from '@m5/ui';
import {
  buildAuditTrailHref,
  buildConfigurationCertificateDetailHref,
  buildConfigurationConfigEntryDetailHref,
  buildConfigurationFeatureFlagDetailHref,
  buildConfigurationOperationDetailHref,
  buildConfigurationSecretDetailHref,
  buildFoundationWorkspaceHref,
  type ConfigurationCertificateMetadata,
  type ConfigurationConfigEntry,
  type ConfigurationFeatureFlag,
  type ConfigurationGovernanceMetadataEntry,
  type ConfigurationOverview,
  type ConfigurationSecretMetadata
} from '@m5/types';
import { adminGovernanceApprovalsRoute } from '../approvals-data';
import { useDetailActions } from '../components/use-detail-actions';
import {
  CERTIFICATE_STATUS_LABEL,
  CERTIFICATE_STATUS_VARIANT,
  FEATURE_FLAG_STATUS_VARIANT,
  SECRET_STATUS_LABEL,
  SECRET_STATUS_VARIANT,
  featureFlagStatusLabel,
  summarizeCertificate,
  summarizeConfigEntry,
  summarizeSecret
} from '../configuration-view-model';

interface ConfigurationWorkspaceClientProps {
  overview: ConfigurationOverview;
  managementMetadata: ConfigurationGovernanceMetadataEntry[];
  query: ConfigurationOverview['scopeChain'];
}

type TabKey = 'overview' | 'feature-flags' | 'config-entries' | 'secrets' | 'certificates';

const TAB_DEFINITIONS: ReadonlyArray<{ key: TabKey; label: string; countKey?: keyof ConfigurationOverview['configuration'] | 'posture' }> = [
  { key: 'overview', label: '总览' },
  { key: 'feature-flags', label: '功能开关', countKey: 'featureFlags' },
  { key: 'config-entries', label: '配置项', countKey: 'entries' },
  { key: 'secrets', label: '密钥', countKey: 'secrets' },
  { key: 'certificates', label: '证书', countKey: 'certificates' }
];

function toVariant(label: 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'pending') {
  return label;
}

export default function ConfigurationWorkspaceClient({
  overview,
  managementMetadata,
  query: _query
}: ConfigurationWorkspaceClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [search, setSearch] = useState('');
  const { actions } = useDetailActions({
    workspace: 'configuration',
    detailId: 'overview',
    record: overview,
    shareTitle: '配置治理工作台',
    shareText: '查看配置项 / 功能开关 / 密钥 / 证书治理状态'
  });

  const counts = useMemo(() => {
    return {
      overview: 1,
      'feature-flags': overview.configuration.featureFlags.total,
      'config-entries': overview.configuration.entries.total,
      secrets: overview.configuration.secrets.total,
      certificates: overview.configuration.certificates.total
    };
  }, [overview]);

  const filteredFlags = useMemo(() => {
    return overview.configuration.featureFlags.items.filter((flag) => {
      if (search.trim().length === 0) {
        return true;
      }
      const haystack = `${flag.key} ${flag.name ?? ''} ${flag.description ?? ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [overview, search]);

  const filteredEntries = useMemo(() => {
    return overview.configuration.entries.items.filter((entry) => {
      if (search.trim().length === 0) {
        return true;
      }
      const haystack = `${entry.key} ${entry.namespace ?? ''} ${entry.tags?.join(' ') ?? ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [overview, search]);

  const filteredSecrets = useMemo(() => {
    return overview.configuration.secrets.items.filter((secret) => {
      if (search.trim().length === 0) {
        return true;
      }
      const haystack = `${secret.name} ${secret.consumers?.join(' ') ?? ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [overview, search]);

  const filteredCertificates = useMemo(() => {
    return overview.configuration.certificates.items.filter((cert) => {
      if (search.trim().length === 0) {
        return true;
      }
      const haystack = `${cert.name} ${cert.issuer ?? ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [overview, search]);

  const flagColumns: DataTableColumn<ConfigurationFeatureFlag>[] = useMemo(
    () => [
      {
        key: 'key',
        title: 'Key',
        dataKey: 'key',
        sortable: true,
        render: (item) => (
          <Link
            href={buildConfigurationFeatureFlagDetailHref(item.key)}
            style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}
          >
            {item.key}
          </Link>
        )
      },
      {
        key: 'name',
        title: '名称',
        dataKey: 'name',
        sortable: true,
        render: (item) => item.name ?? item.key
      },
      {
        key: 'enabled',
        title: '状态',
        sortable: true,
        render: (item) => (
          <StatusBadge
            label={featureFlagStatusLabel(item)}
            variant={FEATURE_FLAG_STATUS_VARIANT[String(item.enabled) as 'true' | 'false']}
            dot
            size="sm"
          />
        )
      },
      {
        key: 'rolloutPercentage',
        title: '发布',
        dataKey: 'rolloutPercentage',
        render: (item) => `${item.rolloutPercentage ?? 0}%`
      },
      {
        key: 'reason',
        title: '原因',
        dataKey: 'reason',
        render: (item) => item.reason ?? '—'
      },
      {
        key: 'source',
        title: '来源',
        dataKey: 'source',
        render: (item) => item.source ?? '—'
      }
    ],
    []
  );

  const entryColumns: DataTableColumn<ConfigurationConfigEntry>[] = useMemo(
    () => [
      {
        key: 'key',
        title: 'Key',
        dataKey: 'key',
        sortable: true,
        render: (item) => (
          <div>
            <Link
              href={buildConfigurationConfigEntryDetailHref(item.id)}
              style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}
            >
              {item.key}
            </Link>
            <div style={{ fontSize: 11, color: '#64748b' }}>{item.id}</div>
          </div>
        )
      },
      {
        key: 'namespace',
        title: '命名空间',
        dataKey: 'namespace',
        sortable: true,
        render: (item) => item.namespace ?? '—'
      },
      {
        key: 'value',
        title: '当前值',
        render: (item) => (
          <span style={{ fontSize: 12, color: '#cbd5f5', fontFamily: 'monospace' }}>{summarizeConfigEntry(item)}</span>
        )
      },
      {
        key: 'valueType',
        title: '类型',
        dataKey: 'valueType',
        render: (item) => item.valueType ?? '—'
      },
      {
        key: 'status',
        title: '状态',
        dataKey: 'status',
        render: (item) => item.status ?? '—'
      },
      {
        key: 'version',
        title: '版本',
        dataKey: 'version',
        render: (item) => item.version ?? 1
      },
      {
        key: 'updatedAt',
        title: '更新时间',
        dataKey: 'updatedAt',
        render: (item) => new Date(item.updatedAt).toLocaleString('zh-CN')
      }
    ],
    []
  );

  const secretColumns: DataTableColumn<ConfigurationSecretMetadata>[] = useMemo(
    () => [
      {
        key: 'name',
        title: '名称',
        dataKey: 'name',
        sortable: true,
        render: (item) => (
          <div>
            <Link
              href={buildConfigurationSecretDetailHref(item.name)}
              style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}
            >
              {item.name}
            </Link>
            <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeSecret(item)}</div>
          </div>
        )
      },
      {
        key: 'status',
        title: '状态',
        render: (item) => {
          const status = item.status ?? 'active';
          const label = SECRET_STATUS_LABEL[status] ?? status;
          const variant = SECRET_STATUS_VARIANT[status] ?? 'neutral';
          return (
            <StatusBadge
              label={label}
              variant={toVariant(variant)}
              dot
              size="sm"
            />
          );
        }
      },
      {
        key: 'expiresAt',
        title: '过期时间',
        dataKey: 'expiresAt',
        render: (item) => item.expiresAt ?? '—'
      },
      {
        key: 'version',
        title: '版本',
        dataKey: 'version',
        render: (item) => item.version ?? 1
      }
    ],
    []
  );

  const certificateColumns: DataTableColumn<ConfigurationCertificateMetadata>[] = useMemo(
    () => [
      {
        key: 'name',
        title: '名称',
        dataKey: 'name',
        sortable: true,
        render: (item) => (
          <div>
            <Link
              href={buildConfigurationCertificateDetailHref(item.name)}
              style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}
            >
              {item.name}
            </Link>
            <div style={{ fontSize: 11, color: '#64748b' }}>{summarizeCertificate(item)}</div>
          </div>
        )
      },
      {
        key: 'status',
        title: '状态',
        render: (item) => {
          const label = CERTIFICATE_STATUS_LABEL[item.status] ?? item.status;
          const variant = CERTIFICATE_STATUS_VARIANT[item.status] ?? 'neutral';
          return (
            <StatusBadge
              label={label}
              variant={toVariant(variant)}
              dot
              size="sm"
            />
          );
        }
      },
      {
        key: 'expiresAt',
        title: '过期时间',
        dataKey: 'expiresAt',
        render: (item) => new Date(item.expiresAt).toLocaleDateString('zh-CN')
      },
      {
        key: 'daysToExpire',
        title: '剩余天数',
        dataKey: 'daysToExpire',
        render: (item) => (item.daysToExpire !== undefined ? `${item.daysToExpire}天` : '—')
      },
      {
        key: 'autoRenew',
        title: '自动续签',
        dataKey: 'autoRenew',
        render: (item) => (item.autoRenew ? '是' : '否')
      }
    ],
    []
  );

  const [sortConfig, setSortConfig] = useState<DataTableSortConfig | null>({ key: 'updatedAt', direction: 'desc' });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <Tabs
          items={TAB_DEFINITIONS.map((definition) => ({
            key: definition.key,
            label: definition.label,
            count: counts[definition.key]
          }))}
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as TabKey);
            setPage(1);
          }}
          variant="pills"
        />
      </div>

      {activeTab !== 'overview' ? (
        <SearchFilterInput
          value={search}
          onChange={setSearch}
          placeholder={`搜索 ${activeTab === 'feature-flags' ? '功能开关' : activeTab === 'config-entries' ? '配置项' : activeTab === 'secrets' ? '密钥' : '证书'}...`}
        />
      ) : null}

      {activeTab === 'overview' ? (
        <OverviewBoard overview={overview} managementMetadata={managementMetadata} />
      ) : null}

      {activeTab === 'feature-flags' ? (
        <DataTable
          title={`功能开关（${filteredFlags.length}）`}
          columns={flagColumns}
          items={paginate(filteredFlags, page, pageSize)}
          rowKey={(item) => item.key}
          sort={sortConfig}
          onSortChange={setSortConfig}
          striped
          compact
        />
      ) : null}

      {activeTab === 'config-entries' ? (
        <DataTable
          title={`配置项（${filteredEntries.length}）`}
          columns={entryColumns}
          items={paginate(filteredEntries, page, pageSize)}
          rowKey={(item) => item.id}
          sort={sortConfig}
          onSortChange={setSortConfig}
          striped
          compact
        />
      ) : null}

      {activeTab === 'secrets' ? (
        <DataTable
          title={`密钥（${filteredSecrets.length}）`}
          columns={secretColumns}
          items={paginate(filteredSecrets, page, pageSize)}
          rowKey={(item) => item.name}
          striped
          compact
        />
      ) : null}

      {activeTab === 'certificates' ? (
        <DataTable
          title={`证书（${filteredCertificates.length}）`}
          columns={certificateColumns}
          items={paginate(filteredCertificates, page, pageSize)}
          rowKey={(item) => item.name}
          striped
          compact
        />
      ) : null}

      {activeTab !== 'overview' ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={
            activeTab === 'feature-flags'
              ? filteredFlags.length
              : activeTab === 'config-entries'
                ? filteredEntries.length
                : activeTab === 'secrets'
                  ? filteredSecrets.length
                  : filteredCertificates.length
          }
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}

      <FilterChips
        chips={[
          { key: 'tenant', label: `租户: ${_query?.[0]?.tenantId ?? '—'}`, tone: 'neutral' as const },
          { key: 'brand', label: `品牌: ${_query?.[0]?.brandId ?? '—'}`, tone: 'neutral' as const },
          { key: 'store', label: `门店: ${_query?.[0]?.storeId ?? '—'}`, tone: 'neutral' as const },
          { key: 'market', label: `市场: ${_query?.[0]?.marketCode ?? '—'}`, tone: 'neutral' as const }
        ]}
        onClearAll={() => undefined}
        onRemove={() => undefined}
        hint="配置上下文："
        size="sm"
        style={{ marginTop: 16 }}
      />

      <DetailActionBar
        actions={actions}
        heading="工作台收口动作"
        caption="复制 / 导出 / 分享当前配置治理工作台快照"
      />
    </div>
  );
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function OverviewBoard({
  overview,
  managementMetadata
}: {
  overview: ConfigurationOverview;
  managementMetadata: ConfigurationGovernanceMetadataEntry[];
}) {
  const { posture, configuration } = overview;
  const auditHref = buildAuditTrailHref({ source: 'configuration-governance', limit: 50 });
  const foundationHref = buildFoundationWorkspaceHref({
    moduleKey: 'configuration-governance',
    consumer: 'workbench'
  });

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <SummaryCard
          title="配置项"
          primary={`${configuration.entries.total}`}
          secondary={`活跃 ${configuration.entries.active} · 命名空间 ${Object.keys(configuration.entries.namespaces).length}`}
        />
        <SummaryCard
          title="功能开关"
          primary={`${configuration.featureFlags.total}`}
          secondary={`启用 ${configuration.featureFlags.enabled} · 策略 ${Object.keys(configuration.featureFlags.byStrategy).length}`}
        />
        <SummaryCard
          title="密钥"
          primary={`${configuration.secrets.total}`}
          secondary={`待轮换 ${posture.secrets.rotationDue} · 已过期 ${posture.secrets.expired}`}
          tone={posture.secrets.rotationDue > 0 ? 'warning' : 'normal'}
        />
        <SummaryCard
          title="证书"
          primary={`${configuration.certificates.total}`}
          secondary={`即将到期 ${posture.certificates.expiringSoon} · 已过期 ${posture.certificates.expired}`}
          tone={posture.certificates.expiringSoon > 0 ? 'warning' : 'normal'}
        />
        <SummaryCard
          title="密钥共享消费者"
          primary={`${posture.secrets.sharedConsumers}`}
          secondary={`共享 ≥2 消费者的密钥数量`}
        />
        <SummaryCard
          title="证书自动续签"
          primary={`${posture.certificates.autoRenewDisabled}`}
          secondary={`未启用自动续签的证书`}
          tone={posture.certificates.autoRenewDisabled > 0 ? 'warning' : 'normal'}
        />
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <ActionCard
          title="治理审批中心"
          description="查看高风险配置变更相关审批与执行状态。"
          href={`${adminGovernanceApprovalsRoute.href}?status=PENDING`}
          detail="聚焦待审批单"
        />
        <ActionCard
          title="审计日志"
          description="查看 configuration-governance 相关的审计留痕。"
          href={auditHref}
          detail="聚焦配置治理来源"
        />
        <ActionCard
          title="Foundation 模块"
          description="回到 foundation 总览查看 configuration-governance 模块健康度与依赖。"
          href={foundationHref}
          detail="聚焦模块 drilldown"
        />
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <ManagementMetadataPanel items={managementMetadata} />
        <AttentionPanel title="待关注密钥" items={posture.attention.secrets} emptyText="暂无需要立即处理的密钥风险" />
        <AttentionPanel title="待关注证书" items={posture.attention.certificates} emptyText="暂无需要立即处理的证书风险" />
      </div>
    </div>
  );
}

function SummaryCard({ title, primary, secondary, tone }: { title: string; primary: string; secondary: string; tone?: 'warning' | 'normal' }) {
  const accent = tone === 'warning' ? '#fbbf24' : '#93c5fd';
  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 12,
        padding: 18,
        background: 'rgba(15,23,42,0.6)',
        color: '#e2e8f0'
      }}
    >
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent, marginBottom: 6 }}>{primary}</div>
      <div style={{ fontSize: 12, color: '#cbd5f5' }}>{secondary}</div>
    </div>
  );
}

function ActionCard({ title, description, href, detail }: { title: string; description: string; href: string; detail: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 12,
        padding: 18,
        background: 'rgba(15,23,42,0.6)',
        color: '#e2e8f0',
        textDecoration: 'none'
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
      <div style={{ marginTop: 8, fontSize: 13, color: '#cbd5f5' }}>{description}</div>
      <div style={{ marginTop: 12, fontSize: 12, color: '#93c5fd' }}>{detail}</div>
    </Link>
  );
}

function AttentionPanel({
  title,
  items,
  emptyText
}: {
  title: string;
  items: ConfigurationOverview['posture']['attention']['secrets'];
  emptyText: string;
}) {
  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 12,
        padding: 18,
        background: 'rgba(15,23,42,0.6)',
        color: '#e2e8f0'
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{title}</div>
      {items.length === 0 ? <div style={{ fontSize: 12, color: '#94a3b8' }}>{emptyText}</div> : null}
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((item) => (
          <div
            key={`${item.type}-${item.key}`}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(30,41,59,0.65)'
            }}
          >
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>{item.key}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#cbd5f5' }}>
              状态 {item.status}
              {item.expiresAt ? ` · 截止 ${item.expiresAt}` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManagementMetadataPanel({ items }: { items: ConfigurationGovernanceMetadataEntry[] }) {
  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 12,
        padding: 18,
        background: 'rgba(15,23,42,0.6)',
        color: '#e2e8f0'
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>操作边界</div>
      {items.length === 0 ? <div style={{ fontSize: 12, color: '#94a3b8' }}>当前使用 fallback，暂未取得真实 RBAC/审批 metadata</div> : null}
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((item) => (
          <Link
            key={item.operation}
            href={buildConfigurationOperationDetailHref(item.operation)}
            style={{
              display: 'block',
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(30,41,59,0.65)',
              color: '#e2e8f0',
              textDecoration: 'none'
            }}
          >
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#93c5fd' }}>{item.operation}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#cbd5f5' }}>
              {item.rbac.resource}:{item.rbac.action} · 角色 {item.rbac.requiredRoles.join(', ')}
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: '#cbd5f5' }}>
              权限 {item.rbac.requiredPermissions.join(', ') || '—'} · 审批 {item.approval.required ? '需要' : '不需要'}
              {item.approval.required ? ` · ${item.approval.status}` : ''}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
