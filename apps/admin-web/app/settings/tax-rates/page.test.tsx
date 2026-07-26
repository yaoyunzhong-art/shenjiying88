import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'tax-rates-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'tax-rates-data.ts'), 'utf-8')
})

describe('TaxRatesPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function TaxRatesPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 tax-rates 快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadTaxRatesSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadTaxRatesSnapshot } from './tax-rates-data'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应展示来源态证据与权限门禁', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('sourceLabel: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('refreshPath: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })
})

describe('TaxRatesData — 快照合同', () => {
  it('应定义 fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'tax-rates-fallback'"))
    assert.ok(DATA_SRC.includes('rates: TaxRatePreview[]'))
    assert.ok(DATA_SRC.includes('rules: TaxRuleItem[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留税率样本与税务规则', () => {
    assert.ok(DATA_SRC.includes('食品饮料'))
    assert.ok(DATA_SRC.includes('电子产品'))
    assert.ok(DATA_SRC.includes('服务费'))
    assert.ok(DATA_SRC.includes('计税方式'))
    assert.ok(DATA_SRC.includes('fallback 样本'))
  })
})

describe('TaxRatesClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('客户端应保留品类税率表、税务规则与提示信息', () => {
    assert.ok(CLIENT_SRC.includes('品类税率表'))
    assert.ok(CLIENT_SRC.includes('税务规则'))
    assert.ok(CLIENT_SRC.includes('温馨提示'))
    assert.ok(CLIENT_SRC.includes('rates.map'))
  })
})
