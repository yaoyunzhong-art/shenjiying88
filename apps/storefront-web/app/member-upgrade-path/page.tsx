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
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary, MemberUpgradePath, type UpgradeTierNode } from '@m5/ui';

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

/**
 * 会员等级数据 — 青铜→白银→黄金→钻石
 */
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

/** 会员升级统计数据 */
function MemberUpgradeSummary({ currentTierKey }: { currentTierKey: string }) {
  const currentIndex = DEFAULT_TIERS.findIndex((t) => t.key === currentTierKey);
  const totalTiers = DEFAULT_TIERS.length;
  const progress = totalTiers > 1 ? ((currentIndex + 1) / totalTiers) * 100 : 0;

  const nextTier =
    currentIndex < totalTiers - 1 ? DEFAULT_TIERS[currentIndex + 1] : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}
    >
      {/* 当前等级 */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(148,163,184,0.08)',
        }}
      >
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>当前等级</div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: DEFAULT_TIERS[currentIndex]?.color ?? '#94a3b8',
          }}
        >
          {DEFAULT_TIERS[currentIndex]?.name ?? '—'}
        </div>
      </div>

      {/* 等级进度 */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(148,163,184,0.08)',
        }}
      >
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>升级进度</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
          {currentIndex + 1}/{totalTiers}
        </div>
        <div
          style={{
            marginTop: 6,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 2,
              background: 'linear-gradient(90deg, #f59e0b, #d97706)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* 下一等级 */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(148,163,184,0.08)',
        }}
      >
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

      {/* 权益概览 */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(148,163,184,0.08)',
        }}
      >
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>当前权益数</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#34d399' }}>
          {DEFAULT_TIERS[currentIndex]?.benefits?.length ?? 0} 项
        </div>
      </div>
    </div>
  );
}

/** 加载占位 */
function MemberUpgradeLoadingFallback() {
  return (
    <div style={{ padding: 32, maxWidth: 1000, margin: '0 auto' }}>
      {/* 统计 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={2} label={`加载统计 ${i}`} />
        ))}
      </div>

      {/* 升级路径 */}
      <LoadingSkeleton variant="card" rows={6} label="加载升级路径..." />
    </div>
  );
}

/** 错误回退 */
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

/** 空状态 */
function MemberUpgradeEmptyState() {
  return (
    <EmptyState
      title="暂未配置会员等级"
      description="门店尚未配置会员升级体系，请联系管理员初始化会员等级配置。"
    />
  );
}

export default function MemberUpgradePathPage() {
  const currentTierKey = 'silver';

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '会员升级路径',
            applicationCategory: 'BusinessApplication',
            description:
              '查看从青铜→白银→黄金→钻石的完整会员升级阶梯。了解各级消费条件与专属权益。',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY',
            },
          }),
        }}
      />

      {/* 当前排名统计摘要 */}
      <MemberUpgradeSummary currentTierKey={currentTierKey} />

      {/* 升级路径主体 */}
      <ErrorBoundary fallback={<MemberUpgradeErrorFallback />}>
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

      {/* 底部提示 */}
      <div
        style={{
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
        }}
      >
        <strong style={{ color: '#fbbf24' }}>💡 升级小贴士</strong>
        <br />
        积分每月 1 日结算，累计消费以订单实付金额为准（不含运费和优惠券抵扣部分）。
        达到升级条件后系统将在 24 小时内自动升级等级，无需手动申请。
        部分权益（如生日礼物）需完成身份认证后方可享受。
      </div>
    </>
  );
}
