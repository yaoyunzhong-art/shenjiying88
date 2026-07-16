import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  DeliveryMethod,
  DeliveryStatus,
  type DeliveryEvent,
  type DeliveryRecord,
} from './delivery-tracking.entity'

// ── In-memory stores ──

const deliveryStore = new Map<string, DeliveryRecord>()
const eventStore = new Map<string, DeliveryEvent>()

function generateDeliveryNo(): string {
  const prefix = 'DL'
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `${prefix}${date}${seq}`
}

@Injectable()
export class DeliveryTrackingService {
  // ═══════════════════════════════════════════════════════════════════
  // Delivery CRUD
  // ═══════════════════════════════════════════════════════════════════

  createDelivery(input: {
    tenantId: string
    orderNo: string
    method: DeliveryMethod
    carrier: string
    trackingNo: string
    sender: string
    receiver: string
    receiverPhone: string
    receiverAddress: string
    estimatedAt: string
    remark?: string
  }): DeliveryRecord {
    const now = new Date().toISOString()
    const delivery: DeliveryRecord = {
      id: `delivery-${randomUUID()}`,
      deliveryNo: generateDeliveryNo(),
      orderNo: input.orderNo,
      method: input.method,
      status: DeliveryStatus.Pending,
      carrier: input.carrier,
      trackingNo: input.trackingNo,
      sender: input.sender,
      receiver: input.receiver,
      receiverPhone: input.receiverPhone,
      receiverAddress: input.receiverAddress,
      estimatedAt: input.estimatedAt,
      remark: input.remark,
      tenantId: input.tenantId,
      createdAt: now,
    }
    deliveryStore.set(delivery.id, delivery)
    return delivery
  }

  getDelivery(deliveryId: string, tenantId: string): DeliveryRecord | undefined {
    const d = deliveryStore.get(deliveryId)
    if (!d || d.tenantId !== tenantId) return undefined
    return d
  }

  listDeliveries(
    tenantId: string,
    filters?: {
      status?: DeliveryStatus
      method?: DeliveryMethod
      orderNo?: string
    },
  ): DeliveryRecord[] {
    const all = Array.from(deliveryStore.values())
    return all.filter((d) => {
      if (d.tenantId !== tenantId) return false
      if (filters?.status && d.status !== filters.status) return false
      if (filters?.method && d.method !== filters.method) return false
      if (filters?.orderNo && d.orderNo !== filters.orderNo) return false
      return true
    })
  }

  updateDelivery(
    deliveryId: string,
    tenantId: string,
    input: {
      method?: DeliveryMethod
      carrier?: string
      trackingNo?: string
      sender?: string
      receiver?: string
      receiverPhone?: string
      receiverAddress?: string
      estimatedAt?: string
      remark?: string
    },
  ): DeliveryRecord {
    const delivery = this.getDelivery(deliveryId, tenantId)
    if (!delivery) {
      throw new Error(`Delivery not found: ${deliveryId}`)
    }
    const updated: DeliveryRecord = {
      ...delivery,
      method: input.method ?? delivery.method,
      carrier: input.carrier ?? delivery.carrier,
      trackingNo: input.trackingNo ?? delivery.trackingNo,
      sender: input.sender ?? delivery.sender,
      receiver: input.receiver ?? delivery.receiver,
      receiverPhone: input.receiverPhone ?? delivery.receiverPhone,
      receiverAddress: input.receiverAddress ?? delivery.receiverAddress,
      estimatedAt: input.estimatedAt ?? delivery.estimatedAt,
      remark: input.remark !== undefined ? input.remark : delivery.remark,
    }
    deliveryStore.set(deliveryId, updated)
    return updated
  }

  updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    tenantId: string,
    remark?: string,
  ): DeliveryRecord {
    const delivery = this.getDelivery(deliveryId, tenantId)
    if (!delivery) {
      throw new Error(`Delivery not found: ${deliveryId}`)
    }
    const updated: DeliveryRecord = {
      ...delivery,
      status,
      deliveredAt:
        status === DeliveryStatus.Delivered || status === DeliveryStatus.Failed
          ? new Date().toISOString()
          : delivery.deliveredAt,
      remark: remark !== undefined ? remark : delivery.remark,
    }
    deliveryStore.set(deliveryId, updated)
    return updated
  }

  // ═══════════════════════════════════════════════════════════════════
  // Delivery Events
  // ═══════════════════════════════════════════════════════════════════

  addEvent(input: {
    deliveryId: string
    status: DeliveryStatus
    location: string
    description: string
    timestamp: string
  }): DeliveryEvent {
    const event: DeliveryEvent = {
      id: `event-${randomUUID()}`,
      deliveryId: input.deliveryId,
      status: input.status,
      location: input.location,
      description: input.description,
      timestamp: input.timestamp,
    }
    eventStore.set(event.id, event)
    return event
  }

  getTrackingTimeline(deliveryId: string, tenantId: string): DeliveryEvent[] {
    const delivery = this.getDelivery(deliveryId, tenantId)
    if (!delivery) return []
    const events = Array.from(eventStore.values())
    return events
      .filter((e) => e.deliveryId === deliveryId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }

  // ═══════════════════════════════════════════════════════════════════
  // Mock Seeding
  // ═══════════════════════════════════════════════════════════════════

  seedMockData(tenantId: string): void {
    const now = new Date()
    const mockDeliveries: Array<{
      orderNo: string
      method: DeliveryMethod
      status: DeliveryStatus
      carrier: string
      trackingNo: string
      sender: string
      receiver: string
      receiverPhone: string
      receiverAddress: string
      estimatedAt: string
      remark?: string
      events: Array<{ status: DeliveryStatus; location: string; description: string; offsetHours: number }>
    }> = [
      {
        orderNo: 'ORD-2026-0001',
        method: DeliveryMethod.Courier,
        status: DeliveryStatus.Delivered,
        carrier: '顺丰速运',
        trackingNo: 'SF1234567890',
        sender: '上海仓储中心',
        receiver: '张三',
        receiverPhone: '13800138001',
        receiverAddress: '北京市朝阳区建国路88号',
        estimatedAt: '2026-07-10T18:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '上海仓储中心', description: '订单已创建，等待取件', offsetHours: -48 },
          { status: DeliveryStatus.PickedUp, location: '上海仓储中心', description: '快递员已取件', offsetHours: -36 },
          { status: DeliveryStatus.InTransit, location: '上海中转站', description: '包裹已到达上海中转站', offsetHours: -24 },
          { status: DeliveryStatus.InTransit, location: '北京中转站', description: '包裹已到达北京中转站', offsetHours: -12 },
          { status: DeliveryStatus.Arrived, location: '北京朝阳配送站', description: '包裹已到达配送站，准备派送', offsetHours: -6 },
          { status: DeliveryStatus.Delivered, location: '北京市朝阳区建国路88号', description: '已签收，签收人：张三', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0002',
        method: DeliveryMethod.Express,
        status: DeliveryStatus.InTransit,
        carrier: '中通快递',
        trackingNo: 'ZT9876543210',
        sender: '深圳工厂',
        receiver: '李四',
        receiverPhone: '13900139002',
        receiverAddress: '上海市浦东新区陆家嘴金融中心12F',
        estimatedAt: '2026-07-17T12:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '深圳工厂', description: '订单已创建', offsetHours: -36 },
          { status: DeliveryStatus.PickedUp, location: '深圳工厂', description: '已取件', offsetHours: -24 },
          { status: DeliveryStatus.InTransit, location: '广州分拨中心', description: '包裹正在广州分拨中心处理', offsetHours: -12 },
        ],
      },
      {
        orderNo: 'ORD-2026-0003',
        method: DeliveryMethod.SelfPickup,
        status: DeliveryStatus.Pending,
        carrier: '门店自提',
        trackingNo: 'SP-202607-001',
        sender: '成都万象城店',
        receiver: '王五',
        receiverPhone: '13700137003',
        receiverAddress: '成都市锦江区春熙路100号',
        estimatedAt: '2026-07-18T20:00:00.000Z',
        remark: '请携带身份证取件',
        events: [
          { status: DeliveryStatus.Pending, location: '成都万象城店', description: '订单已创建，等待到店自提', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0004',
        method: DeliveryMethod.Courier,
        status: DeliveryStatus.Arrived,
        carrier: '京东物流',
        trackingNo: 'JD5555555555',
        sender: '广州番禺仓库',
        receiver: '赵六',
        receiverPhone: '13600136004',
        receiverAddress: '广州市天河区体育西路100号',
        estimatedAt: '2026-07-16T14:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '广州番禺仓库', description: '订单已创建', offsetHours: -72 },
          { status: DeliveryStatus.PickedUp, location: '广州番禺仓库', description: '已取件', offsetHours: -60 },
          { status: DeliveryStatus.InTransit, location: '广州分拣中心', description: '包裹正在分拣', offsetHours: -48 },
          { status: DeliveryStatus.Arrived, location: '广州天河配送站', description: '包裹已到达配送站', offsetHours: -12 },
        ],
      },
      {
        orderNo: 'ORD-2026-0005',
        method: DeliveryMethod.Express,
        status: DeliveryStatus.Delivered,
        carrier: '圆通速递',
        trackingNo: 'YT1111111111',
        sender: '杭州电商仓',
        receiver: '孙七',
        receiverPhone: '13500135005',
        receiverAddress: '杭州市西湖区文三路500号',
        estimatedAt: '2026-07-08T16:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '杭州电商仓', description: '订单已创建', offsetHours: -96 },
          { status: DeliveryStatus.PickedUp, location: '杭州电商仓', description: '已取件', offsetHours: -84 },
          { status: DeliveryStatus.InTransit, location: '杭州中转站', description: '包裹已到达杭州中转站', offsetHours: -72 },
          { status: DeliveryStatus.InTransit, location: '杭州滨江分拣中心', description: '包裹正在分拣', offsetHours: -48 },
          { status: DeliveryStatus.Arrived, location: '杭州西湖配送站', description: '包裹已到达配送站', offsetHours: -24 },
          { status: DeliveryStatus.Delivered, location: '杭州市西湖区文三路500号', description: '已签收（前台代收）', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0006',
        method: DeliveryMethod.ThirdParty,
        status: DeliveryStatus.Failed,
        carrier: '韵达快递',
        trackingNo: 'YD2222222222',
        sender: '北京总部仓库',
        receiver: '周八',
        receiverPhone: '13400134006',
        receiverAddress: '深圳市南山区科技园南路1号',
        estimatedAt: '2026-07-12T10:00:00.000Z',
        remark: '联系不上收件人',
        events: [
          { status: DeliveryStatus.Pending, location: '北京总部仓库', description: '订单已创建', offsetHours: -120 },
          { status: DeliveryStatus.PickedUp, location: '北京总部仓库', description: '已取件', offsetHours: -108 },
          { status: DeliveryStatus.InTransit, location: '北京大兴中转站', description: '包裹已到达中转站', offsetHours: -96 },
          { status: DeliveryStatus.InTransit, location: '深圳宝安中转站', description: '包裹已到达深圳中转站', offsetHours: -48 },
          { status: DeliveryStatus.Arrived, location: '深圳南山配送站', description: '包裹已到达配送站', offsetHours: -24 },
          { status: DeliveryStatus.Failed, location: '深圳市南山区科技园南路1号', description: '派送失败，收件人电话无人接听', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0007',
        method: DeliveryMethod.Courier,
        status: DeliveryStatus.PickedUp,
        carrier: '顺丰速运',
        trackingNo: 'SF3333333333',
        sender: '武汉光谷仓库',
        receiver: '郑九',
        receiverPhone: '13300133007',
        receiverAddress: '武汉市洪山区珞喻路1037号',
        estimatedAt: '2026-07-19T15:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '武汉光谷仓库', description: '订单已创建', offsetHours: -12 },
          { status: DeliveryStatus.PickedUp, location: '武汉光谷仓库', description: '已取件', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0008',
        method: DeliveryMethod.Express,
        status: DeliveryStatus.Delivered,
        carrier: '申通快递',
        trackingNo: 'ST4444444444',
        sender: '南京中央仓',
        receiver: '陈十',
        receiverPhone: '13200132008',
        receiverAddress: '南京市鼓楼区中央路32号',
        estimatedAt: '2026-07-06T14:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '南京中央仓', description: '订单已创建', offsetHours: -72 },
          { status: DeliveryStatus.PickedUp, location: '南京中央仓', description: '已取件', offsetHours: -60 },
          { status: DeliveryStatus.InTransit, location: '南京中转站', description: '包裹已到达南京中转站', offsetHours: -48 },
          { status: DeliveryStatus.Arrived, location: '南京鼓楼配送站', description: '包裹已到达配送站', offsetHours: -24 },
          { status: DeliveryStatus.Delivered, location: '南京市鼓楼区中央路32号', description: '已签收，签收人：陈十', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0009',
        method: DeliveryMethod.ThirdParty,
        status: DeliveryStatus.InTransit,
        carrier: '跨越速运',
        trackingNo: 'KY6666666666',
        sender: '重庆工厂',
        receiver: '林一',
        receiverPhone: '13100131009',
        receiverAddress: '重庆市渝中区解放碑街道88号',
        estimatedAt: '2026-07-18T18:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '重庆工厂', description: '订单已创建', offsetHours: -48 },
          { status: DeliveryStatus.PickedUp, location: '重庆工厂', description: '已取件', offsetHours: -36 },
          { status: DeliveryStatus.InTransit, location: '重庆中转站', description: '包裹已到达重庆中转站', offsetHours: -24 },
        ],
      },
      {
        orderNo: 'ORD-2026-0010',
        method: DeliveryMethod.SelfPickup,
        status: DeliveryStatus.Delivered,
        carrier: '门店自提',
        trackingNo: 'SP-202607-002',
        sender: '西安赛格店',
        receiver: '刘二',
        receiverPhone: '13000130010',
        receiverAddress: '西安市雁塔区长安中路100号',
        estimatedAt: '2026-07-05T21:00:00.000Z',
        remark: '已自提完成',
        events: [
          { status: DeliveryStatus.Pending, location: '西安赛格店', description: '订单已创建', offsetHours: -48 },
          { status: DeliveryStatus.Delivered, location: '西安赛格店', description: '已到店自提取走', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0011',
        method: DeliveryMethod.Courier,
        status: DeliveryStatus.Pending,
        carrier: '极兔速递',
        trackingNo: 'JT7777777777',
        sender: '广州白云仓',
        receiver: '吴三',
        receiverPhone: '15900159011',
        receiverAddress: '广州市白云区白云大道北100号',
        estimatedAt: '2026-07-20T12:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '广州白云仓', description: '订单已创建，等待取件', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0012',
        method: DeliveryMethod.Express,
        status: DeliveryStatus.InTransit,
        carrier: '德邦快递',
        trackingNo: 'DB8888888888',
        sender: '郑州物流中心',
        receiver: '黄四',
        receiverPhone: '15800158012',
        receiverAddress: '郑州市金水区花园路39号',
        estimatedAt: '2026-07-17T16:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '郑州物流中心', description: '订单已创建', offsetHours: -24 },
          { status: DeliveryStatus.PickedUp, location: '郑州物流中心', description: '已取件', offsetHours: -18 },
          { status: DeliveryStatus.InTransit, location: '郑州分拨中心', description: '包裹正在分拨中心处理', offsetHours: -6 },
        ],
      },
      {
        orderNo: 'ORD-2026-0013',
        method: DeliveryMethod.ThirdParty,
        status: DeliveryStatus.Failed,
        carrier: '安能物流',
        trackingNo: 'AN9999999999',
        sender: '长沙仓库',
        receiver: '何五',
        receiverPhone: '15700157013',
        receiverAddress: '长沙市天心区五一大道100号',
        estimatedAt: '2026-07-14T10:00:00.000Z',
        remark: '地址不正确，退回中',
        events: [
          { status: DeliveryStatus.Pending, location: '长沙仓库', description: '订单已创建', offsetHours: -120 },
          { status: DeliveryStatus.PickedUp, location: '长沙仓库', description: '已取件', offsetHours: -108 },
          { status: DeliveryStatus.InTransit, location: '长沙中转站', description: '包裹已到达长沙中转站', offsetHours: -96 },
          { status: DeliveryStatus.Arrived, location: '长沙天心配送站', description: '包裹已到达配送站', offsetHours: -48 },
          { status: DeliveryStatus.Failed, location: '长沙市天心区五一大道100号', description: '派送失败，地址不存在', offsetHours: -24 },
          { status: DeliveryStatus.InTransit, location: '长沙中转站', description: '退回中，已离开配送站', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0014',
        method: DeliveryMethod.Courier,
        status: DeliveryStatus.Delivered,
        carrier: '顺丰速运',
        trackingNo: 'SF0000000001',
        sender: '厦门海沧仓',
        receiver: '马六',
        receiverPhone: '15600156014',
        receiverAddress: '厦门市思明区中山路200号',
        estimatedAt: '2026-07-03T16:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '厦门海沧仓', description: '订单已创建', offsetHours: -72 },
          { status: DeliveryStatus.PickedUp, location: '厦门海沧仓', description: '已取件', offsetHours: -60 },
          { status: DeliveryStatus.InTransit, location: '厦门中转站', description: '包裹已到达中转站', offsetHours: -48 },
          { status: DeliveryStatus.Arrived, location: '厦门思明配送站', description: '包裹已到达配送站', offsetHours: -24 },
          { status: DeliveryStatus.Delivered, location: '厦门市思明区中山路200号', description: '已签收', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0015',
        method: DeliveryMethod.Express,
        status: DeliveryStatus.PickedUp,
        carrier: '中通快递',
        trackingNo: 'ZT0000000002',
        sender: '合肥工厂',
        receiver: '朱七',
        receiverPhone: '15500155015',
        receiverAddress: '合肥市蜀山区黄山路100号',
        estimatedAt: '2026-07-20T14:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '合肥工厂', description: '订单已创建', offsetHours: -6 },
          { status: DeliveryStatus.PickedUp, location: '合肥工厂', description: '已取件', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0016',
        method: DeliveryMethod.Courier,
        status: DeliveryStatus.Arrived,
        carrier: '京东物流',
        trackingNo: 'JD0000000003',
        sender: '无锡仓库',
        receiver: '杨八',
        receiverPhone: '15400154016',
        receiverAddress: '无锡市梁溪区中山路500号',
        estimatedAt: '2026-07-16T10:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '无锡仓库', description: '订单已创建', offsetHours: -48 },
          { status: DeliveryStatus.PickedUp, location: '无锡仓库', description: '已取件', offsetHours: -36 },
          { status: DeliveryStatus.InTransit, location: '无锡中转站', description: '包裹已到达中转站', offsetHours: -24 },
          { status: DeliveryStatus.Arrived, location: '无锡梁溪配送站', description: '包裹已到达配送站', offsetHours: -4 },
        ],
      },
      {
        orderNo: 'ORD-2026-0017',
        method: DeliveryMethod.Express,
        status: DeliveryStatus.Delivered,
        carrier: '圆通速递',
        trackingNo: 'YT0000000004',
        sender: '福州仓山仓',
        receiver: '秦九',
        receiverPhone: '15300153017',
        receiverAddress: '福州市鼓楼区东街100号',
        estimatedAt: '2026-07-07T15:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '福州仓山仓', description: '订单已创建', offsetHours: -96 },
          { status: DeliveryStatus.PickedUp, location: '福州仓山仓', description: '已取件', offsetHours: -84 },
          { status: DeliveryStatus.InTransit, location: '福州中转站', description: '包裹已到达中转站', offsetHours: -72 },
          { status: DeliveryStatus.Arrived, location: '福州鼓楼配送站', description: '包裹已到达配送站', offsetHours: -24 },
          { status: DeliveryStatus.Delivered, location: '福州市鼓楼区东街100号', description: '已签收', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0018',
        method: DeliveryMethod.ThirdParty,
        status: DeliveryStatus.Pending,
        carrier: '韵达快递',
        trackingNo: 'YD0000000005',
        sender: '天津武清仓',
        receiver: '许十',
        receiverPhone: '15200152018',
        receiverAddress: '天津市和平区南京路200号',
        estimatedAt: '2026-07-21T18:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '天津武清仓', description: '订单已创建，等待取件', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0019',
        method: DeliveryMethod.Courier,
        status: DeliveryStatus.InTransit,
        carrier: '顺丰速运',
        trackingNo: 'SF0000000006',
        sender: '昆明仓库',
        receiver: '韩一',
        receiverPhone: '15100151019',
        receiverAddress: '昆明市五华区人民中路100号',
        estimatedAt: '2026-07-19T14:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '昆明仓库', description: '订单已创建', offsetHours: -30 },
          { status: DeliveryStatus.PickedUp, location: '昆明仓库', description: '已取件', offsetHours: -24 },
          { status: DeliveryStatus.InTransit, location: '昆明中转站', description: '包裹已到达昆明中转站', offsetHours: -12 },
        ],
      },
      {
        orderNo: 'ORD-2026-0020',
        method: DeliveryMethod.SelfPickup,
        status: DeliveryStatus.Delivered,
        carrier: '门店自提',
        trackingNo: 'SP-202607-003',
        sender: '哈尔滨中央大街店',
        receiver: '曹二',
        receiverPhone: '15000150020',
        receiverAddress: '哈尔滨市道里区中央大街50号',
        estimatedAt: '2026-07-04T20:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '哈尔滨中央大街店', description: '订单已创建', offsetHours: -24 },
          { status: DeliveryStatus.Delivered, location: '哈尔滨中央大街店', description: '已到店自提取走', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0021',
        method: DeliveryMethod.Courier,
        status: DeliveryStatus.PickedUp,
        carrier: '极兔速递',
        trackingNo: 'JT1111111111',
        sender: '东莞厚街仓',
        receiver: '谢三',
        receiverPhone: '14900149021',
        receiverAddress: '东莞市南城区鸿福路200号',
        estimatedAt: '2026-07-20T10:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '东莞厚街仓', description: '订单已创建', offsetHours: -8 },
          { status: DeliveryStatus.PickedUp, location: '东莞厚街仓', description: '已取件', offsetHours: 0 },
        ],
      },
      {
        orderNo: 'ORD-2026-0022',
        method: DeliveryMethod.Express,
        status: DeliveryStatus.InTransit,
        carrier: '申通快递',
        trackingNo: 'ST2222222222',
        sender: '青岛黄岛仓',
        receiver: '彭四',
        receiverPhone: '14800148022',
        receiverAddress: '青岛市市南区香港中路100号',
        estimatedAt: '2026-07-18T16:00:00.000Z',
        events: [
          { status: DeliveryStatus.Pending, location: '青岛黄岛仓', description: '订单已创建', offsetHours: -48 },
          { status: DeliveryStatus.PickedUp, location: '青岛黄岛仓', description: '已取件', offsetHours: -36 },
          { status: DeliveryStatus.InTransit, location: '青岛分拨中心', description: '包裹正在分拨中心处理', offsetHours: -24 },
        ],
      },
    ]

    for (const m of mockDeliveries) {
      const delivery = this.createDelivery({
        tenantId,
        orderNo: m.orderNo,
        method: m.method,
        carrier: m.carrier,
        trackingNo: m.trackingNo,
        sender: m.sender,
        receiver: m.receiver,
        receiverPhone: m.receiverPhone,
        receiverAddress: m.receiverAddress,
        estimatedAt: m.estimatedAt,
        remark: m.remark,
      })

      // Override status after creation
      delivery.status = m.status
      deliveryStore.set(delivery.id, delivery)

      for (const ev of m.events) {
        const ts = new Date(now.getTime() + ev.offsetHours * 60 * 60 * 1000).toISOString()
        this.addEvent({
          deliveryId: delivery.id,
          status: ev.status,
          location: ev.location,
          description: ev.description,
          timestamp: ts,
        })
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test Helpers
  // ═══════════════════════════════════════════════════════════════════

  resetDeliveryStoresForTests(): void {
    deliveryStore.clear()
    eventStore.clear()
  }
}
