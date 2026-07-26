import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

import {
  CATEGORY_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_BADGE_VARIANT,
  STATUS_FLOW_OPTIONS,
  STATUS_LABELS,
  formatDate,
  loadAnnouncementDetailSnapshot,
  normalizeAnnouncementDetailParam,
} from './announcement-detail-data'

const PAGE_SRC = fs.readFileSync(require.resolve('./page'), 'utf-8')
const CLIENT_SRC = fs.readFileSync(
  require.resolve('./announcement-detail-client'),
  'utf-8',
)

test('normalizeAnnouncementDetailParam 兼容 string 与 string[]', () => {
  assert.equal(normalizeAnnouncementDetailParam('a1'), 'a1')
  assert.equal(normalizeAnnouncementDetailParam(['a1', 'a2']), 'a1')
  assert.equal(normalizeAnnouncementDetailParam(undefined), '')
})

test('公告详情常量映射保持完整', () => {
  assert.equal(CATEGORY_LABELS.system, '系统通知')
  assert.equal(STATUS_LABELS.published, '已发布')
  assert.equal(PRIORITY_LABELS.high, '高')
  assert.equal(PRIORITY_COLORS.high, '#ef4444')
  assert.equal(STATUS_BADGE_VARIANT.archived, 'warning')
})

test('STATUS_FLOW_OPTIONS 只允许草稿发布与发布归档', () => {
  assert.deepEqual(STATUS_FLOW_OPTIONS, [
    { from: 'draft', to: 'published', label: '发布' },
    { from: 'published', to: 'archived', label: '归档' },
  ])
})

test('formatDate 兼容空值与非法值', () => {
  assert.equal(formatDate('2026-07-05'), '2026-07-05')
  assert.equal(formatDate(''), '-')
  assert.equal(formatDate('invalid-date'), 'invalid-date')
})

test('loadAnnouncementDetailSnapshot 命中样本时返回详情快照', async () => {
  const snapshot = await loadAnnouncementDetailSnapshot('a1')

  assert.equal(snapshot.notFound, false)
  assert.equal(snapshot.sourceLabel, 'local-announcement-detail-snapshot')
  assert.equal(snapshot.announcement?.id, 'a1')
  assert.ok(snapshot.announcement?.content.includes('核心数据库'))
})

test('loadAnnouncementDetailSnapshot 未命中样本时保留 requestedId', async () => {
  const snapshot = await loadAnnouncementDetailSnapshot('missing-id')

  assert.equal(snapshot.notFound, true)
  assert.equal(snapshot.requestedId, 'missing-id')
  assert.equal(snapshot.announcement, null)
  assert.ok(snapshot.generatedAt.length > 0)
})

test('announcements/[id]/page.tsx 固证 server wrapper 与来源态证据', () => {
  assert.match(PAGE_SRC, /export const dynamic = 'force-dynamic'/)
  assert.match(PAGE_SRC, /loadAnnouncementDetailSnapshot/)
  assert.match(PAGE_SRC, /AnnouncementDetailClient/)
  assert.match(PAGE_SRC, /const sourceEvidence = \{/)
  assert.match(
    PAGE_SRC,
    /refreshPath: 'AnnouncementDetailPage -> loadAnnouncementDetailSnapshot'/,
  )
})

test('announcement-detail-client.tsx 固证 client renderer 与刷新动作', () => {
  assert.match(CLIENT_SRC, /'use client'/)
  assert.match(CLIENT_SRC, /useRouter\(\)/)
  assert.match(CLIENT_SRC, /router\.refresh\(/)
  assert.match(CLIENT_SRC, /客户端演练/)
  assert.match(CLIENT_SRC, /FormSubmitFeedback/)
})
