import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const DATA_SRC = readFileSync(resolve(DIR, 'marketing-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'marketing-client.tsx'), 'utf-8')

describe('stores/[id]/marketing data/client 结构固证', () => {
  it('snapshot loader 应固化 mock 来源态、诊断与刷新合同', () => {
    assert.ok(DATA_SRC.includes('export interface MarketingSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-marketing-mock'"))
    assert.ok(DATA_SRC.includes('diagnostics: MarketingDiagnostic[]'))
    assert.ok(DATA_SRC.includes('controlPlaneSource: string'))
    assert.ok(DATA_SRC.includes('refreshPath: string'))
    assert.ok(DATA_SRC.includes('loadMarketingSnapshot'))
  })

  it('snapshot loader 应保留营销样本与纯计算函数', () => {
    assert.ok(DATA_SRC.includes('MARKETING_CAMPAIGNS'))
    assert.ok(DATA_SRC.includes('MARKETING_COUPONS'))
    assert.ok(DATA_SRC.includes('buildMarketingSummary'))
    assert.ok(DATA_SRC.includes('buildMarketingBreakdown'))
    assert.ok(DATA_SRC.includes('buildMarketingDiagnostics'))
  })

  it('client renderer 应承载交互、诊断与 router.refresh 刷新', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('snapshot.sourceLabel'))
    assert.ok(CLIENT_SRC.includes('snapshot.diagnostics'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes("message.info('当前为 mock 快照"))
    assert.ok(CLIENT_SRC.includes('title="创建营销活动"'))
  })
})
