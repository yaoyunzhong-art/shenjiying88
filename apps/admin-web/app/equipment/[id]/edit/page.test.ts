import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PAGE_SRC = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf-8')
const CLIENT_SRC = fs.readFileSync(path.resolve(__dirname, 'equipment-edit-client.tsx'), 'utf-8')
const DATA_SRC = fs.readFileSync(path.resolve(__dirname, 'equipment-edit-data.ts'), 'utf-8')
const LEGACY_SRC = fs.readFileSync(path.resolve(__dirname, 'equipment-edit-legacy.tsx'), 'utf-8')

describe('equipment/[id]/edit 结构固证', () => {
  it('page 应迁移为服务端 wrapper', () => {
    assert.ok(!PAGE_SRC.includes("'use client'"))
    assert.ok(PAGE_SRC.includes('export default async function EquipmentEditPage'))
    assert.ok(PAGE_SRC.includes('const { id } = await params'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadEquipmentEditSnapshot(id)'))
    assert.ok(PAGE_SRC.includes('<EquipmentEditClient snapshot={snapshot} />'))
  })

  it('page 应透出来源态证据与刷新策略', () => {
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(PAGE_SRC.includes('export const revalidate = 0'))
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
  })

  it('client 应保留 router.refresh 并桥接 legacy 编辑页', () => {
    assert.ok(CLIENT_SRC.includes("'use client'"))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
    assert.ok(CLIENT_SRC.includes('刷新快照'))
    assert.ok(CLIENT_SRC.includes('Promise.resolve({ id: snapshot.id })'))
    assert.ok(CLIENT_SRC.includes('<EquipmentEditLegacy params={Promise.resolve({ id: snapshot.id })} />'))
  })

  it('data 应定义 fallback snapshot 合同', () => {
    assert.ok(DATA_SRC.includes('export interface EquipmentEditSnapshot'))
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'equipment-edit-fallback'"))
    assert.ok(DATA_SRC.includes('refreshPath'))
    assert.ok(DATA_SRC.includes('note'))
  })

  it('legacy 编辑页仍保留旧 client/mock 交互实现', () => {
    assert.ok(LEGACY_SRC.includes("'use client'"))
    assert.ok(LEGACY_SRC.includes('MOCK_EQUIPMENT_DETAIL'))
    assert.ok(LEGACY_SRC.includes('validateEditForm'))
    assert.ok(LEGACY_SRC.includes('useFormSubmit'))
  })
})
