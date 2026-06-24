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
import type { ConfigurationCertificateMetadata } from '@m5/types';
import {
  buildConfigurationCertificateDeepLinks,
  type ConfigurationCertificateDetailDelivery
} from '../../../configuration-certificate-view-model';
import { useDetailActions } from '../../../components/use-detail-actions';
import { buildStandardBreadcrumb } from '../../../components/detail-workspace-registry';
import {
  CERTIFICATE_STATUS_LABEL,
  CERTIFICATE_STATUS_VARIANT,
  summarizeCertificate
} from '../../../configuration-view-model';

interface ConfigurationCertificateDetailClientProps {
  snapshot: ConfigurationCertificateDetailDelivery;
}

export default function ConfigurationCertificateDetailClient({
  snapshot
}: ConfigurationCertificateDetailClientProps) {
  if (snapshot.notFound || !snapshot.certificate) {
    return <NotFoundPanel snapshot={snapshot} />;
  }
  return <CertificateBoard certificate={snapshot.certificate} snapshot={snapshot} />;
}

function CertificateBoard({
  certificate,
  snapshot
}: {
  certificate: ConfigurationCertificateMetadata;
  snapshot: ConfigurationCertificateDetailDelivery;
}) {
  const links = buildConfigurationCertificateDeepLinks(certificate, {
    tenantId: snapshot.query.tenantId,
    brandId: snapshot.query.brandId,
    storeId: snapshot.query.storeId,
    marketCode: snapshot.query.marketCode
  });
  const label = CERTIFICATE_STATUS_LABEL[certificate.status] ?? certificate.status;
  const variant = CERTIFICATE_STATUS_VARIANT[certificate.status] ?? 'neutral';
  const { actions } = useDetailActions({
    workspace: 'configuration',
    detailId: certificate.name,
    record: certificate
  });

  const relatedColumns: DataTableColumn<ConfigurationCertificateMetadata>[] = [
    {
      key: 'name',
      title: '名称',
      dataKey: 'name',
      sortable: true,
      render: (item) => (
        <Link
          href={`/configuration/certificates/${encodeURIComponent(item.name)}`}
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
        const itemLabel = CERTIFICATE_STATUS_LABEL[item.status] ?? item.status;
        const itemVariant = CERTIFICATE_STATUS_VARIANT[item.status] ?? 'neutral';
        return <StatusBadge label={itemLabel} variant={itemVariant} dot size="sm" />;
      }
    },
    {
      key: 'issuer',
      title: 'Issuer',
      dataKey: 'issuer',
      render: (item) => item.issuer ?? '—'
    },
    {
      key: 'expiresAt',
      title: '到期时间',
      dataKey: 'expiresAt',
      render: (item) => new Date(item.expiresAt).toLocaleDateString('zh-CN')
    },
    {
      key: 'autoRenew',
      title: '自动续签',
      dataKey: 'autoRenew',
      render: (item) => (item.autoRenew ? '是' : '否')
    }
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        {...buildStandardBreadcrumb({ workspace: 'configuration', detailLabel: certificate.name })}
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
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Certificate</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginTop: 4 }}>
              {certificate.name}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5f5' }}>
              {summarizeCertificate(certificate)}
            </div>
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
          <Row label="Name" value={certificate.name} />
          <Row label="Status" value={label} />
          <Row label="Issuer" value={certificate.issuer ?? '—'} />
          <Row label="Fingerprint" value={certificate.fingerprint ?? '—'} />
          <Row label="Expires At" value={new Date(certificate.expiresAt).toLocaleString('zh-CN')} />
          <Row label="Days To Expire" value={certificate.daysToExpire !== undefined ? `${certificate.daysToExpire} 天` : '—'} />
          <Row label="Auto Renew" value={certificate.autoRenew ? '是' : '否'} />
        </PanelCard>
        <PanelCard title="治理上下文">
          <Row label="Tenant" value={snapshot.query.tenantId ?? '—'} />
          <Row label="Brand" value={snapshot.query.brandId ?? '—'} />
          <Row label="Store" value={snapshot.query.storeId ?? '—'} />
          <Row label="Market" value={snapshot.query.marketCode ?? '—'} />
          <Row label="Posture · expiring soon" value={`${snapshot.overview.posture.certificates.expiringSoon}`} />
          <Row label="Posture · expired" value={`${snapshot.overview.posture.certificates.expired}`} />
          <Row label="Posture · auto-renew disabled" value={`${snapshot.overview.posture.certificates.autoRenewDisabled}`} />
        </PanelCard>
        <PanelCard title="健康度">
          <Row label="Status" value={label} />
          <Row label="Auto Renew" value={certificate.autoRenew ? '启用' : '未启用'} />
          <Row
            label="Days To Expire"
            value={certificate.daysToExpire !== undefined ? `${certificate.daysToExpire} 天` : '—'}
          />
          <Row
            label="Renewal Window"
            value={
              certificate.autoRenew
                ? '由系统自动续签'
                : certificate.daysToExpire !== undefined && certificate.daysToExpire < 30
                  ? '需要人工介入'
                  : '常规巡检'
            }
          />
        </PanelCard>
      </div>

      <DetailClosureBar
        links={[
          {
            key: 'approvals',
            title: '治理审批中心',
            subtitle:
              certificate.status === 'expiring-soon' || certificate.status === 'expired'
                ? '该证书需要审批：查看 PENDING/ALL 列表'
                : '查看证书/密钥相关的审批单',
            context:
              certificate.status === 'expired'
                ? '聚焦 ALL'
                : certificate.status === 'expiring-soon'
                  ? '聚焦 PENDING'
                  : '聚焦配置治理',
            href: links.approvalsHref,
            variant:
              certificate.status === 'expiring-soon' || certificate.status === 'expired'
                ? 'danger'
                : 'default'
          },
          {
            key: 'audit',
            title: '审计日志',
            subtitle: `查看该证书在审计日志中的留痕（purpose=configuration-certificate:${certificate.name}）`,
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
          title={`同 issuer 的相关证书（${snapshot.related.length}）`}
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

function NotFoundPanel({ snapshot }: { snapshot: ConfigurationCertificateDetailDelivery }) {
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
        <div style={{ fontSize: 16, fontWeight: 700 }}>未找到证书 {snapshot.name || '（空）'}</div>
        <div style={{ marginTop: 8, fontSize: 13, color: '#fecaca' }}>
          Delivery: {snapshot.deliveryMode} · 当前 metadata 中没有匹配该 name 的证书。
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
