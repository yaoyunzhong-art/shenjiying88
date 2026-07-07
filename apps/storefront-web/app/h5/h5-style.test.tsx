import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  getMainContainerStyle,
  getHeaderStyle,
  getPageTitleStyle,
  getToggleChipStyle,
  getCardStyle,
  getEmptyStateStyle,
  getEmptyStateEmojiStyle,
  H5NavBar,
  H5Header,
  COLOR_BG,
  COLOR_BG_SURFACE,
  COLOR_BG_SURFACE_DIM,
  COLOR_BG_HEADER,
  COLOR_BORDER,
  COLOR_BORDER_DIM,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
  COLOR_TEXT_MUTED,
  COLOR_ACCENT,
  COLOR_ACCENT_BG,
  COLOR_NAV_ACTIVE,
  type H5NavKey,
} from './h5-style'

describe('h5-style helpers', () => {
  describe('getMainContainerStyle', () => {
    it('returns the standard H5 main shell', () => {
      const s = getMainContainerStyle()
      assert.equal(s.minHeight, '100vh')
      assert.equal(s.background, COLOR_BG)
      assert.equal(s.paddingBottom, 80)
    })

    it('is deterministic', () => {
      assert.deepEqual(getMainContainerStyle(), getMainContainerStyle())
    })
  })

  describe('getHeaderStyle', () => {
    it('returns the standard sticky header with blur', () => {
      const s = getHeaderStyle()
      assert.equal(s.position, 'sticky')
      assert.equal(s.top, 0)
      assert.equal(s.zIndex, 50)
      assert.equal(s.background, COLOR_BG_HEADER)
      assert.equal(s.backdropFilter, 'blur(12px)')
      assert.equal(s.padding, '16px')
      assert.equal(s.borderBottom, COLOR_BORDER)
    })
  })

  describe('getPageTitleStyle', () => {
    it('default marginBottom is 12', () => {
      const s = getPageTitleStyle()
      assert.equal(s.fontSize, 18)
      assert.equal(s.fontWeight, 700)
      assert.equal(s.color, COLOR_TEXT_PRIMARY)
      assert.equal(s.marginBottom, 12)
    })

    it('accepts 12 or 16 marginBottom', () => {
      assert.equal(getPageTitleStyle(12).marginBottom, 12)
      assert.equal(getPageTitleStyle(16).marginBottom, 16)
    })
  })

  describe('getToggleChipStyle', () => {
    it('active: purple bg, indigo text', () => {
      const s = getToggleChipStyle(true)
      assert.equal(s.background, COLOR_ACCENT_BG)
      assert.equal(s.color, COLOR_ACCENT)
      assert.equal(s.borderRadius, 16)
      assert.equal(s.cursor, 'pointer')
    })

    it('inactive: gray bg, gray text', () => {
      const s = getToggleChipStyle(false)
      assert.equal(s.background, 'rgba(148,163,184,0.1)')
      assert.equal(s.color, COLOR_TEXT_SECONDARY)
    })

    it('padding is 6/16, borderRadius 16, border none', () => {
      const s = getToggleChipStyle(true)
      assert.equal(s.padding, '6px 16px')
      assert.equal(s.border, 'none')
      assert.equal(s.fontSize, 13)
    })

    it('opts.flex sets the flex field', () => {
      const s = getToggleChipStyle(true, { flex: 1 })
      assert.equal(s.flex, 1)
    })

    it('opts.whiteSpace sets the whiteSpace field', () => {
      const s = getToggleChipStyle(true, { whiteSpace: 'nowrap' })
      assert.equal(s.whiteSpace, 'nowrap')
    })

    it('omits flex when not in opts', () => {
      const s = getToggleChipStyle(true)
      assert.equal(s.flex, undefined)
    })
  })

  describe('getCardStyle', () => {
    it('default: surface bg, 1px border, padding 16, marginBottom 12', () => {
      const s = getCardStyle()
      assert.equal(s.borderRadius, 12)
      assert.equal(s.background, COLOR_BG_SURFACE)
      assert.equal(s.border, COLOR_BORDER)
      assert.equal(s.padding, 16)
      assert.equal(s.marginBottom, 12)
      assert.equal(s.opacity, undefined)
    })

    it('disabled: dim bg, dim border, opacity 0.6', () => {
      const s = getCardStyle({ disabled: true })
      assert.equal(s.background, COLOR_BG_SURFACE_DIM)
      assert.equal(s.border, COLOR_BORDER_DIM)
      assert.equal(s.opacity, 0.6)
    })

    it('accepts custom padding and marginBottom', () => {
      const s = getCardStyle({ padding: 12, marginBottom: 8 })
      assert.equal(s.padding, 12)
      assert.equal(s.marginBottom, 8)
    })

    it('merges display/gap/textDecoration/overflow opts', () => {
      const s = getCardStyle({ display: 'block', gap: 12, textDecoration: 'none', overflow: 'hidden' })
      assert.equal(s.display, 'block')
      assert.equal(s.gap, 12)
      assert.equal(s.textDecoration, 'none')
      assert.equal(s.overflow, 'hidden')
    })
  })

  describe('getEmptyStateStyle', () => {
    it('returns the standard empty state container', () => {
      const s = getEmptyStateStyle()
      assert.equal(s.textAlign, 'center')
      assert.equal(s.padding, 48)
      assert.equal(s.color, COLOR_TEXT_MUTED)
    })
  })

  describe('getEmptyStateEmojiStyle', () => {
    it('emoji is 48px with 12px margin', () => {
      const s = getEmptyStateEmojiStyle()
      assert.equal(s.fontSize, 48)
      assert.equal(s.marginBottom, 12)
    })
  })
})

describe('H5NavBar component', () => {
  it('renders 4 nav items in the same order (home/stores/coupons/me)', () => {
    const html = renderToStaticMarkup(<H5NavBar activeKey="coupons" />)
    assert.ok(html.includes('首页'))
    assert.ok(html.includes('门店'))
    assert.ok(html.includes('优惠券'))
    assert.ok(html.includes('我的'))
    assert.ok(html.includes('🏠'))
    assert.ok(html.includes('🔍'))
    assert.ok(html.includes('🎫'))
    assert.ok(html.includes('👤'))
  })

  it('uses orange for the active item, gray for the rest', () => {
    const html = renderToStaticMarkup(<H5NavBar activeKey="stores" />)
    // The 门店 link should have orange color
    assert.ok(html.includes(COLOR_NAV_ACTIVE))
    // The other 3 should use muted color
    assert.ok(html.includes(COLOR_TEXT_MUTED))
  })

  it('contains the standard href routes', () => {
    const html = renderToStaticMarkup(<H5NavBar activeKey="me" />)
    assert.ok(html.includes('href="/h5"'))
    assert.ok(html.includes('href="/store-locator"'))
    assert.ok(html.includes('href="/h5/coupons"'))
    assert.ok(html.includes('href="/member-center"'))
  })

  it('accepts all 4 nav keys', () => {
    const keys: H5NavKey[] = ['home', 'stores', 'coupons', 'me']
    for (const k of keys) {
      const html = renderToStaticMarkup(<H5NavBar activeKey={k} />)
      // active key should always show up in orange (which appears once for the active item)
      assert.ok(html.includes(COLOR_NAV_ACTIVE), `key ${k} should produce active color`)
    }
  })
})

describe('H5Header component', () => {
  it('renders title in H1 with standard style', () => {
    const html = renderToStaticMarkup(<H5Header title="我的优惠券" />)
    assert.ok(html.includes('<h1'))
    assert.ok(html.includes('我的优惠券'))
    assert.ok(html.includes('18')) // fontSize
    assert.ok(html.includes('700')) // fontWeight
  })

  it('forwards children inside header', () => {
    const html = renderToStaticMarkup(
      <H5Header title="我的收藏">
        <span data-testid="child">inner</span>
      </H5Header>
    )
    assert.ok(html.includes('我的收藏'))
    assert.ok(html.includes('data-testid="child"'))
    assert.ok(html.includes('inner'))
  })

  it('accepts marginBottom 12 or 16', () => {
    const h12 = renderToStaticMarkup(<H5Header title="x" marginBottom={12} />)
    const h16 = renderToStaticMarkup(<H5Header title="x" marginBottom={16} />)
    assert.ok(h12.includes('margin-bottom:12') || h12.includes('marginBottom:12') || h12.includes('margin-bottom: 12'))
    assert.ok(h16.includes('margin-bottom:16') || h16.includes('marginBottom:16') || h16.includes('margin-bottom: 16'))
  })
})
