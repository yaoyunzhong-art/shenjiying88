import { describe, it } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  AnalyticsScope,
  DiagnosticCategory,
  DiagnosticSeverity
} from './analytics.entity'

describe('AnalyticsEntity', () => {
  it('AnalyticsScope and DiagnosticSeverity enums are stable', () => {
    assert.equal(AnalyticsScope.Tenant, 'TENANT')
    assert.equal(AnalyticsScope.Brand, 'BRAND')
    assert.equal(AnalyticsScope.Store, 'STORE')
    assert.equal(DiagnosticSeverity.Info, 'INFO')
    assert.equal(DiagnosticSeverity.Warning, 'WARNING')
    assert.equal(DiagnosticSeverity.Critical, 'CRITICAL')
  })

  it('DiagnosticCategory enums cover the diagnostic categories', () => {
    const categories = Object.values(DiagnosticCategory)
    assert.ok(categories.includes(DiagnosticCategory.PaymentHealth))
    assert.ok(categories.includes(DiagnosticCategory.CouponPerformance))
    assert.ok(categories.includes(DiagnosticCategory.BlindboxEngagement))
    assert.ok(categories.includes(DiagnosticCategory.MemberActivity))
    assert.ok(categories.includes(DiagnosticCategory.PointEconomy))
    assert.ok(categories.includes(DiagnosticCategory.ConcentrationRisk))
  })

  it('AnalyticsScope enum has exactly 3 members', () => {
    const keys = Object.keys(AnalyticsScope).filter((k) => isNaN(Number(k)))
    assert.equal(keys.length, 3)
    assert.deepEqual(keys, ['Tenant', 'Brand', 'Store'])
  })

  it('DiagnosticSeverity enum has exactly 3 members in order', () => {
    const keys = Object.keys(DiagnosticSeverity).filter((k) => isNaN(Number(k)))
    assert.equal(keys.length, 3)
    assert.equal(keys[0], 'Info')
    assert.equal(keys[1], 'Warning')
    assert.equal(keys[2], 'Critical')
  })

  it('DiagnosticCategory enum has exactly 6 members', () => {
    const keys = Object.keys(DiagnosticCategory).filter((k) => isNaN(Number(k)))
    assert.equal(keys.length, 6)
    assert.ok(keys.includes('ConcentrationRisk'))
  })

  it('AnalyticsScope string values match expected constants', () => {
    assert.equal(AnalyticsScope.Tenant, 'TENANT')
    assert.equal(AnalyticsScope.Brand, 'BRAND')
    assert.equal(AnalyticsScope.Store, 'STORE')
  })

  it('ConcentrationRisk is defined but not yet assigned to a rule', () => {
    // ConcentrationRisk exists in the enum for future use
    assert.equal(DiagnosticCategory.ConcentrationRisk, 'CONCENTRATION_RISK')
    // Currently no diagnostic rule uses ConcentrationRisk — validate it's
    // available for future diagnostic rules
    const categoriesWithRules = [
      DiagnosticCategory.PaymentHealth,
      DiagnosticCategory.CouponPerformance,
      DiagnosticCategory.BlindboxEngagement,
      DiagnosticCategory.MemberActivity,
      DiagnosticCategory.PointEconomy
    ]
    assert.ok(!categoriesWithRules.includes(DiagnosticCategory.ConcentrationRisk))
  })
})
