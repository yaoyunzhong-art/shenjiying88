import Link from 'next/link';
import { PortalConsumerGovernanceSection } from '@m5/ui';
import { getTenantPortalConsumerSnapshot } from '../../bootstrap';
import { GovernanceLinkedSection } from '../../components/governance-linked-overview';
import { RuntimeGovernancePanel } from '../../components/runtime-governance-panel';

export default async function TenantPortalPage({
  params
}: {
  params: Promise<{ marketCode: string; tenantCode: string }>;
}) {
  const { marketCode, tenantCode } = await params;
  const snapshot = await getTenantPortalConsumerSnapshot(marketCode, tenantCode);
  const { portal, market } = snapshot;

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: 32 }}>
      <section
        style={{
          borderRadius: 28,
          padding: 32,
          color: '#f8fafc',
          background: 'linear-gradient(180deg, #082f49 0%, #0f172a 100%)'
        }}
      >
        <div style={{ fontSize: 13, color: '#bae6fd' }}>{market.marketName}</div>
        <h1 style={{ marginBottom: 12 }}>{portal.heroTitle}</h1>
        <p style={{ marginTop: 0, color: '#cbd5e1' }}>{portal.heroSubtitle}</p>

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <article style={{ borderRadius: 16, padding: 18, background: 'rgba(15, 23, 42, 0.35)' }}>
            <div style={{ fontSize: 12, color: '#93c5fd' }}>语言与时区</div>
            <div style={{ marginTop: 8 }}>{market.locale.supportedLanguages.join(' / ')}</div>
            <div style={{ marginTop: 6, color: '#cbd5e1' }}>{market.timezone.timezone}</div>
          </article>
          <article style={{ borderRadius: 16, padding: 18, background: 'rgba(15, 23, 42, 0.35)' }}>
            <div style={{ fontSize: 12, color: '#93c5fd' }}>税务与货币</div>
            <div style={{ marginTop: 8 }}>
              {market.currency.currencyCode} / {market.tax.taxLabel}
            </div>
            <div style={{ marginTop: 6, color: '#cbd5e1' }}>{market.tax.taxMode}</div>
          </article>
          <article style={{ borderRadius: 16, padding: 18, background: 'rgba(15, 23, 42, 0.35)' }}>
            <div style={{ fontSize: 12, color: '#93c5fd' }}>网络与邮箱</div>
            <div style={{ marginTop: 8 }}>{market.network.networkRegion}</div>
            <div style={{ marginTop: 6, color: '#cbd5e1' }}>{market.email.provider}</div>
          </article>
        </div>

        <PortalConsumerGovernanceSection
          titleColor="#bae6fd"
          summaryTextColor="#bae6fd"
          deliverySummary={`交付模式：${snapshot.deliveryMode} / 作用域策略：${snapshot.scope.mismatchStrategy}`}
          responsibility={snapshot.consumerDescriptor.responsibility}
          detailLines={[
            `降级：${snapshot.degradation.featureFlagFallback} / 脱敏：${snapshot.degradation.desensitizationMode}`,
            `挑战：${snapshot.challenge.enforcement} / ${snapshot.challenge.notes.join(' / ')}`,
            `启动顺序：${snapshot.consumerDescriptor.recommendedSequence.join(' -> ')}`,
            `高风险入口：${snapshot.consumerDescriptor.highRiskEntrypoints.join(' / ')}`,
          ]}
          governanceCodes={snapshot.governance.alerts.map((item) => item.code)}
          governanceSummary={`概览：待审批 ${snapshot.governance.summary.approvalsPending} / 高风险审计 ${snapshot.governance.summary.highRiskAudits} / 韧性关注 ${
            snapshot.governance.summary.degradedSignals +
            snapshot.governance.summary.attentionRecoveryPlans +
            snapshot.governance.summary.staleDrills
          }`}
          linkedOverview={
          <GovernanceLinkedSection
            title={`${market.marketName} 租户治理`}
            description="租户官网内的概览卡、top risks、triage 卡片可直接联动当前治理面板。"
            marketCode={marketCode}
            tenantCode={tenantCode}
            governance={snapshot.governance}
          />
          }
          runtimePanel={<RuntimeGovernancePanel marketCode={marketCode} tenantCode={tenantCode} />}
        />

        <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {portal.solutionTags.map((tag) => (
            <span
              key={tag}
              style={{
                borderRadius: 999,
                padding: '8px 14px',
                border: '1px solid rgba(125, 211, 252, 0.35)',
                color: '#e0f2fe'
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <Link
            href={portal.loginEntry.loginPath}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 999,
              padding: '12px 18px',
              background: '#38bdf8',
              color: '#082f49',
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
