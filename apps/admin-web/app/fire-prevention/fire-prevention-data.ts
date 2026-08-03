export type InspectionStatus = 'pending' | 'in_progress' | 'passed' | 'failed'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface InspectionItem {
  id: string
  area: string
  inspector: string
  scheduledDate: string
  status: InspectionStatus
  riskLevel: RiskLevel
  notes: string
  equipment: string
  lastInspection: string
  actionRequired: string
}

export interface FireInspectionForm {
  area: string
  inspector: string
  scheduledDate: string
  riskLevel: RiskLevel
  equipment: string
  notes: string
}

export interface FirePreventionSnapshotDelivery {
  deliveryMode: 'mock'
  items: InspectionItem[]
  generatedAt: string
}

export const FIRE_STATUS_MAP: Record<
  InspectionStatus,
  { label: string; variant: 'neutral' | 'warning' | 'success' | 'danger' }
> = {
  pending: { label: '待检查', variant: 'neutral' },
  in_progress: { label: '检查中', variant: 'warning' },
  passed: { label: '通过', variant: 'success' },
  failed: { label: '未通过', variant: 'danger' },
}

export const RISK_MAP: Record<
  RiskLevel,
  { label: string; variant: 'neutral' | 'warning' | 'danger' }
> = {
  low: { label: '低风险', variant: 'neutral' },
  medium: { label: '中风险', variant: 'warning' },
  high: { label: '高风险', variant: 'danger' },
}

export const EQUIPMENT_OPTIONS = [
  '灭火器',
  '消防栓',
  '报警器',
  '喷淋系统',
  '疏散指示灯',
  '防火门',
  '排烟系统',
] as const

export const AREA_OPTIONS = [
  '厨房A区',
  '厨房B区',
  '仓库A区',
  '仓库B区',
  '大厅',
  '办公室',
  '停车场',
  '走廊',
  '天台',
] as const

export const INSPECTOR_OPTIONS = ['张三', '李四', '王五', '赵六', '陈七', '刘八'] as const

export const defaultFireInspectionForm: FireInspectionForm = {
  area: '',
  inspector: '',
  scheduledDate: '',
  riskLevel: 'low',
  equipment: '',
  notes: '',
}

export const defaultInspectionItems: InspectionItem[] = AREA_OPTIONS.map((area, index) => ({
  id: `FP-${String(index + 1).padStart(3, '0')}`,
  area,
  inspector: INSPECTOR_OPTIONS[index % INSPECTOR_OPTIONS.length],
  scheduledDate: `2026-08-${String(index + 10).padStart(2, '0')}`,
  status: ['passed', 'passed', 'pending', 'in_progress', 'failed', 'pending', 'passed', 'failed', 'pending'][
    index
  ] as InspectionStatus,
  riskLevel: ['low', 'low', 'medium', 'medium', 'high', 'low', 'medium', 'high', 'low'][index] as RiskLevel,
  notes: index === 4 ? '报警器故障需维修' : index === 0 ? '灭火器正常' : '',
  equipment: EQUIPMENT_OPTIONS[index % EQUIPMENT_OPTIONS.length],
  lastInspection: `2026-06-${String(index + 1).padStart(2, '0')}`,
  actionRequired: index === 4 || index === 7 ? '立即维修' : '',
}))

export function filterFireInspectionItems(
  items: InspectionItem[],
  searchQuery: string,
  statusFilter: InspectionStatus | 'ALL',
  riskFilter: RiskLevel | 'ALL',
) {
  const normalized = searchQuery.trim().toLowerCase()
  return items.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false
    }
    if (riskFilter !== 'ALL' && item.riskLevel !== riskFilter) {
      return false
    }
    if (!normalized) {
      return true
    }
    return [item.id, item.area, item.inspector, item.notes, item.equipment]
      .join(' ')
      .toLowerCase()
      .includes(normalized)
  })
}

export function summarizeFireInspectionStats(items: InspectionItem[]) {
  const total = items.length
  const pending = items.filter((item) => item.status === 'pending').length
  const inProgress = items.filter((item) => item.status === 'in_progress').length
  const passed = items.filter((item) => item.status === 'passed').length
  const failed = items.filter((item) => item.status === 'failed').length
  const highRisk = items.filter((item) => item.riskLevel === 'high').length
  return { total, pending, inProgress, passed, failed, highRisk }
}

export async function mockCreateFireInspection(
  formData: FireInspectionForm,
  seed: number,
): Promise<InspectionItem> {
  return {
    id: `FP-${String(seed).padStart(3, '0')}`,
    area: formData.area,
    inspector: formData.inspector,
    scheduledDate: formData.scheduledDate,
    status: 'pending',
    riskLevel: formData.riskLevel,
    notes: formData.notes,
    equipment: formData.equipment,
    lastInspection: new Date().toISOString().slice(0, 10),
    actionRequired: formData.riskLevel === 'high' ? '立即复检' : '',
  }
}

export async function mockUpdateFireInspection(
  current: InspectionItem,
  formData: FireInspectionForm,
): Promise<InspectionItem> {
  return {
    ...current,
    area: formData.area,
    inspector: formData.inspector,
    scheduledDate: formData.scheduledDate,
    riskLevel: formData.riskLevel,
    notes: formData.notes,
    equipment: formData.equipment,
    actionRequired: formData.riskLevel === 'high' ? '立即复检' : current.actionRequired,
  }
}

export function buildFireInspectionCsv(items: InspectionItem[]) {
  return ['id,area,equipment,status,riskLevel,notes']
    .concat(
      items.map(
        (item) =>
          `${item.id},${item.area},${item.equipment},${FIRE_STATUS_MAP[item.status].label},${RISK_MAP[item.riskLevel].label},${item.notes}`,
      ),
    )
    .join('\n')
}

export async function loadFirePreventionSnapshot(): Promise<FirePreventionSnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    items: defaultInspectionItems,
    generatedAt: new Date().toISOString(),
  }
}
