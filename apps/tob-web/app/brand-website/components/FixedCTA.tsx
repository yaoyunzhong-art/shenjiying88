/**
 * 固定悬浮咨询按钮 - Fixed CTA Button
 * 滚动时显示的悬浮咨询入口
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppleColors, AppleRadius, AppleShadows, AppleTransitions } from '../lib/apple-design';

export default function FixedCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        zIndex: 999,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
        transition: `all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <Link
        href="/brand-website/contact"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '16px 24px',
          background: AppleColors.accent,
          color: AppleColors.bgWhite,
          borderRadius: AppleRadius.full,
          textDecoration: 'none',
          boxShadow: AppleShadows.lg,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
          fontSize: '15px',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          transition: `all ${AppleTransitions.fast}`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 113, 227, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = AppleShadows.lg;
        }}
      >
        {/* Chat Icon */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 0C4.48 0 0 4.48 0 10c0 1.85.51 3.58 1.38 5.06L0 20l4.94-1.38A9.96 9.96 0 0010 20c5.52 0 10-4.48 10-10S15.52 0 10 0zm5 11.5c0 .83-.67 1.5-1.5 1.5H11l-2 2v-2H7.5c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5v5z" />
        </svg>
        立即咨询
      </Link>

      {/* Pulse Animation Ring */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          height: '100%',
          borderRadius: AppleRadius.full,
          background: AppleColors.accent,
          opacity: visible ? 0.3 : 0,
          animation: visible ? 'pulse 2s ease-in-out infinite' : 'none',
          zIndex: -1,
        }}
      />

      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
