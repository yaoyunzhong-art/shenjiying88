import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import GeoLocationsPage from './page'

afterEach(() => { cleanup() })

describe('GEO地域标签页', () => {
  it('正例: 渲染标题', () => {
    render(React.createElement(GeoLocationsPage))
    assert.ok(screen.getByText('GEO 地域标签'))
  })
  it('正例: 5城市', () => {
    render(React.createElement(GeoLocationsPage))
    assert.ok(screen.getAllByText('上海').length > 0)
    assert.ok(screen.getAllByText('成都').length > 0)
    assert.ok(screen.getAllByText('深圳').length > 0)
  })
  it('正例: 搜索过滤', () => {
    render(React.createElement(GeoLocationsPage))
    fireEvent.change(screen.getByPlaceholderText('搜索城市/商圈/地标...'), { target: { value: '海岸城' } })
    assert.ok(screen.getByText('海岸城'))
    assert.equal(screen.queryByText('徐家汇'), null)
  })
  it('正例: 城市筛选', () => {
    render(React.createElement(GeoLocationsPage))
    const select = screen.getAllByRole('combobox')[0]
    fireEvent.change(select, { target: { value: '上海' } })
    assert.ok(screen.getByText('徐汇'))
    assert.equal(screen.queryByText('三里屯'), null)
  })
  it('边界: 经纬度格式化', () => {
    render(React.createElement(GeoLocationsPage))
    assert.ok(screen.getByText('31.1900'))
  })
})
