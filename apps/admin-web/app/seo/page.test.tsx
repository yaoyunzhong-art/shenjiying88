import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import SEOPage from './page'

afterEach(() => { cleanup() })

describe('P-49 SEO 仪表盘', () => {
  it('正例: 渲染标题', () => {
    render(React.createElement(SEOPage))
    assert.ok(screen.getByText('SEO / GEO 地理营销'))
  })

  it('正例: 四个统计卡片', () => {
    render(React.createElement(SEOPage))
    assert.ok(screen.getByText('SEO 元数据'))
    assert.ok(screen.getByText('Sitemap 条目'))
    // "GEO 地域标签"同时出现在卡片和入口
    const geoLabels = screen.getAllByText('GEO 地域标签')
    assert.ok(geoLabels.length >= 1)
    assert.ok(screen.getByText('页面优化'))
  })

  it('正例: 数值渲染', () => {
    render(React.createElement(SEOPage))
    const zeros = screen.getAllByText('0')
    assert.ok(zeros.length >= 3) // totalMetadata, totalSitemaps, totalGeos
    assert.ok(screen.getByText('12/20')) // pagesOptimized/total
  })

  it('正例: 三个模块入口', () => {
    render(React.createElement(SEOPage))
    assert.ok(screen.getByText('SEO 元数据管理'))
    assert.ok(screen.getByText('Sitemap 管理'))
    assert.ok(screen.getAllByText('GEO 地域标签').length >= 1)
  })

  it('反例: error区块不显示', () => {
    render(React.createElement(SEOPage))
    assert.equal(screen.queryByText(/错误/), null)
  })

  it('边界: 页面加载', () => {
    render(React.createElement(SEOPage))
    assert.ok(screen.getByText('SEO / GEO 地理营销'))
  })
})
