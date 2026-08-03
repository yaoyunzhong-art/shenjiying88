import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  buildMockMember,
  buildPointRecords,
  loadMemberDetailPageSnapshot,
} from './[id]/member-detail-data'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, '[id]/page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, '[id]/member-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, '[id]/member-detail-data.ts'), 'utf-8')

describe('Member detail route contract', () => {
  it('快照应返回 fallback 来源态证据', async () => {
    const snapshot = await loadMemberDetailPageSnapshot('m-001')
    assert.equal(snapshot.deliveryMode, 'fallback')
    assert.equal(snapshot.sourceLabel, 'member-detail-fallback-snapshot')
    assert.equal(snapshot.member.memberNo, 'M5-m-001')
    assert.equal(snapshot.points.length > 0, true)
  })

  it('样本工厂应稳定输出会员与积分记录', () => {
    assert.equal(buildMockMember('m-002').memberNo, 'M5-m-002')
    assert.equal(buildPointRecords()[0]?.id, 'PT-1')
  })

  it('page 应为 server wrapper 并消费 snapshot loader', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMemberDetailPageSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<MemberDetailClient snapshot={snapshot} />'))
  })

  it('client 与 data 应固化刷新和详情合同', () => {
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('WorkspaceBreadcrumb'))
    assert.ok(DATA_SRC.includes('export interface MemberDetailPageSnapshot'))
    assert.ok(DATA_SRC.includes('buildRechargeRecords'))
  })
})
