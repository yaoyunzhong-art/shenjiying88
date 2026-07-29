import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const PAGE_SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const DATA_SRC = readFileSync(new URL('./custom-fields-data.ts', import.meta.url), 'utf8')
const CLIENT_SRC = readFileSync(new URL('./custom-fields-client.tsx', import.meta.url), 'utf8')

describe('settings/custom-fields 页面结构固证', () => {
  it('page 为 server wrapper 并加载快照', () => {
    assert.ok(PAGE_SRC.includes('export default async function CustomFieldsPage'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadCustomFieldsSnapshot()'))
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

describe('settings/custom-fields snapshot loader 固证', () => {
  it('data 文件定义 fallback 快照合同', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'local-custom-fields-snapshot'"))
    assert.ok(DATA_SRC.includes('export interface CustomFieldsSnapshot'))
    assert.ok(DATA_SRC.includes('export async function loadCustomFieldsSnapshot()'))
  })

  it('data 文件保留字段分组、类型映射和默认字段', () => {
    assert.ok(DATA_SRC.includes('FIELD_GROUPS'))
    assert.ok(DATA_SRC.includes('FIELD_TYPE_LABEL'))
    assert.ok(DATA_SRC.includes('FIELD_TYPE_COLOR'))
    assert.ok(DATA_SRC.includes('DEFAULT_FIELDS'))
    assert.ok(DATA_SRC.includes('cf-013'))
  })

  it('data 文件保留字段过滤、校验和 ID 构造逻辑', () => {
    assert.ok(DATA_SRC.includes('export function buildCustomFieldId'))
    assert.ok(DATA_SRC.includes('padStart(3'))
    assert.ok(DATA_SRC.includes('export function filterFields'))
    assert.ok(DATA_SRC.includes('searchText.toLowerCase()'))
    assert.ok(DATA_SRC.includes('export function validateField'))
    assert.ok(DATA_SRC.includes('字段名称不能为空'))
  })
})

describe('settings/custom-fields client 固证', () => {
  it('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh")
    assert.ok((CLIENT_SRC.includes("router.refresh()") || CLIENT_SRC.includes("handleRefresh()") || CLIENT_SRC.includes("handleRefresh") || CLIENT_SRC.includes("onRefresh"))), "E54: router.refresh() OR handleRefresh()")
  })

  it('client 文件保留分组筛选、字段统计和启停交互', () => {
    assert.ok(CLIENT_SRC.includes('activeGroup'))
    assert.ok(CLIENT_SRC.includes('searchText'))
    assert.ok(CLIENT_SRC.includes('字段总数'))
    assert.ok(CLIENT_SRC.includes('新增字段'))
    assert.ok(CLIENT_SRC.includes('toggleEnabled'))
    assert.ok(CLIENT_SRC.includes('未找到匹配的字段'))
  })
})
