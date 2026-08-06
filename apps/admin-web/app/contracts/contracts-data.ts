import { apiFetchJson, apiFetch } from '../api/_client'

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export type ContractType = 'sales' | 'procurement' | 'service' | 'lease'
export type ContractStatus = 'pending_sign' | 'in_progress' | 'expired' | 'completed'
export type ContractTabKey = 'all' | 'pending_sign' | 'in_progress' | 'expired'

interface BackendContractRecord {
  id: string
  contractNo?: string
  name?: string
  type?: string
  status?: string
  partyA?: string
  partyB?: string
  amount?: number
  startDate?: string
  endDate?: string
  signedDate?: string
  fileName?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface ContractRecord {
  id: string
  upstreamId: string
  type: ContractType
  title: string
  partyA: string
  partyB: string
  amount: number
  status: ContractStatus
  signedAt: string
  expiresAt: string
  updatedAt: string
  description: string
  comment: string
}

export interface ContractsSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'contracts-api' | 'contracts-fallback'
  contracts: ContractRecord[]
  generatedAt: string
  error?: string
}

export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  sales: '销售合同',
  procurement: '采购合同',
  service: '服务合同',
  lease: '租赁合同',
}

export const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  pending_sign: '待签',
  in_progress: '执行中',
  expired: '已到期',
  completed: '已完成',
}

export const defaultContracts: ContractRecord[] = [
  { id: 'CT-001', upstreamId: 'CT-001', type: 'sales', title: '北京朝阳店设备销售合同', partyA: '我方', partyB: '北京朝阳科技有限公司', amount: 350000, status: 'pending_sign', signedAt: '', expiresAt: '2026-10-18', updatedAt: '2026-07-18T09:00:00', description: '销售 2 条全自动生产线及相关配件', comment: '' },
  { id: 'CT-002', upstreamId: 'CT-002', type: 'procurement', title: '上海浦东原材料采购合同', partyA: '上海浦东原材料供应商', partyB: '我方', amount: 128000, status: 'in_progress', signedAt: '2026-06-15', expiresAt: '2026-12-31', updatedAt: '2026-07-17T14:30:00', description: '年度原材料框架采购协议', comment: '' },
  { id: 'CT-003', upstreamId: 'CT-003', type: 'service', title: '广州天河 IT 运维服务合同', partyA: '广州天河信息技术公司', partyB: '我方', amount: 96000, status: 'in_progress', signedAt: '2026-05-01', expiresAt: '2027-04-30', updatedAt: '2026-07-17T10:00:00', description: '全年 IT 系统运维及技术支持服务', comment: '' },
  { id: 'CT-004', upstreamId: 'CT-004', type: 'lease', title: '深圳南山办公场地租赁合同', partyA: '我方', partyB: '深圳南山产业园管理有限公司', amount: 240000, status: 'in_progress', signedAt: '2026-04-01', expiresAt: '2027-03-31', updatedAt: '2026-07-16T08:00:00', description: '深圳南山研发中心办公场地续租', comment: '' },
  { id: 'CT-005', upstreamId: 'CT-005', type: 'sales', title: '成都锦江门店装修合同', partyA: '成都锦江装饰公司', partyB: '我方', amount: 86000, status: 'completed', signedAt: '2026-03-10', expiresAt: '2026-06-30', updatedAt: '2026-07-02T11:00:00', description: '新门店装修工程合同', comment: '已按合同约定完成验收结算' },
  { id: 'CT-006', upstreamId: 'CT-006', type: 'procurement', title: '杭州西湖办公设备采购合同', partyA: '我方', partyB: '杭州办公设备供应商', amount: 45000, status: 'expired', signedAt: '2025-07-01', expiresAt: '2026-06-30', updatedAt: '2026-07-01T16:00:00', description: '年度办公设备集中采购合同', comment: '合同已到期，正在协商续签' },
]

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveContractsApiBaseUrl(): string {
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
    return `${normalized.replace(/\/$/, '')}/v1/`
  }
  return `${normalized.replace(/\/$/, '')}/api/v1/`
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeContractType(value: unknown): ContractType {
  switch (value) {
    case 'SALE':
      return 'sales'
    case 'PURCHASE':
      return 'procurement'
    case 'LEASE':
      return 'lease'
    case 'SERVICE':
    case 'NDA':
    default:
      return 'service'
  }
}

function normalizeContractStatus(value: unknown): ContractStatus {
  switch (value) {
    case 'DRAFT':
    case 'PENDING_SIGN':
      return 'pending_sign'
    case 'SIGNED':
    case 'ACTIVE':
      return 'in_progress'
    case 'EXPIRED':
      return 'expired'
    case 'TERMINATED':
      return 'completed'
    default:
      return 'in_progress'
  }
}

function mapBackendContract(value: unknown): ContractRecord | null {
  if (!isRecord(value)) {
    return null
  }
  const backend = value as unknown as BackendContractRecord
  const upstreamId = readString(backend.id)
  const displayId = readString(backend.contractNo, upstreamId || 'CT-UNKNOWN')
  const fileName = readString(backend.fileName)

  return {
    id: displayId,
    upstreamId: upstreamId || displayId,
    type: normalizeContractType(backend.type),
    title: readString(backend.name, '未命名合同'),
    partyA: readString(backend.partyA, '甲方未提供'),
    partyB: readString(backend.partyB, '乙方未提供'),
    amount: readNumber(backend.amount, 0),
    status: normalizeContractStatus(backend.status),
    signedAt: readString(backend.signedDate),
    expiresAt: readString(backend.endDate, '—'),
    updatedAt: readString(backend.updatedAt, backend.createdAt ?? '—'),
    description: fileName ? `合同文件: ${fileName}` : '未提供合同文件',
    comment: readString(backend.remark),
  }
}

function extractContracts(payload: unknown): ContractRecord[] {
  if (Array.isArray(payload)) {
    return payload.map(mapBackendContract).filter(Boolean) as ContractRecord[]
  }
  if (isRecord(payload) && Array.isArray(payload.contracts)) {
    return payload.contracts.map(mapBackendContract).filter(Boolean) as ContractRecord[]
  }
  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data.map(mapBackendContract).filter(Boolean) as ContractRecord[]
  }
  if (isRecord(payload) && isRecord(payload.data) && Array.isArray(payload.data.contracts)) {
    return payload.data.contracts.map(mapBackendContract).filter(Boolean) as ContractRecord[]
  }
  return []
}

async function fetchContractsUpstream(): Promise<ContractRecord[]> {
  const upstreamUrl = new URL('contracts', resolveContractsApiBaseUrl()).toString()
  const payload = await apiFetchJson<unknown>(upstreamUrl)
  const contracts = extractContracts(payload)
  if (!contracts.length) {
    throw new Error('contracts upstream returned empty list')
  }
  return contracts
}

export function formatContractAmount(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
}

export function formatContractDate(date: string): string {
  if (!date) return '—'
  return new Date(date).toISOString().slice(0, 10)
}

export function isContractExpiringSoon(expiresAt: string, withinDays = 30): boolean {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return diff > 0 && diff <= withinDays * 24 * 60 * 60 * 1000
}

export function filterContracts(contracts: ContractRecord[], tabKey: ContractTabKey) {
  if (tabKey === 'all') return contracts
  return contracts.filter((contract) => contract.status === tabKey)
}

export function summarizeContracts(contracts: ContractRecord[]) {
  return {
    total: contracts.length,
    pendingSign: contracts.filter((contract) => contract.status === 'pending_sign').length,
    inProgress: contracts.filter((contract) => contract.status === 'in_progress').length,
    expired: contracts.filter((contract) => contract.status === 'expired').length,
    totalAmount: contracts.reduce((sum, contract) => sum + contract.amount, 0),
  }
}

function mapSingleContract(payload: unknown): ContractRecord {
  const contract = mapBackendContract(payload)
  if (!contract) {
    throw new Error('invalid contract payload')
  }
  return contract
}

async function callContractsApi<T>(path: string, init: RequestInit): Promise<T> {
  const response = await apiFetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.message === 'string'
        ? payload.message
        : `contracts api failed: ${response.status}`
    throw new Error(message)
  }
  return unwrapApiPayload<T>(payload)
}

export async function signContractViaApi(upstreamId: string): Promise<ContractRecord> {
  const payload = await callContractsApi<unknown>(`/api/contracts/${encodeURIComponent(upstreamId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'SIGNED' }),
  })
  return mapSingleContract(payload)
}

export async function updateContractCommentViaApi(
  upstreamId: string,
  text: string
): Promise<ContractRecord> {
  const payload = await callContractsApi<unknown>(`/api/contracts/${encodeURIComponent(upstreamId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ remark: text.trim() }),
  })
  return mapSingleContract(payload)
}

export async function loadContractsSnapshot(): Promise<ContractsSnapshotDelivery> {
  try {
    const contracts = await fetchContractsUpstream()
    return {
      deliveryMode: 'api',
      sourceLabel: 'contracts-api',
      contracts,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'contracts-fallback',
      contracts: defaultContracts,
      generatedAt: new Date().toISOString(),
      error: '合同实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
