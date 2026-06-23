import { notFound } from 'next/navigation';
import { PortalConsumerGovernanceSection } from '@m5/ui';
import { getStorePortal, getStorefrontConsumerSnapshot } from '../market-bootstrap';
import { GovernanceLinkedSection } from '../components/governance-linked-overview';
import { RuntimeGovernancePanel } from '../components/runtime-governance-panel';
import { resolveStoreScope } from '../store-scope';
import { StoreShowcaseClient } from '../components/store-showcase-client';

const marketTouchpoints = [
  '市场化活动落地页',
  '多语言领券页',
  '区域赛事报名页',
  '品牌联名分享页',
  '预约与排队入口',
];

const defaultTouchpoints = [
  '门店活动落地页',
  '优惠券领取页',
  '赛事报名页',
  '生日趴 / 团建分享页',
  '预约与排队入口',
];

export default async function StoreSitePage({
  params,
}: {
  params: Promise<{ storeScope: string[] }>;
}) {
  const { storeScope } = await params;
  const isH5 = storeScope[storeScope.length - 1] === 'h5';
  const resolved = resolveStoreScope(isH5 ? storeScope.slice(0, -1) : storeScope);

  if (!resolved) {
    notFound();
  }

  const { marketCode, tenantCode, brandCode, storeCode } = resolved;

  if (isH5) {
    if (storeScope.length === 4) {
      return (
        <main style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
          <section
            style={{
              borderRadius: 24,
              padding: 24,
              color: '#f8fafc',
              background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            }}
          >
            <div style={{ fontSize: 12, color: '#cbd5e1' }}>
              H5 / {marketCode} / {tenantCode} / {brandCode} / {storeCode}
            </div>
            <h1 style={{ marginBottom: 12 }}>门店 H5 触达中台</h1>
            <p style={{ color: '#cbd5e1', marginTop: 0 }}>
              用于承接广告投放、分享裂变、活动报名、领券、预约等高频移动轻触达场景，默认采用国内市场配置。
            </p>

            <div style={{ display: 'grid', gap: 12 }}>
              {defaultTouchpoints.map((item) => (
                <article
                  key={item}
                  style={{ borderRadius: 14, padding: 16, background: 'rgba(15, 23, 42, 0.42)' }}
                >
                  {item}
                </article>
              ))}
            </div>
          </section>
        </main>
      );
    }

    const snapshot = await getStorefrontConsumerSnapshot(marketCode, tenantCode, brandCode, storeCode);

    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
        <section
          style={{
            borderRadius: 24,
            padding: 24,
            color: '#f8fafc',
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
          }}
        >
          <div style={{ fontSize: 12, color: '#cbd5e1' }}>
            H5 / {marketCode} / {tenantCode} / {brandCode} / {storeCode}
          </div>
          <h1 style={{ marginBottom: 12 }}>门店 H5 触达中台</h1>
          <p style={{ color: '#cbd5e1', marginTop: 0 }}>
            H5 已预留市场维度，后续可根据国家、语言、税务提示与社媒策略做差异化运营。
          </p>
          <PortalConsumerGovernanceSection
            titleColor="#93c5fd"
            panelStyle={{ marginBottom: 16, background: 'rgba(15, 23, 42, 0.42)' }}
            deliverySummary={`${snapshot.deliveryMode.toUpperCase()} / ${snapshot.scope.scopePath}`}
            responsibility={snapshot.consumerDescriptor.responsibility}
            detailLines={[
              `降级：${snapshot.degradation.featureFlagFallback} / 挑战：${snapshot.challenge.enforcement}`,
              `启动顺序：${snapshot.consumerDescriptor.recommendedSequence.join(' -> ')}`,
            ]}
            governanceCodes={snapshot.governance.alerts.map((item) => item.code)}
            governanceSummary={`概览：待审批 ${snapshot.governance.summary.approvalsPending} / 高风险审计 ${snapshot.governance.summary.highRiskAudits} / 信号异常 ${snapshot.governance.summary.degradedSignals}`}
            linkedOverview={
              <GovernanceLinkedSection
                title="H5 治理"
                description="H5 触达页沿用同一套 linked overview，可在窄屏场景直接聚焦到目标告警。"
                marketCode={marketCode}
                tenantCode={tenantCode}
                brandCode={brandCode}
                storeCode={storeCode}
                governance={snapshot.governance}
              />
            }
            runtimePanel={
              <RuntimeGovernancePanel
                marketCode={marketCode}
                tenantCode={tenantCode}
                brandCode={brandCode}
                storeCode={storeCode}
              />
            }
          />

          <div style={{ display: 'grid', gap: 12 }}>
            {marketTouchpoints.map((item) => (
              <article
                key={item}
                style={{ borderRadius: 14, padding: 16, background: 'rgba(15, 23, 42, 0.42)' }}
              >
                {item}
              </article>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (storeScope.length === 3) {
    const portal = await getStorePortal(marketCode, tenantCode, brandCode, storeCode);

    return (
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: 32 }}>
        <section
          style={{
            borderRadius: 24,
            padding: 32,
            color: '#f8fafc',
            background: 'linear-gradient(180deg, #172554 0%, #0f172a 100%)',
          }}
        >
          <div style={{ fontSize: 13, color: '#cbd5e1' }}>
            {portal.marketCode} / {portal.tenantCode} / {portal.brandCode} / {portal.storeCode}
          </div>
          <h1 style={{ marginBottom: 12 }}>{portal.storeName} ToC 官网</h1>
          <p style={{ margin: 0, color: '#cbd5e1' }}>
            这里是门店独立官网入口，后续承接门店介绍、项目服务、活动日历、预约、赛事和会员权益展示。
          </p>

          <div style={{ marginTop: 24, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
              <div style={{ fontSize: 12, color: '#93c5fd' }}>独立域名</div>
              <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>{portal.primaryDomain}</div>
            </article>
            <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
              <div style={{ fontSize: 12, color: '#93c5fd' }}>支持端</div>
              <div style={{ marginTop: 8, fontSize: 15, color: '#e2e8f0' }}>{portal.supportedSurfaces.join(' / ')}</div>
            </article>
            <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
              <div style={{ fontSize: 12, color: '#93c5fd' }}>默认语言</div>
              <div style={{ marginTop: 8, fontSize: 15, color: '#e2e8f0' }}>{portal.supportedLanguages.join(' / ')}</div>
            </article>
          </div>
        </section>

        <StoreShowcaseClient storeName={portal.storeName} />
      </main>
    );
  }

  const snapshot = await getStorefrontConsumerSnapshot(marketCode, tenantCode, brandCode, storeCode);
  const { portal } = snapshot;

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: 32 }}>
      <section
        style={{
          borderRadius: 24,
          padding: 32,
          color: '#f8fafc',
          background: 'linear-gradient(180deg, #172554 0%, #0f172a 100%)',
        }}
      >
        <div style={{ fontSize: 13, color: '#cbd5e1' }}>
          {portal.marketCode} / {portal.tenantCode} / {portal.brandCode} / {portal.storeCode}
        </div>
        <h1 style={{ marginBottom: 12 }}>{portal.storeName} ToC 官网</h1>
        <p style={{ margin: 0, color: '#cbd5e1' }}>
          当前门店门户已具备市场维度，后续可按国家和语言切换官网内容、H5 活动、税务提示和社媒分享策略。
        </p>

        <div style={{ marginTop: 24, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
            <div style={{ fontSize: 12, color: '#93c5fd' }}>独立域名</div>
            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700 }}>{portal.primaryDomain}</div>
          </article>
          <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
            <div style={{ fontSize: 12, color: '#93c5fd' }}>支持语言</div>
            <div style={{ marginTop: 8, fontSize: 15, color: '#e2e8f0' }}>{portal.supportedLanguages.join(' / ')}</div>
          </article>
          <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
            <div style={{ fontSize: 12, color: '#93c5fd' }}>支持端</div>
            <div style={{ marginTop: 8, fontSize: 15, color: '#e2e8f0' }}>{portal.supportedSurfaces.join(' / ')}</div>
          </article>
        </div>
        <PortalConsumerGovernanceSection
          titleColor="#93c5fd"
          summaryTextColor="#bfdbfe"
          deliverySummary={`交付模式：${snapshot.deliveryMode} / 作用域：${snapshot.scope.scopePath}`}
          responsibility={snapshot.consumerDescriptor.responsibility}
          detailLines={[
            `Scope 策略：${snapshot.scope.mismatchStrategy} / 降级：${snapshot.degradation.featureFlagFallback}`,
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
              title={`${portal.storeName} 治理`}
              description="门店官网已接入 linked overview，概览卡、top risks 与 triage 卡片可直接联动当前门店治理面板。"
              marketCode={marketCode}
              tenantCode={tenantCode}
              brandCode={brandCode}
              storeCode={storeCode}
              governance={snapshot.governance}
            />
          }
          runtimePanel={
            <RuntimeGovernancePanel
              marketCode={marketCode}
              tenantCode={tenantCode}
              brandCode={brandCode}
              storeCode={storeCode}
            />
          }
        />
      </section>
    </main>
  );
}
