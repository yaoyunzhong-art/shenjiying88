import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'executions-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'executions-data.ts'), 'utf-8')
})

describe('RuleExecutionsPage — 服务端壳层', () => {
  it('应加载执行快照并展示来源态', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadRuleExecutionsSnapshot()'))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('RuleExecutionsData — 快照合同', () => {
  it('应定义默认执行样本与统计函数', () => {
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-rule-executions-snapshot'"))
    assert.ok(DATA_SRC.includes('export const defaultRuleExecutions'))
    assert.ok(DATA_SRC.includes('信用评分规则'))
    assert.ok(DATA_SRC.includes('export function computeExecutionStats'))
  })
})

describe('RuleExecutionsClient — 客户端渲染层', () => {
  it('应支持 router.refresh 与筛选器', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
    assert.ok(CLIENT_SRC.includes('statusFilter'))
    assert.ok(CLIENT_SRC.includes('timeRange'))
    assert.ok(CLIENT_SRC.includes('搜索执行 ID / 规则名 / 触发源'))
  })

  it('应保留详情跳转', () => {
    assert.ok(CLIENT_SRC.includes('href={`/rules/executions/${item.id}`}'))
    assert.ok(CLIENT_SRC.includes('查看详情'))
  })
})
