import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'configuration-operation-detail-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'configuration-operation-detail-data.ts'), 'utf-8')
})

describe('ConfigurationOperationDetailPage — 服务端壳层', () => {
  it('应解析 operation 并加载 no-store 快照', () => {
    assert.ok(PAGE_SRC.includes('readConfigurationOperationDetailParam'))
    assert.ok(PAGE_SRC.includes("const snapshot = await loadConfigurationOperationDetailPageSnapshot(operation ?? '')"))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })

  it('应渲染来源态证据和客户端详情组件', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('<ConfigurationOperationDetailClient snapshot={snapshot.detail} />'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
  })
})

describe('ConfigurationOperationDetailData — 快照合同', () => {
  it('应通过 view-model loader 构建详情快照', () => {
    assert.ok(
      DATA_SRC.includes("const detail = await loadConfigurationOperationDetail(operation, { cache: 'no-store' })")
    )
    assert.ok(DATA_SRC.includes("sourceLabel: `configuration-operation-detail:${detail.deliveryMode}`"))
  })
})

describe('ConfigurationOperationDetailClient — 客户端展示层', () => {
  it('应保留状态 badge、闭环跳转与相关操作表格', () => {
    assert.ok(CLIENT_SRC.includes('StatusBadge'))
    assert.ok(CLIENT_SRC.includes('DetailClosureBar'))
    assert.ok(CLIENT_SRC.includes('DataTable'))
  })
})
