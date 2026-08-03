export type LogisticsReservationStatus = 'confirmed' | 'pending' | 'in_progress'
export type ShipmentStatus = 'pending_shipping' | 'in_transit' | 'delivered' | 'abnormal'

export interface LogisticsReservation {
  id: string
  customer: string
  type: string
  people: number
  time: string
  status: LogisticsReservationStatus
  amount: number
  staff: string
}

export interface ShipmentRecord {
  id: string
  trackingNo: string
  supplier: string
  items: string
  quantity: number
  status: ShipmentStatus
  estimatedArrival: string
  carrier: string
}

export interface LogisticsSnapshotSummary {
  reservationCount: number
  confirmedReservations: number
  inProgressReservations: number
  pendingReservations: number
  reservationAmount: number
  pendingShipments: number
  inTransitShipments: number
  deliveredShipments: number
  abnormalShipments: number
}

export interface LogisticsSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-logistics-mock'
  storeId: string
  reservations: LogisticsReservation[]
  shipments: ShipmentRecord[]
  summary: LogisticsSnapshotSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const LOGISTICS_RESERVATIONS: LogisticsReservation[] = [
  {
    id: 'R-01',
    customer: '张三',
    type: '生日派对',
    people: 15,
    time: '2026-07-15 14:00',
    status: 'confirmed',
    amount: 2800,
    staff: '王五',
  },
  {
    id: 'R-02',
    customer: '李四',
    type: '团建',
    people: 30,
    time: '2026-07-16 10:00',
    status: 'confirmed',
    amount: 5000,
    staff: '赵六',
  },
  {
    id: 'R-03',
    customer: '科技公司',
    type: '年会',
    people: 80,
    time: '2026-07-20 18:00',
    status: 'pending',
    amount: 12000,
    staff: '周七',
  },
  {
    id: 'R-04',
    customer: '王五',
    type: '私人聚会',
    people: 8,
    time: '2026-07-14 19:00',
    status: 'in_progress',
    amount: 1500,
    staff: '王五',
  },
]

export const SHIPMENT_RECORDS: ShipmentRecord[] = [
  {
    id: 'S-01',
    trackingNo: 'SF20260701001',
    supplier: '游戏设备供应商',
    items: '街机主板×5',
    quantity: 5,
    status: 'pending_shipping',
    estimatedArrival: '2026-07-22',
    carrier: '顺丰速运',
  },
  {
    id: 'S-02',
    trackingNo: 'SF20260701002',
    supplier: '饮品供应商',
    items: '可乐×200箱',
    quantity: 200,
    status: 'in_transit',
    estimatedArrival: '2026-07-20',
    carrier: '顺丰速运',
  },
  {
    id: 'S-03',
    trackingNo: 'YT20260702001',
    supplier: '装饰材料商',
    items: '气球×500,彩带×100',
    quantity: 600,
    status: 'in_transit',
    estimatedArrival: '2026-07-19',
    carrier: '圆通速递',
  },
  {
    id: 'S-04',
    trackingNo: 'SF20260703001',
    supplier: '办公设备商',
    items: '打印机×2,电脑×3',
    quantity: 5,
    status: 'delivered',
    estimatedArrival: '2026-07-15',
    carrier: '顺丰速运',
  },
  {
    id: 'S-05',
    trackingNo: 'ZTO20260704001',
    supplier: '清洁用品商',
    items: '消毒液×50瓶',
    quantity: 50,
    status: 'delivered',
    estimatedArrival: '2026-07-14',
    carrier: '中通快递',
  },
  {
    id: 'S-06',
    trackingNo: 'SF20260705001',
    supplier: '食品供应商',
    items: '零食大礼包×30',
    quantity: 30,
    status: 'abnormal',
    estimatedArrival: '2026-07-18',
    carrier: '顺丰速运',
  },
  {
    id: 'S-07',
    trackingNo: 'YT20260706001',
    supplier: '广告物料商',
    items: '展架×10,海报×200',
    quantity: 210,
    status: 'pending_shipping',
    estimatedArrival: '2026-07-25',
    carrier: '圆通速递',
  },
]

export function buildLogisticsSummary(
  reservations: LogisticsReservation[],
  shipments: ShipmentRecord[]
): LogisticsSnapshotSummary {
  return {
    reservationCount: reservations.length,
    confirmedReservations: reservations.filter((item) => item.status === 'confirmed').length,
    inProgressReservations: reservations.filter((item) => item.status === 'in_progress').length,
    pendingReservations: reservations.filter((item) => item.status === 'pending').length,
    reservationAmount: reservations.reduce((sum, item) => sum + item.amount, 0),
    pendingShipments: shipments.filter((item) => item.status === 'pending_shipping').length,
    inTransitShipments: shipments.filter((item) => item.status === 'in_transit').length,
    deliveredShipments: shipments.filter((item) => item.status === 'delivered').length,
    abnormalShipments: shipments.filter((item) => item.status === 'abnormal').length,
  }
}

export async function loadLogisticsSnapshot(
  storeId: string
): Promise<LogisticsSnapshot> {
  const reservations = LOGISTICS_RESERVATIONS.map((item) => ({ ...item }))
  const shipments = SHIPMENT_RECORDS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-logistics-mock',
    storeId,
    reservations,
    shipments,
    summary: buildLogisticsSummary(reservations, shipments),
    generatedAt: '2026-07-27T17:10:00.000Z',
    controlPlaneSource:
      'loadLogisticsSnapshot -> LOGISTICS_RESERVATIONS + SHIPMENT_RECORDS + buildLogisticsSummary',
    businessDataSource: 'local logistics samples + derived reservation/shipment counters',
    refreshPath: `LogisticsPage -> loadLogisticsSnapshot(${storeId})`,
    note: '当前门店后勤页消费本地 logistics snapshot loader，已显式暴露来源态与刷新路径，新建预约与物流处置仍为 mock 演示。',
    error: '门店后勤控制面尚未接入实时物流与预约协同上游，当前展示 mock 快照。',
  }
}
