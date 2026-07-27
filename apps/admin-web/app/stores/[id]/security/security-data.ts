export type SecurityAlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type SecurityAlertStatus = 'pending' | 'handled' | 'ignored'
export type CameraState = 'online' | 'offline' | 'error'

export interface SecurityAlert {
  id: string
  type: string
  location: string
  time: string
  severity: SecurityAlertSeverity
  status: SecurityAlertStatus
  handler?: string
  category: string
  resolvedAt?: string
}

export interface CameraStatus {
  id: string
  name: string
  status: CameraState
  lastCheck: string
}

export interface SecurityTimelineItem {
  id: string
  title: string
  subtitle: string
  color: string
}

export interface SecuritySummary {
  totalAlerts: number
  pendingCount: number
  criticalCount: number
  handledCount: number
  cameraOnline: number
  highSeverityRate: number
  handleRate: number
}

export interface SecuritySnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'store-security-mock'
  storeId: string
  alerts: SecurityAlert[]
  cameraStatus: CameraStatus[]
  categories: string[]
  timeline: SecurityTimelineItem[]
  summary: SecuritySummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const SECURITY_ALERTS: SecurityAlert[] = [
  { id: 'AL-001', type: '门禁异常', location: '后门', time: '2026-07-13 23:15', severity: 'high', status: 'pending', category: '门禁' },
  { id: 'AL-002', type: '烟雾告警', location: '机房', time: '2026-07-13 22:00', severity: 'critical', status: 'pending', category: '消防' },
  { id: 'AL-003', type: '监控掉线', location: 'C区', time: '2026-07-13 21:30', severity: 'medium', status: 'handled', handler: '张三', category: '监控', resolvedAt: '2026-07-13 22:10' },
  { id: 'AL-004', type: '异常闯入', location: '仓库', time: '2026-07-13 03:00', severity: 'critical', status: 'handled', handler: '保安队', category: '门禁', resolvedAt: '2026-07-13 03:25' },
  { id: 'AL-005', type: '设备移位', location: 'D区', time: '2026-07-12 18:00', severity: 'low', status: 'ignored', category: '设备' },
  { id: 'AL-006', type: '门未关闭', location: '消防通道', time: '2026-07-12 14:00', severity: 'medium', status: 'pending', category: '门禁' },
  { id: 'AL-007', type: '视频存储告警', location: 'NVR', time: '2026-07-12 10:00', severity: 'high', status: 'handled', handler: '李四', category: '监控', resolvedAt: '2026-07-12 11:30' },
  { id: 'AL-008', type: '异常登录', location: 'POS系统', time: '2026-07-11 23:00', severity: 'high', status: 'pending', category: '系统' },
  { id: 'AL-009', type: '电力波动', location: '总配电室', time: '2026-07-11 15:30', severity: 'medium', status: 'handled', handler: '赵工', category: '电力', resolvedAt: '2026-07-11 16:00' },
  { id: 'AL-010', type: '温感告警', location: '服务器间', time: '2026-07-10 14:00', severity: 'critical', status: 'handled', handler: 'IT部', category: '环境', resolvedAt: '2026-07-10 14:20' },
  { id: 'AL-011', type: 'UPS告警', location: '弱电间', time: '2026-07-10 08:00', severity: 'high', status: 'ignored', category: '电力' },
  { id: 'AL-012', type: '巡更超时', location: 'B区', time: '2026-07-09 22:00', severity: 'low', status: 'handled', handler: '王五', category: '巡检', resolvedAt: '2026-07-09 22:10' },
]

export const CAMERA_STATUS: CameraStatus[] = [
  { id: 'CAM-01', name: '入口', status: 'online', lastCheck: '1分钟前' },
  { id: 'CAM-02', name: '收银台', status: 'online', lastCheck: '30秒前' },
  { id: 'CAM-03', name: 'A区', status: 'online', lastCheck: '2分钟前' },
  { id: 'CAM-04', name: 'B区', status: 'offline', lastCheck: '15分钟前' },
  { id: 'CAM-05', name: 'C区', status: 'online', lastCheck: '1分钟前' },
  { id: 'CAM-06', name: '仓库', status: 'online', lastCheck: '3分钟前' },
  { id: 'CAM-07', name: '出口', status: 'error', lastCheck: '5分钟前' },
  { id: 'CAM-08', name: '机房', status: 'online', lastCheck: '30秒前' },
]

const TIMELINE_COLORS: Record<SecurityAlertSeverity, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'default',
}

export function buildSecuritySummary(
  alerts: SecurityAlert[],
  cameraStatus: CameraStatus[]
): SecuritySummary {
  const pendingCount = alerts.filter((item) => item.status === 'pending').length
  const criticalCount = alerts.filter((item) => item.severity === 'critical').length
  const handledCount = alerts.filter((item) => item.status === 'handled').length
  const cameraOnline = cameraStatus.filter((item) => item.status === 'online').length
  const highSeverity = alerts.filter(
    (item) => item.severity === 'high' || item.severity === 'critical'
  ).length

  return {
    totalAlerts: alerts.length,
    pendingCount,
    criticalCount,
    handledCount,
    cameraOnline,
    highSeverityRate: alerts.length ? Math.round((highSeverity / alerts.length) * 100) : 0,
    handleRate: alerts.length ? Math.round((handledCount / alerts.length) * 100) : 0,
  }
}

export function buildSecurityTimeline(
  alerts: SecurityAlert[]
): SecurityTimelineItem[] {
  return alerts
    .filter((item) => item.status === 'handled' && item.handler)
    .sort((left, right) => right.time.localeCompare(left.time))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: `${item.type} - ${item.location}`,
      subtitle: `${item.handler} · ${item.resolvedAt ?? item.time}`,
      color: TIMELINE_COLORS[item.severity],
    }))
}

export async function loadSecuritySnapshot(
  storeId: string
): Promise<SecuritySnapshot> {
  const alerts = SECURITY_ALERTS.map((item) => ({ ...item }))
  const cameraStatus = CAMERA_STATUS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'mock',
    sourceLabel: 'store-security-mock',
    storeId,
    alerts,
    cameraStatus,
    categories: [...new Set(alerts.map((item) => item.category))],
    timeline: buildSecurityTimeline(alerts),
    summary: buildSecuritySummary(alerts, cameraStatus),
    generatedAt: '2026-07-27T16:30:00.000Z',
    controlPlaneSource:
      'loadSecuritySnapshot -> SECURITY_ALERTS + CAMERA_STATUS + buildSecuritySummary',
    businessDataSource: 'local security alerts + camera status snapshots',
    refreshPath: `SecurityPage -> loadSecuritySnapshot(${storeId})`,
    note: '当前门店安防页消费本地 security snapshot loader，已显式暴露来源态、刷新路径与 mock 边界，不作为实时安防处置凭据。',
    error: '门店安防控制面尚未接入实时告警总线，当前展示 mock 快照。',
  }
}
