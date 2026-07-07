/**
 * EnterpriseAuthPage.tsx
 *
 * 企业登录/注册页共享布局：背景 + 卡片 + Logo + 标题 + 副标题 + 版权。
 *
 * 由来：login 与 register 两个页面把完全相同的 5 段视觉骨架（背景渐变 / 卡片
 *       外壳 / 64x64 Logo / 标题 / 副标题 / 底部版权）逐字符 inline 在 10 处。
 *       任何视觉调整都要同步两处，且容易漂移。
 * 集中后：调用方 1 行 <EnterpriseAuthPage> 即可，视觉规格调整从 2 处变 1 处。
 *
 * 用法：
 *   <EnterpriseAuthPage title="企业用户登录" subtitle="神机营 SaaS 平台企业管理入口">
 *     {/* form ... *\/}
 *   </EnterpriseAuthPage>
 */

'use client';

import React from 'react';
import {
  enterpriseCenteredMainStyle,
  enterpriseTopAlignedMainStyle,
  enterpriseCardStyle,
  enterpriseLogoBoxStyle,
  enterpriseLogoCharStyle,
  enterpriseTitleStyle,
  enterpriseSubtitleStyle,
  enterpriseFixedFooterStyle,
  ENTERPRISE_DEFAULT_FOOTER,
} from './enterprise-input-style';

export type EnterpriseAuthVariant = 'centered' | 'top-aligned';

export interface EnterpriseAuthPageProps {
  /** 页面主标题（如 "企业用户登录"） */
  title: string;
  /** 页面副标题（如 "神机营 SaaS 平台企业管理入口"） */
  subtitle: string;
  /**
   * 布局变体：
   *   - 'centered' (默认) 居中网格，用于登录页
   *   - 'top-aligned' 顶部对齐并限制最大宽，用于注册页
   */
  variant?: EnterpriseAuthVariant;
  /** 卡片最大宽度，默认 440（登录）；注册页可传 520 */
  cardMaxWidth?: number;
  /** 头部追加内容（如注册页的"返回登录"链接） */
  headerExtra?: React.ReactNode;
  /** 版权文本，默认 ENTERPRISE_DEFAULT_FOOTER */
  footerText?: string;
  /** 版权位置：'fixed' 固定底部（登录），'inline' 跟随卡片下方（注册） */
  footerPosition?: 'fixed' | 'inline';
  children: React.ReactNode;
}

export function EnterpriseAuthPage({
  title,
  subtitle,
  variant = 'centered',
  cardMaxWidth = 440,
  headerExtra,
  footerText = ENTERPRISE_DEFAULT_FOOTER,
  footerPosition = 'fixed',
  children,
}: EnterpriseAuthPageProps) {
  const mainStyle: React.CSSProperties =
    variant === 'centered'
      ? enterpriseCenteredMainStyle
      : enterpriseTopAlignedMainStyle;

  const cardWrapper: React.ReactNode =
    variant === 'centered' ? (
      <section style={{ ...enterpriseCardStyle, width: '100%', maxWidth: cardMaxWidth }}>
        <Header title={title} subtitle={subtitle} />
        {children}
      </section>
    ) : (
      <div style={{ maxWidth: cardMaxWidth, margin: '0 auto' }}>
        {headerExtra ? <div style={{ textAlign: 'center', marginBottom: 32 }}>{headerExtra}</div> : null}
        <Header title={title} subtitle={subtitle} />
        <section style={enterpriseCardStyle}>{children}</section>
        {footerPosition === 'inline' ? (
          <footer style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#64748b' }}>
            {footerText}
          </footer>
        ) : null}
      </div>
    );

  return (
    <main style={mainStyle}>
      {cardWrapper}
      {footerPosition === 'fixed' ? (
        <footer style={enterpriseFixedFooterStyle}>{footerText}</footer>
      ) : null}
    </main>
  );
}

interface HeaderProps {
  title: string;
  subtitle: string;
}

/** 64x64 Logo + 标题 + 副标题，独立组件便于复用 */
function Header({ title, subtitle }: HeaderProps) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <div style={enterpriseLogoBoxStyle}>
        <span style={enterpriseLogoCharStyle}>神</span>
      </div>
      <h1 style={enterpriseTitleStyle}>{title}</h1>
      <p style={enterpriseSubtitleStyle}>{subtitle}</p>
    </div>
  );
}
