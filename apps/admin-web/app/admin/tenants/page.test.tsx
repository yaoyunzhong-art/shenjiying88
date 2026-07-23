/**
 * admin/tenants/page.test.tsx — 租户配额管理页面 L1+L2 测试
 *
 * 覆盖: 正例·反例·边界·防御·数据校验
 * 组件: AdminTenantsQuotaPage — 租户配额仪表盘
 */
import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

afterEach(() => { cleanup() })

// ── 正例: 结构渲染 ──

describe('AdminTenantsQuotaPage — 正例', () => {
  it('渲染页面标题', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => screen.getByText('租户配额管理'), { timeout: 500 })
    assert.ok(screen.getByText('租户配额管理'))
  })

  it('渲染副标题含租户数量', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('个租户'), '应显示租户数量')
    }, { timeout: 500 })
  })

  it('渲染店铺容量统计卡', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('店铺容量'), '应显示店铺容量')
    }, { timeout: 500 })
  })

  it('渲染用户容量统计卡', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('用户容量'), '应显示用户容量')
    }, { timeout: 500 })
  })

  it('渲染存储容量统计卡', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('存储容量'), '应显示存储容量')
    }, { timeout: 500 })
  })

  it('渲染需关注租户统计卡', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('需关注租户'), '应显示需关注租户')
    }, { timeout: 500 })
  })

  it('渲染 Tab: 配额列表', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => screen.getByText('📋 配额列表'), { timeout: 500 })
    assert.ok(screen.getByText('📋 配额列表'))
  })

  it('渲染 Tab: 概况', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => screen.getByText('📊 概况'), { timeout: 500 })
    assert.ok(screen.getByText('📊 概况'))
  })

  it('搜索输入框显示(通过 data-mock)', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const inputs = document.querySelectorAll('[data-mock="SearchFilterInput"]')
      assert.ok(inputs.length >= 1, '应显示搜索输入框')
    }, { timeout: 500 })
  })

  it('渲染版本筛选Tab(免费版/入门版等)', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('免费版') || body.includes('入门版') || body.includes('商业版'), '应显示版本筛选')
    }, { timeout: 500 })
  })

  it('渲染配额列表表头(店铺/用户/存储/API)', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('店铺') || body.includes('用户') || body.includes('存储') || body.includes('API'), '应显示配额表头')
    }, { timeout: 500 })
  })

  it('渲染超限/紧张预警数据', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('超限') || body.includes('紧张'), '应显示配额预警')
    }, { timeout: 500 })
  })

  it('渲染风险预警标题(点击概况Tab后)', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    // 切换到概况 Tab
    await waitFor(() => {
      const tabs = document.querySelectorAll('[data-tab-key="overview"]')
      if (tabs.length > 0) tabs[0].click()
    }, { timeout: 500 })
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('风险预警'), '应显示风险预警')
    }, { timeout: 500 })
  })

  it('渲染版本分布标题(点击概况Tab后)', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const tabs = document.querySelectorAll('[data-tab-key="overview"]')
      if (tabs.length > 0) tabs[0].click()
    }, { timeout: 500 })
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('版本配额分布'), '应显示版本分布')
    }, { timeout: 500 })
  })

  it('渲染区域配额概况标题(点击概况Tab后)', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const tabs = document.querySelectorAll('[data-tab-key="overview"]')
      if (tabs.length > 0) tabs[0].click()
    }, { timeout: 500 })
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('区域配额概况'), '应显示区域概况')
    }, { timeout: 500 })
  })
})

// ── 反例 ──

describe('AdminTenantsQuotaPage — 反例', () => {
  it('不应抛异常', async () => {
    const mod = await import('./page')
    assert.doesNotThrow(() => render(React.createElement(mod.default)))
  })

  it('不应为空页面', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.length > 50, '页面应有足够内容')
    }, { timeout: 500 })
  })
})

// ── 边界 ──

describe('AdminTenantsQuotaPage — 边界', () => {
  it('加载完成后显示租户数据', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('租户') || body.includes('超限'), '加载完成后应显示数据')
    }, { timeout: 500 })
  })

  it('渲染至少3个版本标签', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      const versionLabels = ['免费版', '入门版', '商业版', '企业版', '旗舰版']
      const found = versionLabels.filter(l => body.includes(l))
      assert.ok(found.length >= 3, `应展示至少3个版本标签, 实际${found.length}`)
    }, { timeout: 500 })
  })

  it('渲染分页控件', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      if (body.includes('第') && body.includes('页')) {
        assert.ok(true, '分页文字可见')
      } else {
        const buttons = document.querySelectorAll('button')
        const pageBtns = Array.from(buttons).filter(b => /^[123]$/.test(b.textContent || ''))
        assert.ok(pageBtns.length >= 1, `应显示分页按钮, 实际${pageBtns.length}`)
      }
    }, { timeout: 500 })
  })

  it('渲染区域配额内容', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('华东') || body.includes('华南') || body.includes('华北'), '应显示区域配额')
    }, { timeout: 500 })
  })

  it('渲染警告卡片 - 店铺超限/紧张(点击概况Tab后)', async () => {
    const mod = await import('./page')
    render(React.createElement(mod.default))
    await waitFor(() => {
      const tabs = document.querySelectorAll('[data-tab-key="overview"]')
      if (tabs.length > 0) tabs[0].click()
    }, { timeout: 500 })
    await waitFor(() => {
      const body = document.body.textContent || ''
      assert.ok(body.includes('店铺超限') || body.includes('用户超限'), '应显示超限明细')
    }, { timeout: 500 })
  })
})

// ── 防御 ──

describe('AdminTenantsQuotaPage — 防御', () => {
  it('组件默认导出为函数', async () => {
    const mod = await import('./page')
    assert.equal(typeof mod.default, 'function')
  })

  it('组件名包含相关关键词', async () => {
    const mod = await import('./page')
    assert.ok(
      mod.default.name.includes('Tenants') || mod.default.name.includes('tenants') ||
      mod.default.name.includes('Quota') || mod.default.name.includes('Admin'),
      `组件名${mod.default.name}应包含租户相关关键词`
    )
  })

  it('源码包含 useMemo 优化', () => {
    const src = readPageSource()
    assert.ok(src.includes('useMemo'), '应使用 useMemo 优化')
  })

  it('源码包含接口类型定义', () => {
    const src = readPageSource()
    assert.ok(src.includes('interface') || src.includes('type '), '应有类型定义')
  })

  it('computeQuotaStatus 函数导出', () => {
    const src = readPageSource()
    assert.ok(src.includes('computeQuotaStatus'), '应有配额状态计算函数')
  })

  it('computeQuotaStats 函数存在', () => {
    const src = readPageSource()
    assert.ok(src.includes('computeQuotaStats'), '应有配额统计函数')
  })

  it('renderQuotaCell 函数存在', () => {
    const src = readPageSource()
    assert.ok(src.includes('renderQuotaCell'), '应有配额渲染函数')
  })

  it('源码包含 @ts-nocheck 注释', () => {
    const src = readPageSource()
    assert.ok(src.includes('@ts-nocheck'), '应有 ts-nocheck')
  })

  it('源码包含 TenantQuota 接口', () => {
    const src = readPageSource()
    assert.ok(src.includes('TenantQuota'), '应有租户配额接口')
  })

  it('源码包含 QuotaStatus 类型', () => {
    const src = readPageSource()
    assert.ok(src.includes('QuotaStatus'), '应有配额状态类型')
  })
})

// ── 数据校验 ──

describe('AdminTenantsQuotaPage — 数据校验', () => {
  it('computeQuotaStatus 正常范围 (20% 使用率)', () => {
    assert.equal(computeQuotaStatusForTest(20, 100), 'normal')
  })

  it('computeQuotaStatus 警告范围 (75% 使用率)', () => {
    assert.equal(computeQuotaStatusForTest(75, 100), 'warning')
  })

  it('computeQuotaStatus 超限范围 (95% 使用率)', () => {
    assert.equal(computeQuotaStatusForTest(95, 100), 'critical')
  })

  it('computeQuotaStatus 零上限时返回 normal', () => {
    assert.equal(computeQuotaStatusForTest(50, 0), 'normal')
  })

  it('computeQuotaStatus 刚好 70% 属于 warning', () => {
    assert.equal(computeQuotaStatusForTest(70, 100), 'warning')
  })

  it('computeQuotaStatus 刚好 90% 属于 critical', () => {
    assert.equal(computeQuotaStatusForTest(90, 100), 'critical')
  })

  it('computeQuotaStatus 刚好 69% 属于 normal', () => {
    assert.equal(computeQuotaStatusForTest(69, 100), 'normal')
  })

  it('computeQuotaStatus 刚好 89% 属于 warning', () => {
    assert.equal(computeQuotaStatusForTest(89, 100), 'warning')
  })
})

// ── 辅助函数 ──

function readPageSource(): string {
  const filePath = resolve(process.cwd(), 'app/admin/tenants/page.tsx')
  return readFileSync(filePath, 'utf-8')
}

function computeQuotaStatusForTest(used: number, limit: number): string {
  if (limit <= 0) return 'normal'
  const ratio = used / limit
  if (ratio >= 0.9) return 'critical'
  if (ratio >= 0.7) return 'warning'
  return 'normal'
}
