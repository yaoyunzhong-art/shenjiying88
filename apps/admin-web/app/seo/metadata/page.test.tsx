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

  it('正例: 搜索过滤', () => {
    render(React.createElement(SEOMetadataPage))
    fireEvent.change(screen.getByPlaceholderText('搜索路径或标题...'), { target: { value: '北京' } })
    assert.ok(screen.getByText('北京朝阳店 | 品牌'))
    assert.equal(screen.queryByText('上海徐汇旗舰店 | 品牌'), null)
  })

  it('正例: 点击编辑打开弹窗', () => {
    render(React.createElement(SEOMetadataPage))
    fireEvent.click(screen.getAllByText('编辑')[0]!)
    assert.ok(screen.getByText(/编辑元数据/))
    assert.ok(screen.getByText('保存'))
  })

  it('反例: 取消关闭弹窗', () => {
    render(React.createElement(SEOMetadataPage))
    fireEvent.click(screen.getAllByText('编辑')[0]!)
    assert.ok(screen.getByText(/编辑元数据/))
    fireEvent.click(screen.getByText('取消'))
    assert.equal(screen.queryByText(/编辑元数据/), null)
  })

  it('边界: 搜索无结果', () => {
    render(React.createElement(SEOMetadataPage))
    fireEvent.change(screen.getByPlaceholderText('搜索路径或标题...'), { target: { value: 'ZZZZZZ' } })
    assert.ok(screen.getByText('无匹配数据'))
  })
})
