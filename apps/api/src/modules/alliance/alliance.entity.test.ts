/**
 * Alliance Entity 类型测试 (D-controller spec 补全)
 *
 * 验证 entity 文件正确 re-exports 和定义了接口。
 * 注意: 部分类型是 `export type` 重新导出（编译时仅类型），
 * 在 typecheck 中转 type 验证。
 */
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'

// Type-only imports for verification (TS typecheck validates at compile time)
import type {
  Grade,
  PartnerStatus,
  BusinessType,
  HealthFactors,
  HealthTrend,
  SettlementType,
  SettlementParticipant,
  AnomalyRecord,
  AnomalyReport,
  AllianceRegisterRequest,
  AllianceUpdateRequest,
  AllianceListFilter,
  GradeConfig,
  SettlementCreateRequest,
  AnomalyDetectionResponse,
  UnlinkedOrderScanResult,
  AutoLinkResult,
} from './alliance.entity'
import type {
  Grade as SGrade,
  PartnerStatus as SPartnerStatus,
  BusinessType as SBizType,
} from './alliance-grade.service'

describe('Alliance Entity — re-export verification', () => {
  it('should re-export Grade type (compile-time check)', () => {
    // Compile-time: Grade is resolved from alliance.entity
    const assertTypes: Record<string, string> = {
      S: 'S',
      A: 'A',
      B: 'B',
      C: 'C',
    }
    const v: Grade = 'S'
    assert.equal(assertTypes[v], 'S')
  })

  it('should re-export PartnerStatus type', () => {
    const v: PartnerStatus = 'ACTIVE'
    assert.equal(v, 'ACTIVE')
  })

  it('should re-export BusinessType type', () => {
    const v: BusinessType = 'RETAIL'
    assert.equal(v, 'RETAIL')
  })

  it('should define AllianceRegisterRequest interface', () => {
    const req: AllianceRegisterRequest = {
      name: 'Test',
      businessType: 'RETAIL',
      contact: 'test@test.com',
      address: 'addr',
    }
    assert.equal(req.name, 'Test')
  })

  it('should define AllianceUpdateRequest interface', () => {
    const req: AllianceUpdateRequest = { name: 'Updated' }
    assert.equal(req.name, 'Updated')
  })

  it('should define AllianceListFilter interface', () => {
    const filter: AllianceListFilter = {
      businessType: 'RETAIL',
      status: 'ACTIVE',
      grade: 'S',
    }
    assert.equal(filter.businessType, 'RETAIL')
  })

  it('should define GradeConfig interface', () => {
    const cfg: GradeConfig = {
      grade: 'S',
      minScore: 90,
      maxScore: 100,
      label: '金牌伙伴',
    }
    assert.equal(cfg.label, '金牌伙伴')
  })

  it('should define SettlementCreateRequest interface', () => {
    const req: SettlementCreateRequest = {
      orderId: 'o-001',
      type: 'SPLIT',
      totalAmount: 10000,
      participants: [{ partnerId: 'p1', share: 6000 }],
    }
    assert.equal(req.orderId, 'o-001')
  })

  it('should define AnomalyDetectionResponse interface', () => {
    const res: AnomalyDetectionResponse = {
      partnerId: 'p1',
      report: { anomalies: [], summary: 'OK', totalScore: 100 },
    }
    assert.equal(res.partnerId, 'p1')
  })

  it('should define UnlinkedOrderScanResult interface', () => {
    const scan: UnlinkedOrderScanResult = {
      storeId: 's-1',
      orders: [{ orderId: 'o1', amount: 100, createdAt: '2026-01-01', linkStatus: 'unlinked' }],
      total: 1,
    }
    assert.equal(scan.total, 1)
  })

  it('should define AutoLinkResult interface', () => {
    const res: AutoLinkResult = {
      linked: true,
      partnerId: 'p1',
      reason: 'OK',
    }
    assert.equal(res.linked, true)
  })

  it('should re-export HealthFactors from alliance-grade.service', () => {
    const f: HealthFactors = {
      revenueScore: 90,
      orderScore: 80,
      complaintScore: 70,
      activityScore: 85,
      overall: 85,
    }
    assert.equal(f.overall, 85)
  })

  it('should re-export HealthTrend type', () => {
    const t: HealthTrend = { date: '2026-07-01', score: 85 }
    assert.equal(t.score, 85)
  })

  it('should re-export SettlementType type', () => {
    const st: SettlementType = 'SPLIT'
    assert.equal(st, 'SPLIT')
  })

  it('should re-export SettlementParticipant type', () => {
    const sp: SettlementParticipant = { partnerId: 'p1', share: 5000 }
    assert.equal(sp.partnerId, 'p1')
  })

  it('should re-export AnomalyRecord type', () => {
    const r: AnomalyRecord = {
      id: 'a1',
      partnerId: 'p1',
      type: 'SCORE_DROP',
      severity: 'HIGH',
      message: 'drop',
      detectedAt: '2026-07-01T00:00:00Z',
    }
    assert.equal(r.id, 'a1')
  })

  it('should re-export AnomalyReport type', () => {
    const r: AnomalyReport = { anomalies: [], summary: 'OK', totalScore: 100 }
    assert.equal(r.totalScore, 100)
  })
})

describe('Alliance Entity — source type consistency', () => {
  it('should align Grade with source definition', () => {
    const v: SGrade = 'S'
    const reExport: Grade = v
    assert.equal(reExport, v)
  })

  it('should align PartnerStatus with source definition', () => {
    const v: SPartnerStatus = 'ACTIVE'
    const reExport: PartnerStatus = v
    assert.equal(reExport, v)
  })

  it('should align BusinessType with source definition', () => {
    const v: SBizType = 'RETAIL'
    const reExport: BusinessType = v
    assert.equal(reExport, v)
  })
})
