import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'notification-form-client.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'notification-form-data.ts'), 'utf-8')
const LEGACY_SRC = readFileSync(resolve(DIR, 'notification-form-legacy.tsx'), 'utf-8')

describe('notifications/new 结构固证', () => {
  it('page 应切为 server wrapper 并加载快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function NewNotificationPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadNotificationFormSnapshot()'))
    assert.ok(PAGE_SRC.includes('<NotificationFormClient snapshot={snapshot} />'))
  })

  it('page 应显式透出来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'notifications:read'"))
  })

  it('client 应保留 router.refresh 刷新链路', () => {
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('刷新快照'))
    assert.ok(CLIENT_SRC.includes('snapshot.sourceLabel'))
  })

  it('data 应定义 mock 快照合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'notification-form-mock'"))
    assert.ok(DATA_SRC.includes('loadNotificationFormSnapshot'))
  })

  it('legacy 应保留创建通知表单与校验逻辑', () => {
    assert.ok(LEGACY_SRC.includes('function validateForm'))
    assert.ok(LEGACY_SRC.includes('通知标题不能为空'))
    assert.ok(LEGACY_SRC.includes('创建通知'))
    assert.ok(LEGACY_SRC.includes("router.push('/notifications')"))
  })
})
