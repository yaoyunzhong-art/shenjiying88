import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  fieldKey,
  parseFieldKey,
  deduplicateByKey,
  registerFieldInMap,
  getAffectedFromMap,
} from './lineage-field-key'

describe('lineage-field-key helpers', () => {
  describe('fieldKey', () => {
    it('joins tableName and fieldName with dot', () => {
      assert.equal(fieldKey('users', 'email'), 'users.email')
    })

    it('handles underscores in names', () => {
      assert.equal(fieldKey('order_items', 'unit_price'), 'order_items.unit_price')
    })

    it('empty parts are preserved as empty', () => {
      assert.equal(fieldKey('', ''), '.')
    })
  })

  describe('parseFieldKey', () => {
    it('splits on first dot', () => {
      assert.deepEqual(parseFieldKey('users.email'), { tableName: 'users', fieldName: 'email' })
    })

    it('handles dots in fieldName (splits on first only)', () => {
      assert.deepEqual(parseFieldKey('a.b.c'), { tableName: 'a', fieldName: 'b.c' })
    })

    it('round-trips with fieldKey', () => {
      const original = { tableName: 'orders', fieldName: 'created_at' }
      const parsed = parseFieldKey(fieldKey(original.tableName, original.fieldName))
      assert.deepEqual(parsed, original)
    })
  })

  describe('deduplicateByKey', () => {
    it('keeps first occurrence of each key', () => {
      const items = [
        { id: 'a', n: 1 },
        { id: 'b', n: 2 },
        { id: 'a', n: 3 },
      ]
      const result = deduplicateByKey(items, (x) => x.id)
      assert.equal(result.length, 2)
      assert.equal(result[0].n, 1)
      assert.equal(result[1].n, 2)
    })

    it('returns empty array for empty input', () => {
      assert.deepEqual(deduplicateByKey([], (x: any) => x.id), [])
    })

    it('handles all-unique keys', () => {
      const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
      assert.equal(deduplicateByKey(items, (x) => x.id).length, 3)
    })

    it('handles all-duplicate keys', () => {
      const items = [{ id: 'a', n: 1 }, { id: 'a', n: 2 }, { id: 'a', n: 3 }]
      const result = deduplicateByKey(items, (x) => x.id)
      assert.equal(result.length, 1)
      assert.equal(result[0].n, 1)
    })
  })

  describe('registerFieldInMap', () => {
    it('registers item under each of its fields', () => {
      const registry = new Map<string, { id: string; fields: { tableName: string; fieldName: string }[] }[]>()
      const dashboard = { id: 'd1', fields: [{ tableName: 'A', fieldName: 'x' }, { tableName: 'A', fieldName: 'y' }] }
      registerFieldInMap(registry, dashboard, (d) => d.id)
      assert.equal(registry.get('A.x')!.length, 1)
      assert.equal(registry.get('A.y')!.length, 1)
    })

    it('deduplicates same id on same field', () => {
      const registry = new Map<string, { id: string; fields: { tableName: string; fieldName: string }[] }[]>()
      const d1 = { id: 'd1', fields: [{ tableName: 'A', fieldName: 'x' }] }
      const d2 = { id: 'd1', fields: [{ tableName: 'A', fieldName: 'x' }] }
      registerFieldInMap(registry, d1, (d) => d.id)
      registerFieldInMap(registry, d2, (d) => d.id)
      assert.equal(registry.get('A.x')!.length, 1)
    })

    it('keeps different ids on same field', () => {
      const registry = new Map<string, { id: string; fields: { tableName: string; fieldName: string }[] }[]>()
      registerFieldInMap(registry, { id: 'd1', fields: [{ tableName: 'A', fieldName: 'x' }] }, (d) => d.id)
      registerFieldInMap(registry, { id: 'd2', fields: [{ tableName: 'A', fieldName: 'x' }] }, (d) => d.id)
      assert.equal(registry.get('A.x')!.length, 2)
    })

    it('handles item with empty fields (no-op)', () => {
      const registry = new Map()
      registerFieldInMap(registry, { id: 'd1', fields: [] }, (d) => d.id)
      assert.equal(registry.size, 0)
    })
  })

  describe('getAffectedFromMap', () => {
    it('returns registered items for the field', () => {
      const registry = new Map<string, { id: string; fields: { tableName: string; fieldName: string }[] }[]>()
      const d1 = { id: 'd1', fields: [{ tableName: 'A', fieldName: 'x' }] }
      registerFieldInMap(registry, d1, (d) => d.id)
      const result = getAffectedFromMap(registry, { tableName: 'A', fieldName: 'x' })
      assert.equal(result.length, 1)
      assert.equal(result[0].id, 'd1')
    })

    it('returns empty array for unknown field', () => {
      const registry = new Map()
      const result = getAffectedFromMap(registry, { tableName: 'A', fieldName: 'unknown' })
      assert.deepEqual(result, [])
    })

    it('returns empty array for missing key in registry', () => {
      const registry = new Map<string, any[]>()
      const result = getAffectedFromMap(registry, { tableName: 'A', fieldName: 'x' })
      assert.deepEqual(result, [])
    })
  })

  describe('integration: fieldKey + parseFieldKey + register + get', () => {
    it('end-to-end: register then query', () => {
      const registry = new Map<string, { id: string; fields: { tableName: string; fieldName: string }[] }[]>()
      const d = { id: 'd1', fields: [{ tableName: 'orders', fieldName: 'total' }] }
      registerFieldInMap(registry, d, (x) => x.id)
      const affected = getAffectedFromMap(registry, parseFieldKey('orders.total'))
      assert.equal(affected.length, 1)
    })
  })
})
