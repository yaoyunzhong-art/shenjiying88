import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'workflow-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'workflow-data.ts'), 'utf-8')
})

describe('WorkflowPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function WorkflowPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应加载 workflow 快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadWorkflowSnapshot()'))
    assert.ok(PAGE_SRC.includes("import { loadWorkflowSnapshot } from './workflow-data'"))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应展示来源态证据与权限门禁', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('sourceLabel: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'))
    assert.ok(PAGE_SRC.includes('refreshPath: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })
})

describe('WorkflowData — 快照合同', () => {
  it('应定义 fallback 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'workflow-fallback'"))
    assert.ok(DATA_SRC.includes('configs: WorkflowConfigItem[]'))
    assert.ok(DATA_SRC.includes('nodeTypes: WorkflowNodeType[]'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留流程样本、节点类型与治理备注', () => {
    assert.ok(DATA_SRC.includes('当前版本'))
    assert.ok(DATA_SRC.includes('开始'))
    assert.ok(DATA_SRC.includes('等待'))
    assert.ok(DATA_SRC.includes('DEFAULT_WORKFLOW_GOVERNANCE_NOTES'))
    assert.ok(DATA_SRC.includes('fallback 样本'))
  })
})

describe('WorkflowClient — 客户端渲染层', () => {
  it('客户端应声明 use client 并支持 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes('"use client"'))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('客户端应保留采购审批流、节点类型与治理备注', () => {
    assert.ok(CLIENT_SRC.includes('示例流程: 采购审批'))
    assert.ok(CLIENT_SRC.includes('节点类型'))
    assert.ok(CLIENT_SRC.includes('治理备注'))
    assert.ok(CLIENT_SRC.includes('nodeTypes.map'))
  })
})
