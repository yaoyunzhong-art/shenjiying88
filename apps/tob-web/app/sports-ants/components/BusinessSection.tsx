/**
 * 运动蚂蚁业务板块区域
 * BigAnts Business Section
 * 重构版本：四大核心业务独立展示模块 + 人群标签 + SaaS融合
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsShadows, BigAntsTransitions } from '../lib/bigants-design';
import { SAAS_FEATURES } from '../lib/shenjiying-saas';

interface BusinessModule {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  color: string;
  targetAudience: string[];    // 目标人群
  typicalCases: string[];       // 典型案例
  saasFeature: string;         // 关联SaaS功能
  href: string;                // 跳转链接
}

interface BusinessSectionProps {
  modules?: BusinessModule[];  // 改为可选，允许使用内置数据
}

// 四大核心业务完整数据
const CORE_BUSINESS_MODULES: BusinessModule[] = [
  {
    id: 'digital-products',
    icon: '🎮',
    title: '数字运动产品',
    subtitle: '自主研发·规模化生产·全渠道销售',
    description: '60+款数字运动设备，涵盖模拟运动、射击系列、VR/AR系列、大型游戏设备等全系列产品，提供源头生产制造商品质保障',
    features: ['AI智能对战', '云端内容更新', 'IoT设备监控', '全年龄段覆盖'],
    color: '#0066FF',
    targetAudience: ['连锁品牌投资者', '商业地产开发商', '传统娱乐转型'],
    typicalCases: ['万达广场', '华润万象城', '新城吾悦广场'],
    saasFeature: 'equipment-monitor',
    href: '/sports-ants/products',
  },
  {
    id: 'epc-service',
    icon: '🏗️',
    title: 'EPC+O全流程服务',
    subtitle: '从规划到运营的一站式服务',
    description: '专业团队提供项目可行性研究、门店选址评估、空间规划设计、施工建设、设备供应、运营管理的全生命周期支持',
    features: ['智能选址系统', '3D空间规划', '六阶段流程', '驻店运营指导'],
    color: '#FF6B00',
    targetAudience: ['初次创业者', '政府/文旅项目', '连锁品牌投资者'],
    typicalCases: ['某市政府公共体育中心', '某景区数字运动馆', '某商业综合体'],
    saasFeature: 'site-selection',
    href: '/sports-ants/epc',
  },
  {
    id: 'franchise',
    icon: '🤝',
    title: '招商加盟',
    subtitle: '三种合作模式·全程扶持',
    description: '灵活的合作模式选择，包括特许加盟、合资联营、品牌授权，总部全程扶持，助力创业者轻松开店',
    features: ['最低首付40%', '6-12个月回本', '40节培训课程', '全程运营支持'],
    color: '#00C853',
    targetAudience: ['初次创业者', '亲子业态投资者', '酒店/民宿业者'],
    typicalCases: ['某三线城市创业者', '某亲子乐园加盟商', '某度假酒店'],
    saasFeature: 'multi-store',
    href: '/sports-ants/franchise',
  },
  {
    id: 'tender',
    icon: '📋',
    title: '招投标项目承接',
    subtitle: 'EPC+O全模式承接大型项目',
    description: '拥有丰富的政府公共体育设施、文旅景区、智慧城市等大型项目承接经验，提供设计-采购-施工+运营全模式服务',
    features: ['EPC总包资质', '运营管理方案', '合规手续支持', '本地服务网络'],
    color: '#8B5CF6',
    targetAudience: ['政府/文旅项目', '连锁品牌投资者', '海外市场进入者'],
    typicalCases: ['某市体育中心', '某文旅景区', '某智慧城市项目'],
    saasFeature: 'operations-dashboard',
    href: '/sports-ants/epc?type=tender',
  },
];

export default function BusinessSection({ modules }: BusinessSectionProps) {
  const businessModules = modules || CORE_BUSINESS_MODULES;

  return (
    <section
      style={{
        background: BigAntsColors.bgLight,
        padding: `${BigAntsSpacing['4xl']} 0`,
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: `0 ${BigAntsSpacing.lg}`,
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: BigAntsSpacing['3xl'] }}>
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '14px',
              fontWeight: 600,
              color: BigAntsColors.primary,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: BigAntsSpacing.md,
            }}
          >
            核心业务
          </p>
          <h2
            style={{
              fontFamily: BigAntsFonts.display,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              color: BigAntsColors.textPrimary,
              marginBottom: BigAntsSpacing.md,
            }}
          >
            四大核心业务板块
          </h2>
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '18px',
              color: BigAntsColors.textSecondary,
              maxWidth: '700px',
              margin: '0 auto',
            }}
          >
            从产品到服务，从设备到运营，运动蚂蚁提供数字运动全产业链解决方案
            <br />
            <span style={{ fontSize: '14px', color: '#00C853' }}>
              神机营SaaS系统全程赋能
            </span>
          </p>
        </div>

        {/* Modules Grid - 2x2 布局 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(580px, 1fr))',
            gap: BigAntsSpacing.xl,
          }}
        >
          {businessModules.map((module) => (
            <div
              key={module.id}
              style={{
                background: BigAntsColors.white,
                borderRadius: BigAntsRadius.xl,
                overflow: 'hidden',
                boxShadow: BigAntsShadows.md,
                transition: `all ${BigAntsTransitions.normal}`,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = BigAntsShadows.xl;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = BigAntsShadows.md;
              }}
            >
              {/* Header with color */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${module.color} 0%, ${module.color}CC 100%)`,
                  padding: `${BigAntsSpacing.xl} ${BigAntsSpacing['2xl']}`,
                  position: 'relative',
                }}
              >
                {/* SaaS Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: BigAntsRadius.full,
                  }}
                >
                  <span style={{ fontSize: '12px' }}>
                    {SAAS_FEATURES[module.saasFeature as keyof typeof SAAS_FEATURES]?.icon || '🔗'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#FFFFFF', fontWeight: 500 }}>
                    {SAAS_FEATURES[module.saasFeature as keyof typeof SAAS_FEATURES]?.name || 'SaaS'}
                  </span>
                </div>

                {/* Icon and Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: BigAntsRadius.lg,
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '36px',
                    }}
                  >
                    {module.icon}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: BigAntsFonts.display,
                        fontSize: '26px',
                        fontWeight: 700,
                        color: BigAntsColors.white,
                        marginBottom: '4px',
                      }}
                    >
                      {module.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: BigAntsFonts.chinese,
                        fontSize: '13px',
                        color: 'rgba(255,255,255,0.85)',
                      }}
                    >
                      {module.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: BigAntsSpacing['2xl'] }}>
                {/* Description */}
                <p
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    color: BigAntsColors.textSecondary,
                    lineHeight: 1.7,
                    marginBottom: BigAntsSpacing.lg,
                  }}
                >
                  {module.description}
                </p>

                {/* Features */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginBottom: BigAntsSpacing.lg,
                  }}
                >
                  {module.features.map((feature) => (
                    <span
                      key={feature}
                      style={{
                        padding: '4px 12px',
                        background: `${module.color}10`,
                        color: module.color,
                        fontSize: '12px',
                        fontWeight: 500,
                        borderRadius: BigAntsRadius.full,
                      }}
                    >
                      ✓ {feature}
                    </span>
                  ))}
                </div>

                {/* Target Audience */}
                <div style={{ marginBottom: BigAntsSpacing.md }}>
                  <p
                    style={{
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '12px',
                      fontWeight: 600,
                      color: BigAntsColors.textTertiary,
                      marginBottom: '8px',
                    }}
                  >
                    适用人群
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {module.targetAudience.map((audience) => (
                      <span
                        key={audience}
                        style={{
                          padding: '2px 10px',
                          background: BigAntsColors.bgGray,
                          color: BigAntsColors.textSecondary,
                          fontSize: '12px',
                          borderRadius: BigAntsRadius.sm,
                        }}
                      >
                        {audience}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Typical Cases */}
                <div style={{ marginBottom: BigAntsSpacing.lg }}>
                  <p
                    style={{
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '12px',
                      fontWeight: 600,
                      color: BigAntsColors.textTertiary,
                      marginBottom: '8px',
                    }}
                  >
                    标杆案例
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {module.typicalCases.map((caseName) => (
                      <span
                        key={caseName}
                        style={{
                          padding: '2px 10px',
                          background: BigAntsColors.bgGray,
                          color: BigAntsColors.textSecondary,
                          fontSize: '12px',
                          borderRadius: BigAntsRadius.sm,
                        }}
                      >
                        {caseName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Link
                    href={module.href}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '12px 20px',
                      background: module.color,
                      color: BigAntsColors.white,
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: BigAntsRadius.md,
                      textDecoration: 'none',
                      transition: `all ${BigAntsTransitions.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    了解更多 →
                  </Link>
                  <Link
                    href={`/sports-ants/contact?source=${module.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 16px',
                      background: BigAntsColors.bgGray,
                      color: BigAntsColors.textPrimary,
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      fontWeight: 600,
                      borderRadius: BigAntsRadius.md,
                      textDecoration: 'none',
                      transition: `all ${BigAntsTransitions.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = module.color;
                      e.currentTarget.style.color = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = BigAntsColors.bgGray;
                      e.currentTarget.style.color = BigAntsColors.textPrimary;
                    }}
                  >
                    咨询
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            textAlign: 'center',
            marginTop: BigAntsSpacing['3xl'],
          }}
        >
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '14px',
              color: BigAntsColors.textTertiary,
              marginBottom: BigAntsSpacing.md,
            }}
          >
            不知道哪个方案适合您？
          </p>
          <Link
            href="/sports-ants/solutions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 32px',
              background: 'transparent',
              border: `2px solid ${BigAntsColors.primary}`,
              color: BigAntsColors.primary,
              fontFamily: BigAntsFonts.chinese,
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: BigAntsRadius.full,
              textDecoration: 'none',
              transition: `all ${BigAntsTransitions.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = BigAntsColors.primary;
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = BigAntsColors.primary;
            }}
          >
            <span>🎯</span>
            <span>让AI帮您匹配最合适的方案</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
