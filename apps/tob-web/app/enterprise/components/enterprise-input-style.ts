/**
 * enterprise-input-style.ts
 *
 * 共享设计 token：企业登录/注册页 input/卡片/Logo 等公共样式。
 *
 * 由来：之前 login/page.tsx 与 register/page.tsx 各自内联了完全相同的
 *       12 行 inputStyle + 多段页面骨架样式，修改需要同步两处，且容易漂移。
 * 集中后：新增 enterprise 页面（如 forgot-password / 2FA）零样板接入。
 */

import type { CSSProperties } from 'react';

// ─── Input ─────────────────────────────────────────────
/** 默认输入框样式（暗色玻璃态），与原 login:197 / register:262 字节相同 */
export const enterpriseInputStyle: CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '12px 14px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  color: '#f8fafc',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

// ─── Page ──────────────────────────────────────────────
/** 登录/注册页公共背景：蓝紫渐变 */
export const enterprisePageBackground =
  'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';

/** 登录页 main：居中网格布局 */
export const enterpriseCenteredMainStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  padding: '24px',
  background: enterprisePageBackground,
};

/** 注册页 main：顶部对齐、自适应宽 */
export const enterpriseTopAlignedMainStyle: CSSProperties = {
  minHeight: '100vh',
  padding: '24px 16px',
  background: enterprisePageBackground,
};

// ─── Section card ──────────────────────────────────────
/** 登录/注册页公共卡片外壳（玻璃态、暗色、模糊背景） */
export const enterpriseCardStyle: CSSProperties = {
  borderRadius: 20,
  padding: 32,
  background: 'rgba(15, 23, 42, 0.8)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

/** 登录卡片默认最大宽度 */
export const ENTERPRISE_LOGIN_CARD_MAX_WIDTH = 440;
/** 注册卡片默认最大宽度 */
export const ENTERPRISE_REGISTER_CARD_MAX_WIDTH = 520;

// ─── Logo ──────────────────────────────────────────────
/** Logo 渐变背景方块（64x64 + 16 圆角 + 紫蓝渐变） */
export const enterpriseLogoBoxStyle: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 16,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
};

/** Logo 字符 "神" 样式 */
export const enterpriseLogoCharStyle: CSSProperties = {
  fontSize: 28,
  color: '#fff',
};

/** 页面标题样式 */
export const enterpriseTitleStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: '#f8fafc',
  margin: '0 0 8px',
};

/** 页面副标题样式 */
export const enterpriseSubtitleStyle: CSSProperties = {
  fontSize: 14,
  color: '#94a3b8',
  margin: 0,
};

// ─── Footer ────────────────────────────────────────────
/** 默认版权文本 */
export const ENTERPRISE_DEFAULT_FOOTER = '© 2024 神机营 SaaS · 保留所有权利';

/** 固定底部版权（用于 login） */
export const enterpriseFixedFooterStyle: CSSProperties = {
  position: 'fixed',
  bottom: 16,
  textAlign: 'center',
  fontSize: 12,
  color: '#64748b',
};
