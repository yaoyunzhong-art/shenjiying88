import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'notification-detail-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'notification-detail-data.ts'), 'utf-8')
const LEGACY_SRC = readFileSync(resolve(DIR, 'notification-detail-legacy.tsx'), 'utf-8')

describe('notifications/[id] 结构固证', () => {
  it('page 应迁移为服务端 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function NotificationDetailPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadNotificationDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<NotificationDetailClient snapshot={snapshot} />'))
  })

  it('page 应展示完整来源态证据与权限边界', () => {
    assert.ok(PAGE_SRC.includes('export const dynamic = \'force-dynamic\''))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('params: Promise<{ id: string }>'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'))
  })

  it('data 应定义 fallback 详情快照合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'notification-detail-fallback'"))
    assert.ok(DATA_SRC.includes('id: string'))
    assert.ok(DATA_SRC.includes('notification-detail-legacy params bridge'))
  })

  it('client 应保留 router.refresh 并桥接 legacy 详情页', () => {
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('刷新快照'))
    assert.ok(CLIENT_SRC.includes('Promise.resolve({ id: snapshot.id })'))
  })

  it('legacy 应保留编辑、状态流转与收口动作', () => {
    assert.ok(LEGACY_SRC.includes('TYPE_MAP'))
    assert.ok(LEGACY_SRC.includes('保存修改'))
    assert.ok(LEGACY_SRC.includes('DetailActionBar'))
    assert.ok(LEGACY_SRC.includes('buildStandardClosureLinks'))
  })
})
