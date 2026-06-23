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
import type { ConfigurationFeatureFlag } from '@m5/types';
import {
  buildConfigurationFeatureFlagDeepLinks,
  type ConfigurationFeatureFlagDetailDelivery
} from '../../../configuration-feature-flag-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';

interface ConfigurationFeatureFlagDetailClientProps {
  snapshot: ConfigurationFeatureFlagDetailDelivery;
}

export default function ConfigurationFeatureFlagDetailClient({
  snapshot
}: ConfigurationFeatureFlagDetailClientProps) {
  if (snapshot.notFound || !snapshot.flag) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <FlagBoard flag={snapshot.flag} snapshot={snapshot} />;
}

function FlagBoard({
  flag,
  snapshot
}: {
  flag: ConfigurationFeatureFlag;
  snapshot: ConfigurationFeatureFlagDetailDelivery;
}) {
  const links = buildConfigurationFeatureFlagDeepLinks(flag, {
    tenantId: snapshot.query.tenantId,
    brandId: snapshot.query.brandId,
    storeId: snapshot.query.storeId,
    marketCode: snapshot.query.marketCode
  });
  const rollout = flag.rolloutPercentage ?? 0;
  const scope = flag.matchedScope;
  const { actions } = useDetailActions({
    workspace: 'configuration',
    detailId: flag.key,
    record: flag
  });

  const relatedColumns: DataTableColumn<ConfigurationFeatureFlag>[] = [
    {
      key: 'key',
      title: 'Key',
      dataKey: 'key',
      sortable: true,
      render: (item) => (
        <Link
          href={`/configuration/flags/${encodeURIComponent(item.key)}`}
          style={{ color: '#93c5fd' }}
        >
          {item.key}
        </Link>
      )
    },
    {
      key: 'enabled',
      title: '状态',
      render: (item) => (
        <StatusBadge
          label={item.enabled ? '启用' : '关闭'}
          variant={item.enabled ? 'success' : 'neutral'}
          dot
          size="sm"
        />
      )
    },
    {
      key: 'rollout',
      title: '灰度',
      render: (item) =>
        item.rolloutPercentage !== undefined ? `${item.rolloutPercentage}%` : '—'
    },
    {
      key: 'subject',
      title: 'Subject Key',
      render: (item) => item.subjectKey ?? '—'
    }
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'configuration', detailLabel: flag.name ?? flag.key })}
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
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Feature Flag</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginTop: 4 }}>
              {flag.name ?? flag.key}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5f5' }}>{flag.key}</div>
            {flag.description ? (
              <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8' }}>{flag.description}</div>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <StatusBadge
              label={flag.enabled ? '启用' : '关闭'}
              variant={flag.enabled ? 'success' : 'neutral'}
              dot
            />
            <StatusBadge
              label={`灰度 ${rollout}%`}
              variant={rollout >= 50 ? 'warning' : 'info'}
              dot
            />
            <StatusBadge
              label={flag.source ?? '—'}
              variant="neutral"
              dot
            />
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
          <Row label="Key" value={flag.key} />
          <Row label="Name" value={flag.name ?? '—'} />
          <Row label="Enabled" value={flag.enabled ? '是' : '否'} />
          <Row label="Reason" value={flag.reason ?? '—'} />
          <Row label="Source" value={flag.source ?? '—'} />
          <Row label="Subject Key" value={flag.subjectKey ?? '—'} />
          <Row label="Rollout" value={`${rollout}%`} />
        </PanelCard>
        <PanelCard title="作用域">
          {scope ? (
            <>
              <Row label="Tenant" value={scope.tenantId ?? '—'} />
              <Row label="Brand" value={scope.brandId ?? '—'} />
              <Row label="Store" value={scope.storeId ?? '—'} />
              <Row label="Market" value={scope.marketCode ?? '—'} />
              <Row label="Scope Type" value={scope.scopeType ?? '—'} />
            </>
          ) : (
            <span style={{ fontSize: 12, color: '#94a3b8' }}>未匹配到具体作用域，使用全局默认</span>
          )}
        </PanelCard>
        <PanelCard title="治理上下文">
          <Row label="Tenant" value={snapshot.query.tenantId ?? '—'} />
          <Row label="Brand" value={snapshot.query.brandId ?? '—'} />
          <Row label="Store" value={snapshot.query.storeId ?? '—'} />
          <Row label="Market" value={snapshot.query.marketCode ?? '—'} />
          <Row label="Posture · enabled" value={`${snapshot.overview.configuration.featureFlags.enabled}`} />
          <Row label="Posture · active" value={`${snapshot.overview.configuration.featureFlags.active}`} />
          <Row label="Posture · total" value={`${snapshot.overview.configuration.featureFlags.total}`} />
        </PanelCard>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'approvals',
            title: '治理审批中心',
            subtitle:
              flag.enabled && rollout >= 50
                ? '该功能开关已放量 ≥50%，变更需要审批'
                : '查看配置治理相关的审批单',
            context: flag.enabled && rollout >= 50 ? '聚焦 PENDING' : '聚焦配置治理',
            href: links.approvalsHref,
            variant: flag.enabled && rollout >= 50 ? 'warning' : 'default'
          },
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `查看该功能开关在审计日志中的留痕（purpose=configuration-flag:${flag.key}）`,
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
          title={`同 subjectKey 的相关 flag（${snapshot.related.length}）`}
          columns={relatedColumns}
          items={snapshot.related}
          rowKey={(item) => item.key}
          striped
          compact
        />
      ) : null}
    </div>
  );
}

function NotFoundPanel({ snapshot }: { snapshot: ConfigurationFeatureFlagDetailDelivery }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'configuration', detailLabel: snapshot.key || '未找到' })}
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
        <div style={{ fontSize: 16, fontWeight: 700 }}>未找到功能开关 {snapshot.key || '（空）'}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#fecaca' }}>
          Delivery: {snapshot.deliveryMode} · 当前 metadata 中没有匹配该 key 的功能开关。
        </div>
      </div>
      <DetailClosureBar
        links={[
          {
            key: 'workspace',
            title: '返回配置治理工作台',
            subtitle: '查看所有功能开关',
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
