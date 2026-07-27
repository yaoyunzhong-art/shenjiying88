import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(import.meta.dirname, 'deploy-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'deploy-client.tsx'), 'utf-8')

describe('dev-tools/deploy page', () => {
  it('page 已迁移为 E54 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes("import { loadDeploySnapshot } from './deploy-data'"))
    assert.ok(PAGE_SRC.includes('<DeployClient snapshot={snapshot} />'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
  })

  it('data 固证 mock 来源', () => {
    assert.ok(DATA_SRC.includes('export async function loadDeploySnapshot'))
    assert.ok(DATA_SRC.includes("sourceLabel: 'dev-tools-deploy-mock'"))
    assert.ok(DATA_SRC.includes('deployments: DEPLOYS'))
    assert.ok(DATA_SRC.includes('envOptions: ENV_OPTIONS'))
  })

  it('client 保留筛选、弹窗与刷新交互', () => {
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('envFilter'))
    assert.ok(CLIENT_SRC.includes('Modal'))
    assert.ok(CLIENT_SRC.includes('成功率'))
  })
})
