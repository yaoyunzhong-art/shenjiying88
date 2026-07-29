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
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
  })

  it('页面应区分 api 与 fallback 来源说明', () => {
    assert.ok(
      PAGE_SRC.includes('loadMemberConfigSnapshot -> api/member/config + api/member/config/history')
    )
    assert.ok(
      PAGE_SRC.includes(
        'loadMemberConfigSnapshot -> DEFAULT_MEMBER_CONFIG + DEFAULT_MEMBER_CONFIG_HISTORY'
      )
    )
  })
})

describe('MemberConfigData — 快照合同', () => {
  it('应定义接近真实 API 的快照结构', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'member-config-api' | 'member-config-fallback'"))
    assert.ok(DATA_SRC.includes('config: MemberConfig'))
    assert.ok(DATA_SRC.includes('historyCount: number'))
    assert.ok(DATA_SRC.includes('lastChangedAt: string'))
    assert.ok(DATA_SRC.includes('generatedAt: string'))
  })

  it('应保留会员配置样本', () => {
    assert.ok(DATA_SRC.includes('DEFAULT_MEMBER_CONFIG'))
    assert.ok(DATA_SRC.includes('DEFAULT_MEMBER_CONFIG_HISTORY'))
    assert.ok(DATA_SRC.includes('phoneUniqueScope'))
    assert.ok(DATA_SRC.includes('crossTenantEnabled'))
  })
})

describe('MemberConfigClient — 客户端渲染层', () => {
  it('应声明 use client 并触发 router.refresh', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()")), "E54: router.refresh() OR handleRefresh()")
  })

  it('应保留积分、等级、生命周期和变更原因区块，并展示最近变更证据', () => {
    assert.ok(CLIENT_SRC.includes('积分比例'))
    assert.ok(CLIENT_SRC.includes('等级阈值'))
    assert.ok(CLIENT_SRC.includes('生命周期'))
    assert.ok(CLIENT_SRC.includes('变更原因'))
    assert.ok(CLIENT_SRC.includes('保存配置'))
    assert.ok(CLIENT_SRC.includes('最近变更'))
    assert.ok(CLIENT_SRC.includes('snapshot.sourceLabel'))
  })
})
