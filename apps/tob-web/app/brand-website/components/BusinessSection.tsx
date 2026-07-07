/**
 * 核心业务板块 - Business Section
 * 展示四大核心业务线：产品销售、EPC+O、数字运动、招商加盟
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AppleColors, AppleFonts, AppleSpacing, AppleRadius, AppleFontSizes, AppleShadows, AppleTransitions } from '../lib/apple-design';

const BUSINESS_CARDS = [
  {
    id: 'products',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
        <path d="M28 8h-4V6a2 2 0 00-2-2H10a2 2 0 00-2 2v2H4a2 2 0 00-2 2v18a2 2 0 002 2h24a2 2 0 002-2V10a2 2 0 00-2-2zM10 6h12v2H10V6zm16 22H6V10h20v18z" />
        <path d="M8 12h16v2H8zm0 4h12v2H8zm0 4h8v2H8z" />
      </svg>
    ),
    title: '产品销售合作',
    subtitle: '全品类供应链支持',
    description: '涵盖食品、饮料、日用品、电子、服装等全品类产品，灵活的供货政策和价格体系，满足不同规模企业的采购需求。',
    features: ['一站式采购平台', '灵活定价机制', '全品类覆盖', '物流配送保障'],
    ctaText: '了解更多',
    ctaLink: '/brand-website/products',
    color: '#0071e3',
  },
  {
    id: 'epc',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
        <path d="M16 2L2 9v14l14 7 14-7V9L16 2zm0 4l8 4v8l-8 4-8-4v-8l8-4z" />
        <path d="M16 10l-6 3v6l6 3 6-3v-6l-6-3z" />
        <path d="M22 11l4 2v4l-4 2-4-2v-4l4-2z" />
      </svg>
    ),
    title: 'EPC+O全流程服务',
    subtitle: '工程到运营一体化',
    description: '从项目勘测、方案设计、工程施工到运营支持的全流程服务，专业团队全程跟进，确保项目高效落地。',
    features: ['专业勘测评估', '定制方案设计', '工程施工管理', '运营培训支持'],
    ctaText: '申请项目勘测',
    ctaLink: '/brand-website/epc',
    color: '#34c759',
  },
  {
    id: 'digital-sports',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
        <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M16 6v20M6 16h20" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="16" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    title: '数字运动潮玩馆',
    subtitle: '一站式馆型规划',
    description: '提供数字运动潮玩馆的全新创业模式，涵盖馆型规划、设备选型、运营培训、市场推广等全方位支持。',
    features: ['智能设备配套', '运营培训体系', '营销推广支持', '会员系统搭建'],
    ctaText: '获取馆型规划',
    ctaLink: '/brand-website/digital-sports',
    color: '#ff9500',
  },
  {
    id: 'franchise',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
        <path d="M16 2l-4 8h8l-4-8z" fill="currentColor" />
        <path d="M12 10v4l-4 12h20l-4-12v-4H12z" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="14" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    title: '招商加盟合作',
    subtitle: '三类模式灵活选择',
    description: '提供特许加盟、合资联营、品牌授权三种合作模式，灵活的政策和全方位的支持体系，助力合作伙伴快速起步。',
    features: ['城市独家保护', '阶梯式返利', '40节培训课程', '3天线下训练营'],
    ctaText: '申请加盟考察',
    ctaLink: '/brand-website/franchise',
    color: '#af52de',
  },
];

export default function BusinessSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      style={{
        padding: `${AppleSpacing.sectionLg} ${AppleSpacing.lg}`,
        background: AppleColors.bgWhite,
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: AppleSpacing.section,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: `all 800ms ease-out`,
          }}
        >
          <h2
            style={{
              fontFamily: AppleFonts.display,
              fontSize: AppleFontSizes.h1,
              fontWeight: 700,
              color: AppleColors.primary,
              letterSpacing: '-0.02em',
              marginBottom: AppleSpacing.md,
            }}
          >
            四大核心业务线
          </h2>
          <p
            style={{
              fontFamily: AppleFonts.text,
              fontSize: AppleFontSizes.h3,
              fontWeight: 400,
              color: AppleColors.textSecondary,
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            满足企业客户的全方位商业需求，提供一站式解决方案
          </p>
        </div>

        {/* Business Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: AppleSpacing.lg,
          }}
        >
          {BUSINESS_CARDS.map((card, idx) => (
            <div
              key={card.id}
              style={{
                position: 'relative',
                background: AppleColors.bgWhite,
                borderRadius: AppleRadius.xl,
                padding: AppleSpacing.xl,
                border: `1px solid ${AppleColors.borderLight}`,
                transition: `all ${AppleTransitions.normal}`,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(40px)',
                transitionDelay: `${idx * 100}ms`,
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = AppleShadows.lg;
                e.currentTarget.style.borderColor = card.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = AppleColors.borderLight;
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: AppleRadius.lg,
                  background: `${card.color}12`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                  marginBottom: AppleSpacing.lg,
                }}
              >
                {card.icon}
              </div>

              {/* Content */}
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: card.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: AppleSpacing.sm,
                }}
              >
                {card.subtitle}
              </div>

              <h3
                style={{
                  fontFamily: AppleFonts.display,
                  fontSize: '22px',
                  fontWeight: 600,
                  color: AppleColors.primary,
                  marginBottom: AppleSpacing.md,
                  letterSpacing: '-0.01em',
                }}
              >
                {card.title}
              </h3>

              <p
                style={{
                  fontFamily: AppleFonts.text,
                  fontSize: '15px',
                  color: AppleColors.textSecondary,
                  lineHeight: 1.6,
                  marginBottom: AppleSpacing.lg,
                }}
              >
                {card.description}
              </p>

              {/* Features */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: AppleSpacing.sm,
                  marginBottom: AppleSpacing.lg,
                }}
              >
                {card.features.map((feature) => (
                  <div
                    key={feature}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: AppleSpacing.sm,
                      fontSize: '13px',
                      color: AppleColors.textSecondary,
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: card.color,
                        flexShrink: 0,
                      }}
                    />
                    {feature}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href={card.ctaLink}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: AppleSpacing.sm,
                  fontFamily: AppleFonts.text,
                  fontSize: '15px',
                  fontWeight: 500,
                  color: card.color,
                  textDecoration: 'none',
                  transition: `all ${AppleTransitions.fast}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.gap = `${AppleSpacing.md}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.gap = AppleSpacing.sm;
                }}
              >
                {card.ctaText}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L6.59 1.41 12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8-8-8z" />
                </svg>
              </Link>

              {/* Decorative Corner */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '120px',
                  height: '120px',
                  background: `radial-gradient(circle at 100% 0%, ${card.color}08 0%, transparent 60%)`,
                  pointerEvents: 'none',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
