import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import SitemapPage from './page'

afterEach(() => { cleanup() })

describe('Sitemap管理页', () => {
  it('正例: 渲染标题', () => {
    render(React.createElement(SitemapPage))
    assert.ok(screen.getByText('Sitemap 管理'))
  })
  it('正例: 6条目', () => {
    render(React.createElement(SitemapPage))
    assert.ok(screen.getByText('/stores/shanghai-xuhui'))
    assert.ok(screen.getByText('/about'))
  })
  it('正例: 筛选每日', () => {
    render(React.createElement(SitemapPage))
    fireEvent.click(screen.getByText('每日'))
    assert.ok(screen.getByText('/'))
    assert.equal(screen.queryByText('/about'), null)
  })
  it('边界: 筛选每月', () => {
    render(React.createElement(SitemapPage))
    fireEvent.click(screen.getByText('每月'))
    assert.ok(screen.getByText('/about'))
  })
  it('正例: 优先级渲染', () => {
    render(React.createElement(SitemapPage))
    assert.ok(screen.getByText('0.9'))
    assert.ok(screen.getByText('0.5'))
  })
})
