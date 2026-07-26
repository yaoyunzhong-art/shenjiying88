export type ContractType = 'sales' | 'procurement' | 'service' | 'lease'
export type ContractStatus = 'pending_sign' | 'in_progress' | 'expired' | 'completed'
export type ContractTabKey = 'all' | 'pending_sign' | 'in_progress' | 'expired'

export interface ContractRecord {
  id: string
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
  deliveryMode: 'mock'
  contracts: ContractRecord[]
  generatedAt: string
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
  { id: 'CT-001', type: 'sales', title: '北京朝阳店设备销售合同', partyA: '我方', partyB: '北京朝阳科技有限公司', amount: 350000, status: 'pending_sign', signedAt: '', expiresAt: '2026-10-18', updatedAt: '2026-07-18T09:00:00', description: '销售 2 条全自动生产线及相关配件', comment: '' },
  { id: 'CT-002', type: 'procurement', title: '上海浦东原材料采购合同', partyA: '上海浦东原材料供应商', partyB: '我方', amount: 128000, status: 'in_progress', signedAt: '2026-06-15', expiresAt: '2026-12-31', updatedAt: '2026-07-17T14:30:00', description: '年度原材料框架采购协议', comment: '' },
  { id: 'CT-003', type: 'service', title: '广州天河 IT 运维服务合同', partyA: '广州天河信息技术公司', partyB: '我方', amount: 96000, status: 'in_progress', signedAt: '2026-05-01', expiresAt: '2027-04-30', updatedAt: '2026-07-17T10:00:00', description: '全年 IT 系统运维及技术支持服务', comment: '' },
  { id: 'CT-004', type: 'lease', title: '深圳南山办公场地租赁合同', partyA: '我方', partyB: '深圳南山产业园管理有限公司', amount: 240000, status: 'in_progress', signedAt: '2026-04-01', expiresAt: '2027-03-31', updatedAt: '2026-07-16T08:00:00', description: '深圳南山研发中心办公场地续租', comment: '' },
  { id: 'CT-005', type: 'sales', title: '成都锦江门店装修合同', partyA: '成都锦江装饰公司', partyB: '我方', amount: 86000, status: 'completed', signedAt: '2026-03-10', expiresAt: '2026-06-30', updatedAt: '2026-07-02T11:00:00', description: '新门店装修工程合同', comment: '已按合同约定完成验收结算' },
  { id: 'CT-006', type: 'procurement', title: '杭州西湖办公设备采购合同', partyA: '我方', partyB: '杭州办公设备供应商', amount: 45000, status: 'expired', signedAt: '2025-07-01', expiresAt: '2026-06-30', updatedAt: '2026-07-01T16:00:00', description: '年度办公设备集中采购合同', comment: '合同已到期，正在协商续签' },
]

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

export async function mockSignContract(id: string) {
  return { ok: true as const, id, signedAt: new Date().toISOString().slice(0, 10) }
}

export async function mockCommentContract(id: string, text: string) {
  return { ok: true as const, id, comment: text.trim() }
}

export async function loadContractsSnapshot(): Promise<ContractsSnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    contracts: defaultContracts,
    generatedAt: new Date().toISOString(),
  }
}
