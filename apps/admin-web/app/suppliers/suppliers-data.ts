import { apiFetchJson } from '../api/_client'

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export interface SupplierItem {
  id: string
  code: string
  name: string
  contactPerson: string
  contactPhone: string
  email: string
  category: SupplierCategory
  status: SupplierStatus
  creditRating: SupplierCredit
  cooperationMonths: number
  totalOrders: number
  totalAmount: number
  defectRate: number
  avgDeliveryDays: number
  address: string
  marketCode: string
  createdBy: string
  createdAt: string
  lastOrderAt: string
}

export type SupplierStatus = 'active' | 'paused' | 'blacklisted' | 'pending_audit'
export type SupplierCategory = 'raw_material' | 'packaging' | 'equipment' | 'logistics' | 'service' | 'others'
export type SupplierCredit = 'AAA' | 'AA' | 'A' | 'B' | 'C'

export interface SuppliersSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'suppliers-api' | 'suppliers-fallback'
  suppliers: SupplierItem[]
  stats: SupplierStats
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const SUPPLIER_STATUS_MAP: Record<
  SupplierStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }
> = {
  active: { label: '合作中', variant: 'success' },
  paused: { label: '暂停合作', variant: 'warning' },
  blacklisted: { label: '黑名单', variant: 'danger' },
  pending_audit: { label: '待审核', variant: 'info' },
}

export const SUPPLIER_CATEGORY_MAP: Record<SupplierCategory, string> = {
  raw_material: '原材料',
  packaging: '包装耗材',
  equipment: '设备',
  logistics: '物流配送',
  service: '服务',
  others: '其他',
}

export const SUPPLIER_CREDIT_MAP: Record<SupplierCredit, { label: string; color: string }> = {
  AAA: { label: 'AAA', color: '#22c55e' },
  AA: { label: 'AA', color: '#34d399' },
  A: { label: 'A', color: '#facc15' },
  B: { label: 'B', color: '#fb923c' },
  C: { label: 'C', color: '#ef4444' },
}

export const SUPPLIER_STATUSES: SupplierStatus[] = ['active', 'paused', 'blacklisted', 'pending_audit']
export const SUPPLIER_CATEGORIES: SupplierCategory[] = [
  'raw_material',
  'packaging',
  'equipment',
  'logistics',
  'service',
  'others',
]

export const SUPPLIER_LIST_SEARCH_FIELDS: (keyof SupplierItem)[] = [
  'name',
  'code',
  'contactPerson',
  'contactPhone',
  'email',
  'category',
  'address',
]

export const SUPPLIER_LIST_COLUMN_KEYS: (keyof SupplierItem)[] = [
  'code',
  'name',
  'category',
  'status',
  'creditRating',
  'contactPerson',
  'totalOrders',
  'totalAmount',
  'defectRate',
  'avgDeliveryDays',
  'lastOrderAt',
]

export const MOCK_SUPPLIERS: SupplierItem[] = [
  { id: 'sp-001', code: 'SUP-001', name: '绿源食品有限公司', contactPerson: '王建国', contactPhone: '13800010001', email: 'wjg@lyfood.com', category: 'raw_material', status: 'active', creditRating: 'AA', cooperationMonths: 36, totalOrders: 142, totalAmount: 3850000, defectRate: 0.8, avgDeliveryDays: 2, address: '北京市大兴区生物医药基地', marketCode: 'cn-mainland', createdBy: '张建国', createdAt: '2023-01-15', lastOrderAt: '2026-06-20' },
  { id: 'sp-002', code: 'SUP-002', name: '鼎盛包装科技有限公司', contactPerson: '李志强', contactPhone: '13800010002', email: 'lzq@dsbz.com', category: 'packaging', status: 'active', creditRating: 'AAA', cooperationMonths: 24, totalOrders: 89, totalAmount: 1260000, defectRate: 0.3, avgDeliveryDays: 3, address: '上海市松江区新桥镇', marketCode: 'cn-mainland', createdBy: '张建国', createdAt: '2023-06-01', lastOrderAt: '2026-06-22' },
  { id: 'sp-003', code: 'SUP-003', name: '海龙物流集团', contactPerson: '陈海', contactPhone: '13800010003', email: 'chenhai@hllog.com', category: 'logistics', status: 'active', creditRating: 'A', cooperationMonths: 48, totalOrders: 520, totalAmount: 7200000, defectRate: 1.2, avgDeliveryDays: 1, address: '广州市白云区太和镇', marketCode: 'cn-mainland', createdBy: '刘强', createdAt: '2022-08-20', lastOrderAt: '2026-06-23' },
  { id: 'sp-004', code: 'SUP-004', name: '鲜生活食材配送', contactPerson: '赵敏', contactPhone: '13800010004', email: 'zhaomin@freshlife.com', category: 'raw_material', status: 'active', creditRating: 'AAA', cooperationMonths: 18, totalOrders: 68, totalAmount: 980000, defectRate: 0.1, avgDeliveryDays: 1, address: '深圳市南山区西丽街道', marketCode: 'cn-mainland', createdBy: '李小红', createdAt: '2024-01-10', lastOrderAt: '2026-06-24' },
  { id: 'sp-005', code: 'SUP-005', name: '锦华设备制造厂', contactPerson: '钱锦华', contactPhone: '13800010005', email: 'qjh@jhdevice.com', category: 'equipment', status: 'paused', creditRating: 'B', cooperationMonths: 12, totalOrders: 6, totalAmount: 450000, defectRate: 5.5, avgDeliveryDays: 15, address: '浙江省宁波市鄞州区', marketCode: 'cn-mainland', createdBy: '陈芳', createdAt: '2024-03-15', lastOrderAt: '2025-11-05' },
  { id: 'sp-006', code: 'SUP-006', name: '嘉华物业管理有限公司', contactPerson: '周建华', contactPhone: '13800010006', email: 'zhoujh@jiahua.com', category: 'service', status: 'pending_audit', creditRating: 'A', cooperationMonths: 0, totalOrders: 0, totalAmount: 0, defectRate: 0, avgDeliveryDays: 0, address: '成都市武侯区天府大道', marketCode: 'cn-mainland', createdBy: '周涛', createdAt: '2026-06-10', lastOrderAt: '-' },
  { id: 'sp-007', code: 'SUP-007', name: '恒达包装材料厂', contactPerson: '李恒', contactPhone: '13800010007', email: 'liheng@hdpack.com', category: 'packaging', status: 'active', creditRating: 'AA', cooperationMonths: 30, totalOrders: 76, totalAmount: 890000, defectRate: 0.6, avgDeliveryDays: 4, address: '江苏省苏州市工业园区', marketCode: 'cn-mainland', createdBy: '张建国', createdAt: '2023-04-01', lastOrderAt: '2026-06-18' },
  { id: 'sp-008', code: 'SUP-008', name: '源广达食材供应链', contactPerson: '孙广源', contactPhone: '13800010008', email: 'sgy@ygdsc.com', category: 'raw_material', status: 'blacklisted', creditRating: 'C', cooperationMonths: 6, totalOrders: 12, totalAmount: 185000, defectRate: 12.3, avgDeliveryDays: 5, address: '湖北省武汉市江汉区', marketCode: 'cn-mainland', createdBy: '赵丽', createdAt: '2024-03-01', lastOrderAt: '2024-09-20' },
  { id: 'sp-009', code: 'SUP-009', name: '星空科技服务有限公司', contactPerson: '林星辰', contactPhone: '13800010009', email: 'linx@starlight.com', category: 'service', status: 'active', creditRating: 'AA', cooperationMonths: 20, totalOrders: 34, totalAmount: 620000, defectRate: 0.4, avgDeliveryDays: 7, address: '北京市海淀区中关村', marketCode: 'cn-mainland', createdBy: '黄志明', createdAt: '2024-02-01', lastOrderAt: '2026-06-15' },
  { id: 'sp-010', code: 'SUP-010', name: 'Global Trade Logistics Inc.', contactPerson: 'John Miller', contactPhone: '14150001001', email: 'jmiller@gtl.com', category: 'logistics', status: 'active', creditRating: 'AAA', cooperationMonths: 60, totalOrders: 410, totalAmount: 15800000, defectRate: 0.2, avgDeliveryDays: 5, address: '200 Mission St, San Francisco, CA', marketCode: 'us-default', createdBy: 'James Smith', createdAt: '2021-07-01', lastOrderAt: '2026-06-24' },
  { id: 'sp-011', code: 'SUP-011', name: 'Eco Pack Solutions Ltd.', contactPerson: 'Sarah Connor', contactPhone: '12120001001', email: 'sconnor@ecopack.com', category: 'packaging', status: 'active', creditRating: 'AA', cooperationMonths: 28, totalOrders: 95, totalAmount: 2100000, defectRate: 0.5, avgDeliveryDays: 6, address: '55 Broadway, New York, NY', marketCode: 'us-default', createdBy: 'Emily Chen', createdAt: '2024-01-05', lastOrderAt: '2026-06-21' },
  { id: 'sp-012', code: 'SUP-012', name: '华北粮油批发市场', contactPerson: '郑大勇', contactPhone: '13800010012', email: 'zdy@hbliang.com', category: 'raw_material', status: 'active', creditRating: 'A', cooperationMonths: 15, totalOrders: 42, totalAmount: 1560000, defectRate: 1.5, avgDeliveryDays: 3, address: '天津市河北区粮库路18号', marketCode: 'cn-mainland', createdBy: '王伟', createdAt: '2024-04-20', lastOrderAt: '2026-06-19' },
  { id: 'sp-013', code: 'SUP-013', name: '西南冷链物流有限公司', contactPerson: '张凯', contactPhone: '13800010013', email: 'zhangk@xnll.com', category: 'logistics', status: 'pending_audit', creditRating: 'A', cooperationMonths: 0, totalOrders: 0, totalAmount: 0, defectRate: 0, avgDeliveryDays: 0, address: '重庆市渝北区回兴街道', marketCode: 'cn-mainland', createdBy: '周涛', createdAt: '2026-06-12', lastOrderAt: '-' },
  { id: 'sp-014', code: 'SUP-014', name: '福瑞德咖啡设备有限公司', contactPerson: '陈福瑞', contactPhone: '13800010014', email: 'cfr@friendcoffee.com', category: 'equipment', status: 'active', creditRating: 'AA', cooperationMonths: 42, totalOrders: 28, totalAmount: 3200000, defectRate: 0.9, avgDeliveryDays: 10, address: '广东省佛山市顺德区', marketCode: 'cn-mainland', createdBy: '杨帆', createdAt: '2022-10-01', lastOrderAt: '2026-06-10' },
  { id: 'sp-015', code: 'SUP-015', name: '悦读文化传媒', contactPerson: '文艺', contactPhone: '13800010015', email: 'wenyi@yuedu.com', category: 'others', status: 'paused', creditRating: 'B', cooperationMonths: 8, totalOrders: 5, totalAmount: 45000, defectRate: 3, avgDeliveryDays: 7, address: '长沙市岳麓区大学城', marketCode: 'cn-mainland', createdBy: '孙静', createdAt: '2024-11-01', lastOrderAt: '2025-08-15' },
  { id: 'sp-016', code: 'SUP-016', name: '欧风烘焙原料进口', contactPerson: '欧阳雪', contactPhone: '13800010016', email: 'oyx@oufeng.com', category: 'raw_material', status: 'active', creditRating: 'AAA', cooperationMonths: 40, totalOrders: 110, totalAmount: 4500000, defectRate: 0.1, avgDeliveryDays: 4, address: '上海市浦东新区外高桥保税区', marketCode: 'cn-mainland', createdBy: '陈芳', createdAt: '2023-01-05', lastOrderAt: '2026-06-23' },
]

export function getSupplierById(id: string): SupplierItem | undefined {
  return MOCK_SUPPLIERS.find((supplier) => supplier.id === id)
}

export interface SupplierStats {
  total: number
  active: number
  paused: number
  pendingAudit: number
  blacklisted: number
  totalOrders: number
  totalAmount: number
  avgDefectRate: number
  avgDeliveryDays: number
  topCategory: string
}

export function computeSupplierStats(items: SupplierItem[]): SupplierStats {
  return {
    total: items.length,
    active: items.filter((item) => item.status === 'active').length,
    paused: items.filter((item) => item.status === 'paused').length,
    pendingAudit: items.filter((item) => item.status === 'pending_audit').length,
    blacklisted: items.filter((item) => item.status === 'blacklisted').length,
    totalOrders: items.reduce((sum, item) => sum + item.totalOrders, 0),
    totalAmount: items.reduce((sum, item) => sum + item.totalAmount, 0),
    avgDefectRate:
      items.length > 0 ? items.reduce((sum, item) => sum + item.defectRate, 0) / items.length : 0,
    avgDeliveryDays:
      items.filter((item) => item.avgDeliveryDays > 0).length > 0
        ? items.filter((item) => item.avgDeliveryDays > 0).reduce((sum, item) => sum + item.avgDeliveryDays, 0) /
          items.filter((item) => item.avgDeliveryDays > 0).length
        : 0,
    topCategory: (() => {
      const counts: Record<string, number> = {}
      items.forEach((item) => {
        counts[item.category] = (counts[item.category] || 0) + 1
      })
      return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? '—'
    })(),
  }
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `${(amount / 10000).toFixed(1)}万`
  if (amount >= 10000) return `${(amount / 10000).toFixed(2)}万`
  return amount.toLocaleString('zh-CN')
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveSuppliersApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return `${DEFAULT_API_ORIGIN}/api/v1/`
  }
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/v1`)
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api/v1`)
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) {
      throw new Error(wrapped.message ?? 'API error')
    }
    return wrapped.data as T
  }
  return payload as T
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeSupplierStatus(value: string): SupplierStatus {
  switch (value) {
    case 'active':
      return 'active'
    case 'paused':
    case 'inactive':
      return 'paused'
    case 'blacklisted':
      return 'blacklisted'
    case 'pending':
    case 'pending_audit':
      return 'pending_audit'
    default:
      return 'active'
  }
}

function normalizeSupplierCategory(value: string): SupplierCategory {
  if (SUPPLIER_CATEGORIES.includes(value as SupplierCategory)) {
    return value as SupplierCategory
  }
  if (value.includes('pack')) return 'packaging'
  if (value.includes('equip')) return 'equipment'
  if (value.includes('log')) return 'logistics'
  if (value.includes('service')) return 'service'
  if (value.includes('raw')) return 'raw_material'
  return 'others'
}

function normalizeSupplierCredit(value: unknown): SupplierCredit {
  if (typeof value === 'string' && ['AAA', 'AA', 'A', 'B', 'C'].includes(value)) {
    return value as SupplierCredit
  }
  const numeric = asNumber(value, 4)
  if (numeric >= 4.8) return 'AAA'
  if (numeric >= 4.2) return 'AA'
  if (numeric >= 3.5) return 'A'
  if (numeric >= 2.5) return 'B'
  return 'C'
}

function normalizeSupplierItem(item: unknown, index: number): SupplierItem {
  const record = asRecord(item)
  return {
    id: asString(record.id, `supplier-${index + 1}`),
    code: asString(record.code, `SUP-${String(index + 1).padStart(3, '0')}`),
    name: asString(record.name, `供应商 ${index + 1}`),
    contactPerson: asString(record.contactPerson, '待补充'),
    contactPhone: asString(record.phone ?? record.contactPhone, '—'),
    email: asString(record.email, '—'),
    category: normalizeSupplierCategory(asString(record.category, 'others')),
    status: normalizeSupplierStatus(asString(record.status, 'active')),
    creditRating: normalizeSupplierCredit(record.rating ?? record.creditRating),
    cooperationMonths: asNumber(record.cooperationMonths, 0),
    totalOrders: asNumber(record.totalOrders, 0),
    totalAmount: asNumber(record.totalAmount, 0),
    defectRate: asNumber(record.defectRate, 0),
    avgDeliveryDays: asNumber(record.avgDeliveryDays, 0),
    address: asString(record.address, '—'),
    marketCode: asString(record.marketCode, 'cn-mainland'),
    createdBy: asString(record.createdBy, 'system'),
    createdAt: asString(record.createdAt, '—'),
    lastOrderAt: asString(record.lastOrderAt, '—'),
  }
}

function getLatestSupplierTimestamp(items: SupplierItem[]): string {
  const values = items.flatMap((item) => [item.lastOrderAt, item.createdAt]).filter((value) => value !== '—')
  return values.sort().at(-1) ?? '—'
}

async function fetchSuppliersFromApi(): Promise<SupplierItem[]> {
  const upstreamUrl = new URL('suppliers', resolveSuppliersApiBaseUrl()).toString()
  const payload = await apiFetchJson<unknown[]>(upstreamUrl)
  return Array.isArray(payload) ? payload.map(normalizeSupplierItem) : []
}

export async function loadSuppliersSnapshot(): Promise<SuppliersSnapshotDelivery> {
  try {
    const suppliers = await fetchSuppliersFromApi()
    return {
      deliveryMode: 'api',
      sourceLabel: 'suppliers-api',
      suppliers,
      stats: computeSupplierStats(suppliers),
      generatedAt: new Date().toISOString(),
      controlPlaneSource: 'loadSuppliersSnapshot -> suppliers',
      businessDataSource: 'suppliers upstream API responses',
      refreshPath: `loadSuppliersSnapshot(${'root'})`,
      note: '当前页面直接消费供应商服务端快照。',
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'suppliers-fallback',
      suppliers: MOCK_SUPPLIERS,
      stats: computeSupplierStats(MOCK_SUPPLIERS),
      generatedAt: getLatestSupplierTimestamp(MOCK_SUPPLIERS),
      controlPlaneSource: 'loadSuppliersSnapshot -> MOCK_SUPPLIERS fallback',
      businessDataSource: 'local supplier samples',
      refreshPath: `loadSuppliersSnapshot(${'root'})`,
      note: '当前页面已回退到本地供应商样本，不可作为闭环复签证据。',
      error: '供应商实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
