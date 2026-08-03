/**
 * logistics.supplier.entity.ts
 * P-30 供应商管理
 *
 * 供应商评价/信用/合同管理
 */

export type SupplierStatus = 'active' | 'inactive' | 'suspended'
export type ContractType = 'annual' | 'quarterly' | 'project' | 'one_time'
export type CreditLevel = 'A' | 'B' | 'C' | 'D'

export interface SupplierContact {
  name: string
  phone: string
  email?: string
  position?: string
}

export interface SupplierContract {
  id: string
  supplierId: string
  type: ContractType
  contractNumber: string
  startDate: string
  endDate: string
  amount: number // 合同金额（分）
  autoRenew: boolean
  terms?: string
  signedAt: string
}

export interface SupplierEvaluation {
  id: string
  supplierId: string
  evaluatorId: string
  evaluatorName: string
  /** 1-10 评分 */
  qualityScore: number
  deliveryScore: number
  serviceScore: number
  priceScore: number
  comment: string
  evaluatedAt: string
}

export interface Supplier {
  id: string
  tenantId: string
  /** 供应商编码 */
  code: string
  /** 供应商名称 */
  name: string
  category: string
  status: SupplierStatus
  creditLevel: CreditLevel
  contacts: SupplierContact[]
  address?: string
  /** 主营品类 */
  mainProducts: string[]
  /** 合作年限 */
  cooperationYears: number
  /** 平均评分 (1-10) */
  averageScore: number
  /** 评估次数 */
  evaluationCount: number
  /** 活动合同数 */
  activeContracts: number
  /** 备注 */
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SupplierMetrics {
  total: number
  active: number
  byCreditLevel: Record<CreditLevel, number>
  byCategory: Record<string, number>
  avgScore: number
  totalContracts: number
  activeContracts: number
}
