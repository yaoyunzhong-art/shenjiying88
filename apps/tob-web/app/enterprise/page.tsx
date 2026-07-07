/**
 * enterprise/page.tsx — 企业门户入口页 (Enterprise Landing Page)
 * 功能: 企业注册/登录入口、产品功能介绍、快速通道
 * 角色视角: 企业管理员 / 品牌运营者
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Card, StatCard } from '@m5/ui';

// ---- 模拟数据 ----

const FEATURES = [
  { title: '多门店管理', desc: '统一管理全国门店、设备、人员', icon: '🏪' },
  { title: '智能营销', desc: 'AI 驱动的精准营销与会员运营', icon: '🤖' },
  { title: '设备监控', desc: '实时设备告警与远程运维', icon: '📡' },
  { title: '数据分析', desc: '多维度经营报表与趋势预测', icon: '📊' },
  { title: '库存管理', desc: '智能补货预警与调拨', icon: '📦' },
  { title: '告警中心', desc: '7x24 告警聚合与智能诊断', icon: '🔔' },
];

const STATS_ITEMS = [
  { label: '服务门店', value: 5000, suffix: '+' },
  { label: '日处理告警', value: 120000, suffix: '+' },
  { label: '会员总数', value: 5000000, suffix: '+' },
  { label: '系统可用性', value: 99.99, suffix: '%' },
];

// ---- 子组件 ----

function HeroSection() {
  return (
    <section
      style={{
        textAlign: 'center',
        padding: '80px 24px 60px',
        background: 'linear-gradient(180deg, rgba(59,130,246,0.08) 0%, transparent 100%)',
      }}
    >
      <h1
        style={{
          fontSize: 42,
          fontWeight: 700,
          color: '#f8fafc',
          margin: '0 0 16px',
          letterSpacing: '-0.02em',
        }}
      >
        Shenjiying · 企业智能运营平台
      </h1>
      <p
        style={{
          fontSize: 16,
          color: '#94a3b8',
          maxWidth: 600,
          margin: '0 auto 40px',
          lineHeight: 1.6,
        }}
      >
        一站式门店运营管理平台，涵盖设备监控、营销管理、会员运营、智能告警等核心能力，
        助力企业数字化转型升级。
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        <Link href="/enterprise/register">
          <Button variant="primary" size="lg">
            免费注册
          </Button>
        </Link>
        <Link href="/enterprise/login">
          <Button variant="outline" size="lg">
            登录控制台
          </Button>
        </Link>
      </div>
    </section>
  );
}

function StatsBar() {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 24,
        padding: '0 24px 48px',
        maxWidth: 900,
        margin: '0 auto',
      }}
    >
      {STATS_ITEMS.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={`${stat.value.toLocaleString()}${stat.suffix}`}
          variant="info"
        />
      ))}
    </section>
  );
}

function FeaturesSection() {
  return (
    <section style={{ padding: '0 24px 48px', maxWidth: 1000, margin: '0 auto' }}>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: '#f8fafc',
          textAlign: 'center',
          margin: '0 0 32px',
        }}
      >
        核心功能
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}
      >
        {FEATURES.map((feature) => (
          <Card key={feature.title} style={{ padding: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{feature.icon}</div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#e2e8f0',
                margin: '0 0 8px',
              }}
            >
              {feature.title}
            </h3>
            <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              {feature.desc}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function QuickLinksSection() {
  return (
    <section style={{ padding: '0 24px 60px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: '#f8fafc',
          margin: '0 0 20px',
        }}
      >
        已有企业账号？
      </h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Link
          href="/enterprise/console"
          style={{
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 8,
            background: 'rgba(59, 130, 246, 0.12)',
            color: '#93c5fd',
            textDecoration: 'none',
          }}
        >
          进入控制台
        </Link>
        <Link
          href="/docs-center"
          style={{
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 8,
            background: 'rgba(168, 85, 247, 0.12)',
            color: '#c4b5fd',
            textDecoration: 'none',
          }}
        >
          帮助文档
        </Link>
        <Link
          href="/teams"
          style={{
            padding: '12px 28px',
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 8,
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#86efac',
            textDecoration: 'none',
          }}
        >
          企业套餐
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(148,163,184,0.1)',
        padding: '32px 24px',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
        &copy; {new Date().getFullYear()} Shenjiying. All rights reserved. 沪ICP备xxxxxxxx号
      </p>
    </footer>
  );
}

// ---- 主组件 ----

export default function EnterpriseLandingPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0f172a' }}>
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <QuickLinksSection />
      <Footer />
    </main>
  );
}
