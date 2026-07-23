/**
 * 🧪 BS-0294: 联盟健康度低效预警测试
 * 覆盖: detectLowEfficiencyPartners 方法
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { HealthScoreService } from './alliance-grade.service'

describe('[BS-0294] 低效联盟检测', () => {
  let healthService: HealthScoreService

  beforeEach(() => {
    healthService = new HealthScoreService()
    healthService.clearAlerts()
  })

  it('[正例] 无指标数据时返回空列表', () => {
    const alerts = healthService.detectLowEfficiencyPartners()
    expect(alerts).toHaveLength(0)
  })

  it('[正例] 月订单低于10的伙伴被检测到', () => {
    healthService.setMetrics('partner-001', {
      partnerId: 'partner-001',
      revenue: 5000,
      orderCount: 3,
      complaintCount: 0,
      activeDays: 10,
    })

    const alerts = healthService.detectLowEfficiencyPartners()
    expect(alerts.length).toBeGreaterThanOrEqual(1)

    const alert = alerts.find(a => a.partnerId === 'partner-001')
    expect(alert).toBeDefined()
    expect(alert!.orderCount).toBe(3)
    expect(alert!.reason).toContain('低于10单')
  })

  it('[正例] 月订单充足的伙伴不被检测', () => {
    healthService.setMetrics('partner-002', {
      partnerId: 'partner-002',
      revenue: 200000,
      orderCount: 100,
      complaintCount: 1,
      activeDays: 28,
    })

    const alerts = healthService.detectLowEfficiencyPartners()
    const alert = alerts.find(a => a.partnerId === 'partner-002')
    expect(alert).toBeUndefined()
  })

  it('[正例] 多个低效伙伴全部被检测到', () => {
    healthService.setMetrics('partner-001', {
      partnerId: 'partner-001',
      revenue: 1000,
      orderCount: 2,
      complaintCount: 0,
      activeDays: 5,
    })
    healthService.setMetrics('partner-002', {
      partnerId: 'partner-002',
      revenue: 500,
      orderCount: 1,
      complaintCount: 0,
      activeDays: 3,
    })
    healthService.setMetrics('partner-003', {
      partnerId: 'partner-003',
      revenue: 500000,
      orderCount: 500,
      complaintCount: 0,
      activeDays: 30,
    })

    const alerts = healthService.detectLowEfficiencyPartners()
    expect(alerts.length).toBe(2)
    expect(alerts.map(a => a.partnerId).sort()).toEqual(['partner-001', 'partner-002'])
  })

  it('[边界] 月订单恰好10单的伙伴不被检测', () => {
    healthService.setMetrics('partner-010', {
      partnerId: 'partner-010',
      revenue: 50000,
      orderCount: 10,
      complaintCount: 0,
      activeDays: 20,
    })

    const alerts = healthService.detectLowEfficiencyPartners()
    const alert = alerts.find(a => a.partnerId === 'partner-010')
    expect(alert).toBeUndefined()
  })
})
