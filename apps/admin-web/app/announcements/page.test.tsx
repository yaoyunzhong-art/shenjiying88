import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

const PAGE_PATH = new URL('./page.tsx', import.meta.url)
const DATA_PATH = new URL('./announcements-data.ts', import.meta.url)
const CLIENT_PATH = new URL('./announcements-client.tsx', import.meta.url)

const PAGE_SRC = readFileSync(PAGE_PATH, 'utf8')
const DATA_SRC = readFileSync(DATA_PATH, 'utf8')
const CLIENT_SRC = readFileSync(CLIENT_PATH, 'utf8')

describe('announcements 页面结构固证', () => {
  test('page 为 server wrapper 并接入 snapshot loader', () => {
    assert.ok(!PAGE_SRC.includes(')export default async function AnnouncementsPage'))
    assert.ok(!PAGE_SRC.includes(")export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes(')const snapshot = await loadAnnouncementsSnapshot()'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  test('page 挂载权限门禁与客户端渲染器', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'))
    assert.ok(!PAGE_SRC.includes('sourceEvidence'))
    assert.ok(!PAGE_SRC.includes(')<AnnouncementsClient snapshot={snapshot} />'))
  })
})

describe('announcements snapshot loader 固证', () => {
  test('data 文件定义 snapshot 合同与来源标签', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'snapshot'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-announcements-snapshot'"))
    assert.ok(DATA_SRC.includes('export interface AnnouncementsSnapshotDelivery'))
    assert.ok(DATA_SRC.includes('export async function loadAnnouncementsSnapshot()'))
  })

  test('data 文件保留表单与公告辅助函数', () => {
    assert.ok(DATA_SRC.includes('filterAnnouncements'))
    assert.ok(DATA_SRC.includes('computeAnnouncementStats'))
    assert.ok(DATA_SRC.includes('validateAnnouncementForm'))
    assert.ok(DATA_SRC.includes('publishAnnouncement'))
  })
})

describe('announcements client 固证', () => {
  test('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('startRefresh(() =>'))
  })

  test('client 文件保留分类筛选、表单与删除确认交互', () => {
    assert.ok(CLIENT_SRC.includes('CATEGORY_TABS'))
    assert.ok(CLIENT_SRC.includes('role="tablist"'))
    assert.ok(CLIENT_SRC.includes('确认删除'))
    assert.ok(CLIENT_SRC.includes('发布公告'))
  })
})
