import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 扩展角色测试: delivery-tracking 模块
 *
 * 4 个附加角色视角（每个角色 >= 3 个测试用例）：
 * 🎮导玩员 — 门店配送信息查看与收货确认
 * 🔧安监 — 设备配送监控与异常配送追踪
 * 🤝团建 — 团建物资配送管理与进度跟踪
 * 📢营销 — 营销物料配送管理与时效分析
 *
 * 每个角色 3+ 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */
import { DeliveryTrackingService } from './delivery-tracking.service'
import { DeliveryStatus, DeliveryMethod } from './delivery-tracking.entity'

const TENANT_ID = 't-arcade-001'

describe('🎮导玩员 — 门店配送信息查看与收货确认视角', () => {
  beforeEach(() => {
    const svc = new DeliveryTrackingService()
    svc.resetDeliveryStoresForTests()
  })

  it('导玩员可查看门店的配送记录列表 (list deliveries)', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    const deliveries = svc.listDeliveries(TENANT_ID)
    expect(deliveries.length).toBeGreaterThanOrEqual(22)
    expect(deliveries[0]).toHaveProperty('deliveryNo')
    expect(deliveries[0]).toHaveProperty('status')
    expect(deliveries[0]).toHaveProperty('carrier')
  })

  it('导玩员可按配送状态筛选 (filter by delivery status)', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    const pending = svc.listDeliveries(TENANT_ID, { status: DeliveryStatus.Pending })
    expect(pending.length).toBeGreaterThanOrEqual(2)
    expect(pending.every(d => d.status === DeliveryStatus.Pending)).toBe(true)

    const delivered = svc.listDeliveries(TENANT_ID, { status: DeliveryStatus.Delivered })
    expect(delivered.length).toBeGreaterThanOrEqual(5)
  })

  it('导玩员可查看配送详情含时间线 (view delivery detail with timeline)', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    const deliveries = svc.listDeliveries(TENANT_ID)
    const detail = svc.getDelivery(deliveries[0].id, TENANT_ID)
    expect(detail).toBeDefined()
    expect(detail!.receiverAddress).toBeDefined()
    expect(detail!.trackingNo).toBeDefined()
  })

  it('导玩员查看配送时间线含事件记录 (view tracking timeline)', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    const deliveries = svc.listDeliveries(TENANT_ID, { status: DeliveryStatus.Delivered })
    const timeline = svc.getTrackingTimeline(deliveries[0].id, TENANT_ID)
    expect(timeline.length).toBeGreaterThanOrEqual(1)
    expect(timeline[0]).toHaveProperty('status')
    expect(timeline[0]).toHaveProperty('location')
    expect(timeline[0]).toHaveProperty('description')
  })

  it('导玩员查询不存在的配送返回undefined (get non-existing delivery)', () => {
    const svc = new DeliveryTrackingService()

    const result = svc.getDelivery('non-existing', TENANT_ID)
    expect(result).toBeUndefined()
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🔧安监 — 设备配送监控与异常配送追踪
// ──────────────────────────────────────────────────────────────────────
describe('🔧安监 — 设备配送监控视角', () => {
  beforeEach(() => {
    const svc = new DeliveryTrackingService()
    svc.resetDeliveryStoresForTests()
  })

  it('安监可查看所有失败配送记录 (view failed deliveries)', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    const failed = svc.listDeliveries(TENANT_ID, { status: DeliveryStatus.Failed })
    expect(failed.length).toBeGreaterThanOrEqual(2)
    expect(failed.every(d => d.status === DeliveryStatus.Failed)).toBe(true)
  })

  it('安监可追踪异常配送的详细时间线 (track failed delivery timeline)', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    const failed = svc.listDeliveries(TENANT_ID, { status: DeliveryStatus.Failed })
    const timeline = svc.getTrackingTimeline(failed[0].id, TENANT_ID)
    expect(timeline.length).toBeGreaterThanOrEqual(4)
    // 最后的event应为Failed
    const lastEvent = timeline[timeline.length - 1]
    expect(lastEvent.status).toBe(DeliveryStatus.Failed)
    expect(lastEvent.description).toBeDefined()
  })

  it('安监可按订单号查询配送 (filter by order no)', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    const byOrder = svc.listDeliveries(TENANT_ID, { orderNo: 'ORD-2026-0001' })
    expect(byOrder.length).toBe(1)
    expect(byOrder[0].orderNo).toBe('ORD-2026-0001')
    expect(byOrder[0].status).toBe(DeliveryStatus.Delivered)
  })

  it('安监可创建安防设备配送单 (create security equipment delivery)', () => {
    const svc = new DeliveryTrackingService()

    const delivery = svc.createDelivery({
      tenantId: TENANT_ID,
      orderNo: 'ORD-SEC-001',
      method: DeliveryMethod.Courier,
      carrier: '顺丰速运',
      trackingNo: 'SF-SECURITY-001',
      sender: '安防设备仓库',
      receiver: '门店安监',
      receiverPhone: '13800138001',
      receiverAddress: '门店安防监控室',
      estimatedAt: '2026-07-25T18:00:00.000Z',
      remark: '安防摄像头更换配件',
    })
    expect(delivery.method).toBe(DeliveryMethod.Courier)
    expect(delivery.status).toBe(DeliveryStatus.Pending)
    expect(delivery.deliveryNo).toMatch(/^DL/)
  })

  it('安监可更新配送为运输中状态 (update to in transit)', () => {
    const svc = new DeliveryTrackingService()

    const delivery = svc.createDelivery({
      tenantId: TENANT_ID, orderNo: 'ORD-SEC-002',
      method: DeliveryMethod.Courier, carrier: '中通快递',
      trackingNo: 'ZT-SEC-001', sender: '安防仓库',
      receiver: '门店', receiverPhone: '13900139001',
      receiverAddress: '门店监控室',
      estimatedAt: '2026-07-26T12:00:00.000Z',
    })

    const inTransit = svc.updateDeliveryStatus(delivery.id, DeliveryStatus.InTransit, TENANT_ID)
    expect(inTransit.status).toBe(DeliveryStatus.InTransit)

    // 添加事件
    const event = svc.addEvent({
      deliveryId: delivery.id,
      status: DeliveryStatus.InTransit,
      location: '广州中转站',
      description: '设备包裹已到达中转站',
      timestamp: new Date().toISOString(),
    })
    expect(event.status).toBe(DeliveryStatus.InTransit)
  })

  it('安监查看空配送时间线返回空数组 (empty timeline)', () => {
    const svc = new DeliveryTrackingService()

    const delivery = svc.createDelivery({
      tenantId: TENANT_ID, orderNo: 'ORD-EMPTY',
      method: DeliveryMethod.Courier, carrier: '测试',
      trackingNo: 'TEST-001', sender: '仓库',
      receiver: '门店', receiverPhone: '13000000000',
      receiverAddress: '测试地址',
      estimatedAt: '2026-07-30T12:00:00.000Z',
    })

    const timeline = svc.getTrackingTimeline(delivery.id, TENANT_ID)
    expect(timeline.length).toBe(0)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🤝团建 — 团建物资配送管理与进度跟踪
// ──────────────────────────────────────────────────────────────────────
describe('🤝团建 — 团建物资配送视角', () => {
  beforeEach(() => {
    const svc = new DeliveryTrackingService()
    svc.resetDeliveryStoresForTests()
  })

  it('团建负责人可创建团建物资配送单 (create team building supply delivery)', () => {
    const svc = new DeliveryTrackingService()

    const delivery = svc.createDelivery({
      tenantId: TENANT_ID,
      orderNo: 'ORD-TB-001',
      method: DeliveryMethod.Express,
      carrier: '京东物流',
      trackingNo: 'JD-TB-001',
      sender: '团建物资仓库',
      receiver: '团建组织者',
      receiverPhone: '13700137001',
      receiverAddress: '门店活动场地',
      estimatedAt: '2026-08-01T10:00:00.000Z',
      remark: '团建活动帐篷、烧烤架等物资',
    })
    expect(delivery.method).toBe(DeliveryMethod.Express)
    expect(delivery.remark).toContain('团建')
    expect(delivery.deliveryNo).toBeDefined()
    expect(delivery.status).toBe(DeliveryStatus.Pending)
  })

  it('团建负责人可更新配送状态并查看进度 (update and track progress)', () => {
    const svc = new DeliveryTrackingService()

    const delivery = svc.createDelivery({
      tenantId: TENANT_ID, orderNo: 'ORD-TB-002',
      method: DeliveryMethod.Courier, carrier: '顺丰速运',
      trackingNo: 'SF-TB-002', sender: '户外用品仓库',
      receiver: '团建负责人', receiverPhone: '13600136001',
      receiverAddress: '门店活动中心',
      estimatedAt: '2026-08-03T14:00:00.000Z',
    })

    // 模拟配送流程
    svc.addEvent({
      deliveryId: delivery.id, status: DeliveryStatus.PickedUp,
      location: '户外用品仓库', description: '已取件',
      timestamp: new Date().toISOString(),
    })
    svc.updateDeliveryStatus(delivery.id, DeliveryStatus.PickedUp, TENANT_ID)

    svc.addEvent({
      deliveryId: delivery.id, status: DeliveryStatus.InTransit,
      location: '苏州中转站', description: '包裹已到达苏州中转站',
      timestamp: new Date().toISOString(),
    })
    svc.updateDeliveryStatus(delivery.id, DeliveryStatus.InTransit, TENANT_ID)

    const timeline = svc.getTrackingTimeline(delivery.id, TENANT_ID)
    expect(timeline.length).toBe(2)
    expect(timeline[0].status).toBe(DeliveryStatus.PickedUp)
    expect(timeline[1].status).toBe(DeliveryStatus.InTransit)
  })

  it('团建负责人可查看自提类配送 (view self-pickup deliveries)', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    const selfPickup = svc.listDeliveries(TENANT_ID, { method: DeliveryMethod.SelfPickup })
    expect(selfPickup.length).toBeGreaterThanOrEqual(3)
    expect(selfPickup.every(d => d.method === DeliveryMethod.SelfPickup)).toBe(true)
  })

  it('团建负责人可查看配送备注信息 (view delivery remarks)', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    // 种子数据中有些有remark
    const withRemark = svc.listDeliveries(TENANT_ID).filter(d => d.remark !== undefined)
    expect(withRemark.length).toBeGreaterThanOrEqual(3)

    // 检查自提配送的备注
    const selfPickup = svc.listDeliveries(TENANT_ID, { method: DeliveryMethod.SelfPickup })
    const hasRemark = selfPickup.some(d => d.remark !== undefined)
    expect(hasRemark).toBe(true)
  })

  it('团建负责人按方法筛选配送 (filter by delivery method)', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    const courier = svc.listDeliveries(TENANT_ID, { method: DeliveryMethod.Courier })
    expect(courier.length).toBeGreaterThanOrEqual(7)

    const express = svc.listDeliveries(TENANT_ID, { method: DeliveryMethod.Express })
    expect(express.length).toBeGreaterThanOrEqual(5)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 📢营销 — 营销物料配送管理与时效分析
// ──────────────────────────────────────────────────────────────────────
describe('📢营销 — 营销物料配送视角', () => {
  beforeEach(() => {
    const svc = new DeliveryTrackingService()
    svc.resetDeliveryStoresForTests()
  })

  it('营销人员可创建营销物料配送单 (create marketing material delivery)', () => {
    const svc = new DeliveryTrackingService()

    const delivery = svc.createDelivery({
      tenantId: TENANT_ID,
      orderNo: 'ORD-MKT-001',
      method: DeliveryMethod.Courier,
      carrier: '顺丰速运',
      trackingNo: 'SF-MKT-001',
      sender: '印刷厂',
      receiver: '门店市场部',
      receiverPhone: '13500135001',
      receiverAddress: '门店市场部仓库',
      estimatedAt: '2026-07-28T12:00:00.000Z',
      remark: '七夕活动海报、展架各20套',
    })
    expect(delivery.orderNo).toContain('MKT')
    expect(delivery.remark).toContain('海报')
    expect(delivery.status).toBe(DeliveryStatus.Pending)
  })

  it('营销人员可更新配送信息（物流单号、预计时间）(update delivery info)', () => {
    const svc = new DeliveryTrackingService()

    const delivery = svc.createDelivery({
      tenantId: TENANT_ID, orderNo: 'ORD-MKT-002',
      method: DeliveryMethod.Express, carrier: '中通快递',
      trackingNo: 'ZT-MKT-001', sender: '物料仓库',
      receiver: '门店', receiverPhone: '13400134001',
      receiverAddress: '门店市场部',
      estimatedAt: '2026-07-30T15:00:00.000Z',
    })

    const updated = svc.updateDelivery(delivery.id, TENANT_ID, {
      trackingNo: 'ZT-MKT-002',
      carrier: '中通快递（加急）',
      estimatedAt: '2026-07-29T12:00:00.000Z',
      remark: '加急配送，请优先处理',
    })
    expect(updated.trackingNo).toBe('ZT-MKT-002')
    expect(updated.estimatedAt).toBe('2026-07-29T12:00:00.000Z')
    expect(updated.remark).toContain('加急')
  })

  it('营销人员可查看在途配送的时效分析 (view in-transit deliveries)', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    const inTransit = svc.listDeliveries(TENANT_ID, { status: DeliveryStatus.InTransit })
    expect(inTransit.length).toBeGreaterThanOrEqual(4)

    // 检查还有多少时间到达
    for (const d of inTransit) {
      expect(d.estimatedAt).toBeDefined()
    }
  })

  it('营销人员可查看已到达待签收配送 (view arrived deliveries)', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    const arrived = svc.listDeliveries(TENANT_ID, { status: DeliveryStatus.Arrived })
    expect(arrived.length).toBeGreaterThanOrEqual(2)
    expect(arrived.every(d => d.status === DeliveryStatus.Arrived)).toBe(true)
  })

  it('营销人员更新不存在的配送应抛错 (update non-existing delivery)', () => {
    const svc = new DeliveryTrackingService()

    expect(() => {
      svc.updateDelivery('nonexistent', TENANT_ID, { carrier: '测试' })
    }).toThrow('Delivery not found')
  })

  it('营销人员创建第三方物流配送单 (create third-party delivery)', () => {
    const svc = new DeliveryTrackingService()

    const delivery = svc.createDelivery({
      tenantId: TENANT_ID, orderNo: 'ORD-MKT-003',
      method: DeliveryMethod.ThirdParty, carrier: '德邦物流',
      trackingNo: 'DB-MKT-001', sender: '上海印刷厂',
      receiver: '门店市场部', receiverPhone: '13300133001',
      receiverAddress: '门店市场部展架区',
      estimatedAt: '2026-08-05T16:00:00.000Z',
      remark: '易碎品，轻拿轻放',
    })
    expect(delivery.method).toBe(DeliveryMethod.ThirdParty)
    expect(delivery.remark).toContain('易碎品')
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🦞 跨角色全流程闭环
// ──────────────────────────────────────────────────────────────────────
describe('🦞 配送追踪跨角色全流程闭环', () => {
  beforeEach(() => {
    const svc = new DeliveryTrackingService()
    svc.resetDeliveryStoresForTests()
  })

  it('🎮导玩员查看配送 → 🤝团建创建物资配送 → 📢营销加急变更 → 🔧安监监控异常', () => {
    const svc = new DeliveryTrackingService()
    svc.seedMockData(TENANT_ID)

    // 1. 🎮导玩员查看所有配送
    const allDeliveries = svc.listDeliveries(TENANT_ID)
    expect(allDeliveries.length).toBeGreaterThanOrEqual(22)

    // 2. 🤝团建创建团建物资配送
    const tbDelivery = svc.createDelivery({
      tenantId: TENANT_ID, orderNo: 'ORD-TB-CYCLE',
      method: DeliveryMethod.Express, carrier: '京东物流',
      trackingNo: 'JD-TB-CYCLE', sender: '户外用品仓库',
      receiver: '团建负责人', receiverPhone: '13700137000',
      receiverAddress: '门店团建活动中心',
      estimatedAt: '2026-08-05T10:00:00.000Z',
      remark: '团建用帐篷及烧烤食材',
    })

    // 3. 📢营销查看配送并加急变更
    svc.updateDelivery(tbDelivery.id, TENANT_ID, {
      estimatedAt: '2026-08-04T10:00:00.000Z',
      remark: '团建物资加急，提前一天送达',
    })
    svc.updateDeliveryStatus(tbDelivery.id, DeliveryStatus.PickedUp, TENANT_ID)
    svc.addEvent({
      deliveryId: tbDelivery.id, status: DeliveryStatus.PickedUp,
      location: '户外用品仓库', description: '已取件，加急处理中',
      timestamp: new Date().toISOString(),
    })

    // 4. 🔧安监检查是否有异常配送
    const failed = svc.listDeliveries(TENANT_ID, { status: DeliveryStatus.Failed })
    // 原有的异常配送
    if (failed.length > 0) {
      const timeline = svc.getTrackingTimeline(failed[0].id, TENANT_ID)
      expect(timeline.length).toBeGreaterThanOrEqual(2)
      expect(timeline[timeline.length - 1].status).toBe(DeliveryStatus.Failed)
    }

    // 5. 验证团建配送的更新状态
    const tbDeliveryDetail = svc.getDelivery(tbDelivery.id, TENANT_ID)
    expect(tbDeliveryDetail!.status).toBe(DeliveryStatus.PickedUp)
    expect(tbDeliveryDetail!.remark).toContain('加急')

    const timeline = svc.getTrackingTimeline(tbDelivery.id, TENANT_ID)
    expect(timeline.length).toBe(1)
    expect(timeline[0].location).toBe('户外用品仓库')
  })
})
