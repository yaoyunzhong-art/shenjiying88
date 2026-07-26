import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const PAGE_SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const DATA_SRC = readFileSync(new URL('./security-data.ts', import.meta.url), 'utf8')
const CLIENT_SRC = readFileSync(new URL('./security-client.tsx', import.meta.url), 'utf8')

describe('settings/security 页面结构固证', () => {
  it('page 为 server wrapper 并加载快照', () => {
    assert.ok(PAGE_SRC.includes('export default async function SecurityPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadSecuritySnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('page 显式展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })
})

describe('settings/security snapshot loader 固证', () => {
  it('data 文件定义 mock 快照合同与来源标签', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'mock'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-security-policy-snapshot'"))
    assert.ok(DATA_SRC.includes('export interface SecuritySnapshotDelivery'))
    assert.ok(DATA_SRC.includes('export async function loadSecuritySnapshot()'))
  })

  it('data 文件保留密码、登录和合规样本', () => {
    assert.ok(DATA_SRC.includes('defaultPasswordPolicies'))
    assert.ok(DATA_SRC.includes('defaultLoginProtections'))
    assert.ok(DATA_SRC.includes('defaultComplianceItems'))
    assert.ok(DATA_SRC.includes('IP 白名单（未配置）'))
  })
})

describe('settings/security client 固证', () => {
  it('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('client 文件保留密码策略、登录保护和合规渲染', () => {
    assert.ok(CLIENT_SRC.includes('密码策略'))
    assert.ok(CLIENT_SRC.includes('登录保护'))
    assert.ok(CLIENT_SRC.includes('安全合规要求'))
    assert.ok(CLIENT_SRC.includes('snapshot.complianceItems.map'))
  })
})
