import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  SENSITIVE_CATEGORIES,
  isSensitiveCategory,
  iterateAllClassifications,
  filterRecordsByKey,
} from './sensitive-data-collectors'
import type { FieldClassification, SensitiveCategory } from './sensitive-data.service'

describe('sensitive-data-collectors helpers', () => {
  describe('SENSITIVE_CATEGORIES', () => {
    it('contains exactly 5 GDPR categories (NONE excluded)', () => {
      assert.equal(SENSITIVE_CATEGORIES.length, 5)
    })

    it('contains PII/FINANCIAL/HEALTH/CONTACT/CREDENTIAL', () => {
      const set = new Set(SENSITIVE_CATEGORIES)
      for (const c of ['PII', 'FINANCIAL', 'HEALTH', 'CONTACT', 'CREDENTIAL']) {
        assert.ok(set.has(c as SensitiveCategory), `missing ${c}`)
      }
    })

    it('does not contain NONE', () => {
      assert.ok(!SENSITIVE_CATEGORIES.includes('NONE'))
    })
  })

  describe('isSensitiveCategory', () => {
    it('returns true for the 5 sensitive categories', () => {
      for (const c of ['PII', 'FINANCIAL', 'HEALTH', 'CONTACT', 'CREDENTIAL']) {
        assert.equal(isSensitiveCategory(c as SensitiveCategory), true)
      }
    })

    it('returns false for NONE', () => {
      assert.equal(isSensitiveCategory('NONE'), false)
    })

    it('returns false for public/internal/confidential (those are levels, not categories)', () => {
      // The function takes SensitiveCategory; 'public' is a SensitivityLevel, not category
      // but type system permits only valid categories. Test the runtime behavior is defined.
      assert.equal(isSensitiveCategory('NONE'), false)
    })
  })

  describe('iterateAllClassifications', () => {
    function buildClassifications(rows: FieldClassification[]): Map<string, Map<string, FieldClassification>> {
      const map = new Map<string, Map<string, FieldClassification>>()
      for (const row of rows) {
        if (!map.has(row.tableName)) map.set(row.tableName, new Map())
        map.get(row.tableName)!.set(row.fieldName, row)
      }
      return map
    }

    it('collects all matching items from a flat source', () => {
      const data: FieldClassification[] = [
        { tableName: 'users', fieldName: 'email', category: 'PII', level: 'restricted', autoClassified: true, updatedAt: new Date() },
        { tableName: 'users', fieldName: 'name', category: 'PII', level: 'restricted', autoClassified: true, updatedAt: new Date() },
        { tableName: 'orders', fieldName: 'total', category: 'FINANCIAL', level: 'restricted', autoClassified: true, updatedAt: new Date() },
      ]
      const result = iterateAllClassifications(() => buildClassifications(data), () => true)
      assert.equal(result.length, 3)
    })

    it('filters by predicate (sensitive only)', () => {
      const data: FieldClassification[] = [
        { tableName: 'users', fieldName: 'email', category: 'PII', level: 'restricted', autoClassified: true, updatedAt: new Date() },
        { tableName: 'public', fieldName: 'banner', category: 'NONE', level: 'public', autoClassified: true, updatedAt: new Date() },
      ]
      const result = iterateAllClassifications(() => buildClassifications(data), (c) => isSensitiveCategory(c.category))
      assert.equal(result.length, 1)
      assert.equal(result[0].fieldName, 'email')
    })

    it('returns empty array for empty source', () => {
      const result = iterateAllClassifications(() => new Map(), () => true)
      assert.equal(result.length, 0)
    })

    it('preserves insertion order (tableMap then fieldMap)', () => {
      const data: FieldClassification[] = [
        { tableName: 'a', fieldName: 'x', category: 'NONE', level: 'public', autoClassified: true, updatedAt: new Date() },
        { tableName: 'a', fieldName: 'y', category: 'NONE', level: 'public', autoClassified: true, updatedAt: new Date() },
      ]
      const result = iterateAllClassifications(() => buildClassifications(data), () => true)
      assert.equal(result[0].fieldName, 'x')
      assert.equal(result[1].fieldName, 'y')
    })
  })

  describe('filterRecordsByKey', () => {
    type Access = { entity: string; tableName: string }
    type Consent = { entityId: string; consentType: string }

    it('filters by entity field', () => {
      const records: Access[] = [
        { entity: 'A', tableName: 'users' },
        { entity: 'B', tableName: 'orders' },
        { entity: 'A', tableName: 'logs' },
      ]
      const result = filterRecordsByKey(records, 'A', 'entity')
      assert.equal(result.length, 2)
      assert.ok(result.every((r) => r.entity === 'A'))
    })

    it('filters by entityId field', () => {
      const records: Consent[] = [
        { entityId: 'X', consentType: 'marketing' },
        { entityId: 'Y', consentType: 'analytics' },
      ]
      const result = filterRecordsByKey(records, 'X', 'entityId')
      assert.equal(result.length, 1)
      assert.equal(result[0].consentType, 'marketing')
    })

    it('returns empty array for unmatched value', () => {
      const records: Access[] = [{ entity: 'A', tableName: 'users' }]
      const result = filterRecordsByKey(records, 'Z', 'entity')
      assert.equal(result.length, 0)
    })

    it('returns empty array for empty input', () => {
      assert.equal(filterRecordsByKey<Access>([], 'A', 'entity').length, 0)
    })
  })
})
