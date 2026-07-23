/**
 * 🧪 BS-0297: AI方案设备校验补充测试
 * 覆盖: recommendPlans 中的 aiSuggestion 字段
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { TeamBuildingService } from './team-building.service'

const TENANT = 'tenant-001'

function makeSvc(): TeamBuildingService {
  return new TeamBuildingService()
}

describe('[BS-0297] AI建议备注 aiSuggestion', () => {
  it('[正例] 推荐结果包含 aiSuggestion 字段', () => {
    const svc = makeSvc()
    const results = svc.recommendPlans(TENANT, {
      participants: 20,
      budget: 500000,
      ageGroup: 'youth',
      tenantId: TENANT,
    })
    expect(results.length).toBeGreaterThan(0)
    for (const r of results) {
      expect(r).toHaveProperty('aiSuggestion')
      expect(typeof r.aiSuggestion).toBe('string')
      expect(r.aiSuggestion!.length).toBeGreaterThan(0)
    }
  })

  it('[正例] 人数超出方案设计上限时给出调整建议', () => {
    const svc = makeSvc()
    // 密室逃脱方案上限12人
    const results = svc.recommendPlans(TENANT, {
      participants: 25,
      budget: 600000,
      ageGroup: 'youth',
      preferredType: 'escape-room',
      tenantId: TENANT,
    })
    const escapeRoom = results.find(r => r.type === 'escape-room')
    expect(escapeRoom).toBeDefined()
    expect(escapeRoom!.aiSuggestion).toContain('超出方案设计上限')
  })

  it('[正例] 预算偏低时给出预算建议', () => {
    const svc = makeSvc()
    // 预算极低
    const results = svc.recommendPlans(TENANT, {
      participants: 30,
      budget: 10000,
      ageGroup: 'adult',
      tenantId: TENANT,
    })
    const outdoorPlan = results.find(r => r.type === 'outdoor')
    if (outdoorPlan) {
      expect(outdoorPlan.aiSuggestion).toMatch(/预算.*偏低|经济/)
    }
  })

  it('[正例] 预算充裕时建议升级', () => {
    const svc = makeSvc()
    const results = svc.recommendPlans(TENANT, {
      participants: 20,
      budget: 10000000, // 1000万分
      ageGroup: 'mixed',
      tenantId: TENANT,
    })
    const result = results[0]
    expect(result.aiSuggestion).toContain('预算充裕')
  })

  it('[正例] 推荐偏好类型与实际不符时提示', () => {
    const svc = makeSvc()
    const results = svc.recommendPlans(TENANT, {
      participants: 20,
      budget: 500000,
      ageGroup: 'adult',
      preferredType: 'ktv',
      tenantId: TENANT,
    })
    const nonKtv = results.find(r => r.type !== 'ktv')
    if (nonKtv) {
      expect(nonKtv.aiSuggestion).toContain('可重新筛选')
    }
  })
})
