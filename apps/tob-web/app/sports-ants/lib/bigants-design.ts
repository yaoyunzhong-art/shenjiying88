/**
 * 运动蚂蚁品牌视觉设计系统
 * BigAnts Brand Design System
 *
 * 色彩体系、字体规范、间距系统等
 */

// ==================== 色彩体系 ====================

/**
 * 运动蚂蚁品牌主色彩
 * 以科技蓝为主，活力橙为辅，强调智慧绿
 */
export const BigAntsColors = {
  // 主色调 - 科技蓝
  primary: '#0066FF',
  primaryLight: '#3385FF',
  primaryDark: '#0052CC',

  // 辅助色 - 活力橙
  secondary: '#FF6B00',
  secondaryLight: '#FF8A3D',
  secondaryDark: '#CC5500',

  // 强调色 - 智慧绿
  accent: '#00C853',
  accentLight: '#69F0AE',
  accentDark: '#00A844',

  // 中性色
  white: '#FFFFFF',
  black: '#000000',

  // 背景色
  bgWhite: '#FFFFFF',
  bgLight: '#F8FAFC',
  bgGray: '#F1F5F9',
  bgDark: '#1A1A2E',

  // 文字色
  textPrimary: '#1A1A2E',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textLight: '#FFFFFF',
  textMuted: '#94A3B8',

  // 功能色
  success: '#00C853',
  warning: '#FFB800',
  error: '#FF3D00',
  info: '#0066FF',

  // 渐变色
  gradient: {
    primary: 'linear-gradient(135deg, #0066FF 0%, #0052CC 100%)',
    secondary: 'linear-gradient(135deg, #FF6B00 0%, #FF8A3D 100%)',
    hero: 'linear-gradient(135deg, #1A1A2E 0%, #0066FF 100%)',
    dark: 'linear-gradient(180deg, #1A1A2E 0%, #2D2D44 100%)',
  },
};

// ==================== 字体规范 ====================

/**
 * 字体家族
 */
export const BigAntsFonts = {
  // 中文
  chinese: '"Source Han Sans CN", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',

  // 英文
  english: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',

  // 数字/等宽
  mono: '"Roboto Mono", "SF Mono", "Consolas", monospace',

  // 展示字体（用于标题）
  display: '"Inter", "Roboto", sans-serif',
};

// ==================== 字号规范 ====================

/**
 * 字体大小系统
 */
export const BigAntsFontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem',  // 72px
  '8xl': '6rem',    // 96px
};

// ==================== 间距系统 ====================

/**
 * 间距系统（基于 4px）
 */
export const BigAntsSpacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
  '5xl': '8rem',   // 128px

  // 区块间距
  section: '6rem',    // 96px
  sectionLg: '8rem',  // 128px
  sectionSm: '4rem',  // 64px
};

// ==================== 圆角规范 ====================

/**
 * 圆角系统
 */
export const BigAntsRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  full: '9999px',
};

// ==================== 阴影规范 ====================

/**
 * 阴影系统
 */
export const BigAntsShadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  glow: '0 0 20px rgba(0, 102, 255, 0.3)',
  'glow-secondary': '0 0 20px rgba(255, 107, 0, 0.3)',
};

// ==================== 动画规范 ====================

/**
 * 过渡/动画时间
 */
export const BigAntsTransitions = {
  none: 'none',
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '350ms ease',
  slower: '500ms ease',
};

// ==================== 断点规范 ====================

/**
 * 响应式断点
 */
export const BigAntsBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ==================== Z-Index 层级 ====================

/**
 * Z-Index 层级
 */
export const BigAntsZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
};

// ==================== 快捷样式 ====================

/**
 * 常用样式组合
 */
export const BigAntsStyles = {
  // 容器
  container: {
    maxWidth: '1280px',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: '1rem',
    paddingRight: '1rem',
  },

  // 卡片
  card: {
    background: BigAntsColors.white,
    borderRadius: BigAntsRadius.lg,
    boxShadow: BigAntsShadows.md,
    padding: BigAntsSpacing.lg,
  },

  // 按钮基础
  buttonBase: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: BigAntsRadius.full,
    transition: `all ${BigAntsTransitions.normal}`,
    cursor: 'pointer',
  },

  // 主按钮
  buttonPrimary: {
    background: BigAntsColors.primary,
    color: BigAntsColors.white,
    padding: '0.75rem 1.5rem',
    fontSize: BigAntsFontSizes.base,
  },

  // 次按钮
  buttonSecondary: {
    background: 'transparent',
    color: BigAntsColors.primary,
    border: `2px solid ${BigAntsColors.primary}`,
    padding: '0.75rem 1.5rem',
    fontSize: BigAntsFontSizes.base,
  },

  // 标题样式
  heading: {
    fontFamily: BigAntsFonts.display,
    fontWeight: 700,
    color: BigAntsColors.textPrimary,
    lineHeight: 1.2,
  },

  // 副标题
  subheading: {
    fontFamily: BigAntsFonts.chinese,
    fontWeight: 500,
    color: BigAntsColors.textSecondary,
    lineHeight: 1.6,
  },
};
