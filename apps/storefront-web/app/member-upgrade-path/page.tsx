/**
 * member-upgrade-path — 会员升级路径页 (Next.js App Router Page)
 *
 * 功能:
 * - 展示从青铜→白银→黄金→钻石的完整升级阶梯
 * - 当前会员等级标识（门店自定义配置）
 * - 每级展示：所需条件 / 完成状态 / 权益列表
 * - 提示下一级晋升差距
 * - 空状态 / 加载中 / 错误回退
 * - JSON-LD 结构化数据
 * - 升级统计、等级对比、历史记录、常见问题
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import {
  LoadingSkeleton,
  EmptyState,
  ErrorBoundary,
  MemberUpgradePath,
  type UpgradeTierNode,
} from '@m5/ui';

export const metadata: Metadata = {
  title: '会员升级路径 - 神机营电竞乐园',
  description:
    '查看从青铜→白银→黄金→钻石的完整会员升级阶梯。了解各级所需消费金额、达成条件和专属权益，规划您的升级路线。',
  openGraph: {
    title: '会员升级路径 | 神机营电竞乐园 VIP 等级',
    description: '查看完整会员升级阶梯，了解各级消费条件与专属权益',
    type: 'website',
  },
};

// ============================================================
// 会员等级数据
// ============================================================

const DEFAULT_TIERS: UpgradeTierNode[] = [
  {
    key: 'bronze',
    name: '青铜会员',
    color: '#cd7f32',
    requiredValue: '注册即享',
    benefits: ['基础折扣 9.5折', '生日优惠券', '积分累积'],
  },
  {
    key: 'silver',
    name: '白银会员',
    color: '#9ca3af',
    requiredValue: '累计消费 ≥ ¥500',
    conditions: [
      { label: '累计消费 ¥500', met: true },
      { label: '注册满 30 天', met: true },
      { label: '绑定手机号', met: true },
    ],
    benefits: ['折扣升级 9折', '每月1张满减券', '生日双倍积分'],
  },
  {
    key: 'gold',
    name: '黄金会员',
    color: '#f59e0b',
    requiredValue: '累计消费 ≥ ¥2,000',
    conditions: [
      { label: '累计消费 ¥2,000', met: true },
      { label: '注册满 90 天', met: false },
      { label: '完成身份认证', met: true },
    ],
    benefits: ['折扣升级 8.5折', '每月2张满减券', '专属客服', '免运费'],
  },
  {
    key: 'diamond',
    name: '钻石会员',
    color: '#06b6d4',
    requiredValue: '累计消费 ≥ ¥10,000',
    conditions: [
      { label: '累计消费 ¥10,000', met: false },
      { label: '注册满 365 天', met: false },
    ],
    benefits: ['折扣升级 8折', '不限次免运费', '生日礼物', '新品优先体验'],
  },
];

// ============================================================
// 升级历史记录
// ============================================================

interface UpgradeHistory {
  id: string;
  fromTier: string;
  toTier: string;
  date: string;
  reason: string;
}

const UPGRADE_HISTORIES: UpgradeHistory[] = [
  { id: 'UH-001', fromTier: '青铜会员', toTier: '白银会员', date: '2026-03-15', reason: '累计消费达标自动升级' },
  { id: 'UH-002', fromTier: '白银会员', toTier: '黄金会员', date: '2026-01-10', reason: '历史累计消费达标' },
  { id: 'UH-003', fromTier: '黄金会员', toTier: '钻石会员', date: '2025-09-20', reason: '年度消费达标自动升级' },
];

// ============================================================
// 常见问题
// ============================================================

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FAQ[] = [
  { id: 'F1', question: '升级后多长时间生效？', answer: '达到升级条件后，系统将在 24 小时内自动升级等级，无需手动申请。' },
  { id: 'F2', question: '升级后原有积分会清零吗？', answer: '不会。升级不会影响您的积分余额，所有积分正常累积和使用。' },
  { id: 'F3', question: '消费金额如何计算？', answer: '以订单实付金额为准（不含运费和优惠券抵扣部分）。退款订单扣除对应消费金额。' },
  { id: 'F4', question: '等级会降级吗？', answer: '目前等级终身制，达到后不会降级。但长期不消费可能会影响积分到期。' },
  { id: 'F5', question: '跨店消费是否累计？', answer: '是的。同一会员账号下所有门店消费均累计入总消费金额。' },
];

// ============================================================
// 等级权益对比
// ============================================================

interface BenefitComparison {
  benefit: string;
  bronze: string;
  silver: string;
  gold: string;
  diamond: string;
}

const BENEFIT_COMPARISONS: BenefitComparison[] = [
  { benefit: '基础折扣', bronze: '9.5折', silver: '9折', gold: '8.5折', diamond: '8折' },
  { benefit: '满减券/月', bronze: '0张', silver: '1张', gold: '2张', diamond: '3张' },
  { benefit: '生日福利', bronze: '优惠券', silver: '双倍积分', gold: '双倍积分+礼物', diamond: '专属礼物' },
  { benefit: '运费优惠', bronze: '—', silver: '—', gold: '免运费', diamond: '不限次免运费' },
  { benefit: '专属客服', bronze: '—', silver: '—', gold: '在线客服', diamond: 'VIP专属通道' },
  { benefit: '新品体验', bronze: '—', silver: '—', gold: '—', diamond: '优先体验' },
];

// ============================================================
// 等级统计
// ============================================================

const TIER_STATS = {
  totalMembers: 5824,
  bronzeCount: 2840,
  silverCount: 1680,
  goldCount: 928,
  diamondCount: 376,
  monthlyUpgrades: 142,
};

// ============================================================
// 子组件: 升级统计数据
// ============================================================

function MemberUpgradeSummary({ currentTierKey }: { currentTierKey: string }) {
  const currentIndex = DEFAULT_TIERS.findIndex((t) => t.key === currentTierKey);
  const totalTiers = DEFAULT_TIERS.length;
  const progress = totalTiers > 1 ? ((currentIndex + 1) / totalTiers) * 100 : 0;

  const nextTier = currentIndex < totalTiers - 1 ? DEFAULT_TIERS[currentIndex + 1] : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}
    >
      <div style={{
        padding: '16px 20px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(148,163,184,0.08)',
      }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>当前等级</div>
        <div style={{
          fontSize: 20,
          fontWeight: 700,
          color: DEFAULT_TIERS[currentIndex]?.color ?? '#94a3b8',
        }}>
          {DEFAULT_TIERS[currentIndex]?.name ?? '—'}
        </div>
      </div>

      <div style={{
        padding: '16px 20px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(148,163,184,0.08)',
      }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>升级进度</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
          {currentIndex + 1}/{totalTiers}
        </div>
        <div style={{
          marginTop: 6,
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            borderRadius: 2,
            background: 'linear-gradient(90deg, #f59e0b, #d97706)',
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      <div style={{
        padding: '16px 20px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(148,163,184,0.08)',
      }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>下一等级</div>
        {nextTier ? (
          <>
            <div style={{ fontSize: 20, fontWeight: 700, color: nextTier.color }}>
              {nextTier.name}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              累计消费 {nextTier.requiredValue}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399' }}>已达最高等级</div>
        )}
      </div>

      <div style={{
        padding: '16px 20px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(148,163,184,0.08)',
      }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>当前权益数</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399' }}>
          {DEFAULT_TIERS[currentIndex]?.benefits?.length ?? 0} 项
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 子组件: 等级分布统计
// ============================================================

function TierDistributionPanel() {
  const total = TIER_STATS.totalMembers;
  const tiers = [
    { label: '钻石会员', count: TIER_STATS.diamondCount, color: '#06b6d4' },
    { label: '黄金会员', count: TIER_STATS.goldCount, color: '#f59e0b' },
    { label: '白银会员', count: TIER_STATS.silverCount, color: '#9ca3af' },
    { label: '青铜会员', count: TIER_STATS.bronzeCount, color: '#cd7f32' },
  ];

  return (
    <div style={{
      marginTop: 24,
      padding: 20,
      borderRadius: 14,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(148,163,184,0.08)',
      maxWidth: 1000,
      marginLeft: 'auto',
      marginRight: 'auto',
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>
        📊 会员等级分布
      </h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {tiers.map((tier) => {
          const pct = total > 0 ? Math.round((tier.count / total) * 100) : 0;
          return (
            <div key={tier.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: tier.color }}>{tier.label}</span>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>{tier.count}人 ({pct}%)</span>
              </div>
              <div style={{
                height: 8,
                borderRadius: 4,
                background: 'rgba(148,163,184,0.08)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 4,
                  background: tier.color,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
        本月升级 {TIER_STATS.monthlyUpgrades} 人 · 累计会员 {total.toLocaleString()} 人
      </div>
    </div>
  );
}

// ============================================================
// 子组件: 权益对比表格
// ============================================================

function BenefitComparisonTable({ comparisons }: { comparisons: BenefitComparison[] }) {
  const tierNames = ['青铜会员', '白银会员', '黄金会员', '钻石会员'];
  const tierColors = ['#cd7f32', '#9ca3af', '#f59e0b', '#06b6d4'];

  return (
    <div style={{
      marginTop: 20,
      padding: 20,
      borderRadius: 14,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(148,163,184,0.08)',
      maxWidth: 1000,
      marginLeft: 'auto',
      marginRight: 'auto',
      overflowX: 'auto',
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>
        📋 等级权益对比
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>权益项目</th>
            {tierNames.map((name, i) => (
              <th key={name} style={{
                padding: '10px 12px',
                textAlign: 'center',
                color: tierColors[i],
                fontWeight: 700,
                fontSize: 12,
              }}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparisons.map((row) => {
            const values = [row.bronze, row.silver, row.gold, row.diamond];
            return (
              <tr key={row.benefit} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 500 }}>{row.benefit}</td>
                {values.map((v, i) => (
                  <td key={`${row.benefit}-${i}`} style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    color: v === '—' ? '#475569' : '#94a3b8',
                  }}>
                    <span style={{
                      color: v !== '—' ? tierColors[i] : undefined,
                      fontWeight: v !== '—' ? 600 : undefined,
                    }}>
                      {v}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// 子组件: 升级历史记录
// ============================================================

function UpgradeHistoryTable({ histories }: { histories: UpgradeHistory[] }) {
  return (
    <div style={{
      marginTop: 20,
      padding: 20,
      borderRadius: 14,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(148,163,184,0.08)',
      maxWidth: 1000,
      marginLeft: 'auto',
      marginRight: 'auto',
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>
        🏆 升级记录
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>从</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>到</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>日期</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12 }}>原因</th>
          </tr>
        </thead>
        <tbody>
          {histories.map((h) => (
            <tr key={h.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
              <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{h.fromTier}</td>
              <td style={{ padding: '10px 12px', color: '#f59e0b', fontWeight: 600 }}>{h.toTier}</td>
              <td style={{ padding: '10px 12px', color: '#64748b' }}>{h.date}</td>
              <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{h.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// 子组件: FAQ 面板
// ============================================================

function FAQSection({ faqs }: { faqs: FAQ[] }) {
  return (
    <div style={{
      marginTop: 20,
      padding: 20,
      borderRadius: 14,
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(148,163,184,0.08)',
      maxWidth: 1000,
      marginLeft: 'auto',
      marginRight: 'auto',
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>
        ❓ 常见问题
      </h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {faqs.map((faq) => (
          <div key={faq.id} style={{
            borderRadius: 10,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(148,163,184,0.06)',
            padding: '14px 16px',
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>
              {faq.question}
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              {faq.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 加载/错误/空状态
// ============================================================

function MemberUpgradeLoadingFallback() {
  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={2} label={`加载统计 ${i}`} />
        ))}
      </div>
      <LoadingSkeleton variant="card" rows={6} label="加载升级路径..." />
    </div>
  );
}

function MemberUpgradeErrorFallback() {
  return (
    <EmptyState
      title="会员等级数据加载失败"
      description="无法加载会员升级路径信息。请检查网络连接或稍后重试。"
      actionLabel="重试"
      actionHref="/member-upgrade-path"
    />
  );
}

function MemberUpgradeEmptyState() {
  return (
    <EmptyState
      title="暂未配置会员等级"
      description="门店尚未配置会员升级体系，请联系管理员初始化会员等级配置。"
    />
  );
}

// ============================================================
// 主页面
// ============================================================

export default function MemberUpgradePathPage() {
  const currentTierKey = 'silver';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '会员升级路径',
            applicationCategory: 'BusinessApplication',
            description: '查看从青铜→白银→黄金→钻石的完整会员升级阶梯。了解各级消费条件与专属权益。',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'CNY' },
          }),
        }}
      />

      <MemberUpgradeSummary currentTierKey={currentTierKey} />

      <ErrorBoundary fallback={() => <MemberUpgradeErrorFallback />}>
        <Suspense fallback={<MemberUpgradeLoadingFallback />}>
          {DEFAULT_TIERS && DEFAULT_TIERS.length > 0 ? (
            <MemberUpgradePath
              tiers={DEFAULT_TIERS}
              currentTierKey={currentTierKey}
              subtitle="当前门店 · 标准 VIP 等级体系"
            />
          ) : (
            <MemberUpgradeEmptyState />
          )}
        </Suspense>
      </ErrorBoundary>

      {/* 等级分布 */}
      <TierDistributionPanel />

      {/* 权益对比 */}
      <BenefitComparisonTable comparisons={BENEFIT_COMPARISONS} />

      {/* 升级记录 */}
      <UpgradeHistoryTable histories={UPGRADE_HISTORIES} />

      {/* FAQ */}
      <FAQSection faqs={FAQS} />

      {/* 底部提示 */}
      <div style={{
        marginTop: 24,
        padding: '12px 16px',
        borderRadius: 8,
        background: 'rgba(245,158,11,0.04)',
        border: '1px solid rgba(245,158,11,0.12)',
        fontSize: 12,
        color: '#94a3b8',
        lineHeight: 1.6,
        maxWidth: 1000,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        <strong style={{ color: '#fbbf24' }}>💡 升级小贴士</strong>
        <br />
        积分每月 1 日结算，累计消费以订单实付金额为准（不含运费和优惠券抵扣部分）。
        达到升级条件后系统将在 24 小时内自动升级等级，无需手动申请。
        部分权益（如生日礼物）需完成身份认证后方可享受。
      </div>
    </>
  );
}
