export type ReservationStatus = 'confirmed' | 'pending' | 'cancelled'

export interface ReservationRecord {
  id: string
  customer: string
  type: string
  date: string
  time: string
  people: number
  status: ReservationStatus
  phone: string
  source: string
}

export interface ReservationSnapshotSummary {
  totalCount: number
  confirmedCount: number
  pendingCount: number
  cancelledCount: number
  totalPeople: number
}

export interface ReservationsSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-reservations-mock'
  storeId: string
  reservations: ReservationRecord[]
  summary: ReservationSnapshotSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const RESERVATION_RECORDS: ReservationRecord[] = [
  { id: 'R001', customer: '张明', type: '生日派对', date: '2026-07-15', time: '14:00-17:00', people: 15, status: 'confirmed', phone: '138****8888', source: '小程序' },
  { id: 'R002', customer: '公司团建（TechCo）', type: '团建活动', date: '2026-07-16', time: '10:00-16:00', people: 28, status: 'confirmed', phone: '139****0000', source: '电话' },
  { id: 'R003', customer: '李芳', type: 'VR体验', date: '2026-07-13', time: '10:00-12:00', people: 3, status: 'pending', phone: '136****6666', source: '小程序' },
  { id: 'R004', customer: '王明', type: '台球', date: '2026-07-14', time: '15:00-18:00', people: 4, status: 'confirmed', phone: '137****2222', source: '到店' },
  { id: 'R005', customer: '赵华', type: '电竞包间', date: '2026-07-17', time: '19:00-23:00', people: 10, status: 'pending', phone: '135****1111', source: '电话' },
  { id: 'R006', customer: '少儿培训', type: '体验', date: '2026-07-18', time: '09:00-12:00', people: 20, status: 'cancelled', phone: '133****3333', source: '小程序' },
  { id: 'R007', customer: '刘伟', type: '会员活动', date: '2026-07-19', time: '14:00-17:00', people: 8, status: 'confirmed', phone: '132****5555', source: '到店' },
  { id: 'R008', customer: '陈静', type: 'VR体验', date: '2026-07-20', time: '15:00-16:00', people: 2, status: 'confirmed', phone: '131****7777', source: '小程序' },
]

export function buildReservationsSummary(
  reservations: ReservationRecord[]
): ReservationSnapshotSummary {
  return {
    totalCount: reservations.length,
    confirmedCount: reservations.filter((item) => item.status === 'confirmed').length,
    pendingCount: reservations.filter((item) => item.status === 'pending').length,
    cancelledCount: reservations.filter((item) => item.status === 'cancelled').length,
    totalPeople: reservations.reduce((sum, item) => sum + item.people, 0),
  }
}

export async function loadReservationsSnapshot(
  storeId: string
): Promise<ReservationsSnapshot> {
  const reservations = RESERVATION_RECORDS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-reservations-mock',
    storeId,
    reservations,
    summary: buildReservationsSummary(reservations),
    generatedAt: '2026-07-27T16:20:00.000Z',
    controlPlaneSource: 'loadReservationsSnapshot -> RESERVATION_RECORDS + buildReservationsSummary',
    businessDataSource: 'local reservations samples + derived reservation counters',
    refreshPath: `ReservationsPage -> loadReservationsSnapshot(${storeId})`,
    note: '当前门店预约页消费本地 reservations snapshot loader，已显式暴露来源态与刷新路径，创建、确认与取消仍为 mock 演示。',
    error: '门店预约控制面尚未接入实时预约中台，当前展示 mock 快照。',
  }
}
