import Link from 'next/link';
import { PortalConsumerGovernanceSection } from '@m5/ui';
import { getBrandPortalConsumerSnapshot } from '../../../bootstrap';
import { GovernanceLinkedSection } from '../../../components/governance-linked-overview';

export default async function BrandPortalPage({
  params
}: {
  params: Promise<{ marketCode: string; tenantCode: string; brandCode: string }>;
}) {
  const { marketCode, tenantCode, brandCode } = await params;
  const snapshot = await getBrandPortalConsumerSnapshot(marketCode, tenantCode, brandCode);
  const { portal, market } = snapshot;

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: 32 }}>
      <section
        style={{
          borderRadius: 28,
          padding: 32,
          color: '#f8fafc',
          background: 'linear-gradient(180deg, #3b0764 0%, #111827 100%)'
        }}
      >
        <div style={{ fontSize: 13, color: '#f0abfc' }}>{market.marketName}</div>
        <h1 style={{ marginBottom: 12 }}>{portal.heroTitle}</h1>
        <p style={{ marginTop: 0, color: '#d8b4fe' }}>{portal.heroSubtitle}</p>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.36)' }}>
            <div style={{ fontSize: 12, color: '#e9d5ff' }}>品牌官网能力</div>
            <div style={{ marginTop: 8, color: '#f5f3ff' }}>{portal.solutionTags.join(' / ')}</div>
          </article>
          <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.36)' }}>
            <div style={{ fontSize: 12, color: '#e9d5ff' }}>主域名与社媒</div>
            <div style={{ marginTop: 8, color: '#f5f3ff' }}>{portal.primaryDomain}</div>
            <div style={{ marginTop: 6, color: '#ddd6fe' }}>{market.social.primaryPlatforms.join(' / ')}</div>
          </article>
        </div>

        <PortalConsumerGovernanceSection
          titleColor="#f0abfc"
          primaryTextColor="#f5f3ff"
          secondaryTextColor="#ddd6fe"
          summaryTextColor="#e9d5ff"
          deliverySummary={`交付模式：${snapshot.deliveryMode} / override blocks：${snapshot.regionalOverridesCount}`}
          responsibility={snapshot.consumerDescriptor.responsibility}
          detailLines={[
            `作用域：${snapshot.scope.resolver} / ${snapshot.scope.mismatchStrategy}`,
            `挑战：${snapshot.challenge.enforcement} / 降级：${snapshot.degradation.featureFlagFallback}`,
          ]}
          governanceCodes={snapshot.governance.alerts.map((item) => item.code)}
          governanceSummary={`概览：待审批 ${snapshot.governance.summary.approvalsPending} / 高风险审计 ${snapshot.governance.summary.highRiskAudits} / 密钥关注 ${
            snapshot.governance.summary.rotationDueSecrets + snapshot.governance.summary.expiredSecrets
          }`}
          linkedOverview={
          <GovernanceLinkedSection
            title={`${market.marketName} 品牌治理`}
            description="品牌官网直接复用 linked overview，把概览卡和 triage 卡片联动到当前品牌治理面板。"
            marketCode={marketCode}
            tenantCode={tenantCode}
            brandCode={brandCode}
            governance={snapshot.governance}
          />
          }
        />

        <div style={{ marginTop: 28 }}>
          <Link
            href={portal.loginEntry.loginPath}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 999,
              padding: '12px 18px',
              background: '#f0abfc',
              color: '#3b0764',
              fontWeight: 700
            }}
          >
            {portal.loginEntry.label}
          </Link>
        </div>
      </section>
    </main>
  );
}
