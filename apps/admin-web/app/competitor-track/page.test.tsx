import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'competitor-track-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'competitor-track-data.ts'), 'utf-8')

describe('competitor-track 结构固证', () => {
  it('page 应切为 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCompetitorTrackSnapshot()'))
    assert.ok(PAGE_SRC.includes('<CompetitorTrackClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'competitor-track:read'"))
  })

  it('client 应保留 router.refresh 和筛选交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('filterCompetitors('))
    assert.ok(CLIENT_SRC.includes('查看详情'))
    assert.ok(CLIENT_SRC.includes('刷新快照'))
  })

  it('data 应定义 mock 快照合同与竞品样本', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'competitor-track-mock'"))
    assert.ok(DATA_SRC.includes('DEFAULT_COMPETITORS'))
    assert.ok(DATA_SRC.includes('loadCompetitorTrackSnapshot'))
  })
})
