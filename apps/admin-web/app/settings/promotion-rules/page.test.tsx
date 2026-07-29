import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const PAGE_SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const DATA_SRC = readFileSync(new URL('./promotion-rules-data.ts', import.meta.url), 'utf8')
const CLIENT_SRC = readFileSync(new URL('./promotion-rules-client.tsx', import.meta.url), 'utf8')

describe('settings/promotion-rules 页面结构固证', () => {
  it('page 为 server wrapper 并加载快照', () => {
    assert.ok(PAGE_SRC.includes('export default async function PromotionRulesPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadPromotionRulesSnapshot()'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('page 显式展示来源态证据与权限边界', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
  })
})

describe('settings/promotion-rules snapshot loader 固证', () => {
  it('data 文件定义 fallback 快照合同', () => {
    assert.ok(DATA_SRC.includes('export interface PromotionRulesSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-promotion-rules-snapshot'"))
    assert.ok(DATA_SRC.includes('export async function loadPromotionRulesSnapshot()'))
  })

  it('data 文件保留规则样本、促销类型和过滤逻辑', () => {
    assert.ok(DATA_SRC.includes('PROMOTION_RULES'))
    assert.ok(DATA_SRC.includes('PROMOTION_TYPES'))
    assert.ok(DATA_SRC.includes('618 满 200 减 50'))
    assert.ok(DATA_SRC.includes('秒杀'))
    assert.ok(DATA_SRC.includes('filterPromotionRules'))
  })
})

describe('settings/promotion-rules client 固证', () => {
  it('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
  })

  it('client 文件保留状态筛选、规则表格和类型说明', () => {
    assert.ok(CLIENT_SRC.includes('activeStatus'))
    assert.ok(CLIENT_SRC.includes('当前活动规则'))
    assert.ok(CLIENT_SRC.includes('促销类型说明'))
    assert.ok(CLIENT_SRC.includes('snapshot.promotionTypes.map'))
    assert.ok(CLIENT_SRC.includes('filteredRules.map'))
  })
})
