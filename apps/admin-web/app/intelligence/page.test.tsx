import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import IntelligencePage from './page'

afterEach(() => { cleanup() })

describe('运营参谋仪表盘', () => {
  it('正例: 渲染标题', () => {
    render(React.createElement(IntelligencePage))
    assert.ok(screen.getByText('🤖 运营参谋'))
  })
  it('正例: 三个入口', () => {
    render(React.createElement(IntelligencePage))
    assert.ok(screen.getByText('📊 开业可行性报告'))
    assert.ok(screen.getByText('💡 运营参谋 (AI选择题)'))
    assert.ok(screen.getByText('👀 竞争监控'))
  })
})
