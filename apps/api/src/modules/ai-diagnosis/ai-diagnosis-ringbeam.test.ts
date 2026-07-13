/**
 * 🐜 圈梁: [ai-diagnosis] 诊断模块圈梁测试
 *
 * 正例 + 反例 + 边界
 * 验证: DTO、实体、合约、Service CRUD
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AiDiagnosisService } from './ai-diagnosis.service'
import { CreateDiagnosisDto, UpdateDiagnosisDto } from './ai-diagnosis.dto'
import type { DiagnosisEntity } from './ai-diagnosis.entity'
import {
  toDiagnosisContract,
  toDiagnosisBatchContract,
} from './ai-diagnosis.contract'

// ─── Service ─────────────────────────────────────────────

describe('ai-diagnosis Service CRUD', () => {
  let service: AiDiagnosisService

  beforeEach(() => {
    AiDiagnosisService.resetStores()
    service = new AiDiagnosisService()
  })

  // 正例: 创建诊断
  it('正例: 创建诊断返回完整实体', () => {
    const result = service.createDiagnosis({
      engineId: 'engine-1',
      scenarioId: 'scenario-1',
      tenantId: 'tenant-1',
      requestedBy: 'user-1',
      promptSummary: '测试诊断',
      inputSnapshot: { orderAmount: 999 },
    })
    expect(result.diagnosisId).toBeDefined()
    expect(result.diagnosisId).toMatch(/^diag-/)
    expect(result.status).toBe('PENDING')
    expect(result.engineId).toBe('engine-1')
    expect(result.riskLevel).toBe('low')
  })

  // 正例: 查询诊断
  it('正例: 查询已存在的诊断', () => {
    const created = service.createDiagnosis({
      engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1',
    })
    const found = service.getDiagnosis(created.diagnosisId)
    expect(found).toBeDefined()
    expect(found!.diagnosisId).toBe(created.diagnosisId)
  })

  // 反例: 查询不存在的诊断返回 undefined
  it('反例: 查询不存在的诊断返回 undefined', () => {
    const result = service.getDiagnosis('diag-nonexistent')
    expect(result).toBeUndefined()
  })

  // 反例: 删除不存在的诊断返回 false
  it('反例: 删除不存在的诊断返回 false', () => {
    const deleted = service.deleteDiagnosis('diag-nonexistent')
    expect(deleted).toBe(false)
  })
})

// ─── DTO ────────────────────────────────────────────────

describe('ai-diagnosis DTO', () => {
  // 正例: 合法 CreateDiagnosisDto
  it('正例: CreateDiagnosisDto 包含所需字段', () => {
    const dto = new CreateDiagnosisDto()
    dto.engineId = 'e1'
    dto.scenarioId = 's1'
    dto.tenantId = 't1'
    dto.requestedBy = 'u1'
    expect(dto.engineId).toBeTruthy()
    expect(dto.scenarioId).toBeTruthy()
    expect(dto.tenantId).toBeTruthy()
    expect(dto.requestedBy).toBeTruthy()
  })

  // 边界: UpdateDiagnosisDto 仅更新 status
  it('边界: UpdateDiagnosisDto 更新仅 status 字段', () => {
    const dto = new UpdateDiagnosisDto()
    dto.status = 'COMPLETED'
    expect(dto.status).toBe('COMPLETED')
    expect(dto.riskLevel).toBeUndefined()
  })
})

// ─── 合约 ────────────────────────────────────────────────

describe('ai-diagnosis 合约转换', () => {
  const mockEntity: DiagnosisEntity = {
    diagnosisId: 'diag-abc123',
    engineId: 'e1',
    scenarioId: 's1',
    status: 'COMPLETED',
    matchedRuleIds: ['r1', 'r2'],
    matchedConditionIds: ['c1'],
    triggeredActionIds: ['a1'],
    riskLevel: 'high',
    recommendation: '需要人工复核',
    promptSummary: '高风险订单诊断',
    evaluationDurationMs: 350,
    inputSnapshot: {},
    outputSnapshot: {},
    createdAt: '2026-07-01T00:00:00Z',
    completedAt: '2026-07-01T00:00:05Z',
    tenantId: 't1',
    requestedBy: 'u1',
  }

  it('正例: toDiagnosisContract 正确映射', () => {
    const contract = toDiagnosisContract(mockEntity)
    expect(contract.diagnosisId).toBe('diag-abc123')
    expect(contract.riskLevel).toBe('high')
    expect(contract.matchedRuleIds).toHaveLength(2)
    expect(contract.evaluationDurationMs).toBe(350)
    expect(contract.recommendation).toBe('需要人工复核')
  })

  it('边界: 空匹配列表的合约转换', () => {
    const empty = { ...mockEntity, matchedRuleIds: [], matchedConditionIds: [], triggeredActionIds: [] }
    const contract = toDiagnosisContract(empty)
    expect(contract.matchedRuleIds).toHaveLength(0)
    expect(contract.matchedConditionIds).toHaveLength(0)
    expect(contract.triggeredActionIds).toHaveLength(0)
  })
})
