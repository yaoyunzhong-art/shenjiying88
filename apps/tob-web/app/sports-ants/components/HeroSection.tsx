/**
 * 运动蚂蚁首页Hero区域
 * BigAnts Hero Section
 * 重构版本：四大核心业务入口 + 八类人群定位 + 桑德斯三步法
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import HeroCTA from './HeroCTA';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsRadius, BigAntsTransitions } from '../lib/bigants-design';
import { getAllPersonas, USER_PERSONAS, UserPersonaId } from '../lib/user-personas';
import { SAAS_FEATURES } from '../lib/shenjiying-saas';

// 四大核心业务
const CORE_BUSINESSES = [
  {
    id: 'products',
    icon: '🎮',
    title: '数字运动产品',
    subtitle: '自主研发·规模化生产',
    description: '60+款数字运动设备，覆盖模拟运动、射击、VR/AR等全系列',
    href: '/sports-ants/products',
    color: '#0066FF',
    highlight: '源头生产制造商',
  },
  {
    id: 'epc',
    icon: '🏗️',
    title: 'EPC+O服务',
    subtitle: '全流程一站式',
    description: '从选址评估到运营支持，提供数字运动馆全流程一站式服务',
    href: '/sports-ants/epc',
    color: '#FF6B00',
    highlight: '六阶段全程服务',
  },
  {
    id: 'franchise',
    icon: '🤝',
    title: '招商加盟',
    subtitle: '零门槛创业',
    description: '三种合作模式灵活选择，总部全程扶持，6-12个月回本',
    href: '/sports-ants/franchise',
    color: '#00C853',
    highlight: '最低首付40%起',
  },
  {
    id: 'tender',
    icon: '📋',
    title: '招投标项目',
    subtitle: 'EPC+O全模式承接',
    description: '政府公共体育设施、文旅景区、智慧城市等大型项目承接',
    href: '/sports-ants/epc?type=tender',
    color: '#8B5CF6',
    highlight: '资质齐全·经验丰富',
  },
];

export default function HeroSection() {
  const [selectedPersona, setSelectedPersona] = useState<UserPersonaId | null>(null);
  const personas = getAllPersonas();

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: BigAntsColors.bgDark,
        overflow: 'hidden',
        paddingTop: '80px',
      }}
    >
      {/* Background Effects */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 102, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(255, 107, 0, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 20% 80%, rgba(0, 200, 83, 0.08) 0%, transparent 50%)
          `,
        }}
      />

      {/* Grid Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 70%)',
        }}
      />

      {/* Floating Elements */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 102, 255, 0.2) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'float 8s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '30%',
          right: '15%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 0, 0.15) 0%, transparent 70%)',
          filter: 'blur(30px)',
          animation: 'float 6s ease-in-out infinite reverse',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: `0 ${BigAntsSpacing.lg}`,
          textAlign: 'center',
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(0, 102, 255, 0.1)',
            border: '1px solid rgba(0, 102, 255, 0.3)',
            borderRadius: BigAntsRadius.full,
            marginBottom: BigAntsSpacing.xl,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: BigAntsColors.primary,
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '14px',
              fontWeight: 500,
              color: BigAntsColors.primary,
            }}
          >
            数字运动行业领导者 · 神机营SaaS赋能全链路
          </span>
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontFamily: BigAntsFonts.display,
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800,
            color: BigAntsColors.white,
            lineHeight: 1.1,
            marginBottom: BigAntsSpacing.xl,
            letterSpacing: '-0.02em',
          }}
        >
          带你玩转
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${BigAntsColors.primary} 0%, ${BigAntsColors.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            数字体育
          </span>
        </h1>

        {/* Subtitle with SaaS Highlight */}
        <p
          style={{
            fontFamily: BigAntsFonts.chinese,
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.8,
            maxWidth: '800px',
            margin: '0 auto',
            marginBottom: BigAntsSpacing.lg,
          }}
        >
          运动蚂蚁是专业的数字运动设备企业，集研发、生产、销售、服务于一体，
          <br />
          为您提供数字运动馆规划、设计、施工、运营一站式服务
        </p>

        {/* SaaS差异化卖点 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            background: 'rgba(0, 200, 83, 0.1)',
            border: '1px solid rgba(0, 200, 83, 0.3)',
            borderRadius: BigAntsRadius.md,
            marginBottom: BigAntsSpacing['2xl'],
          }}
        >
          <span style={{ fontSize: '16px' }}>{SAAS_FEATURES['ai-recommendation'].icon}</span>
          <span
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '13px',
              color: '#00C853',
            }}
          >
            神机营SaaS系统：认知系统 + 实体产品 + 专属服务三位一体
          </span>
        </div>

        {/* 四大核心业务入口 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            maxWidth: '1000px',
            margin: '0 auto',
          }}
        >
          {CORE_BUSINESSES.map((business) => (
            <Link
              key={business.id}
              href={business.href}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: BigAntsRadius.lg,
                textDecoration: 'none',
                textAlign: 'left',
                transition: `all ${BigAntsTransitions.fast}`,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${business.color}15`;
                e.currentTarget.style.borderColor = business.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: BigAntsRadius.md,
                  background: `${business.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  flexShrink: 0,
                }}
              >
                {business.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: BigAntsFonts.chinese,
                      fontSize: '15px',
                      fontWeight: 600,
                      color: BigAntsColors.white,
                    }}
                  >
                    {business.title}
                  </span>
                  <span
                    style={{
                      padding: '2px 6px',
                      background: business.color,
                      color: '#FFFFFF',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderRadius: '4px',
                    }}
                  >
                    {business.subtitle}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    lineHeight: 1.4,
                    marginBottom: '6px',
                  }}
                >
                  {business.description}
                </p>
                <span
                  style={{
                    fontSize: '11px',
                    color: business.color,
                    fontWeight: 500,
                  }}
                >
                  {business.highlight}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* 八类人群快速定位入口 */}
        <div
          style={{
            marginBottom: BigAntsSpacing['2xl'],
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: BigAntsRadius.lg,
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <p
            style={{
              fontFamily: BigAntsFonts.chinese,
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '16px',
            }}
          >
            👋 找到最符合您情况的入口，快速获取专属方案
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {personas.map((persona) => (
              <Link
                key={persona.id}
                href={`/sports-ants/solutions?persona=${persona.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  background: selectedPersona === persona.id ? persona.color : 'rgba(255, 255, 255, 0.08)',
                  border: `1px solid ${selectedPersona === persona.id ? persona.color : 'rgba(255, 255, 255, 0.15)'}`,
                  borderRadius: BigAntsRadius.full,
                  textDecoration: 'none',
                  transition: `all ${BigAntsTransitions.fast}`,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${persona.color}30`;
                  e.currentTarget.style.borderColor = persona.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = selectedPersona === persona.id ? persona.color : 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = selectedPersona === persona.id ? persona.color : 'rgba(255, 255, 255, 0.15)';
                }}
              >
                <span style={{ fontSize: '14px' }}>{persona.icon}</span>
                <span
                  style={{
                    fontFamily: BigAntsFonts.chinese,
                    fontSize: '12px',
                    fontWeight: 500,
                    color: BigAntsColors.white,
                  }}
                >
                  {persona.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Buttons - 三步转化法 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: BigAntsSpacing.md,
            marginBottom: BigAntsSpacing['3xl'],
          }}
        >
          <HeroCTA />
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: BigAntsSpacing['2xl'],
            flexWrap: 'wrap',
          }}
        >
          {[
            { value: '2000+', label: '合作客户' },
            { value: '50+', label: '国家和地区' },
            { value: '500+', label: '场地案例' },
            { value: '100+', label: '专利认证' },
          ].map((stat, index) => (
            <div
              key={stat.label}
              style={{
                textAlign: 'center',
                padding: `0 ${BigAntsSpacing.lg}`,
                borderRight: index < 3 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              }}
            >
              <p
                style={{
                  fontFamily: BigAntsFonts.mono,
                  fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                  fontWeight: 700,
                  color: BigAntsColors.white,
                  marginBottom: '4px',
                }}
              >
                {stat.value}
              </p>
              <p
                style={{
                  fontFamily: BigAntsFonts.chinese,
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          animation: 'bounce 2s ease-in-out infinite',
        }}
      >
        <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>向下滚动</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-10px); }
          60% { transform: translateX(-50%) translateY(-5px); }
        }
      `}</style>
    </section>
  );
}
