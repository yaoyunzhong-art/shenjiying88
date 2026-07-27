import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'security-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'security-data.ts'), 'utf-8')

describe('stores/[id]/security/page.tsx 结构固证', () => {
  it('page 应为 server wrapper 并加载安防快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function SecurityPage'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSecuritySnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<SecurityClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'store:read'"))
  })
})

describe('stores/[id]/security/client 结构固证', () => {
  it('client 应保留筛选、详情与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('useMemo'))
    assert.ok(CLIENT_SRC.includes('setDetailModal'))
    assert.ok(CLIENT_SRC.includes('视频监控'))
    assert.ok(CLIENT_SRC.includes('告警详情'))
  })
})

describe('stores/[id]/security/data 结构固证', () => {
  it('data 应定义安防快照合同与样本数据', () => {
    assert.ok(DATA_SRC.includes('export interface SecuritySnapshot'))
    assert.ok(DATA_SRC.includes('SECURITY_ALERTS'))
    assert.ok(DATA_SRC.includes('buildSecuritySummary'))
    assert.ok(DATA_SRC.includes('loadSecuritySnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'store-security-mock'"))
  })
})
