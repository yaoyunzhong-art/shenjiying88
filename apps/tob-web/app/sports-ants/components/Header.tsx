/**
 * 运动蚂蚁官网头部导航
 * BigAnts Header Navigation
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BigAntsColors, BigAntsFonts, BigAntsSpacing, BigAntsShadows, BigAntsTransitions, BigAntsRadius } from '../lib/bigants-design';

const NAV_ITEMS = [
  { label: '首页', href: '/sports-ants' },
  { label: '产品中心', href: '/sports-ants/products' },
  { label: '解决方案', href: '/sports-ants/solutions' },
  { label: '案例中心', href: '/sports-ants/cases' },
  { label: '新闻资讯', href: '/sports-ants/news' },
  { label: '帮助中心', href: '/sports-ants/help' },
  { label: '定价', href: '/sports-ants/pricing' },
  { label: '招商加盟', href: '/sports-ants/franchise' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 300,
        background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid transparent',
        transition: `all ${BigAntsTransitions.normal}`,
      }}
    >
      <nav
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: `0 ${BigAntsSpacing.lg}`,
          height: scrolled ? '60px' : '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: `height ${BigAntsTransitions.normal}`,
        }}
      >
        {/* Logo */}
        <Link
          href="/sports-ants"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: BigAntsRadius.md,
              background: BigAntsColors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              color: BigAntsColors.white,
            }}
          >
            🐜
          </div>
          <div>
            <span
              style={{
                fontFamily: BigAntsFonts.display,
                fontSize: '20px',
                fontWeight: 700,
                color: BigAntsColors.primary,
                letterSpacing: '-0.02em',
              }}
            >
              运动蚂蚁
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                color: BigAntsColors.textSecondary,
                fontWeight: 500,
                letterSpacing: '0.05em',
              }}
            >
              BIGANTS
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: BigAntsSpacing.xl,
          }}
          className="hidden md:flex"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontFamily: BigAntsFonts.chinese,
                fontSize: '15px',
                fontWeight: 500,
                color: BigAntsColors.textPrimary,
                textDecoration: 'none',
                padding: '8px 4px',
                position: 'relative',
                transition: `color ${BigAntsTransitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = BigAntsColors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = BigAntsColors.textPrimary;
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: BigAntsSpacing.md }}>
          <Link
            href="/sports-ants/login"
            style={{
              padding: '10px 20px',
              color: BigAntsColors.textPrimary,
              fontFamily: BigAntsFonts.chinese,
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: `color ${BigAntsTransitions.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = BigAntsColors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = BigAntsColors.textPrimary;
            }}
          >
            登录
          </Link>
          <Link
            href="/sports-ants/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              background: BigAntsColors.primary,
              color: BigAntsColors.white,
              fontFamily: BigAntsFonts.chinese,
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: BigAntsRadius.full,
              textDecoration: 'none',
              transition: `all ${BigAntsTransitions.normal}`,
              boxShadow: BigAntsShadows.glow,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 102, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = BigAntsShadows.glow;
            }}
          >
            立即咨询
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            className="md:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={BigAntsColors.textPrimary}
              strokeWidth="2"
            >
              {mobileMenuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: BigAntsColors.white,
            borderTop: `1px solid ${BigAntsColors.bgGray}`,
            boxShadow: BigAntsShadows.xl,
            padding: BigAntsSpacing.md,
          }}
          className="md:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'block',
                padding: `${BigAntsSpacing.md} ${BigAntsSpacing.lg}`,
                fontFamily: BigAntsFonts.chinese,
                fontSize: '16px',
                fontWeight: 500,
                color: BigAntsColors.textPrimary,
                textDecoration: 'none',
                borderRadius: BigAntsRadius.md,
                transition: `background ${BigAntsTransitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = BigAntsColors.bgGray;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
