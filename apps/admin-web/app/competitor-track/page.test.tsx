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
  it('page 应切为最小 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCompetitorTrackSnapshot()'))
    assert.ok(PAGE_SRC.includes('<CompetitorTrackClient snapshot={snapshot} />'))
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'))
  })

  it('client 应保留 router.refresh 和筛选交互', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
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
