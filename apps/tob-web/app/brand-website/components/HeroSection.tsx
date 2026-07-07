/**
 * 苹果风格Hero区域 - Apple Hero Section
 * 全屏品牌宣传区，动态视觉素材，固定悬浮咨询按钮
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppleColors, AppleFonts, AppleSpacing, AppleRadius, AppleFontSizes, AppleTransitions } from '../lib/apple-design';

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(0, 113, 227, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 50%, rgba(0, 113, 227, 0.05) 0%, transparent 40%),
          linear-gradient(180deg, ${AppleColors.bgWhite} 0%, ${AppleColors.bgGray} 100%)
        `,
        overflow: 'hidden',
        paddingTop: '64px',
      }}
    >
      {/* Background Animated Elements */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {/* Floating orbs */}
        {[
          { size: 400, top: '-10%', right: '-5%', duration: '20s', delay: '0s' },
          { size: 300, bottom: '-5%', left: '-10%', duration: '25s', delay: '2s' },
          { size: 200, top: '30%', left: '5%', duration: '18s', delay: '1s' },
        ].map((orb, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(0, 113, 227, 0.06) 0%, transparent 70%)`,
              top: orb.top,
              bottom: orb.bottom,
              right: orb.right,
              left: orb.left,
              animation: `float ${orb.duration} ease-in-out infinite`,
              animationDelay: orb.delay,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '900px',
          margin: '0 auto',
          padding: `0 ${AppleSpacing.lg}`,
          textAlign: 'center',
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(20px)',
            transition: `all 800ms ease-out`,
            marginBottom: AppleSpacing.lg,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: `${AppleSpacing.sm} ${AppleSpacing.md}`,
              background: 'rgba(0, 113, 227, 0.08)',
              borderRadius: AppleRadius.full,
              fontFamily: AppleFonts.text,
              fontSize: '13px',
              fontWeight: 500,
              color: AppleColors.accent,
              letterSpacing: '0.02em',
            }}
          >
            企业级全链路服务品牌
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: AppleFonts.display,
            fontSize: AppleFontSizes.hero,
            fontWeight: 700,
            color: AppleColors.primary,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: AppleSpacing.lg,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: `all 800ms ease-out 100ms`,
          }}
        >
          连接你我
          <br />
          <span style={{ color: AppleColors.accent }}>共创商业</span>未来
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontFamily: AppleFonts.text,
            fontSize: AppleFontSizes.h3,
            fontWeight: 400,
            color: AppleColors.textSecondary,
            lineHeight: 1.5,
            maxWidth: '680px',
            margin: `0 auto ${AppleSpacing.xxl}`,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: `all 800ms ease-out 200ms`,
          }}
        >
          神机营专注为企业客户提供产品供应链、EPC+O全流程服务、数字运动潮玩馆一站式解决方案，助力合作伙伴实现商业增长
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            gap: AppleSpacing.md,
            justifyContent: 'center',
            flexWrap: 'wrap',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: `all 800ms ease-out 300ms`,
          }}
        >
          <Link
            href="/brand-website/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: AppleSpacing.sm,
              padding: `${AppleSpacing.md} ${AppleSpacing.xl}`,
              background: AppleColors.accent,
              color: AppleColors.bgWhite,
              fontFamily: AppleFonts.text,
              fontSize: '17px',
              fontWeight: 500,
              borderRadius: AppleRadius.full,
              textDecoration: 'none',
              transition: `all ${AppleTransitions.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = AppleColors.accentHover;
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 113, 227, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = AppleColors.accent;
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            立即咨询
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0L6.59 1.41 12.17 7H0v2h12.17l-5.58 5.59L8 16l8-8-8-8z" />
            </svg>
          </Link>

          <Link
            href="/brand-website/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: AppleSpacing.sm,
              padding: `${AppleSpacing.md} ${AppleSpacing.xl}`,
              background: 'transparent',
              color: AppleColors.textPrimary,
              fontFamily: AppleFonts.text,
              fontSize: '17px',
              fontWeight: 500,
              borderRadius: AppleRadius.full,
              textDecoration: 'none',
              border: `1px solid ${AppleColors.border}`,
              transition: `all ${AppleTransitions.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = AppleColors.accent;
              e.currentTarget.style.color = AppleColors.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = AppleColors.border;
              e.currentTarget.style.color = AppleColors.textPrimary;
            }}
          >
            了解更多
          </Link>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: AppleSpacing.lg,
            marginTop: AppleSpacing.sectionLg,
            padding: AppleSpacing.xl,
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: AppleRadius.xl,
            border: '1px solid rgba(0, 0, 0, 0.04)',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: `all 800ms ease-out 400ms`,
          }}
        >
          {[
            { value: '500+', label: '合作企业' },
            { value: '98%', label: '客户满意度' },
            { value: '10K+', label: '服务门店' },
            { value: '50+', label: '覆盖城市' },
          ].map((stat, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: AppleFonts.display,
                  fontSize: 'clamp(28px, 4vw, 40px)',
                  fontWeight: 700,
                  color: AppleColors.primary,
                  letterSpacing: '-0.02em',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontFamily: AppleFonts.text,
                  fontSize: '13px',
                  color: AppleColors.textSecondary,
                  marginTop: '4px',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: AppleSpacing.xxl,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: AppleSpacing.sm,
          opacity: loaded ? 1 : 0,
          transition: `opacity 800ms ease-out 600ms`,
        }}
      >
        <span style={{ fontFamily: AppleFonts.text, fontSize: '11px', color: AppleColors.textTertiary, letterSpacing: '0.1em' }}>
          SCROLL
        </span>
        <div
          style={{
            width: '1px',
            height: '60px',
            background: `linear-gradient(180deg, ${AppleColors.textTertiary} 0%, transparent 100%)`,
            animation: 'scrollPulse 2s ease-in-out infinite',
          }}
        />
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.1); }
        }
      `}</style>
    </section>
  );
}
