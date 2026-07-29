import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'execution-detail-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'execution-detail-data.ts'), 'utf-8')
})

describe('RuleExecutionDetailPage — 服务端壳层', () => {
  it('应加载详情快照并渲染客户端组件', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadRuleExecutionDetailSnapshot(id)'))
    assert.ok(PAGE_SRC.includes("import RuleExecutionDetailClient from './execution-detail-client'"))
    assert.ok(PAGE_SRC.includes('<RuleExecutionDetailClient snapshot={snapshot} />'))
  })

  it('应展示来源态证据与详情门禁', () => {
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'rules:executions:id:read'"))
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('RuleExecutionDetailData — 快照合同', () => {
  it('应定义详情 snapshot 合同与样本', () => {
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-rule-execution-detail-snapshot'"))
    assert.ok(DATA_SRC.includes('export const defaultRuleExecutionDetails'))
    assert.ok(DATA_SRC.includes('信用评分规则'))
    assert.ok(DATA_SRC.includes('risk-engine timeout'))
    assert.ok(DATA_SRC.includes("status: 'RUNNING'"))
  })

  it('应提供耗时格式化与详情加载函数', () => {
    assert.ok(DATA_SRC.includes('export function formatExecutionDuration'))
    assert.ok(DATA_SRC.includes('export async function loadRuleExecutionDetailSnapshot'))
    assert.ok(DATA_SRC.includes('if (!execution) return null'))
  })
})

describe('RuleExecutionDetailClient — 客户端渲染层', () => {
  it('应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  })

  it('应保留详情演练动作和关键区块', () => {
    assert.ok(CLIENT_SRC.includes('handleRerun'))
    assert.ok(CLIENT_SRC.includes('handleCancel'))
    assert.ok(CLIENT_SRC.includes('handleDelete'))
    assert.ok(CLIENT_SRC.includes('输入载荷'))
    assert.ok(CLIENT_SRC.includes('输出载荷'))
    assert.ok(CLIENT_SRC.includes('错误详情'))
    assert.ok(CLIENT_SRC.includes('查看关联规则'))
  })
})
