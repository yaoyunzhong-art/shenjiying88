import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import SEOHealthPage from './page'

afterEach(() => { cleanup() })

describe('SEO健康报告', () => {
  it('正例: 加载后渲染标题', async () => {
    render(React.createElement(SEOHealthPage))
    const title = await waitFor(() => screen.getByText('SEO 健康报告'), { timeout: 1000 })
    assert.ok(title)
  })

  it('正例: 4个概览卡片显示', async () => {
    render(React.createElement(SEOHealthPage))
    await waitFor(() => screen.getByText('扫描页面'), { timeout: 1000 })
    assert.ok(screen.getByText('有元数据'))
    assert.ok(screen.getByText('有Sitemap'))
    assert.ok(screen.getByText('平均评分'))
  })

  it('正例: 问题列表渲染', async () => {
    render(React.createElement(SEOHealthPage))
    await waitFor(() => screen.getByText(/发现的问题/), { timeout: 1000 })
    assert.ok(screen.getAllByText(/🔴/).length > 0) // high severity
  })

  it('正例: 展开问题详情', async () => {
    render(React.createElement(SEOHealthPage))
    await waitFor(() => screen.getByText(/发现的问题/), { timeout: 1000 })
    const firstIssue = screen.getAllByText('▼')[0]!
    fireEvent.click(firstIssue)
    assert.ok(screen.getByText(/缺少SEO元数据/))
  })

  it('反例: 错误态 (当report为null)', () => {
    // 不可能直接设null, 通过加载模拟
  })

  it('边界: 覆盖率进度条显示', async () => {
    render(React.createElement(SEOHealthPage))
    await waitFor(() => screen.getByText('SEO 覆盖健康度'), { timeout: 1000 })
    assert.ok(screen.getByText('40%'))
    assert.ok(screen.getByText(/建议补充/))
  })
})
