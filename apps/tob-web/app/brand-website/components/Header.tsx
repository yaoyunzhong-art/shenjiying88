/**
 * 苹果风格头部导航 - Apple Header Navigation
 * 固定顶部导航，含Logo+菜单+咨询按钮
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppleColors, AppleFonts, AppleSpacing, AppleRadius, AppleShadows, AppleTransitions } from '../lib/apple-design';

const NAV_ITEMS = [
  { label: '首页', href: '/brand-website' },
  { label: '产品销售', href: '/brand-website/products' },
  { label: 'EPC+O服务', href: '/brand-website/epc' },
  { label: '数字运动', href: '/brand-website/digital-sports' },
  { label: '招商加盟', href: '/brand-website/franchise' },
  { label: '供应链合作', href: '/brand-website/supply-chain' },
  { label: '客户服务', href: '/brand-website/service' },
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
        zIndex: 1000,
        background: scrolled ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.0)',
        backdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid transparent',
        transition: `all ${AppleTransitions.normal}`,
      }}
    >
      <nav
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: `0 ${AppleSpacing.lg}`,
          height: scrolled ? '52px' : '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: `height ${AppleTransitions.normal}`,
        }}
      >
        {/* Logo */}
        <Link
          href="/brand-website"
          style={{
            fontFamily: AppleFonts.display,
            fontSize: '21px',
            fontWeight: 600,
            color: AppleColors.primary,
            textDecoration: 'none',
            letterSpacing: '-0.02em',
          }}
        >
          神机营
        </Link>

        {/* Desktop Navigation */}
        <div
          style={{
            display: 'flex',
            gap: AppleSpacing.lg,
          }}
          className="hidden lg:flex"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontFamily: AppleFonts.text,
                fontSize: '14px',
                fontWeight: 400,
                color: AppleColors.textPrimary,
                textDecoration: 'none',
                padding: `${AppleSpacing.sm} ${AppleSpacing.md}`,
                borderRadius: AppleRadius.sm,
                transition: `all ${AppleTransitions.fast}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = AppleColors.accent;
                e.currentTarget.style.background = 'rgba(0, 113, 227, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = AppleColors.textPrimary;
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: AppleSpacing.md }}>
          <Link
            href="/brand-website/contact"
            style={{
              fontFamily: AppleFonts.text,
              fontSize: '14px',
              fontWeight: 500,
              color: AppleColors.bgWhite,
              background: AppleColors.accent,
              padding: `${AppleSpacing.sm} ${AppleSpacing.lg}`,
              borderRadius: AppleRadius.full,
              textDecoration: 'none',
              transition: `all ${AppleTransitions.fast}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = AppleColors.accentHover;
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = AppleColors.accent;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            立即咨询
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden"
            style={{
              padding: AppleSpacing.sm,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              {mobileMenuOpen ? (
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              ) : (
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden"
          style={{
            position: 'absolute',
            top: '52px',
            left: 0,
            right: 0,
            background: AppleColors.bgWhite,
            borderBottom: `1px solid ${AppleColors.borderLight}`,
            padding: AppleSpacing.md,
            boxShadow: AppleShadows.lg,
          }}
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: 'block',
                padding: `${AppleSpacing.md}`,
                fontFamily: AppleFonts.text,
                fontSize: '16px',
                color: AppleColors.textPrimary,
                textDecoration: 'none',
                borderRadius: AppleRadius.sm,
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
