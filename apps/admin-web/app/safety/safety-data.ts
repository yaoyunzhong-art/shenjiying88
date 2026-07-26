export type SafetyStatus = 'open' | 'investigating' | 'resolved' | 'closed'
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical'

export interface SafetyRecord {
  id: string
  category: string
  reporter: string
  reportedDate: string
  status: SafetyStatus
  severity: SeverityLevel
  description: string
  location: string
  assignee: string
  resolvedDate: string | null
  actionTaken: string
}

export interface SafetySnapshot {
  deliveryMode: 'snapshot'
  sourceLabel: string
  generatedAt: string
  records: SafetyRecord[]
}

export const STATUS_MAP: Record<SafetyStatus, { label: string; tone: string }> = {
  open: { label: '待处理', tone: 'text-slate-700' },
  investigating: { label: '调查中', tone: 'text-amber-700' },
  resolved: { label: '已解决', tone: 'text-green-700' },
  closed: { label: '已关闭', tone: 'text-slate-500' },
}

export const SEVERITY_MAP: Record<SeverityLevel, { label: string; tone: string }> = {
  low: { label: '低', tone: 'text-slate-700' },
  medium: { label: '中', tone: 'text-amber-700' },
  high: { label: '高', tone: 'text-orange-700' },
  critical: { label: '严重', tone: 'text-red-700' },
}

export function buildSafetyRecords(): SafetyRecord[] {
  const statuses: SafetyStatus[] = ['open', 'investigating', 'resolved', 'closed', 'open', 'resolved', 'closed', 'investigating']
  const severities: SeverityLevel[] = ['low', 'medium', 'high', 'critical', 'low', 'medium', 'high', 'critical']
  const categories = ['电气安全', '消防安全', '食品安全', '设备安全', '环境安全', '人身安全', '信息安全'] as const
  const locations = ['厨房A区', '仓库B区', '大厅', '办公室', '停车场', '配电室', '冷冻库', '天台'] as const
  const reporters = ['电工组', '安保部', '厨房组', '设备组', '行政部门', '运营部'] as const
  const assignees = ['张工', '李工', '王工', '赵工', '陈工', '刘工'] as const

  return Array.from({ length: 12 }, (_, index) => {
    const reportedDate = new Date(Date.now() - index * 86400000).toISOString().split('T')[0] ?? ''
    const status = statuses[index % statuses.length] ?? 'open'
    const resolvedDate =
      status === 'resolved' || status === 'closed'
        ? new Date(Date.now() - Math.max(0, index - 2) * 86400000).toISOString().split('T')[0] ?? ''
        : null

    return {
      id: `SAF-${String(index + 1).padStart(3, '0')}`,
      category: categories[index % categories.length] ?? categories[0],
      reporter: reporters[index % reporters.length] ?? reporters[0],
      reportedDate,
      status,
      severity: severities[index % severities.length] ?? severities[0],
      description: index === 0 ? '配电箱线路老化' : index === 3 ? '天花板漏水有触电风险' : `安全记录 #${index + 1}`,
      location: locations[index % locations.length] ?? locations[0],
      assignee: assignees[index % assignees.length] ?? assignees[0],
      resolvedDate,
      actionTaken: resolvedDate ? (index === 2 ? '已更换老化线路' : '已安排检修') : '',
    }
  })
}

export async function loadSafetySnapshot(): Promise<SafetySnapshot> {
  return {
    deliveryMode: 'snapshot',
    sourceLabel: 'local-safety-snapshot',
    generatedAt: new Date().toISOString(),
    records: buildSafetyRecords(),
  }
}
