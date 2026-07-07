/**
 * 苹果风格设计系统 - Apple Design System
 * B2B品牌官网视觉规范
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// ─── 色彩系统 ───────────────────────────────────────────────────────────────

export const AppleColors = {
  // 主色系
  primary: '#1d1d1f',        // 深邃黑 - 标题和重要文字
  secondary: '#f5f5f7',      // 浅灰白 - 背景和卡片
  accent: '#0071e3',         // 苹果蓝 - CTA按钮和链接
  accentHover: '#0077ed',     // 苹果蓝Hover

  // 状态色
  success: '#34c759',
  warning: '#ff9500',
  error: '#ff3b30',

  // 中性色
  textPrimary: '#1d1d1f',
  textSecondary: '#86868b',
  textTertiary: '#6e6e73',

  // 背景色
  bgWhite: '#ffffff',
  bgGray: '#f5f5f7',
  bgGrayDark: '#e8e8ed',

  // 边框
  border: '#d2d2d7',
  borderLight: '#e8e8ed',
} as const;

// ─── 字体系统 ───────────────────────────────────────────────────────────────

export const AppleFonts = {
  display: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
  text: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
} as const;

// ─── 字号系统 ───────────────────────────────────────────────────────────────

export const AppleFontSizes = {
  hero: 'clamp(48px, 8vw, 96px)',      // Hero标题
  h1: 'clamp(40px, 6vw, 64px)',        // 一级标题
  h2: 'clamp(28px, 4vw, 40px)',        // 二级标题
  h3: 'clamp(21px, 3vw, 28px)',        // 三级标题
  body: 'clamp(15px, 2vw, 17px)',      // 正文
  caption: 'clamp(12px, 1.5vw, 14px)', // 辅助文字
  small: '11px',                        // 极小文字
} as const;

// ─── 间距系统 ───────────────────────────────────────────────────────────────

export const AppleSpacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
  section: '80px',
  sectionLg: '120px',
} as const;

// ─── 圆角系统 ───────────────────────────────────────────────────────────────

export const AppleRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
} as const;

// ─── 阴影系统 ───────────────────────────────────────────────────────────────

export const AppleShadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
  md: '0 4px 12px rgba(0, 0, 0, 0.1)',
  lg: '0 12px 40px rgba(0, 0, 0, 0.12)',
  xl: '0 24px 80px rgba(0, 0, 0, 0.16)',
} as const;

// ─── 动效系统 ───────────────────────────────────────────────────────────────

export const AppleTransitions = {
  fast: '150ms ease',
  normal: '300ms ease',
  slow: '500ms ease',
  fade: '600ms ease-out',
} as const;

// ─── Context ────────────────────────────────────────────────────────────────

interface AppleDesignContextType {
  colors: typeof AppleColors;
  fonts: typeof AppleFonts;
  fontSizes: typeof AppleFontSizes;
  spacing: typeof AppleSpacing;
  radius: typeof AppleRadius;
  shadows: typeof AppleShadows;
  transitions: typeof AppleTransitions;
}

const AppleDesignContext = createContext<AppleDesignContextType>({
  colors: AppleColors,
  fonts: AppleFonts,
  fontSizes: AppleFontSizes,
  spacing: AppleSpacing,
  radius: AppleRadius,
  shadows: AppleShadows,
  transitions: AppleTransitions,
});

export function AppleDesignProvider({ children }: { children: ReactNode }) {
  return (
    <AppleDesignContext.Provider
      value={{
        colors: AppleColors,
        fonts: AppleFonts,
        fontSizes: AppleFontSizes,
        spacing: AppleSpacing,
        radius: AppleRadius,
        shadows: AppleShadows,
        transitions: AppleTransitions,
      }}
    >
      {children}
    </AppleDesignContext.Provider>
  );
}

export function useAppleDesign() {
  return useContext(AppleDesignContext);
}

// ─── 工具函数 ───────────────────────────────────────────────────────────────

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
