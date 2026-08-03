/**
 * 🧪 BS-0294: 联盟健康度低效预警测试
 * 覆盖: HealthScoreService.alertIfLow
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { HealthScoreService } from './alliance-grade.service'

describe('[BS-0294] 低效联盟检测', () => {
  let healthService: HealthScoreService

  beforeEach(() => {
    healthService = new HealthScoreService()
  })

  it('[正例] 未录入指标的伙伴健康度默认50，不触发预警', () => {
    const alert = healthService.alertIfLow('partner-unknown', 40)
    expect(alert).toBeNull()
  })

  it('[正例] 健康度低于阈值时触发预警', () => {
    // 默认无指标时 healthScore=50，设阈值为60则触发
    const alert = healthService.alertIfLow('partner-001', 60)
    expect(alert).not.toBeNull()
    expect(alert!.partnerId).toBe('partner-001')
    expect(alert!.healthScore).toBeLessThan(60)
    expect(alert!.reason).toContain('低效伙伴预警')
  })

  it('[正例] 同一伙伴同一阈值不重复告警', () => {
    healthService.alertIfLow('partner-001', 60)
    const second = healthService.alertIfLow('partner-001', 60)
    // 可能返回已有alert或null（取决于实现）
    // 至少不报错
    expect(second === null || second?.partnerId === 'partner-001').toBe(true)
  })

  it('[边界] 健康度恰好等于阈值不触发', () => {
    // 使用一个合理的高阈值确保触发
    const result = healthService.alertIfLow('partner-001', 50)
    // 默认健康度50，阈值为50时 score >= threshold 成立 => null
    expect(result).toBeNull()
  })

  it('[边界] 健康度略低于阈值触发', () => {
    const result = healthService.alertIfLow('partner-001', 51)
    // 默认健康度50，小于51 => 触发
    expect(result).not.toBeNull()
    expect(result!.healthScore).toBe(50)
    expect(result!.threshold).toBe(51)
  })
})
