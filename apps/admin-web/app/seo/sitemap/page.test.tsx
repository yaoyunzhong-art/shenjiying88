import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8')
const DATA_SRC = readFileSync(resolve(DIR, 'sitemap-data.ts'), 'utf-8')
const CLIENT_SRC = readFileSync(resolve(DIR, 'sitemap-client.tsx'), 'utf-8')

describe('seo/sitemap 结构固证', () => {
  it('page 应为 server wrapper 并加载 sitemap 快照', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('loadSitemapSnapshot'))
    assert.ok(PAGE_SRC.includes('<SitemapClient snapshot={snapshot} />'))
    assert.ok(PAGE_SRC.includes("requiredPermission: 'dashboard:read'"))
  })

  it('page 应显式透出来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('控制面来源:'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
  })

  it('data loader 应定义 sitemap 快照合同与频率汇总', () => {
    assert.ok(DATA_SRC.includes('export interface SitemapSnapshotDelivery'))
    assert.ok(DATA_SRC.includes('SITEMAP_ROWS'))
    assert.ok(DATA_SRC.includes('countByFrequency'))
    assert.ok(DATA_SRC.includes('dailyCount'))
    assert.ok(DATA_SRC.includes('loadSitemapSnapshot'))
  })

  it('client renderer 应保留频率筛选、优先级渲染与刷新能力', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('每日'))
    assert.ok(CLIENT_SRC.includes('每周'))
    assert.ok(CLIENT_SRC.includes('每月'))
    assert.ok(CLIENT_SRC.includes('row.priority.toFixed(1)'))
  })
})
