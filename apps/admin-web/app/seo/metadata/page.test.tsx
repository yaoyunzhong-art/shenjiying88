import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import SEOMetadataPage from './page'

afterEach(() => { cleanup() })

describe('SEO元数据管理页', () => {
  it('正例: 渲染标题', () => {
    render(React.createElement(SEOMetadataPage))
    assert.ok(screen.getByText('SEO 元数据管理'))
  })
  it('正例: 表格渲染', () => {
    render(React.createElement(SEOMetadataPage))
    assert.ok(screen.getByText('上海徐汇旗舰店 | 品牌'))
  })
  it('正例: 搜索过滤', () => {
    render(React.createElement(SEOMetadataPage))
    const input = screen.getByPlaceholderText('搜索路径或标题...')
    fireEvent.change(input, { target: { value: '北京' } })
    assert.ok(screen.getByText('北京朝阳店 | 品牌'))
    assert.equal(screen.queryByText('上海徐汇旗舰店 | 品牌'), null)
  })
  it('正例: 排序切换', () => {
    render(React.createElement(SEOMetadataPage))
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'title' } })
    assert.ok(screen.getByText('SEO 元数据管理'))
  })
  it('边界: 搜索无结果', () => {
    render(React.createElement(SEOMetadataPage))
    fireEvent.change(screen.getByPlaceholderText('搜索路径或标题...'), { target: { value: 'ZZZZ_NOTFOUND' } })
    assert.equal(screen.queryByText(/上海|北京/), null)
    assert.ok(screen.getByText('无匹配数据'))
  })
})
