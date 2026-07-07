/**
 * 运动蚂蚁品牌优势区域
 * BigAnts Advantages Section
 */

'use client';

import React from 'react';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsShadows, BigAntsTransitions } from '../lib/bigants-design';

interface Advantage {
  title: string;
  description: string;
  icon: string;
}

interface AdvantagesSectionProps {
  advantages: Advantage[];
}

export default function AdvantagesSection({ advantages }: AdvantagesSectionProps) {
  return (
    <section
      style={{
        background: BigAntsColors.white,
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
            品牌优势
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
            六大优势和有力保障
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
            为什么选择运动蚂蚁？
          </p>
        </div>

        {/* Advantages Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: BigAntsSpacing.xl,
          }}
        >
          {advantages.map((advantage, index) => (
            <div
              key={advantage.title}
              style={{
                display: 'flex',
                gap: BigAntsSpacing.lg,
                padding: BigAntsSpacing.lg,
                background: BigAntsColors.bgLight,
                borderRadius: BigAntsRadius.lg,
                transition: `all ${BigAntsTransitions.normal}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = BigAntsColors.white;
                e.currentTarget.style.boxShadow = BigAntsShadows.lg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = BigAntsColors.bgLight;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Number Badge */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: BigAntsRadius.md,
                  background: BigAntsColors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                {advantage.icon}
              </div>

              {/* Content */}
              <div>
                <h3
                  style={{
                    fontFamily: BigAntsFonts.display,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: BigAntsColors.textPrimary,
                    marginBottom: BigAntsSpacing.sm,
                  }}
                >
                  {advantage.title}
                </h3>
                <p
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '14px',
                    color: BigAntsColors.textSecondary,
                    lineHeight: 1.6,
                  }}
                >
                  {advantage.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
