/**
 * 运动蚂蚁解决方案区域
 * BigAnts Solutions Section
 * 重构版本：八类目标人群×解决方案100%匹配 + SaaS融合
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsShadows, BigAntsTransitions } from '../lib/bigants-design';
import { USER_PERSONAS, getAllPersonas, UserPersonaId } from '../lib/user-personas';
import { SAAS_FEATURES } from '../lib/shenjiying-saas';

interface Solution {
  id: string;
  title: string;
  description: string;
  icon: string;
  cases: number;
  clients: number;
  personaId?: UserPersonaId;  // 关联的人群ID
}

interface SolutionsSectionProps {
  solutions?: Solution[];  // 改为可选
}

// 默认解决方案数据（与人群关联）
const DEFAULT_SOLUTIONS: Solution[] = [
  {
    id: 'chain-solution',
    title: '连锁品牌扩张方案',
    description: '专为连锁品牌设计的标准化复制方案，从选址到运营全程标准化流程，支持快速扩张',
    icon: '🏢',
    cases: 200,
    clients: 50,
    personaId: 'chain-investor',
  },
  {
    id: 'commercial-solution',
    title: '商业地产差异化方案',
    description: '帮助商业地产打造差异化竞争力，通过数字运动提升客流量和坪效',
    icon: '🏬',
    cases: 150,
    clients: 80,
    personaId: 'commercial-property',
  },
  {
    id: 'startup-solution',
    title: '初次创业扶持方案',
    description: '低门槛创业方案，从0开始全程指导，降低创业风险',
    icon: '🚀',
    cases: 300,
    clients: 120,
    personaId: 'first-time-entrepreneur',
  },
  {
    id: 'government-solution',
    title: '政府项目承接方案',
    description: 'EPC+O全模式承接政府公共体育设施、文旅景区等项目',
    icon: '🏛️',
    cases: 30,
    clients: 15,
    personaId: 'government-project',
  },
  {
    id: 'transformation-solution',
    title: '传统娱乐转型方案',
    description: '帮助传统游戏厅、游乐园等业态进行数字化升级',
    icon: '🔄',
    cases: 100,
    clients: 45,
    personaId: 'traditional-entertainment',
  },
  {
    id: 'family-solution',
    title: '亲子业态方案',
    description: '寓教于乐的亲子运动空间，安全有趣，家长孩子都能玩',
    icon: '👨‍👩‍👧‍👦',
    cases: 80,
    clients: 60,
    personaId: 'family-venue',
  },
  {
    id: 'hospitality-solution',
    title: '酒店增值方案',
    description: '为酒店、民宿等业态提供增值服务体验，提升客户满意度',
    icon: '🏨',
    cases: 50,
    clients: 35,
    personaId: 'hospitality',
  },
  {
    id: 'overseas-solution',
    title: '海外市场进入方案',
    description: '品牌授权+本地化支持，帮助品牌顺利进入海外市场',
    icon: '🌏',
    cases: 20,
    clients: 10,
    personaId: 'overseas-market',
  },
];

export default function SolutionsSection({ solutions }: SolutionsSectionProps) {
  const [activeFilter, setActiveFilter] = useState<UserPersonaId | 'all'>('all');
  const allSolutions = solutions || DEFAULT_SOLUTIONS;
  const personas = getAllPersonas();

  const filteredSolutions = activeFilter === 'all'
    ? allSolutions
    : allSolutions.filter(s => s.personaId === activeFilter);

  return (
    <section
      style={{
        background: BigAntsColors.bgDark,
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
        <div style={{ textAlign: 'center', marginBottom: BigAntsSpacing['2xl'] }}>
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '14px',
              fontWeight: 600,
              color: BigAntsColors.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: BigAntsSpacing.md,
            }}
          >
            专属解决方案
          </p>
          <h2
            style={{
              fontFamily: BigAntsFonts.display,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              color: BigAntsColors.white,
              marginBottom: BigAntsSpacing.md,
            }}
          >
            八类人群 × 100%匹配方案
          </h2>
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.6)',
              maxWidth: '700px',
              margin: '0 auto',
              marginBottom: BigAntsSpacing.lg,
            }}
          >
            针对您的具体情况，匹配最合适的解决方案
          </p>

          {/* Persona Filter */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: BigAntsSpacing.lg,
            }}
          >
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '8px 20px',
                background: activeFilter === 'all' ? BigAntsColors.primary : 'rgba(255, 255, 255, 0.08)',
                border: `1px solid ${activeFilter === 'all' ? BigAntsColors.primary : 'rgba(255, 255, 255, 0.15)'}`,
                borderRadius: BigAntsRadius.full,
                color: BigAntsColors.white,
                fontFamily: BigAntsFonts.chinese,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: `all ${BigAntsTransitions.fast}`,
              }}
            >
              全部方案
            </button>
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => setActiveFilter(persona.id)}
                style={{
                  padding: '8px 16px',
                  background: activeFilter === persona.id ? persona.color : 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${activeFilter === persona.id ? persona.color : 'rgba(255, 255, 255, 0.15)'}`,
                  borderRadius: BigAntsRadius.full,
                  color: BigAntsColors.white,
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: `all ${BigAntsTransitions.fast}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{persona.icon}</span>
                <span>{persona.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Solutions Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: BigAntsSpacing.xl,
          }}
        >
          {filteredSolutions.map((solution) => {
            const relatedPersona = solution.personaId
              ? USER_PERSONAS[solution.personaId]
              : null;

            return (
              <div
                key={solution.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: BigAntsRadius.xl,
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: `all ${BigAntsTransitions.normal}`,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = relatedPersona?.color || BigAntsColors.primary;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Header with Persona Badge */}
                <div
                  style={{
                    padding: BigAntsSpacing.xl,
                    background: relatedPersona
                      ? `linear-gradient(135deg, ${relatedPersona.color}20 0%, ${relatedPersona.color}05 100%)`
                      : 'rgba(255, 255, 255, 0.02)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'relative',
                  }}
                >
                  {/* Persona Badge */}
                  {relatedPersona && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        background: `${relatedPersona.color}30`,
                        border: `1px solid ${relatedPersona.color}50`,
                        borderRadius: BigAntsRadius.full,
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>{relatedPersona.icon}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: relatedPersona.color,
                          fontWeight: 500,
                        }}
                      >
                        {relatedPersona.name}
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: BigAntsRadius.lg,
                      background: relatedPersona
                        ? `linear-gradient(135deg, ${relatedPersona.color} 0%, ${relatedPersona.color}CC 100%)`
                        : `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.primaryDark} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      marginBottom: BigAntsSpacing.md,
                    }}
                  >
                    {solution.icon}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontFamily: BigAntsFonts.display,
                      fontSize: '20px',
                      fontWeight: 700,
                      color: BigAntsColors.white,
                      marginBottom: BigAntsSpacing.sm,
                    }}
                  >
                    {solution.title}
                  </h3>

                  {/* Description */}
                  <p
                    style={{
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      lineHeight: 1.6,
                    }}
                  >
                    {solution.description}
                  </p>
                </div>

                {/* Content */}
                <div style={{ padding: BigAntsSpacing.xl }}>
                  {/* Pain Points (for related persona) */}
                  {relatedPersona && (
                    <div style={{ marginBottom: BigAntsSpacing.md }}>
                      <p
                        style={{
                          fontFamily: BigAntsFonts.chinese,
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'rgba(255, 255, 255, 0.4)',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        解决您的痛点
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {relatedPersona.painPoints.slice(0, 2).map((pain) => (
                          <div
                            key={pain.title}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              color: 'rgba(255, 255, 255, 0.7)',
                            }}
                          >
                            <span style={{ color: '#FF6B00' }}>●</span>
                            <span>{pain.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SaaS Feature */}
                  {relatedPersona && relatedPersona.solutions[0]?.saasFeature && (
                    <div
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(0, 200, 83, 0.08)',
                        border: '1px solid rgba(0, 200, 83, 0.2)',
                        borderRadius: BigAntsRadius.md,
                        marginBottom: BigAntsSpacing.md,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>
                          {SAAS_FEATURES[relatedPersona.solutions[0].saasFeature as keyof typeof SAAS_FEATURES]?.icon || '🔗'}
                        </span>
                        <div>
                          <p
                            style={{
                              fontSize: '12px',
                              color: '#00C853',
                              fontWeight: 500,
                            }}
                          >
                            神机营SaaS赋能
                          </p>
                          <p
                            style={{
                              fontSize: '11px',
                              color: 'rgba(255, 255, 255, 0.5)',
                            }}
                          >
                            {SAAS_FEATURES[relatedPersona.solutions[0].saasFeature as keyof typeof SAAS_FEATURES]?.name || 'SaaS功能'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: BigAntsSpacing.xl, marginBottom: BigAntsSpacing.md }}>
                    <div>
                      <p
                        style={{
                          fontFamily: BigAntsFonts.mono,
                          fontSize: '24px',
                          fontWeight: 700,
                          color: relatedPersona?.color || BigAntsColors.primary,
                          marginBottom: '2px',
                        }}
                      >
                        {solution.cases}+
                      </p>
                      <p
                        style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        场地案例
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: BigAntsFonts.mono,
                          fontSize: '24px',
                          fontWeight: 700,
                          color: BigAntsColors.accent,
                          marginBottom: '2px',
                        }}
                      >
                        {solution.clients}+
                      </p>
                      <p
                        style={{
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        合作客户
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/sports-ants/solutions?persona=${solution.personaId || ''}&solution=${solution.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 20px',
                      background: relatedPersona?.color || BigAntsColors.primary,
                      color: BigAntsColors.white,
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: BigAntsRadius.md,
                      textDecoration: 'none',
                      transition: `all ${BigAntsTransitions.fast}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    了解更多 →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredSolutions.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: BigAntsSpacing['3xl'],
            }}
          >
            <p
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              暂无符合条件的方案
            </p>
          </div>
        )}

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
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: BigAntsSpacing.md,
            }}
          >
            没有找到完全匹配的方案？
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              href="/sports-ants/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                background: BigAntsColors.primary,
                color: BigAntsColors.white,
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: BigAntsRadius.full,
                textDecoration: 'none',
                boxShadow: BigAntsShadows.glow,
                transition: `all ${BigAntsTransitions.normal}`,
              }}
            >
              <span>🔗</span>
              <span>咨询专属顾问</span>
            </Link>
            <Link
              href="/sports-ants/roi"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                background: 'transparent',
                border: `2px solid ${BigAntsColors.accent}`,
                color: BigAntsColors.accent,
                fontFamily: BigAntsFonts.chinese,
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: BigAntsRadius.full,
                textDecoration: 'none',
                transition: `all ${BigAntsTransitions.normal}`,
              }}
            >
              <span>🧮</span>
              <span>使用ROI计算器</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
