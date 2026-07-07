/**
 * 会员管理首页 — Member Management (Next.js App Router Page)
 * 展示会员概览、快速访问各子模块入口
 * Server Component: 静态渲染，无客户端交互
 */
import React, { Suspense } from 'react';
import Link from 'next/link';
import { PageShell, StatCard, LoadingSkeleton } from '@m5/ui';

/** 快捷模块入口 */
interface ModuleEntry {
  title: string;
  description: string;
  href: string;
  icon: string;
}

const MODULES: ModuleEntry[] = [
  {
    title: '活动记录',
    description: '查看会员积分变动、等级变更、优惠券发放等操作日志',
    href: '/member/activities',
    icon: '📋',
  },
  {
    title: '配置管理',
    description: '管理会员等级规则、积分策略、权益配置',
    href: '/member/config',
    icon: '⚙️',
  },
];

/** 会员概览统计卡片 */
function OverviewCards() {
  const cards = [
    { label: '总会员数', value: 1286, trend: 3.2, unit: '人' },
    { label: '本月新增', value: 47, trend: 12.5, unit: '人' },
    { label: '活跃会员', value: 835, trend: -2.1, unit: '人' },
    { label: '会员消费总额', value: 356800, trend: 8.7, unit: '元', formatter: (v: number) => `¥${v.toLocaleString()}` },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.formatter ? card.formatter(card.value) : `${card.value.toLocaleString()} ${card.unit}`}
          trend={{
            value: `${card.trend >= 0 ? '+' : ''}${card.trend}%`,
            positive: card.trend >= 0,
          }}
        />
      ))}
    </div>
  );
}

/** 模块入口卡片网格 (use CSS for hover, no onMouseEnter/Leave) */
function ModuleGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
      {MODULES.map((mod) => (
        <Link
          key={mod.href}
          href={mod.href}
          className="member-module-card"
          style={{
            display: 'block',
            padding: 24,
            borderRadius: 12,
            background: 'rgba(15,23,42,0.3)',
            border: '1px solid rgba(148,163,184,0.1)',
            textDecoration: 'none',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>{mod.icon}</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', margin: '0 0 8px' }}>{mod.title}</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{mod.description}</p>
        </Link>
      ))}
    </div>
  );
}

export default function MemberPage() {
  return (
    <PageShell title="会员管理" description="统一管理会员数据、活动记录与配置策略">
      <Suspense fallback={<LoadingSkeleton rows={2} />}>
        <OverviewCards />
      </Suspense>
      <ModuleGrid />
    </PageShell>
  );
}
