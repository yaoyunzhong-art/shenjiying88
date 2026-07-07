/**
 * H5 共享视觉契约 + 共享 shell 组件
 * 7 个 H5 页面（campaigns/favorites/orders/points/coupons/campaigns[id]/contact）共用
 */

import React from 'react';
import Link from 'next/link';

// ─── 颜色 token ─────────────────────────────────────────────────────────────

export const COLOR_BG = '#0f172a'
export const COLOR_BG_SURFACE = 'rgba(15,23,42,0.8)'
export const COLOR_BG_SURFACE_DIM = 'rgba(15,23,42,0.4)'
export const COLOR_BG_HEADER = 'rgba(15,23,42,0.95)'

export const COLOR_BORDER = '1px solid rgba(148,163,184,0.1)'
export const COLOR_BORDER_DIM = '1px solid rgba(148,163,184,0.08)'

export const COLOR_TEXT_PRIMARY = '#f8fafc'
export const COLOR_TEXT_SECONDARY = '#94a3b8'
export const COLOR_TEXT_MUTED = '#64748b'

export const COLOR_ACCENT = '#a5b4fc'
export const COLOR_ACCENT_BG = 'rgba(99,102,241,0.2)'
export const COLOR_ACCENT_BG_DARK = 'rgba(99,102,241,0.1)'
export const COLOR_ACCENT_BORDER = '1px solid rgba(99,102,241,0.4)'
export const COLOR_NAV_ACTIVE = '#f59e0b'

// ─── 通用 type ──────────────────────────────────────────────────────────────

export interface MainContainerStyle {
  minHeight: string
  background: string
  paddingBottom: number
}

export interface HeaderStyle {
  position: 'sticky'
  top: number
  zIndex: number
  background: string
  backdropFilter: string
  padding: string
  borderBottom: string
}

export interface PageTitleStyle {
  fontSize: number
  fontWeight: number
  color: string
  marginBottom: number
}

export interface ToggleChipStyle {
  padding: string
  borderRadius: number
  border: 'none'
  fontSize: number
  cursor: 'pointer'
  whiteSpace?: 'nowrap'
  flex?: number
  background: string
  color: string
}

export interface CardStyle {
  borderRadius: number
  background: string
  border: string
  padding: number
  marginBottom: number
  opacity?: number
  display?: string
  textDecoration?: string
  gap?: number
  overflow?: 'hidden'
}

export interface EmptyStateStyle {
  textAlign: 'center'
  padding: number
  color: string
}

// ─── 共享 shell helper ─────────────────────────────────────────────────────

export function getMainContainerStyle(): MainContainerStyle {
  return {
    minHeight: '100vh',
    background: COLOR_BG,
    paddingBottom: 80,
  }
}

export function getHeaderStyle(): HeaderStyle {
  return {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    background: COLOR_BG_HEADER,
    backdropFilter: 'blur(12px)',
    padding: '16px',
    borderBottom: COLOR_BORDER,
  }
}

export function getPageTitleStyle(marginBottom: 8 | 12 | 16 = 12): PageTitleStyle {
  return {
    fontSize: 18,
    fontWeight: 700,
    color: COLOR_TEXT_PRIMARY,
    marginBottom,
  }
}

export interface ToggleChipOptions {
  flex?: number
  whiteSpace?: 'nowrap'
}

export function getToggleChipStyle(isActive: boolean, opts: ToggleChipOptions = {}): ToggleChipStyle {
  return {
    padding: '6px 16px',
    borderRadius: 16,
    border: 'none',
    fontSize: 13,
    cursor: 'pointer',
    background: isActive ? COLOR_ACCENT_BG : 'rgba(148,163,184,0.1)',
    color: isActive ? COLOR_ACCENT : COLOR_TEXT_SECONDARY,
    ...(opts.whiteSpace ? { whiteSpace: opts.whiteSpace } : {}),
    ...(opts.flex !== undefined ? { flex: opts.flex } : {}),
  }
}

export interface CardOptions {
  padding?: 0 | 12 | 16 | 20 | 24
  marginBottom?: number
  disabled?: boolean
  display?: string
  gap?: number
  textDecoration?: string
  overflow?: 'hidden'
}

export function getCardStyle(opts: CardOptions = {}): CardStyle {
  const isDisabled = opts.disabled ?? false
  const style: CardStyle = {
    borderRadius: 12,
    background: isDisabled ? COLOR_BG_SURFACE_DIM : COLOR_BG_SURFACE,
    border: isDisabled ? COLOR_BORDER_DIM : COLOR_BORDER,
    padding: opts.padding ?? 16,
    marginBottom: opts.marginBottom ?? 12,
  }
  if (isDisabled) style.opacity = 0.6
  if (opts.display) style.display = opts.display
  if (opts.gap !== undefined) style.gap = opts.gap
  if (opts.textDecoration) style.textDecoration = opts.textDecoration
  if (opts.overflow) style.overflow = opts.overflow
  return style
}

export function getEmptyStateStyle(): EmptyStateStyle {
  return {
    textAlign: 'center',
    padding: 48,
    color: COLOR_TEXT_MUTED,
  }
}

export function getEmptyStateEmojiStyle() {
  return { fontSize: 48, marginBottom: 12 }
}

// ─── 共享 shell 组件 ───────────────────────────────────────────────────────

export type H5NavKey = 'home' | 'stores' | 'coupons' | 'me'

interface NavItem {
  icon: string
  label: string
  href: string
  key: H5NavKey
}

const NAV_ITEMS: NavItem[] = [
  { icon: '🏠', label: '首页', href: '/h5', key: 'home' },
  { icon: '🔍', label: '门店', href: '/store-locator', key: 'stores' },
  { icon: '🎫', label: '优惠券', href: '/h5/coupons', key: 'coupons' },
  { icon: '👤', label: '我的', href: '/member-center', key: 'me' },
]

export interface H5NavBarProps {
  activeKey: H5NavKey
}

export function H5NavBar({ activeKey }: H5NavBarProps) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-around', padding: '12px 0',
      background: COLOR_BG_HEADER,
      borderTop: COLOR_BORDER,
    }}>
      {NAV_ITEMS.map((item) => (
        <Link key={item.key} href={item.href} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          textDecoration: 'none', color: item.key === activeKey ? COLOR_NAV_ACTIVE : COLOR_TEXT_MUTED,
        }}>
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <span style={{ fontSize: 11 }}>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export interface H5HeaderProps {
  title: string
  marginBottom?: 8 | 12 | 16
  children?: React.ReactNode
}

export function H5Header({ title, marginBottom = 12, children }: H5HeaderProps) {
  return (
    <header style={getHeaderStyle()}>
      <h1 style={getPageTitleStyle(marginBottom)}>{title}</h1>
      {children}
    </header>
  )
}
