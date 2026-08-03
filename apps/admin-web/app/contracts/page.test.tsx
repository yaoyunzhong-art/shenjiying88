import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'contracts-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(import.meta.dirname, 'contracts-data.ts'), 'utf-8')
})

describe('ContractsPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function ContractsPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应读取 contracts 快照并导出动态配置', () => {
    assert.ok(PAGE_SRC.includes("import { loadContractsSnapshot } from './contracts-data'"))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadContractsSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
  })

  it('页面应展示来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('sourceLabel: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('/api/contracts 代理写链路'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })
})

describe('ContractsData — 快照与真实读写优先合同', () => {
  it('应定义 api/fallback 快照结构与默认样本', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'contracts-api' | 'contracts-fallback'"))
    assert.ok(DATA_SRC.includes('contracts: ContractRecord[]'))
    assert.ok(DATA_SRC.includes('export const defaultContracts'))
    assert.ok(DATA_SRC.includes('export const CONTRACT_TYPE_LABEL'))
    assert.ok(DATA_SRC.includes('export const CONTRACT_STATUS_LABEL'))
  })

  it('应定义辅助函数与真实 API 写入方法', () => {
    assert.ok(DATA_SRC.includes('formatContractAmount'))
    assert.ok(DATA_SRC.includes('formatContractDate'))
    assert.ok(DATA_SRC.includes('isContractExpiringSoon'))
    assert.ok(DATA_SRC.includes('signContractViaApi'))
    assert.ok(DATA_SRC.includes('updateContractCommentViaApi'))
    assert.ok(DATA_SRC.includes('loadContractsSnapshot'))
  })
})

describe('ContractsClient — 客户端交互层', () => {
  it('客户端组件应声明 use client 并支持 refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes('useTransition') || CLIENT_SRC.includes('useSnapshotRefresh') || CLIENT_SRC.includes('isRefreshing')), 'E54: useTransition OR useSnapshotRefresh')
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh")), "E54: router.refresh() OR handleRefresh()")
  })

  it('客户端组件应保留签署、备注和 tab 切换', () => {
    assert.ok(CLIENT_SRC.includes('tabKey'))
    assert.ok(CLIENT_SRC.includes('signContractViaApi'))
    assert.ok(CLIENT_SRC.includes('updateContractCommentViaApi'))
    assert.ok(CLIENT_SRC.includes('签署中...'))
    assert.ok(CLIENT_SRC.includes('提交备注'))
    assert.ok(CLIENT_SRC.includes('snapshot.sourceLabel'))
  })
})
