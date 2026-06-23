import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  toOperationSnapshotContract,
  toDiagnosticContract,
  toDiagnosticRecommendationContract,
  toAnalyticsBootstrapContract
} from './analytics.contract'
import {
  AnalyticsScope,
  DiagnosticSeverity,
  DiagnosticCategory
} from './analytics.entity'
import type {
  OperationSnapshot,
  Diagnostic,
  DiagnosticRecommendation
} from './analytics.entity'

// ─── toOperationSnapshotContract ───

describe('toOperationSnapshotContract()', () => {
  const fullSnapshot: OperationSnapshot = {
    tenantId: 't-001',
    scope: AnalyticsScope.Tenant,
    brandId: 'b-001',
    storeId: 's-001',
    generatedAt: '2026-06-23T06:00:00Z',
    groups: [
      {
        groupKey: 'orders',
        groupLabel: '订单与支付',
        metrics: [
          {
            key: 'settlementCount',
            label: '结算笔数',
            value: 120,
            unit: '笔'
          },
          {
            key: 'settlementSuccessRate',
            label: '结算成功率',
            value: 98.5,
            unit: '%',
            ratio: 98.5,
            trend: 'UP'
          }
        ]
      }
    ],
    totals: [
      {
        key: 'totalSettlements',
        label: '总结算笔数',
        value: 120,
        unit: '笔',
        trend: 'UP'
      }
    ]
  }

  test('maps full OperationSnapshot to contract', () => {
    const contract = toOperationSnapshotContract(fullSnapshot)

    assert.equal(contract.tenantId, 't-001')
    assert.equal(contract.scope, AnalyticsScope.Tenant)
    assert.equal(contract.brandId, 'b-001')
    assert.equal(contract.storeId, 's-001')
    assert.equal(contract.generatedAt, '2026-06-23T06:00:00Z')
  })

  test('maps groups correctly', () => {
    const contract = toOperationSnapshotContract(fullSnapshot)

    assert.equal(contract.groups.length, 1)
    assert.equal(contract.groups[0].groupKey, 'orders')
    assert.equal(contract.groups[0].groupLabel, '订单与支付')
    assert.equal(contract.groups[0].metrics.length, 2)
    assert.equal(contract.groups[0].metrics[0].key, 'settlementCount')
    assert.equal(contract.groups[0].metrics[0].value, 120)
  })

  test('preserves metric optional fields (ratio, trend)', () => {
    const contract = toOperationSnapshotContract(fullSnapshot)

    assert.equal(contract.groups[0].metrics[1].ratio, 98.5)
    assert.equal(contract.groups[0].metrics[1].trend, 'UP')
  })

  test('maps totals correctly', () => {
    const contract = toOperationSnapshotContract(fullSnapshot)

    assert.equal(contract.totals.length, 1)
    assert.equal(contract.totals[0].key, 'totalSettlements')
    assert.equal(contract.totals[0].value, 120)
    assert.equal(contract.totals[0].trend, 'UP')
  })

  test('contract returns independent copy (not same reference)', () => {
    const contract1 = toOperationSnapshotContract(fullSnapshot)
    const contract2 = toOperationSnapshotContract(fullSnapshot)

    // Deep structural equal but separate objects
    assert.deepStrictEqual(contract1, contract2)
  })

  test('maps minimal snapshot (no optional fields)', () => {
    const minimal: OperationSnapshot = {
      tenantId: 't-min',
      scope: AnalyticsScope.Brand,
      generatedAt: '2026-06-23T06:00:00Z',
      groups: [
        {
          groupKey: 'loyalty',
          groupLabel: '积分与会员',
          metrics: [
            {
              key: 'pointsNet',
              label: '积分净流',
              value: 0,
              unit: '分'
            }
          ]
        }
      ],
      totals: []
    }

    const contract = toOperationSnapshotContract(minimal)

    assert.equal(contract.tenantId, 't-min')
    assert.equal(contract.scope, AnalyticsScope.Brand)
    assert.equal(contract.brandId, undefined)
    assert.equal(contract.storeId, undefined)
    assert.equal(contract.groups.length, 1)
    assert.equal(contract.totals.length, 0)
  })

  test('maps Store scope snapshot', () => {
    const storeSnapshot: OperationSnapshot = {
      tenantId: 't-store',
      scope: AnalyticsScope.Store,
      storeId: 's-100',
      generatedAt: '2026-06-23T06:00:00Z',
      groups: [
        {
          groupKey: 'orders',
          groupLabel: '订单与支付',
          metrics: [
            {
              key: 'settlementCount',
              label: '结算笔数',
              value: 45,
              unit: '笔'
            }
          ]
        }
      ],
      totals: [
        {
          key: 'totalSettlements',
          label: '总结算笔数',
          value: 45,
          unit: '笔'
        }
      ]
    }

    const contract = toOperationSnapshotContract(storeSnapshot)

    assert.equal(contract.scope, AnalyticsScope.Store)
    assert.equal(contract.storeId, 's-100')
    assert.equal(contract.groups.length, 1)
    assert.equal(contract.totals.length, 1)
  })

  test('handles DOWN trend metric', () => {
    const snapshot: OperationSnapshot = {
      tenantId: 't-down',
      scope: AnalyticsScope.Tenant,
      generatedAt: '2026-06-23T06:00:00Z',
      groups: [
        {
          groupKey: 'loyalty',
          groupLabel: '积分与会员',
          metrics: [
            {
              key: 'pointsNet',
              label: '积分净流',
              value: -500,
              unit: '分',
              trend: 'DOWN'
            }
          ]
        }
      ],
      totals: []
    }

    const contract = toOperationSnapshotContract(snapshot)

    assert.equal(contract.groups[0].metrics[0].trend, 'DOWN')
    assert.equal(contract.groups[0].metrics[0].value, -500)
  })

  test('handles FLAT trend metric', () => {
    const snapshot: OperationSnapshot = {
      tenantId: 't-flat',
      scope: AnalyticsScope.Tenant,
      generatedAt: '2026-06-23T06:00:00Z',
      groups: [
        {
          groupKey: 'orders',
          groupLabel: '订单与支付',
          metrics: [
            {
              key: 'settlementCount',
              label: '结算笔数',
              value: 120,
              unit: '笔',
              trend: 'FLAT'
            }
          ]
        }
      ],
      totals: []
    }

    const contract = toOperationSnapshotContract(snapshot)

    assert.equal(contract.groups[0].metrics[0].trend, 'FLAT')
  })
})

// ─── toDiagnosticContract ───

describe('toDiagnosticContract()', () => {
  const fullDiagnostic: Diagnostic = {
    diagnosticId: 'diag-payment-low-t-001-2026-06-23T06:00:00Z',
    ruleId: 'payment-success-rate-low',
    tenantContext: {
      tenantId: 't-001',
      brandId: 'b-001',
      storeId: 's-001'
    },
    scope: AnalyticsScope.Tenant,
    category: DiagnosticCategory.PaymentHealth,
    severity: DiagnosticSeverity.Critical,
    title: '支付成功率低于健康线',
    summary: '支付成功率低于健康线',
    evidence: {
      settlementCount: 100,
      successCount: 65,
      successRate: 65
    },
    recommendations: [
      {
        actionCode: 'inspect-payment-gateway',
        description: '检查 LYT 网关连通性与签名校验失败计数',
        priority: 100
      },
      {
        actionCode: 'launch-blindbox-promo',
        description: '为转化偏低的盲盒 SKU 上线专项促销或增发低门槛券',
        suggestedCampaignKind: 'BLINDBOX_PROMO',
        priority: 80
      }
    ],
    generatedAt: '2026-06-23T06:00:00Z'
  }

  test('maps full Diagnostic to DiagnosticContract', () => {
    const contract = toDiagnosticContract(fullDiagnostic)

    assert.equal(contract.diagnosticId, 'diag-payment-low-t-001-2026-06-23T06:00:00Z')
    assert.equal(contract.ruleId, 'payment-success-rate-low')
    assert.equal(contract.tenantId, 't-001')
    assert.equal(contract.brandId, 'b-001')
    assert.equal(contract.storeId, 's-001')
    assert.equal(contract.scope, AnalyticsScope.Tenant)
    assert.equal(contract.category, DiagnosticCategory.PaymentHealth)
    assert.equal(contract.severity, DiagnosticSeverity.Critical)
    assert.equal(contract.title, '支付成功率低于健康线')
    assert.equal(contract.summary, '支付成功率低于健康线')
    assert.equal(contract.generatedAt, '2026-06-23T06:00:00Z')
  })

  test('flattens tenantContext into top-level tenantId/brandId/storeId', () => {
    const contract = toDiagnosticContract(fullDiagnostic)

    // tenantContext nesting is gone in the contract
    assert.ok(!('tenantContext' in contract))
    assert.equal(contract.tenantId, 't-001')
    assert.equal(contract.brandId, 'b-001')
    assert.equal(contract.storeId, 's-001')
  })

  test('maps evidence as-is', () => {
    const contract = toDiagnosticContract(fullDiagnostic)

    assert.deepEqual(contract.evidence, {
      settlementCount: 100,
      successCount: 65,
      successRate: 65
    })
  })

  test('maps recommendations', () => {
    const contract = toDiagnosticContract(fullDiagnostic)

    assert.equal(contract.recommendations.length, 2)
    assert.equal(contract.recommendations[0].actionCode, 'inspect-payment-gateway')
    assert.equal(contract.recommendations[0].priority, 100)
    assert.equal(contract.recommendations[1].actionCode, 'launch-blindbox-promo')
    assert.equal(contract.recommendations[1].priority, 80)
    assert.equal(contract.recommendations[1].suggestedCampaignKind, 'BLINDBOX_PROMO')
  })

  test('maps diagnostic with minimal tenantContext (tenantId only)', () => {
    const minimalDiag: Diagnostic = {
      diagnosticId: 'diag-minimal-001',
      ruleId: 'no-settlement-activity',
      tenantContext: { tenantId: 't-mid' },
      scope: AnalyticsScope.Tenant,
      category: DiagnosticCategory.MemberActivity,
      severity: DiagnosticSeverity.Warning,
      title: '结算活跃度静默',
      summary: '结算活跃度静默',
      evidence: { settlementCount: 0 },
      recommendations: [
        {
          actionCode: 'launch-re-engagement',
          description: '对最近无结算的活跃会员发起回流激励活动',
          suggestedCampaignKind: 'RE_ENGAGEMENT',
          priority: 60
        }
      ],
      generatedAt: '2026-06-23T06:00:00Z'
    }

    const contract = toDiagnosticContract(minimalDiag)

    assert.equal(contract.tenantId, 't-mid')
    assert.equal(contract.brandId, undefined)
    assert.equal(contract.storeId, undefined)
    assert.equal(contract.recommendations.length, 1)
    assert.equal(contract.recommendations[0].suggestedCampaignKind, 'RE_ENGAGEMENT')
  })

  test('maps WARNING severity diagnostic', () => {
    const warningDiag: Diagnostic = {
      diagnosticId: 'diag-coupon-low',
      ruleId: 'coupon-quota-near-exhaustion',
      tenantContext: { tenantId: 't-warn' },
      scope: AnalyticsScope.Brand,
      category: DiagnosticCategory.CouponPerformance,
      severity: DiagnosticSeverity.Warning,
      title: '券计划额度接近耗尽',
      summary: '券计划额度接近耗尽',
      evidence: {
        exhaustedPlanIds: ['cp-1', 'cp-2'],
        exhaustedCodes: ['CP01', 'CP02']
      },
      recommendations: [
        {
          actionCode: 'restock-coupon-quota',
          description: '为额度告急的券计划补充配额或结束计划',
          priority: 70
        }
      ],
      generatedAt: '2026-06-23T06:00:00Z'
    }

    const contract = toDiagnosticContract(warningDiag)

    assert.equal(contract.severity, DiagnosticSeverity.Warning)
    assert.equal(contract.category, DiagnosticCategory.CouponPerformance)
    assert.equal(contract.scope, AnalyticsScope.Brand)
  })

  test('maps INFO severity diagnostic', () => {
    const infoDiag: Diagnostic = {
      diagnosticId: 'diag-info',
      ruleId: 'member-activity-thinning',
      tenantContext: { tenantId: 't-info' },
      scope: AnalyticsScope.Tenant,
      category: DiagnosticCategory.MemberActivity,
      severity: DiagnosticSeverity.Info,
      title: '会员活动节奏稀疏',
      summary: '会员活动节奏稀疏',
      evidence: { settlementCount: 1, couponRedemptionCount: 0, pointsOut: 0 },
      recommendations: [
        {
          actionCode: 'increase-touchpoint-frequency',
          description: '增加导购触达节奏或推送积分翻倍激励',
          suggestedCampaignKind: 'POINTS_AWARD',
          priority: 40
        }
      ],
      generatedAt: '2026-06-23T06:00:00Z'
    }

    const contract = toDiagnosticContract(infoDiag)

    assert.equal(contract.severity, DiagnosticSeverity.Info)
    assert.equal(contract.recommendations[0].suggestedCampaignKind, 'POINTS_AWARD')
  })
})

// ─── toDiagnosticRecommendationContract ───

describe('toDiagnosticRecommendationContract()', () => {
  test('maps full recommendation', () => {
    const rec: DiagnosticRecommendation = {
      actionCode: 'inspect-payment-gateway',
      description: '检查 LYT 网关连通性与签名校验失败计数',
      priority: 100
    }

    const contract = toDiagnosticRecommendationContract(rec)

    assert.equal(contract.actionCode, 'inspect-payment-gateway')
    assert.equal(contract.description, '检查 LYT 网关连通性与签名校验失败计数')
    assert.equal(contract.priority, 100)
    assert.equal(contract.suggestedCampaignKind, undefined)
  })

  test('maps recommendation with campaign kind', () => {
    const rec: DiagnosticRecommendation = {
      actionCode: 'launch-blindbox-promo',
      description: '为转化偏低的盲盒 SKU 上线专项促销',
      suggestedCampaignKind: 'BLINDBOX_PROMO',
      priority: 80
    }

    const contract = toDiagnosticRecommendationContract(rec)

    assert.equal(contract.actionCode, 'launch-blindbox-promo')
    assert.equal(contract.suggestedCampaignKind, 'BLINDBOX_PROMO')
    assert.equal(contract.priority, 80)
  })

  test('maps RE_ENGAGEMENT campaign kind', () => {
    const rec: DiagnosticRecommendation = {
      actionCode: 'launch-re-engagement',
      description: '对最近无结算的活跃会员发起回流激励活动',
      suggestedCampaignKind: 'RE_ENGAGEMENT',
      priority: 60
    }

    const contract = toDiagnosticRecommendationContract(rec)

    assert.equal(contract.suggestedCampaignKind, 'RE_ENGAGEMENT')
  })

  test('maps POINTS_AWARD campaign kind', () => {
    const rec: DiagnosticRecommendation = {
      actionCode: 'increase-touchpoint-frequency',
      description: '增加导购触达节奏',
      suggestedCampaignKind: 'POINTS_AWARD',
      priority: 40
    }

    const contract = toDiagnosticRecommendationContract(rec)

    assert.equal(contract.suggestedCampaignKind, 'POINTS_AWARD')
  })

  test('maps COUPON_ISSUE campaign kind', () => {
    const rec: DiagnosticRecommendation = {
      actionCode: 'restock-coupon-quota',
      description: '为额度告急的券计划补充配额',
      suggestedCampaignKind: 'COUPON_ISSUE',
      priority: 70
    }

    const contract = toDiagnosticRecommendationContract(rec)

    assert.equal(contract.suggestedCampaignKind, 'COUPON_ISSUE')
  })
})

// ─── toAnalyticsBootstrapContract ───

describe('toAnalyticsBootstrapContract()', () => {
  const snapshot: OperationSnapshot = {
    tenantId: 't-001',
    scope: AnalyticsScope.Tenant,
    generatedAt: '2026-06-23T06:00:00Z',
    groups: [
      {
        groupKey: 'orders',
        groupLabel: '订单与支付',
        metrics: [
          {
            key: 'settlementCount',
            label: '结算笔数',
            value: 120,
            unit: '笔'
          }
        ]
      }
    ],
    totals: [
      {
        key: 'totalSettlements',
        label: '总结算笔数',
        value: 120,
        unit: '笔'
      }
    ]
  }

  const diagnostics: Diagnostic[] = [
    {
      diagnosticId: 'diag-payment-low',
      ruleId: 'payment-success-rate-low',
      tenantContext: { tenantId: 't-001' },
      scope: AnalyticsScope.Tenant,
      category: DiagnosticCategory.PaymentHealth,
      severity: DiagnosticSeverity.Critical,
      title: '支付成功率低于健康线',
      summary: '支付成功率低于健康线',
      evidence: { successRate: 65 },
      recommendations: [
        {
          actionCode: 'inspect-payment-gateway',
          description: '检查 LYT 网关',
          priority: 100
        }
      ],
      generatedAt: '2026-06-23T06:00:00Z'
    }
  ]

  const recommendations: DiagnosticRecommendation[] = [
    {
      actionCode: 'inspect-payment-gateway',
      description: '检查 LYT 网关',
      priority: 100
    }
  ]

  test('combines snapshot, diagnostics, and recommendations', () => {
    const contract = toAnalyticsBootstrapContract({
      snapshot,
      diagnostics,
      recommendations
    })

    assert.ok(contract.snapshot)
    assert.ok(contract.diagnostics)
    assert.ok(contract.recommendations)
    assert.equal(contract.generatedAt, '2026-06-23T06:00:00Z')
  })

  test('snapshot is mapped via toOperationSnapshotContract', () => {
    const contract = toAnalyticsBootstrapContract({
      snapshot,
      diagnostics,
      recommendations
    })

    assert.equal(contract.snapshot.tenantId, 't-001')
    assert.equal(contract.snapshot.groups.length, 1)
    assert.equal(contract.snapshot.totals.length, 1)
  })

  test('diagnostics are mapped via toDiagnosticContract', () => {
    const contract = toAnalyticsBootstrapContract({
      snapshot,
      diagnostics,
      recommendations
    })

    assert.equal(contract.diagnostics.length, 1)
    assert.equal(contract.diagnostics[0].diagnosticId, 'diag-payment-low')
    assert.equal(contract.diagnostics[0].tenantId, 't-001')
  })

  test('recommendations are mapped via toDiagnosticRecommendationContract', () => {
    const contract = toAnalyticsBootstrapContract({
      snapshot,
      diagnostics,
      recommendations
    })

    assert.equal(contract.recommendations.length, 1)
    assert.equal(contract.recommendations[0].actionCode, 'inspect-payment-gateway')
    assert.equal(contract.recommendations[0].priority, 100)
  })

  test('handles empty diagnostics', () => {
    const contract = toAnalyticsBootstrapContract({
      snapshot,
      diagnostics: [],
      recommendations: []
    })

    assert.equal(contract.diagnostics.length, 0)
    assert.equal(contract.recommendations.length, 0)
  })

  test('handles multiple diagnostics', () => {
    const multiDiags: Diagnostic[] = [
      {
        diagnosticId: 'diag-1',
        ruleId: 'payment-success-rate-low',
        tenantContext: { tenantId: 't-001' },
        scope: AnalyticsScope.Tenant,
        category: DiagnosticCategory.PaymentHealth,
        severity: DiagnosticSeverity.Critical,
        title: '支付成功率低于健康线',
        summary: '支付成功率低于健康线',
        evidence: {},
        recommendations: [
          { actionCode: 'act-1', description: 'desc-1', priority: 100 }
        ],
        generatedAt: '2026-06-23T06:00:00Z'
      },
      {
        diagnosticId: 'diag-2',
        ruleId: 'no-settlement-activity',
        tenantContext: { tenantId: 't-001' },
        scope: AnalyticsScope.Tenant,
        category: DiagnosticCategory.MemberActivity,
        severity: DiagnosticSeverity.Warning,
        title: '结算活跃度静默',
        summary: '结算活跃度静默',
        evidence: {},
        recommendations: [
          { actionCode: 'act-2', description: 'desc-2', priority: 60 }
        ],
        generatedAt: '2026-06-23T06:00:00Z'
      }
    ]

    const contract = toAnalyticsBootstrapContract({
      snapshot,
      diagnostics: multiDiags,
      recommendations: []
    })

    assert.equal(contract.diagnostics.length, 2)
    assert.equal(contract.diagnostics[0].diagnosticId, 'diag-1')
    assert.equal(contract.diagnostics[1].diagnosticId, 'diag-2')
  })

  test('handles multiple recommendations from different diagnostics', () => {
    const multiDiags: Diagnostic[] = [
      {
        diagnosticId: 'diag-1',
        ruleId: 'payment-success-rate-low',
        tenantContext: { tenantId: 't-001' },
        scope: AnalyticsScope.Tenant,
        category: DiagnosticCategory.PaymentHealth,
        severity: DiagnosticSeverity.Critical,
        title: '支付成功率低于健康线',
        summary: '支付成功率低于健康线',
        evidence: {},
        recommendations: [
          { actionCode: 'act-1', description: 'desc-1', priority: 100 },
          { actionCode: 'act-2', description: 'desc-2', priority: 90 }
        ],
        generatedAt: '2026-06-23T06:00:00Z'
      }
    ]

    const multiRecs: DiagnosticRecommendation[] = [
      { actionCode: 'act-1', description: 'desc-1', priority: 100 },
      { actionCode: 'act-2', description: 'desc-2', priority: 90 }
    ]

    const contract = toAnalyticsBootstrapContract({
      snapshot,
      diagnostics: multiDiags,
      recommendations: multiRecs
    })

    assert.equal(contract.recommendations.length, 2)
    assert.equal(contract.recommendations[0].priority, 100)
    assert.equal(contract.recommendations[1].priority, 90)
  })
})
