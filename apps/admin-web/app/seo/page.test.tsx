import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import SEOPage from './page'

afterEach(() => { cleanup() })

describe('P-49 SEO 仪表盘', () => {
  it('正例: 渲染标题', async () => {
    render(React.createElement(SEOPage))
    assert.ok(screen.getByText('SEO / GEO 地理营销'))
  })

  it('正例: 5个统计卡片(加载后出现)', async () => {
    render(React.createElement(SEOPage))
    const seoLabel = await waitFor(() => screen.getByText('SEO 元数据'), { timeout: 500 })
    assert.ok(seoLabel)
    assert.ok(await waitFor(() => screen.getByText('Sitemap 条目'), { timeout: 200 }))
    assert.ok(await waitFor(() => screen.getByText('GEO 地域标签'), { timeout: 200 }))
    assert.ok(await waitFor(() => screen.getByText('页面优化'), { timeout: 200 }))
    assert.ok(await waitFor(() => screen.getByText('最后更新'), { timeout: 200 }))
  })

  it('正例: 数值渲染(加载后)', async () => {
    render(React.createElement(SEOPage))
    await waitFor(() => screen.getByText('12/20'), { timeout: 500 })
    assert.ok(screen.getByText('12/20'))
  })

  it('正例: 三个模块入口(加载后)', async () => {
    render(React.createElement(SEOPage))
    await waitFor(() => screen.getByText('SEO 元数据管理'), { timeout: 500 })
    assert.ok(screen.getByText('Sitemap 管理'))
    const geoLabels = screen.getAllByText('GEO 地域标签')
    assert.ok(geoLabels.length >= 1)
  })

  it('反例: error区块不显示', () => {
    render(React.createElement(SEOPage))
    assert.equal(screen.queryByText(/关闭/), null)
  })

  it('边界: 页面加载', () => {
    render(React.createElement(SEOPage))
    assert.ok(screen.getByText('SEO / GEO 地理营销'))
  })

  it('正例: 健康度标签', async () => {
    render(React.createElement(SEOPage))
    await waitFor(() => screen.getByText(/健康度 72分/), { timeout: 500 })
    assert.ok(screen.getByText(/健康度 72分/))
  })
})
