import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PortalConsumerGovernanceSection, PortalDomainGovernanceCard } from '@m5/ui';
import { buildDomainGovernanceDisplayModel } from '@m5/types';
import { getStorePortal, getStorefrontConsumerSnapshot } from '../market-bootstrap';
import { GovernanceLinkedSection } from '../components/governance-linked-overview';
import { RuntimeGovernancePanel } from '../components/runtime-governance-panel';
import { resolveStoreScope } from '../store-scope';
import { StoreShowcaseClient } from '../components/store-showcase-client';

// ============================================================
// 门店官网聚合页 — Store Site Portal (Server Component)
// 功能: 多层级门店官网聚合，支持 H5/PC 不同渲染模式
//       展示门店信息、治理面板、市场触达点
// ============================================================

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

/** 扩展的触达点（数据更丰富时展示） */
const extendedTouchpoints = [
  { title: '限时特惠页', desc: '基于库存和时效的优惠聚合页', icon: '🔥' },
  { title: '会员专享页', desc: '会员等级专属页面和权益展示', icon: '💎' },
  { title: '门店介绍页', desc: '门店详细图文介绍及设施展示', icon: '🏪' },
  { title: '联系我们页', desc: '门店地址、联系方式与交通指引', icon: '📞' },
  { title: '服务承诺页', desc: '门店服务体系及售后保障说明', icon: '🤝' },
];

// ============================================================
// 子组件: 门店状态概览卡片
// ============================================================

function StoreStatusBadge({ isH5 }: { isH5: boolean }) {
  const currentHour = new Date().getHours();
  const isOpen = currentHour >= 9 && currentHour < 22;
  const openStatus = isOpen ? '🟢 营业中' : '🔴 已休息';

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      marginBottom: 24,
    }}>
      <div style={{
        padding: '10px 16px',
        borderRadius: 10,
        background: 'rgba(15,23,42,0.45)',
        border: '1px solid rgba(148,163,184,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        color: '#e2e8f0',
      }}>
        {openStatus}
        <span style={{ fontSize: 11, color: '#64748b' }}>09:00 - 22:00</span>
      </div>
      <div style={{
        padding: '10px 16px',
        borderRadius: 10,
        background: 'rgba(15,23,42,0.45)',
        border: '1px solid rgba(148,163,184,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        color: '#e2e8f0',
      }}>
        📱 {isH5 ? '移动端视图' : '桌面端视图'}
      </div>
    </div>
  );
}

// ============================================================
// 子组件: 扩展触达点列表（带描述）
// ============================================================

function ExtendedTouchpointList() {
  return (
    <div style={{ marginTop: 20 }}>
      <h3 style={{
        fontSize: 14,
        fontWeight: 600,
        color: '#93c5fd',
        marginBottom: 12,
      }}>
        更多门店页面
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 10,
      }}>
        {extendedTouchpoints.map((tp) => (
          <div key={tp.title} style={{
            borderRadius: 12,
            padding: 14,
            background: 'rgba(15,23,42,0.35)',
            border: '1px solid rgba(148,163,184,0.08)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}>
              <span style={{ fontSize: 18 }}>{tp.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{tp.title}</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{tp.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 子组件: SEO 元数据注入部分
// ============================================================

function SiteMetadataScript({ storeName, marketCode }: { storeName: string; marketCode: string }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: storeName,
          description: `${storeName} — 神机营 SaaS 门店 ToC 官网（${marketCode}）`,
          url: `https://${storeName?.toLowerCase().replace(/\s+/g, '-')}.shenjiying.com`,
          areaServed: marketCode,
          applicationCategory: 'BusinessApplication',
        }),
      }}
    />
  );
}

// ============================================================
// 子组件: 治理摘要面板（简化版）
// ============================================================

function GovernanceSummaryCards({
  summary,
}: {
  summary: {
    approvalsPending: number;
    highRiskAudits: number;
    degradedSignals: number;
    attentionRecoveryPlans: number;
    staleDrills: number;
  };
}) {
  const items = [
    { label: '待审批', value: summary.approvalsPending, color: '#f59e0b' },
    { label: '高风险审计', value: summary.highRiskAudits, color: '#ef4444' },
    { label: '信号异常', value: summary.degradedSignals, color: '#f97316' },
    { label: '恢复计划', value: summary.attentionRecoveryPlans, color: '#60a5fa' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 10,
      marginBottom: 20,
    }}>
      {items.map((item) => (
        <div key={item.label} style={{
          padding: '12px 10px',
          borderRadius: 10,
          background: 'rgba(15,23,42,0.35)',
          border: '1px solid rgba(148,163,184,0.08)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: item.color }}>
            {item.value}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 子组件: 门店信息头部
// ============================================================

function StoreInfoHeader({
  marketCode,
  tenantCode,
  brandCode,
  storeCode,
  storeName,
  isH5,
}: {
  marketCode: string;
  tenantCode: string;
  brandCode: string;
  storeCode: string;
  storeName?: string;
  isH5: boolean;
}) {
  const hierarchy = [marketCode, tenantCode, brandCode, storeCode].filter(Boolean).join(' / ');
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 12,
        color: '#94a3b8',
        fontFamily: 'monospace',
        marginBottom: 8,
      }}>
        {isH5 ? '📱 H5' : '🖥️ PC'} / {hierarchy}
      </div>
      {storeName && (
        <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>
          {storeName}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 主页面组件 — Server Component
// ============================================================

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

  // ============================================================
  // H5 渲染路径
  // ============================================================
  if (isH5) {
    if (storeScope.length === 4) {
      return (
        <main style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
          <SiteMetadataScript storeName="门店 H5 触达中台" marketCode={marketCode} />
          <StoreInfoHeader
            marketCode={marketCode}
            tenantCode={tenantCode}
            brandCode={brandCode}
            storeCode={storeCode}
            isH5
          />
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

            <StoreStatusBadge isH5 />

            <div style={{ display: 'grid', gap: 12 }}>
              {defaultTouchpoints.map((item) => (
                <article
                  key={item}
                  style={{ borderRadius: 14, padding: 16, background: 'rgba(15, 23, 42, 0.42)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📄</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{item}</span>
                  </div>
                </article>
              ))}
            </div>

            {/* 扩展触达点 */}
            <ExtendedTouchpointList />

            {/* 运营说明 */}
            <div style={{
              marginTop: 20,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(245,158,11,0.04)',
              border: '1px solid rgba(245,158,11,0.12)',
              fontSize: 12,
              color: '#94a3b8',
              lineHeight: 1.6,
            }}>
              <strong style={{ color: '#fbbf24' }}>💡 运营提示</strong>
              <br />
              H5 页面已预留多市场维度支持，可根据国家/语言切换展示内容。
              建议配置 A/B 测试策略以优化不同市场的转化率。
              日历活动与赛事报名 API 已预集成，无需额外开发即可发布。
            </div>
          </section>
        </main>
      );
    }

    // H5 with snapshot
    const snapshot = await getStorefrontConsumerSnapshot(marketCode, tenantCode, brandCode, storeCode);
    const domainGovernanceDisplayModel = buildDomainGovernanceDisplayModel(
      snapshot.portal.domainSource,
      snapshot.domainGovernance,
      snapshot.domainGovernanceWorkspaceHref,
    );

    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
        <SiteMetadataScript storeName={snapshot.portal?.storeName ?? '门店 H5'} marketCode={marketCode} />
        <StoreInfoHeader
          marketCode={marketCode}
          tenantCode={tenantCode}
          brandCode={brandCode}
          storeCode={storeCode}
          storeName={snapshot.portal?.storeName}
          isH5
        />
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

          <StoreStatusBadge isH5 />

          {/* 治理摘要 */}
          <GovernanceSummaryCards
            summary={{
              approvalsPending: snapshot.governance.summary.approvalsPending,
              highRiskAudits: snapshot.governance.summary.highRiskAudits,
              degradedSignals: snapshot.governance.summary.degradedSignals,
              attentionRecoveryPlans: snapshot.governance.summary.attentionRecoveryPlans,
              staleDrills: snapshot.governance.summary.staleDrills,
            }}
          />

          <PortalDomainGovernanceCard
            model={domainGovernanceDisplayModel}
            accentColor="#93c5fd"
            titleColor="#f8fafc"
            summaryColor="#cbd5e1"
            borderColor="rgba(148, 163, 184, 0.12)"
            buttonBackground="#1d4ed8"
            buttonTextColor="#eff6ff"
            background={
              domainGovernanceDisplayModel.requiresAttention
                ? 'rgba(127, 29, 29, 0.35)'
                : 'rgba(15, 23, 42, 0.42)'
            }
            style={{ marginBottom: 16 }}
          />

          <PortalConsumerGovernanceSection
            titleColor="#93c5fd"
            panelStyle={{ marginBottom: 16, background: 'rgba(15, 23, 42, 0.42)' }}
            deliverySummary={`${snapshot.deliveryMode.toUpperCase()} / ${snapshot.scope.scopePath}`}
            responsibility={snapshot.consumerDescriptor.responsibility}
            detailLines={[
              `降级：${snapshot.degradation.featureFlagFallback} / 挑战：${snapshot.challenge.enforcement}`,
              `启动顺序：${snapshot.consumerDescriptor.recommendedSequence.join(' -> ')}`,
              `交付复杂度：${snapshot.governance.alerts.length} 条告警 / 审计项`,
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

          {/* 市场触达点 */}
          <div style={{ display: 'grid', gap: 12 }}>
            {marketTouchpoints.map((item) => (
              <article
                key={item}
                style={{ borderRadius: 14, padding: 16, background: 'rgba(15, 23, 42, 0.42)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>{item}</span>
                </div>
              </article>
            ))}
          </div>

          {/* 扩展触达点 */}
          <ExtendedTouchpointList />
        </section>
      </main>
    );
  }

  // ============================================================
  // PC 渲染路径
  // ============================================================

  if (storeScope.length === 3) {
    const portal = await getStorePortal(marketCode, tenantCode, brandCode, storeCode);

    return (
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: 32 }}>
        <SiteMetadataScript storeName={portal.storeName} marketCode={marketCode} />
        <StoreInfoHeader
          marketCode={marketCode}
          tenantCode={tenantCode}
          brandCode={brandCode}
          storeCode={storeCode}
          storeName={portal.storeName}
          isH5={false}
        />
        <section
          style={{
            borderRadius: 24,
            padding: 32,
            color: '#f8fafc',
            background: 'linear-gradient(180deg, #172554 0%, #0f172a 100%)',
          }}
        >
          <StoreStatusBadge isH5={false} />

          <div style={{ fontSize: 13, color: '#cbd5e1', fontFamily: 'monospace', marginBottom: 8 }}>
            {portal.marketCode} / {portal.tenantCode} / {portal.brandCode} / {portal.storeCode}
          </div>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>{portal.storeName} ToC 官网</h1>
          <p style={{ margin: '0 0 24px', color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>
            这里是门店独立官网入口，后续承接门店介绍、项目服务、活动日历、预约、赛事和会员权益展示。
            作为 P-6 门店官网模块，支持自定义域名、多语言和多端适配。
          </p>

          {/* 四宫格详情 */}
          <div style={{ marginTop: 24, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>🌐</span>
                <div style={{ fontSize: 12, color: '#93c5fd' }}>独立域名</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{portal.primaryDomain}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>支持自定义绑定</div>
            </article>
            <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>📱</span>
                <div style={{ fontSize: 12, color: '#93c5fd' }}>支持端</div>
              </div>
              <div style={{ fontSize: 15, color: '#e2e8f0' }}>{portal.supportedSurfaces.join(' / ')}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                {portal.supportedSurfaces.length} 端覆盖
              </div>
            </article>
            <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>🌍</span>
                <div style={{ fontSize: 12, color: '#93c5fd' }}>支持语言</div>
              </div>
              <div style={{ fontSize: 15, color: '#e2e8f0' }}>{portal.supportedLanguages.join(' / ')}</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                {portal.supportedLanguages.length} 种语言支持
              </div>
            </article>
            <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>⚡</span>
                <div style={{ fontSize: 12, color: '#93c5fd' }}>状态</div>
              </div>
              <div style={{ fontSize: 15, color: '#34d399', fontWeight: 600 }}>🟢 正常运行</div>
              <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                缓存 TTL: 5min · SSR 渲染
              </div>
            </article>
          </div>

          {/* 运营说明 */}
          <div style={{
            marginTop: 20,
            padding: '14px 18px',
            borderRadius: 10,
            background: 'rgba(59,130,246,0.04)',
            border: '1px solid rgba(59,130,246,0.12)',
            fontSize: 12,
            color: '#94a3b8',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: '#60a5fa' }}>🔧 站点配置说明</strong>
            <br />
            该门店官网已自动解析 {portal.marketCode} 市场配置。
            支持 {portal.supportedLanguages.join('、')} 语言，可在 CMS 中配置各语言内容。
            预约功能与门店排期系统深度集成，支持实时预约日历查看。
          </div>
        </section>

        <StoreShowcaseClient storeName={portal.storeName} />
      </main>
    );
  }

  // ============================================================
  // 完整 4 参数路径 — 带治理面板
  // ============================================================

  const snapshot = await getStorefrontConsumerSnapshot(marketCode, tenantCode, brandCode, storeCode);
  const { portal } = snapshot;
  const domainGovernanceDisplayModel = buildDomainGovernanceDisplayModel(
    portal.domainSource,
    snapshot.domainGovernance,
    snapshot.domainGovernanceWorkspaceHref,
  );

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: 32 }}>
      <SiteMetadataScript storeName={portal.storeName} marketCode={marketCode} />
      <StoreInfoHeader
        marketCode={marketCode}
        tenantCode={tenantCode}
        brandCode={brandCode}
        storeCode={storeCode}
        storeName={portal.storeName}
        isH5={false}
      />
      <section
        style={{
          borderRadius: 24,
          padding: 32,
          color: '#f8fafc',
          background: 'linear-gradient(180deg, #172554 0%, #0f172a 100%)',
        }}
      >
        <StoreStatusBadge isH5={false} />

        <div style={{ fontSize: 13, color: '#cbd5e1', fontFamily: 'monospace', marginBottom: 8 }}>
          {portal.marketCode} / {portal.tenantCode} / {portal.brandCode} / {portal.storeCode}
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>{portal.storeName} ToC 官网</h1>
        <p style={{ margin: '0 0 24px', color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>
          当前门店门户已具备市场维度，后续可按国家和语言切换官网内容、H5 活动、税务提示和社媒分享策略。
          治理面板提供实时告警和审批追踪，确保门店官网稳定运行。
        </p>

        {/* 四宫格详情 */}
        <div style={{ marginTop: 24, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🌐</span>
              <div style={{ fontSize: 12, color: '#93c5fd' }}>独立域名</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{portal.primaryDomain}</div>
          </article>
          <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🌍</span>
              <div style={{ fontSize: 12, color: '#93c5fd' }}>支持语言</div>
            </div>
            <div style={{ fontSize: 15, color: '#e2e8f0' }}>{portal.supportedLanguages.join(' / ')}</div>
          </article>
          <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>📱</span>
              <div style={{ fontSize: 12, color: '#93c5fd' }}>支持端</div>
            </div>
            <div style={{ fontSize: 15, color: '#e2e8f0' }}>{portal.supportedSurfaces.join(' / ')}</div>
          </article>
          <article style={{ borderRadius: 16, padding: 20, background: 'rgba(15, 23, 42, 0.45)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <div style={{ fontSize: 12, color: '#93c5fd' }}>状态</div>
            </div>
            <div style={{ fontSize: 15, color: '#34d399', fontWeight: 600 }}>🟢 正常运行</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
              缓存 TTL: 5min · SSR 渲染
            </div>
          </article>
        </div>

        {/* 治理摘要 */}
        <GovernanceSummaryCards
          summary={{
            approvalsPending: snapshot.governance.summary.approvalsPending,
            highRiskAudits: snapshot.governance.summary.highRiskAudits,
            degradedSignals: snapshot.governance.summary.degradedSignals,
            attentionRecoveryPlans: snapshot.governance.summary.attentionRecoveryPlans,
            staleDrills: snapshot.governance.summary.staleDrills,
          }}
        />

        <PortalDomainGovernanceCard
          model={domainGovernanceDisplayModel}
          accentColor="#93c5fd"
          titleColor="#f8fafc"
          summaryColor="#cbd5e1"
          borderColor="rgba(148, 163, 184, 0.1)"
          buttonBackground="#1d4ed8"
          buttonTextColor="#eff6ff"
          background={
            domainGovernanceDisplayModel.requiresAttention
              ? 'rgba(127, 29, 29, 0.28)'
              : 'rgba(15, 23, 42, 0.45)'
          }
          style={{ marginBottom: 16 }}
        />

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

        {/* 扩展触达点 */}
        <ExtendedTouchpointList />
      </section>
    </main>
  );
}
