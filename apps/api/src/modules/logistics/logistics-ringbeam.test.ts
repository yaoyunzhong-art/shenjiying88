import { describe, expect, it } from 'vitest'
import { LogisticsService } from './logistics.service'

describe('P-30 logistics ringbeam', () => {
  it('AC-30-01: 创建巡检任务并触发提醒', () => {
    const service = new LogisticsService()
    service.resetStoreForTests()

    const task = service.createInspectionTask({
      tenantId: 'tenant-p30',
      storeId: 'store-a',
      equipmentId: 'equip-a',
      equipmentName: '设备A',
      assigneeId: 'inspector-01',
      assigneeName: '王工',
      scheduledAt: '2026-07-14T18:00:00.000Z'
    })

    const reminded = service.sendInspectionReminder(
      task.id,
      'tenant-p30',
      '2026-07-14T18:00:00.000Z'
    )

    expect(reminded.status).toBe('reminded')
    expect(reminded.reminderSentAt).toBe('2026-07-14T18:00:00.000Z')
  })

  it('AC-30-02: 记录巡检结果后展示已巡检', () => {
    const service = new LogisticsService()
    service.resetStoreForTests()

    const task = service.createInspectionTask({
      tenantId: 'tenant-p30',
      equipmentId: 'equip-a',
      equipmentName: '设备A',
      assigneeId: 'inspector-01',
      assigneeName: '王工',
      scheduledAt: '2026-07-14T18:00:00.000Z'
    })

    const completed = service.recordInspectionResult(task.id, 'tenant-p30', {
      status: 'normal',
      note: '设备A=正常',
      inspectorId: 'inspector-01',
      inspectorName: '王工'
    })

    expect(completed.status).toBe('completed')
    expect(completed.result?.status).toBe('normal')
    expect(completed.result?.note).toContain('正常')
    expect(completed.completedAt).toBeTruthy()
  })
})
