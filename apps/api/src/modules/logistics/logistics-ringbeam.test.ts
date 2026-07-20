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

  it('AC-30-03: 报修后可派单给维修工并发送通知', () => {
    const notifications: Array<{ recipient: string; payload: Record<string, unknown> }> = []
    const service = new LogisticsService({
      send(input: { recipient: string; payload: Record<string, unknown> }) {
        notifications.push(input)
        return { id: `dispatch-${notifications.length}` }
      }
    } as any)
    service.resetStoreForTests()

    const order = service.createRepairOrder({
      tenantId: 'tenant-p30',
      storeId: 'store-a',
      equipmentId: 'machine-b',
      equipmentName: '机器B',
      issueDescription: '机器B不转',
      reporterId: 'guide-01',
      reporterName: '小李'
    })

    const assigned = service.assignRepairOrder(order.id, 'tenant-p30', {
      assigneeId: 'repairer-c',
      assigneeName: '维修工C',
      assignedAt: '2026-07-14T19:00:00.000Z'
    })

    expect(assigned.status).toBe('assigned')
    expect(assigned.assigneeId).toBe('repairer-c')
    expect(notifications).toHaveLength(1)
    expect(notifications[0].recipient).toBe('repairer-c')
    expect(notifications[0].payload.issueDescription).toBe('机器B不转')
  })

  it('AC-30-04: 维修完成后可验收闭环', () => {
    const service = new LogisticsService()
    service.resetStoreForTests()

    const order = service.createRepairOrder({
      tenantId: 'tenant-p30',
      equipmentId: 'machine-b',
      equipmentName: '机器B',
      issueDescription: '机器B不转',
      reporterId: 'guide-01',
      reporterName: '小李'
    })

    service.assignRepairOrder(order.id, 'tenant-p30', {
      assigneeId: 'repairer-c',
      assigneeName: '维修工C'
    })
    service.startRepairOrder(order.id, 'tenant-p30', {
      startedAt: '2026-07-14T19:10:00.000Z'
    })

    const completed = service.completeRepairOrder(order.id, 'tenant-p30', {
      completionNote: '更换电机驱动后恢复转动',
      technicianId: 'repairer-c',
      technicianName: '维修工C',
      completedAt: '2026-07-14T19:40:00.000Z'
    })
    const verified = service.verifyRepairOrder(order.id, 'tenant-p30', {
      verifierId: 'manager-01',
      verifierName: '店长',
      note: '复测通过',
      verifiedAt: '2026-07-14T19:50:00.000Z'
    })

    expect(completed.status).toBe('completed')
    expect(verified.status).toBe('verified')
    expect(verified.verification?.note).toBe('复测通过')
    expect(verified.verification?.verifiedAt).toBe('2026-07-14T19:50:00.000Z')
  })

  it('RQ-30-02: 创建清洁排班后可分配清洁区域并通知保洁', () => {
    const notifications: Array<{ recipient: string; payload: Record<string, unknown> }> = []
    const service = new LogisticsService({
      send(input: { recipient: string; payload: Record<string, unknown> }) {
        notifications.push(input)
        return { id: `dispatch-${notifications.length}` }
      }
    } as any)
    service.resetStoreForTests()

    const schedule = service.createCleanSchedule({
      tenantId: 'tenant-p30',
      storeId: 'store-a',
      assigneeId: 'cleaner-01',
      assigneeName: '张保洁',
      shiftName: '早班',
      shiftTime: '06:00-14:00',
      scheduledDate: '2026-07-15'
    })

    const assigned = service.assignCleanArea(schedule.id, 'tenant-p30', {
      areaCode: 'area-restroom',
      areaName: '洗手间',
      assignedAt: '2026-07-15T05:50:00.000Z'
    })

    expect(assigned.status).toBe('assigned')
    expect(assigned.areaName).toBe('洗手间')
    expect(notifications).toHaveLength(1)
    expect(notifications[0].recipient).toBe('cleaner-01')
    expect(notifications[0].payload.areaCode).toBe('area-restroom')
  })

  it('RQ-30-02: 保洁签到后回写考勤状态', () => {
    const service = new LogisticsService()
    service.resetStoreForTests()

    const schedule = service.createCleanSchedule({
      tenantId: 'tenant-p30',
      assigneeId: 'cleaner-01',
      assigneeName: '张保洁',
      shiftName: '早班',
      shiftTime: '06:00-14:00',
      scheduledDate: '2026-07-15'
    })

    service.assignCleanArea(schedule.id, 'tenant-p30', {
      areaCode: 'area-restroom',
      areaName: '洗手间'
    })

    const checkedIn = service.checkInCleanSchedule(schedule.id, 'tenant-p30', {
      cleanerId: 'cleaner-01',
      cleanerName: '张保洁',
      checkedInAt: '2026-07-15T05:58:00.000Z',
      note: '已到岗开工'
    })

    expect(checkedIn.status).toBe('checked_in')
    expect(checkedIn.checkIn?.cleanerName).toBe('张保洁')
    expect(checkedIn.checkIn?.note).toBe('已到岗开工')
    expect(checkedIn.checkIn?.checkedInAt).toBe('2026-07-15T05:58:00.000Z')
  })

  it('RQ-30-04: 后勤物料可提交申领并完成审批', () => {
    const service = new LogisticsService()
    service.resetStoreForTests()

    const request = service.createMaterialRequest({
      tenantId: 'tenant-p30',
      storeId: 'store-a',
      requesterId: 'cleaner-01',
      requesterName: '张保洁',
      department: '清洁组',
      purpose: '补充洗手间与前台清洁耗材',
      items: [
        {
          itemId: 'STK-008',
          itemName: '抹布',
          category: '耗材',
          unit: '条',
          quantity: 8
        },
        {
          itemId: 'STK-012',
          itemName: '免洗洗手液',
          category: '耗材',
          unit: '瓶',
          quantity: 3
        }
      ]
    })

    const approved = service.approveMaterialRequest(request.id, 'tenant-p30', {
      approverId: 'manager-01',
      approverName: '店长',
      note: '门店日耗正常，同意发放',
      approvedAt: '2026-07-15T08:10:00.000Z'
    })

    expect(request.status).toBe('pending_approval')
    expect(request.totalQuantity).toBe(11)
    expect(approved.status).toBe('approved')
    expect(approved.approval?.approverName).toBe('店长')
    expect(approved.approval?.note).toContain('同意')
  })

  it('RQ-30-04: 审批通过后可执行出库并回写仓库记录', () => {
    const service = new LogisticsService()
    service.resetStoreForTests()

    const request = service.createMaterialRequest({
      tenantId: 'tenant-p30',
      requesterId: 'cleaner-01',
      requesterName: '张保洁',
      purpose: '晚班补充清洁物料',
      items: [
        {
          itemId: 'STK-005',
          itemName: 'VR清洁套装',
          category: '耗材',
          unit: '套',
          quantity: 2
        }
      ]
    })

    service.approveMaterialRequest(request.id, 'tenant-p30', {
      approverId: 'manager-01',
      approverName: '店长',
      note: '同意领用'
    })

    const outbound = service.outboundMaterialRequest(request.id, 'tenant-p30', {
      operatorId: 'keeper-01',
      operatorName: '仓管员',
      warehouseCode: 'WH-CLEAN',
      note: '已按审批数量出库',
      outboundAt: '2026-07-15T08:30:00.000Z'
    })

    expect(outbound.status).toBe('outbound')
    expect(outbound.outbound?.operatorName).toBe('仓管员')
    expect(outbound.outbound?.warehouseCode).toBe('WH-CLEAN')
    expect(outbound.outbound?.outboundAt).toBe('2026-07-15T08:30:00.000Z')
  })

  // ════════════════════════════════════════════════
  //  P-30 扩展: 设备维保
  // ════════════════════════════════════════════════

  it('AC-30-05: 设备维保闭环: pending → in_progress → pending_acceptance → completed', () => {
    const service = new LogisticsService()
    service.resetStoreForTests()

    const order = service.createMaintenanceOrder({
      tenantId: 'tenant-p30',
      storeId: 'store-a',
      equipmentId: 'equip-mnt-1',
      equipmentName: '跳舞机',
      issueDescription: '踏板感应器失灵',
      reporterId: 'guide-01',
      reporterName: '导玩小王',
    })
    expect(order.status).toBe('pending')
    expect(order.id).toMatch(/^mnt-/)

    const started = service.startMaintenanceOrder(order.id, 'tenant-p30', {
      assigneeId: 'tech-01',
      assigneeName: '赵维修',
    })
    expect(started.status).toBe('in_progress')

    const completed = service.completeMaintenanceOrder(order.id, 'tenant-p30', {
      completionNote: '更换踏板传感器',
    })
    expect(completed.status).toBe('pending_acceptance')

    const accepted = service.acceptMaintenanceOrder(order.id, 'tenant-p30', {
      acceptedBy: 'guide-01',
      acceptanceNote: '踏板恢复正常',
    })
    expect(accepted.status).toBe('completed')
    expect(accepted.acceptedBy).toBe('guide-01')
  })

  it('AC-30-06: 耗材采购对接P-37审批流: 创建→提交→审批(含P-37工单)→下单→收货', () => {
    const service = new LogisticsService()
    service.resetStoreForTests()

    // 创建采购申请
    const req = service.createProcurementRequest({
      tenantId: 'tenant-p30',
      requesterId: 'store-mgr-01',
      requesterName: '店长',
      department: '清洁组',
      purpose: '月度清洁耗材补充',
      vendorName: '清洁用品供应商',
    })
    expect(req.status).toBe('draft')

    // 提交审批
    const submitted = service.submitProcurementRequest(req.id, 'tenant-p30')
    expect(submitted.status).toBe('pending_approval')

    // 审批通过 + 记录P-37审批工单号
    const approved = service.approveProcurementRequest(req.id, 'tenant-p30', {
      approverId: 'ops-mgr-01',
      approverName: '运行经理',
      note: '预算内，同意采购',
      approvalTicket: 'APR-PROC-2026-001', // P-37 审批工单号
    })
    expect(approved.status).toBe('approved')
    expect(approved.approval?.approvalTicket).toBe('APR-PROC-2026-001')

    // 下单
    const ordered = service.orderProcurementRequest(req.id, 'tenant-p30', {
      orderNumber: 'PO-2026-007',
      vendorName: '清洁用品供应商',
      operatorId: 'ops-01',
      operatorName: '运行专员',
    })
    expect(ordered.status).toBe('ordered')

    // 收货
    const received = service.receiveProcurementRequest(req.id, 'tenant-p30', {
      receivedBy: 'store-mgr-01',
      receivedByName: '店长',
      note: '已入库',
    })
    expect(received.status).toBe('received')
  })
})
