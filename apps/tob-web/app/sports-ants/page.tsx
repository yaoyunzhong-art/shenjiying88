/**
 * 运动蚂蚁品牌官网首页
 * BigAnts Official Website - Premium Apple Style
 * 高端重置版 · 精致设计 · 流畅交互
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SEOMeta from './components/seo/SEOMeta';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingContact from './components/FloatingContact';
import ExitIntentPopup from './components/ExitIntentPopup';
import ConversionTracker from './components/ConversionTracker';
import PersonalizedRecommendations from './components/PersonalizedRecommendations';
import { getAllPersonas, UserPersonaId } from './lib/user-personas';
import { SAAS_FEATURES } from './lib/shenjiying-saas';
import { conversionService } from './lib/conversion-service';

// ============================================
// 设计系统 - 内联样式
// ============================================

const designSystem = {
  colors: {
    bg: {
      primary: '#000000',
      secondary: '#050505',
      tertiary: '#0a0a0a',
      card: 'rgba(255, 255, 255, 0.04)',
      cardHover: 'rgba(255, 255, 255, 0.08)',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      muted: 'rgba(255, 255, 255, 0.4)',
      gradient: 'linear-gradient(135deg, #0066FF 0%, #00C853 50%, #8B5CF6 100%)',
    },
    accent: {
      blue: '#0066FF',
      green: '#00C853',
      purple: '#8B5CF6',
      orange: '#FF6B00',
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      medium: 'rgba(255, 255, 255, 0.08)',
      strong: 'rgba(255, 255, 255, 0.15)',
    },
    glass: 'rgba(255, 255, 255, 0.03)',
  },
  spacing: {
    section: '80px',
    container: '1400px',
    cardPadding: '40px',
  },
  borderRadius: {
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    full: '9999px',
  },
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  shadow: {
    card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    cardHover: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    glow: '0 8px 32px rgba(0, 102, 255, 0.4)',
  },
};

// ============================================
// 数据定义
// ============================================

const CORE_BUSINESSES = [
  {
    id: 'products',
    icon: '🎮',
    title: '数字运动产品',
    subtitle: '自主研发 · 规模化生产',
    description: '60+款数字运动设备，覆盖模拟运动、射击、VR/AR等全系列，源头生产制造商',
    href: '/sports-ants/products',
    color: '#0066FF',
    stats: { number: '60+', label: '款产品' },
    image: '/images/products/tennis-simulator.jpg',
  },
  {
    id: 'epc',
    icon: '🏗️',
    title: 'EPC+O服务',
    subtitle: '全流程一站式',
    description: '从选址评估到运营支持，六阶段全程专业服务，助力项目快速落地',
    href: '/sports-ants/epc',
    color: '#FF6B00',
    stats: { number: '6', label: '阶段服务' },
    image: '/images/scenes/digital-sports-center.jpg',
  },
  {
    id: 'franchise',
    icon: '🤝',
    title: '招商加盟',
    subtitle: '零门槛创业',
    description: '直营·联营·合作开店三种模式灵活选择，最低首付40%即可启动',
    href: '/sports-ants/franchise',
    color: '#00C853',
    stats: { number: '3', label: '合作模式' },
    image: '/images/scenes/mall-sports-zone.jpg',
  },
  {
    id: 'tender',
    icon: '📋',
    title: '招投标项目',
    subtitle: 'EPC+O全模式承接',
    description: '政府公共体育设施、文旅景区、智慧城市等大型项目专业承接',
    href: '/sports-ants/epc?type=tender',
    color: '#8B5CF6',
    stats: { number: '100+', label: '资质专利' },
    image: '/images/scenes/interactive-games.jpg',
  },
];

const SANDERS_STEPS = [
  {
    id: 'pain-point',
    step: '01',
    title: '痛点共情',
    subtitle: '了解您的困境',
    description: '选址难、运营重，投资高...运动蚂蚁深知您的痛点，提供全流程解决方案',
    icon: '💭',
  },
  {
    id: 'value-anchor',
    step: '02',
    title: '价值锚定',
    subtitle: '找到您的方案',
    description: '神机营SaaS + 实体产品 + 专属服务，三位一体模式，科学高效',
    icon: '⚡',
  },
  {
    id: 'decision',
    step: '03',
    title: '自主决策',
    subtitle: '做出明智选择',
    description: '真实数据，专业报告、成功案例，助您自主分析，理性决策',
    icon: '🎯',
  },
];

const CORE_STATS = [
  { value: '500+', label: '场地案例' },
  { value: '2000+', label: '合作伙伴' },
  { value: '60+', label: '款产品设备' },
  { value: '18', label: '个月平均回本' },
];

const BRAND_ADVANTAGES = [
  {
    icon: '🏭',
    title: '源头厂商',
    description: '自研自产，品质可控',
    highlight: '60+款自主研发产品',
  },
  {
    icon: '🛡️',
    title: '全程护航',
    description: '从选址到运营一站式服务',
    highlight: '6阶段全流程支持',
  },
  {
    icon: '📊',
    title: '数据赋能',
    description: '神机营SaaS实时数据追踪',
    highlight: 'AI算法精准分析',
  },
  {
    icon: '🤝',
    title: '终身服务',
    description: '2年质保+7×24小时响应',
    highlight: '48小时到场维修',
  },
];

const BRAND_PARTNERS = [
  { name: '万达集团', icon: '🏬' },
  { name: '华润万象城', icon: '🏢' },
  { name: '新城吾悦广场', icon: '🏙️' },
  { name: '龙湖天街', icon: '🌆' },
  { name: '大悦城', icon: '🏗️' },
  { name: '永旺梦乐城', icon: '🛒' },
  { name: '银泰百货', icon: '🏬' },
  { name: '印力中心', icon: '🏗️' },
];

const TESTIMONIALS = [
  {
    name: '张总',
    position: '某连锁健身房创始人',
    avatar: '👨‍💼',
    content: '运动蚂蚁的设备质量非常稳定，售后响应也很快。使用神机营SaaS后，我们的运营效率提升了40%，会员复购率明显提高。',
    rating: 5,
    project: '3家门店数字运动区改造',
  },
  {
    name: '李总',
    position: '商业综合体招商总监',
    avatar: '👩‍💼',
    content: '数字运动馆成为我们商场的差异化引流利器。工作日客流提升了25%，周末更是翻倍。非常满意！',
    rating: 5,
    project: '500㎡数字运动主题区',
  },
  {
    name: '王总',
    position: '文旅景区运营负责人',
    avatar: '👨‍🔬',
    content: '运动蚂蚁的EPC+O全流程服务让我们省心太多。从设计到落地只需45天，开业即爆火。',
    rating: 5,
    project: '2000㎡文旅数字运动馆',
  },
];

// ============================================
// 动画组件
// ============================================

function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry!.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function AnimatedSection({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function HoverCard({ children, style = {}, onClick, onMouseEnter, onMouseLeave }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => { setIsHovered(true); onMouseEnter?.(); }}
      onMouseLeave={() => { setIsHovered(false); onMouseLeave?.(); }}
      onClick={onClick}
      style={{
        ...style,
        transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered ? designSystem.shadow.cardHover : designSystem.shadow.card,
        transition: designSystem.transition,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  );
}

function ClickableLink({ href, children, style = {}, onClick }: {
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...style,
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: designSystem.transition,
        textDecoration: 'none',
        display: 'inline-block',
      }}
    >
      {children}
    </Link>
  );
}

// ============================================
// 主页面组件
// ============================================

export default function SportsAntsHomePage() {
  const [activePersona, setActivePersona] = useState<UserPersonaId | null>(null);
  const [hoveredBusiness, setHoveredBusiness] = useState<string | null>(null);
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);
  const personas = getAllPersonas();

  const handleBusinessClick = (id: string) => {
    conversionService.trackCTAClick('homepage', `business_${id}`);
  };

  const handlePersonaClick = (personaId: UserPersonaId) => {
    setActivePersona(activePersona === personaId ? null : personaId);
    conversionService.trackUserPersona(personaId, 80);
  };

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: designSystem.colors.bg.primary,
      color: designSystem.colors.text.primary,
      overflowX: 'hidden' as const,
    },
    section: {
      padding: designSystem.spacing.section + ' 24px',
    },
    container: {
      maxWidth: designSystem.spacing.container,
      margin: '0 auto',
    },
    glassCard: {
      background: designSystem.colors.glass,
      border: '1px solid ' + designSystem.colors.border.medium,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    },
    sectionTitle: {
      fontSize: '14px',
      color: designSystem.colors.accent.blue,
      letterSpacing: '0.2em',
      textTransform: 'uppercase' as const,
      marginBottom: '16px',
      fontWeight: 500,
    },
    sectionHeading: {
      fontSize: 'clamp(32px, 5vw, 56px)',
      fontWeight: 700,
      color: designSystem.colors.text.primary,
      marginBottom: '24px',
      lineHeight: 1.2,
    },
    sectionSubtitle: {
      fontSize: '18px',
      color: designSystem.colors.text.muted,
      maxWidth: '600px',
      lineHeight: 1.6,
    },
  };

  return (
    <>
      <SEOMeta
        title="运动蚂蚁 SPORTS ANT - 数字运动潮玩一站式提供商"
        description="运动蚂蚁是专业的数字运动设备企业，集研发、生产、销售、服务于一体，为您提供数字运动馆规划、设计、施工、运营一站式服务。"
        keywords={['运动蚂蚁', '数字运动', '模拟运动', 'VR设备', '数字运动馆', '加盟合作']}
        type="website"
      />

      <ConversionTracker page="homepage" />

      <div style={styles.page}>
        <Header />

        {/* ============================================ */}
        {/* Hero Section */}
        {/* ============================================ */}
        <section style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0a0a0a 0%, #000000 50%, #050505 100%)',
        }}>
          {/* 背景图片 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/images/hero/sports-venue-hero.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.15,
            filter: 'blur(2px)',
          }} />

          {/* 多层背景光效 */}
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0, 102, 255, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 80% 50% at 70% 90%, rgba(255, 107, 0, 0.12) 0%, transparent 40%),
              radial-gradient(ellipse 60% 40% at 20% 70%, rgba(0, 200, 83, 0.08) 0%, transparent 40%)
            `,
          }} />

          {/* 动态光球 */}
          <div style={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: '384px',
            height: '384px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 102, 255, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animation: 'pulse 4s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '33%',
            right: '25%',
            width: '288px',
            height: '288px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 0, 0.1) 0%, transparent 70%)',
            filter: 'blur(50px)',
            animation: 'pulse 3s ease-in-out infinite 1.5s',
          }} />
          <div style={{
            position: 'absolute',
            top: '50%',
            right: '33%',
            width: '192px',
            height: '192px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 200, 83, 0.08) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'pulse 5s ease-in-out infinite 2s',
          }} />

          <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center' as const }}>
            <AnimatedSection delay={0}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 20px',
                borderRadius: designSystem.borderRadius.full,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                marginBottom: '64px',
              }}>
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00C853, #0066FF)',
                  boxShadow: '0 0 12px rgba(0, 200, 83, 0.5)',
                }} />
                <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', letterSpacing: '0.05em' }}>
                  神机营SaaS系统 · AI赋能全链路运营
                </span>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <h1 style={{
                fontSize: 'clamp(48px, 10vw, 96px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: '32px',
                lineHeight: 1.1,
              }}>
                <span style={{ display: 'block', color: designSystem.colors.text.primary }}>带你玩转</span>
                <span style={{ display: 'block', background: designSystem.colors.text.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  数字体育
                </span>
              </h1>
            </AnimatedSection>

            <AnimatedSection delay={200}>
              <p style={{
                fontSize: 'clamp(16px, 2.5vw, 20px)',
                color: 'rgba(255, 255, 255, 0.5)',
                maxWidth: '700px',
                margin: '0 auto 64px',
                lineHeight: 1.8,
              }}>
                运动蚂蚁是专业的数字运动设备企业，集研发、生产、销售、服务于一体，
                <br style={{ display: 'block' }} />
                为您提供数字运动馆规划、设计、施工、运营一站式服务
              </p>
            </AnimatedSection>

            <AnimatedSection delay={300}>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '80px', flexWrap: 'wrap' as const }}>
                <ClickableLink
                  href="/sports-ants/contact"
                  onClick={() => conversionService.trackCTAClick('homepage', 'hero_primary_cta')}
                  style={{
                    padding: '18px 40px',
                    borderRadius: designSystem.borderRadius.full,
                    fontSize: '16px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
                    boxShadow: designSystem.shadow.glow,
                    color: '#fff',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    立即咨询
                    <span style={{ transition: 'transform 0.3s', display: 'inline-block' }}>→</span>
                  </span>
                </ClickableLink>
                <ClickableLink
                  href="/sports-ants/products"
                  onClick={() => conversionService.trackCTAClick('homepage', 'hero_secondary_cta')}
                  style={{
                    padding: '18px 40px',
                    borderRadius: designSystem.borderRadius.full,
                    fontSize: '16px',
                    fontWeight: 500,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    color: '#fff',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>了解更多 →</span>
                </ClickableLink>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={400}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '32px',
                maxWidth: '900px',
                margin: '0 auto',
                padding: '32px',
                borderRadius: designSystem.borderRadius.xl,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}>
                {CORE_STATS.map((stat, index) => (
                  <div key={index} style={{ textAlign: 'center' as const }}>
                    <p style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, color: designSystem.colors.text.primary, marginBottom: '8px' }}>
                      {stat.value}
                    </p>
                    <p style={{ fontSize: '14px', color: designSystem.colors.text.muted }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* 滚动提示 */}
          <div style={{
            position: 'absolute',
            bottom: '48px',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: 'float 2s ease-in-out infinite',
          }}>
            <div style={{
              width: '28px',
              height: '44px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: '6px',
            }}>
              <div style={{
                width: '6px',
                height: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '3px',
                animation: 'scrollIndicator 2s ease-in-out infinite',
              }} />
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 八类人群定位 */}
        {/* ============================================ */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.secondary }}>
          <div style={styles.container}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '80px' }}>
              <p style={styles.sectionTitle}>Target Segments</p>
              <h2 style={styles.sectionHeading}>为您精准匹配</h2>
              <p style={{ ...styles.sectionSubtitle, margin: '0 auto' }}>
                八类目标人群 · 专属解决方案 · 100%匹配度
              </p>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '16px', justifyContent: 'center', marginBottom: '48px' }}>
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => handlePersonaClick(persona.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 24px',
                      borderRadius: designSystem.borderRadius.full,
                      fontSize: '14px',
                      fontWeight: 500,
                      background: activePersona === persona.id ? persona.color : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${activePersona === persona.id ? persona.color : 'rgba(255, 255, 255, 0.08)'}`,
                      color: activePersona === persona.id ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                      boxShadow: activePersona === persona.id ? `0 8px 32px ${persona.color}40` : 'none',
                      transition: designSystem.transition,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{persona.icon}</span>
                    <span>{persona.name}</span>
                    {activePersona === persona.id && <span style={{ marginLeft: '4px', opacity: 0.8 }}>✓</span>}
                  </button>
                ))}
              </div>
            </AnimatedSection>

            {activePersona && (
              <AnimatedSection delay={200}>
                <div style={{
                  maxWidth: '800px',
                  margin: '0 auto',
                  padding: '32px',
                  borderRadius: designSystem.borderRadius.xl,
                  textAlign: 'center' as const,
                  ...styles.glassCard,
                }}>
                  <p style={{ fontSize: '14px', color: designSystem.colors.accent.blue, marginBottom: '12px', letterSpacing: '0.05em' }}>
                    {personas.find(p => p.id === activePersona)?.subtitle}
                  </p>
                  <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.8 }}>
                    {String(personas.find(p => p.id === activePersona)?.painPoints?.[0] ?? '')}
                  </p>
                </div>
              </AnimatedSection>
            )}
          </div>
        </section>

        {/* ============================================ */}
        {/* 四大核心业务 */}
        {/* ============================================ */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.primary }}>
          <div style={styles.container}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '80px' }}>
              <p style={styles.sectionTitle}>Core Business</p>
              <h2 style={styles.sectionHeading}>四大核心业务板块</h2>
              <p style={{ ...styles.sectionSubtitle, margin: '0 auto' }}>
                完整覆盖数字运动全产业链，满足您的一切业务需求
              </p>
            </AnimatedSection>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
              {CORE_BUSINESSES.map((business, index) => (
                <AnimatedSection key={business.id} delay={index * 100}>
                  <HoverCard
                    onMouseEnter={() => setHoveredBusiness(business.id)}
                    onMouseLeave={() => setHoveredBusiness(null)}
                    onClick={() => handleBusinessClick(business.id)}
                    style={{
                      padding: designSystem.spacing.cardPadding,
                      borderRadius: designSystem.borderRadius.xl,
                      background: hoveredBusiness === business.id
                        ? `linear-gradient(135deg, ${business.color}08 0%, rgba(255,255,255,0.02) 100%)`
                        : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      border: `1px solid ${hoveredBusiness === business.id ? business.color + '60' : 'rgba(255, 255, 255, 0.08)'}`,
                      overflow: 'hidden',
                      position: 'relative' as const,
                    }}
                  >
                    {/* 产品图片背景 */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '45%',
                      height: '100%',
                      backgroundImage: `url(${business.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: hoveredBusiness === business.id ? 0.3 : 0.15,
                      filter: 'grayscale(30%)',
                      transition: 'opacity 0.5s',
                      zIndex: 0,
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: designSystem.borderRadius.md,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '32px',
                          background: `${business.color}15`,
                          transform: hoveredBusiness === business.id ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
                          transition: 'transform 0.5s',
                        }}>
                          {business.icon}
                        </div>
                        <div style={{ textAlign: 'right' as const }}>
                          <p style={{ fontSize: '48px', fontWeight: 700, color: hoveredBusiness === business.id ? business.color : designSystem.colors.text.primary, transition: 'color 0.3s' }}>
                            {business.stats.number}
                          </p>
                          <p style={{ fontSize: '12px', color: designSystem.colors.text.muted }}>{business.stats.label}</p>
                        </div>
                      </div>

                      <h3 style={{ fontSize: '24px', fontWeight: 600, color: designSystem.colors.text.primary, marginBottom: '8px' }}>{business.title}</h3>
                      <p style={{ fontSize: '14px', marginBottom: '20px', fontWeight: 500, color: business.color, transition: 'color 0.3s' }}>{business.subtitle}</p>
                      <p style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.8, marginBottom: '24px' }}>{business.description}</p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: business.color }}>
                        <span>了解更多</span>
                        <span style={{ transform: hoveredBusiness === business.id ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.3s', display: 'inline-block' }}>→</span>
                      </div>
                    </div>
                  </HoverCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 神机营SaaS */}
        {/* ============================================ */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.secondary }}>
          <div style={styles.container}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '80px' }}>
              <p style={{ ...styles.sectionTitle, color: designSystem.colors.accent.green }}>SaaS System</p>
              <h2 style={styles.sectionHeading}>神机营SaaS系统</h2>
              <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.5)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.8 }}>
                认知系统 + 实体产品 + 专属服务
                <br />
                三位一体模式，科学高效
              </p>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                {Object.entries(SAAS_FEATURES).slice(0, 10).map(([id, feature]) => (
                  <HoverCard
                    key={id}
                    onClick={() => conversionService.trackCTAClick('homepage', `saas_feature_${id}`)}
                    style={{
                      padding: '24px',
                      borderRadius: designSystem.borderRadius.lg,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      textAlign: 'center' as const,
                    }}
                  >
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: designSystem.borderRadius.md,
                      margin: '0 auto 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      background: 'rgba(0, 200, 83, 0.1)',
                    }}>
                      {feature.icon}
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)' }}>{feature.name}</p>
                  </HoverCard>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={200} style={{ textAlign: 'center', marginTop: '64px' }}>
              <ClickableLink
                href="/sports-ants/ai"
                onClick={() => conversionService.trackCTAClick('homepage', 'saas_explore_more')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 32px',
                  borderRadius: designSystem.borderRadius.full,
                  fontSize: '14px',
                  fontWeight: 500,
                  background: 'rgba(0, 200, 83, 0.08)',
                  border: '1px solid rgba(0, 200, 83, 0.25)',
                  color: designSystem.colors.accent.green,
                }}
              >
                <span>探索AI赋能中心</span>
                <span>→</span>
              </ClickableLink>
            </AnimatedSection>
          </div>
        </section>

        {/* ============================================ */}
        {/* 品牌优势 */}
        {/* ============================================ */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.primary }}>
          <div style={{ ...styles.container, maxWidth: '1000px' }}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '80px' }}>
              <p style={styles.sectionTitle}>Why Choose Us</p>
              <h2 style={styles.sectionHeading}>为什么选择运动蚂蚁</h2>
              <p style={{ fontSize: '18px', color: designSystem.colors.text.muted }}>专业 · 可靠 · 值得信赖</p>
            </AnimatedSection>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>
              {BRAND_ADVANTAGES.map((adv, index) => (
                <AnimatedSection key={index} delay={index * 100}>
                  <HoverCard
                    style={{
                      padding: designSystem.spacing.cardPadding,
                      borderRadius: designSystem.borderRadius.xl,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      height: '100%',
                    }}
                  >
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: designSystem.borderRadius.lg,
                      marginBottom: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      background: 'rgba(0, 102, 255, 0.1)',
                    }}>
                      {adv.icon}
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: designSystem.colors.text.primary, marginBottom: '12px' }}>{adv.title}</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '16px', lineHeight: 1.7 }}>{adv.description}</p>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: designSystem.colors.accent.blue }}>{adv.highlight}</p>
                  </HoverCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 合作伙伴 */}
        {/* ============================================ */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.secondary }}>
          <div style={styles.container}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '64px' }}>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.3)', letterSpacing: '0.2em', textTransform: 'uppercase' as const, marginBottom: '16px' }}>Trusted By</p>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: designSystem.colors.text.primary, marginBottom: '16px' }}>他们都在用运动蚂蚁</h2>
              <p style={{ fontSize: '16px', color: designSystem.colors.text.muted }}>2000+合作伙伴的共同选择</p>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '20px', justifyContent: 'center' }}>
                {BRAND_PARTNERS.map((partner, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '20px 28px',
                      borderRadius: designSystem.borderRadius.lg,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{partner.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)' }}>{partner.name}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ============================================ */}
        {/* 客户评价 */}
        {/* ============================================ */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.primary }}>
          <div style={styles.container}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '80px' }}>
              <p style={{ ...styles.sectionTitle, color: '#FFB800' }}>Testimonials</p>
              <h2 style={styles.sectionHeading}>客户真实评价</h2>
              <p style={{ ...styles.sectionSubtitle, margin: '0 auto' }}>来自已合作伙伴的真实反馈</p>
            </AnimatedSection>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              {TESTIMONIALS.map((testimonial, index) => (
                <AnimatedSection key={index} delay={index * 100}>
                  <HoverCard
                    style={{
                      padding: '32px',
                      borderRadius: designSystem.borderRadius.xl,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      height: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        background: 'rgba(255, 255, 255, 0.05)',
                      }}>
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p style={{ fontSize: '16px', fontWeight: 600, color: designSystem.colors.text.primary }}>{testimonial.name}</p>
                        <p style={{ fontSize: '14px', color: designSystem.colors.text.muted }}>{testimonial.position}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} style={{ fontSize: '18px', color: '#FFB800' }}>★</span>
                      ))}
                    </div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.8, marginBottom: '24px' }}>{testimonial.content}</p>
                    <span style={{
                      fontSize: '12px',
                      padding: '8px 16px',
                      borderRadius: designSystem.borderRadius.full,
                      background: 'rgba(0, 102, 255, 0.1)',
                      color: designSystem.colors.accent.blue,
                      fontWeight: 500,
                      display: 'inline-block',
                    }}>
                      {testimonial.project}
                    </span>
                  </HoverCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 桑德斯三步法 */}
        {/* ============================================ */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.secondary }}>
          <div style={styles.container}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '80px' }}>
              <p style={{ ...styles.sectionTitle, color: designSystem.colors.accent.purple }}>Sales Method</p>
              <h2 style={styles.sectionHeading}>桑德斯三步法</h2>
              <p style={{ fontSize: '18px', color: designSystem.colors.text.muted, maxWidth: '500px', margin: '0 auto', lineHeight: 1.8 }}>
                痛点共情 → 价值锚定 → 自主决策
                <br />
                引导客户自主完成需求表达与合作意向确认
              </p>
            </AnimatedSection>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
              {SANDERS_STEPS.map((step, index) => (
                <AnimatedSection key={step.id} delay={index * 150}>
                  <HoverCard
                    onMouseEnter={() => setHoveredStep(step.id)}
                    onMouseLeave={() => setHoveredStep(null)}
                    style={{
                      padding: designSystem.spacing.cardPadding,
                      borderRadius: designSystem.borderRadius.xl,
                      background: hoveredStep === step.id
                        ? 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                      border: `1px solid ${hoveredStep === step.id ? 'rgba(255,255,255,0.15)' : 'rgba(255, 255, 255, 0.08)'}`,
                      position: 'relative' as const,
                    }}
                  >
                    {index < 2 && (
                      <div style={{
                        position: 'absolute',
                        top: '64px',
                        left: '100%',
                        width: '100%',
                        height: '1px',
                        background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                        display: 'none' /* 隐藏连接线，简化设计 */
                      }} />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                      <span style={{
                        fontSize: '56px',
                        fontWeight: 700,
                        color: 'rgba(255, 255, 255, 0.1)',
                      }}>
                        {step.step}
                      </span>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: designSystem.borderRadius.md,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        background: hoveredStep === step.id ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.05)',
                        transform: hoveredStep === step.id ? 'scale(1.1) rotate(-3deg)' : 'scale(1)',
                        transition: 'all 0.3s',
                      }}>
                        {step.icon}
                      </div>
                    </div>

                    <h3 style={{ fontSize: '24px', fontWeight: 600, color: designSystem.colors.text.primary, marginBottom: '8px' }}>{step.title}</h3>
                    <p style={{ color: designSystem.colors.text.muted, marginBottom: '20px', fontWeight: 500 }}>{step.subtitle}</p>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.8 }}>{step.description}</p>
                  </HoverCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ */}
        {/* 个性化推荐 */}
        {/* ============================================ */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.primary }}>
          <div style={styles.container}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '64px' }}>
              <p style={styles.sectionTitle}>AI Powered</p>
              <h2 style={styles.sectionHeading}>为您智能推荐</h2>
              <p style={{ fontSize: '18px', color: designSystem.colors.text.muted, maxWidth: '500px', margin: '0 auto' }}>
                基于您的浏览轨迹，实时推送匹配的业务内容和解决方案
              </p>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <PersonalizedRecommendations />
            </AnimatedSection>
          </div>
        </section>

        {/* ============================================ */}
        {/* 决策资源 */}
        {/* ============================================ */}
        <section style={{ ...styles.section, backgroundColor: designSystem.colors.bg.secondary }}>
          <div style={styles.container}>
            <AnimatedSection style={{ textAlign: 'center' as const, marginBottom: '80px' }}>
              <p style={{ ...styles.sectionTitle, color: designSystem.colors.accent.orange }}>Decision Support</p>
              <h2 style={styles.sectionHeading}>决策资源中心</h2>
              <p style={{ fontSize: '18px', color: designSystem.colors.text.muted, maxWidth: '600px', margin: '0 auto', lineHeight: 1.8 }}>
                真实数据 · 专业报告 · 成功案例
                <br />
                为您的投资决策提供全方位支撑
              </p>
            </AnimatedSection>

            <AnimatedSection delay={100}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                {[
                  { icon: '📊', title: '行业数据', desc: '580亿市场规模', color: '#0066FF', href: '/sports-ants/resources?category=industry-data' },
                  { icon: '🧮', title: 'ROI计算器', desc: '3分钟获取报告', color: '#00C853', href: '/sports-ants/franchise#calculator' },
                  { icon: '🏆', title: '成功案例', desc: '500+场地验证', color: '#FF6B00', href: '/sports-ants/cases' },
                  { icon: '📚', title: '知识中心', desc: '开店全流程指南', color: '#8B5CF6', href: '/sports-ants/resources?category=knowledge' },
                ].map((item, index) => (
                  <HoverCard
                    key={index}
                    onClick={() => conversionService.trackCTAClick('homepage', `resource_${item.title}`)}
                    style={{
                      padding: '32px',
                      borderRadius: designSystem.borderRadius.lg,
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      textAlign: 'center' as const,
                    }}
                  >
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: designSystem.borderRadius.lg,
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      background: `${item.color}12`,
                    }}>
                      {item.icon}
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: designSystem.colors.text.primary, marginBottom: '8px' }}>{item.title}</h3>
                    <p style={{ fontSize: '14px', color: designSystem.colors.text.muted }}>{item.desc}</p>
                  </HoverCard>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* ============================================ */}
        {/* CTA Section */}
        {/* ============================================ */}
        <section style={{
          ...styles.section,
          background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
          position: 'relative' as const,
          overflow: 'hidden' as const,
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(0, 102, 255, 0.2) 0%, transparent 60%)',
          }} />

          <AnimatedSection style={{ position: 'relative', zIndex: 10, maxWidth: '800px', margin: '0 auto', textAlign: 'center' as const }}>
            <h2 style={{
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 700,
              color: designSystem.colors.text.primary,
              marginBottom: '32px',
              lineHeight: 1.2,
            }}>
              开启您的
              <br />
              <span style={{ background: 'linear-gradient(135deg, #0066FF, #00C853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                数字运动之旅
              </span>
            </h2>
            <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '56px', maxWidth: '500px', margin: '0 auto 56px' }}>
              无论您是首次创业还是规模化扩张，运动蚂蚁都能为您提供最合适的解决方案
            </p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <ClickableLink
                href="/sports-ants/contact"
                onClick={() => conversionService.trackCTAClick('homepage', 'bottom_primary_cta')}
                style={{
                  padding: '20px 48px',
                  borderRadius: designSystem.borderRadius.full,
                  fontSize: '16px',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
                  boxShadow: '0 8px 40px rgba(0, 102, 255, 0.5)',
                  color: '#fff',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>立即咨询 <span>→</span></span>
              </ClickableLink>
              <ClickableLink
                href="/sports-ants/cases"
                onClick={() => conversionService.trackCTAClick('homepage', 'bottom_secondary_cta')}
                style={{
                  padding: '20px 48px',
                  borderRadius: designSystem.borderRadius.full,
                  fontSize: '16px',
                  fontWeight: 500,
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>查看案例 <span>→</span></span>
              </ClickableLink>
            </div>
          </AnimatedSection>
        </section>

        <Footer />

        <FloatingContact />
        <ExitIntentPopup delaySeconds={15} />
      </div>

      {/* ============================================ */}
      {/* Global Styles */}
      {/* ============================================ */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-8px) translateX(-50%); }
        }
        @keyframes scrollIndicator {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.8; transform: translateY(4px); }
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html {
          scroll-behavior: smooth;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #111;
        }
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        ::selection {
          background: rgba(0, 102, 255, 0.3);
          color: white;
        }
      `}</style>
    </>
  );
}