import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  AnalyticsScope,
  DiagnosticCategory,
  DiagnosticSeverity
} from './analytics.entity'

describe('AnalyticsEntity', () => {
  test('AnalyticsScope and DiagnosticSeverity enums are stable', () => {
    assert.equal(AnalyticsScope.Tenant, 'TENANT')
    assert.equal(AnalyticsScope.Brand, 'BRAND')
    assert.equal(AnalyticsScope.Store, 'STORE')
    assert.equal(DiagnosticSeverity.Info, 'INFO')
    assert.equal(DiagnosticSeverity.Warning, 'WARNING')
    assert.equal(DiagnosticSeverity.Critical, 'CRITICAL')
  })

  test('DiagnosticCategory enums cover the diagnostic categories', () => {
    const categories = Object.values(DiagnosticCategory)
    assert.ok(categories.includes(DiagnosticCategory.PaymentHealth))
    assert.ok(categories.includes(DiagnosticCategory.CouponPerformance))
    assert.ok(categories.includes(DiagnosticCategory.BlindboxEngagement))
    assert.ok(categories.includes(DiagnosticCategory.MemberActivity))
    assert.ok(categories.includes(DiagnosticCategory.PointEconomy))
    assert.ok(categories.includes(DiagnosticCategory.ConcentrationRisk))
  })
})
