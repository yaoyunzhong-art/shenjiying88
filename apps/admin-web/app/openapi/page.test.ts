import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'openapi-data.ts'), 'utf-8')
})

describe('OpenApiWorkbenchPage — 服务端壳层冒烟', () => {
  it('应为 async server component 并强制使用动态快照', () => {
    assert.ok(PAGE_SRC.includes('export default async function OpenApiWorkbenchPage'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('应加载治理快照并展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadOpenApiWorkbenchSnapshot()'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })

  it('应挂载权限门禁与客户端渲染器', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
    assert.ok(PAGE_SRC.includes("import OpenApiWorkbenchClient from './openapi-client'"))
    assert.ok(PAGE_SRC.includes('<OpenApiWorkbenchClient snapshot={snapshot} />'))
  })
})

describe('OpenApiWorkbenchData — 快照合同冒烟', () => {
  it('应定义 snapshot 合同与状态映射', () => {
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-openapi-workbench-snapshot'"))
    assert.ok(DATA_SRC.includes('export interface OpenApiWorkbenchSnapshotDelivery'))
    assert.ok(DATA_SRC.includes('export const STATUS_COLOR'))
    assert.ok(DATA_SRC.includes('export const ENV_COLOR'))
  })

  it('应保留签名与脱敏工具', () => {
    assert.ok(DATA_SRC.includes('export function maskPII'))
    assert.ok(DATA_SRC.includes('export function buildCanonicalString'))
    assert.ok(DATA_SRC.includes('export function verifySignatureWindow'))
    assert.ok(DATA_SRC.includes('timestamp_out_of_window'))
    assert.ok(DATA_SRC.includes('***MASKED***'))
  })

  it('应保留本地治理样本数据', () => {
    assert.ok(DATA_SRC.includes('/api/orders'))
    assert.ok(DATA_SRC.includes('order.created'))
    assert.ok(DATA_SRC.includes('持久失败，已达 5 次重试上限'))
    assert.ok(DATA_SRC.includes("status: 'EXPIRED'"))
    assert.ok(DATA_SRC.includes('totalUsageToday: 1245'))
  })
})
