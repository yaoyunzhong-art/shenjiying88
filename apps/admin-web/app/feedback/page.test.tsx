import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'feedback-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'feedback-data.ts'), 'utf-8')
})

describe('FeedbackPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function FeedbackPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载反馈快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadFeedbackSnapshot()'))
    assert.ok(PAGE_SRC.includes("import FeedbackClient from './feedback-client'"))
    assert.ok(PAGE_SRC.includes('<FeedbackClient snapshot={snapshot} />'))
  })

  it('页面应导出 dynamic 与 revalidate', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })
})

describe('FeedbackPage — 来源态透明化', () => {
  it('页面应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('应固证本地反馈快照来源', () => {
    assert.ok(!PAGE_SRC.includes('loadFeedbackSnapshot -> defaultFeedbacks snapshot'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(PAGE_SRC.includes('local customer feedback sample snapshot records'))
    assert.ok(PAGE_SRC.includes('不可作为闭环复签证据'))
  })
})

describe('FeedbackData — 快照合同', () => {
  it('应定义 snapshot 合同和来源标签', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'snapshot'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-feedback-snapshot'"))
    assert.ok(DATA_SRC.includes('feedbacks: FeedbackItem[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留 reply tab、过滤与统计辅助函数', () => {
    assert.ok(DATA_SRC.includes('export const REPLY_TABS'))
    assert.ok(DATA_SRC.includes('export function applyReplyTab'))
    assert.ok(DATA_SRC.includes('export function filterFeedbackItems'))
    assert.ok(DATA_SRC.includes('export function computeFeedbackStats'))
  })

  it('应提供默认反馈快照样本', () => {
    assert.ok(DATA_SRC.includes('export const defaultFeedbacks'))
    assert.ok(DATA_SRC.includes('张三'))
    assert.ok(DATA_SRC.includes('建议增加几台新款娃娃机'))
    assert.ok(DATA_SRC.includes('请问节假日营业时间有调整吗？'))
  })
})

describe('FeedbackClient — 客户端展示层', () => {
  it('客户端组件应声明 use client', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
  })

  it('客户端组件应接收 snapshot 并支持刷新', () => {
    assert.ok(CLIENT_SRC.includes('snapshot: FeedbackSnapshotDelivery'))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes("isRefreshing ? '刷新中...' : '刷新'"))
  })

  it('客户端组件应保留双层 tab、搜索与空态', () => {
    assert.ok(CLIENT_SRC.includes('REPLY_TABS.map'))
    assert.ok(CLIENT_SRC.includes('FEEDBACK_TABS.map'))
    assert.ok(CLIENT_SRC.includes('搜索客户名 / 门店 / 内容'))
    assert.ok(CLIENT_SRC.includes('没有搜索到相关反馈'))
    assert.ok(CLIENT_SRC.includes('重置筛选'))
  })

  it('客户端组件应保留评级与卡片渲染', () => {
    assert.ok(CLIENT_SRC.includes('renderStars'))
    assert.ok(CLIENT_SRC.includes('FeedbackCard'))
    assert.ok(CLIENT_SRC.includes('本月平均评级'))
  })
})
