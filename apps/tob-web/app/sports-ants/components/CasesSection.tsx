/**
 * 运动蚂蚁案例展示区域
 * BigAnts Cases Section
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsShadows, BigAntsTransitions } from '../lib/bigants-design';

interface Case {
  id: string;
  clientName: string;
  location: string;
  type: string;
  description: string;
  image: string;
}

interface CasesSectionProps {
  cases: Case[];
}

export default function CasesSection({ cases }: CasesSectionProps) {
  return (
    <section
      style={{
        background: BigAntsColors.bgGray,
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
              color: BigAntsColors.secondary,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: BigAntsSpacing.md,
            }}
          >
            成功案例
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
            500+场地案例
          </h2>
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '18px',
              color: BigAntsColors.textSecondary,
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            他们都选择了运动蚂蚁
          </p>
        </div>

        {/* Cases Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: BigAntsSpacing.xl,
            marginBottom: BigAntsSpacing['2xl'],
          }}
        >
          {cases.map((caseItem) => (
            <div
              key={caseItem.id}
              style={{
                background: BigAntsColors.white,
                borderRadius: BigAntsRadius.xl,
                overflow: 'hidden',
                boxShadow: BigAntsShadows.md,
                transition: `all ${BigAntsTransitions.normal}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = BigAntsShadows.xl;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = BigAntsShadows.md;
              }}
            >
              {/* Case Image Placeholder */}
              <div
                style={{
                  height: '200px',
                  background: `linear-gradient(135deg, ${BigAntsColors.bgDark} 0%, ${BigAntsColors.primary} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    fontSize: '64px',
                    opacity: 0.3,
                  }}
                >
                  🏢
                </div>
                {/* Type Badge */}
                <span
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    padding: '4px 12px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: BigAntsColors.textPrimary,
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: BigAntsRadius.full,
                  }}
                >
                  {caseItem.type}
                </span>
              </div>

              {/* Case Info */}
              <div style={{ padding: BigAntsSpacing.lg }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: BigAntsSpacing.md,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: BigAntsFonts.display,
                      fontSize: '20px',
                      fontWeight: 700,
                      color: BigAntsColors.textPrimary,
                    }}
                  >
                    {caseItem.clientName}
                  </h3>
                  <span
                    style={{
                      fontSize: '13px',
                      color: BigAntsColors.textTertiary,
                    }}
                  >
                    📍 {caseItem.location}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    color: BigAntsColors.textSecondary,
                    lineHeight: 1.6,
                    marginBottom: BigAntsSpacing.md,
                  }}
                >
                  {caseItem.description}
                </p>

                {/* CTA Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    href={`/sports-ants/contact?case=${encodeURIComponent(caseItem.clientName)}&type=${encodeURIComponent(caseItem.type)}`}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: BigAntsColors.primary,
                      color: BigAntsColors.white,
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: BigAntsRadius.md,
                      textAlign: 'center',
                      textDecoration: 'none',
                      transition: `all ${BigAntsTransitions.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = BigAntsColors.primaryDark;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = BigAntsColors.primary;
                    }}
                  >
                    预约考察
                  </Link>
                  <Link
                    href={`/sports-ants/contact?product=${encodeURIComponent(caseItem.type)}&category=${encodeURIComponent(caseItem.clientName)}`}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      background: BigAntsColors.bgGray,
                      color: BigAntsColors.textPrimary,
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: BigAntsRadius.md,
                      textAlign: 'center',
                      textDecoration: 'none',
                      transition: `all ${BigAntsTransitions.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = BigAntsColors.primary;
                      e.currentTarget.style.color = BigAntsColors.white;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = BigAntsColors.bgGray;
                      e.currentTarget.style.color = BigAntsColors.textPrimary;
                    }}
                  >
                    获取报价
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div style={{ textAlign: 'center' }}>
          <Link
            href="/sports-ants/cases"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 32px',
              background: 'transparent',
              color: BigAntsColors.primary,
              fontFamily: BigAntsFonts.chinese,
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: BigAntsRadius.full,
              textDecoration: 'none',
              border: `2px solid ${BigAntsColors.primary}`,
              transition: `all ${BigAntsTransitions.normal}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = BigAntsColors.primary;
              e.currentTarget.style.color = BigAntsColors.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = BigAntsColors.primary;
            }}
          >
            查看更多案例 →
          </Link>
        </div>
      </div>
    </section>
  );
}
