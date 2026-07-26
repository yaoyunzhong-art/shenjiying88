import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

let PAGE_SRC = ''
let CLIENT_SRC = ''
let DATA_SRC = ''

beforeEach(() => {
  PAGE_SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8')
  CLIENT_SRC = readFileSync(resolve(__dirname, 'member-config-client.tsx'), 'utf-8')
  DATA_SRC = readFileSync(resolve(__dirname, 'member-config-data.ts'), 'utf-8')
})

describe('MemberConfigPage — 服务端壳层', () => {
  it('页面应为 async server component', () => {
    assert.ok(PAGE_SRC.includes('export default async function MemberConfigPage'))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('页面应展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('const snapshot = await loadMemberConfigSnapshot()'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })
})

describe('MemberConfigData — 快照合同', () => {
  it('应定义 mock 快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes('config: MemberConfig'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留会员配置样本', () => {
    assert.ok(DATA_SRC.includes('DEFAULT_MEMBER_CONFIG'))
    assert.ok(DATA_SRC.includes('phoneUniqueScope'))
    assert.ok(DATA_SRC.includes('crossTenantEnabled'))
  })
})

describe('MemberConfigClient — 客户端渲染层', () => {
  it('应声明 use client 并触发 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('应保留积分、等级、生命周期和变更原因区块', () => {
    assert.ok(CLIENT_SRC.includes('积分比例'))
    assert.ok(CLIENT_SRC.includes('等级阈值'))
    assert.ok(CLIENT_SRC.includes('生命周期'))
    assert.ok(CLIENT_SRC.includes('变更原因'))
    assert.ok(CLIENT_SRC.includes('保存配置'))
  })
})
