import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'openapi-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'openapi-data.ts'), 'utf-8')
})

describe('OpenApiWorkbenchClient — 客户端渲染层', () => {
  it('应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })

  it('应保留五个工作台 tab 与指标卡', () => {
    assert.ok(CLIENT_SRC.includes("type TabId = 'keys' | 'webhooks' | 'sandboxes' | 'usage' | 'sign'"))
    assert.ok(CLIENT_SRC.includes('MetricCard'))
    assert.ok(CLIENT_SRC.includes('API Keys'))
    assert.ok(CLIENT_SRC.includes('活跃订阅'))
    assert.ok(CLIENT_SRC.includes('今日调用'))
    assert.ok(CLIENT_SRC.includes('异常数'))
  })

  it('应保留签名验证演练与 PII 脱敏展示', () => {
    assert.ok(CLIENT_SRC.includes('buildCanonicalString'))
    assert.ok(CLIENT_SRC.includes('verifySignatureWindow'))
    assert.ok(CLIENT_SRC.includes("reason: 'missing_fields'"))
    assert.ok(CLIENT_SRC.includes('maskPII'))
    assert.ok(CLIENT_SRC.includes('PII 脱敏演示'))
    assert.ok(CLIENT_SRC.includes('验证签名'))
  })
})

describe('OpenApiWorkbenchData — 工具与样本一致性', () => {
  it('应暴露颜色映射和签名窗口逻辑', () => {
    assert.ok(DATA_SRC.includes('ACTIVE:'))
    assert.ok(DATA_SRC.includes('DEAD_LETTER:'))
    assert.ok(DATA_SRC.includes('LIVE:'))
    assert.ok(DATA_SRC.includes('SANDBOX:'))
    assert.ok(DATA_SRC.includes('5 * 60 * 1000'))
  })

  it('应保留 webhook、dead-letter、sandbox 与 usage 样本', () => {
    assert.ok(DATA_SRC.includes('https://hooks.example.com/orders'))
    assert.ok(DATA_SRC.includes("status: 'DEAD_LETTER'"))
    assert.ok(DATA_SRC.includes("name: 'load-test'"))
    assert.ok(DATA_SRC.includes("endpoint: '/api/payments'"))
  })
})

describe('OpenApiWorkbenchPage — 页面结构补充断言', () => {
  it('应继续从 page 层渲染来源态与 client renderer', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('<OpenApiWorkbenchClient snapshot={snapshot} />'))
  })
})
