// ── Contract Manager Entities ──

export enum ContractStatus {
  Draft = 'DRAFT',
  PendingSign = 'PENDING_SIGN',
  Signed = 'SIGNED',
  Active = 'ACTIVE',
  Expired = 'EXPIRED',
  Terminated = 'TERMINATED',
}

export enum ContractType {
  Purchase = 'PURCHASE',
  Sale = 'SALE',
  Service = 'SERVICE',
  Lease = 'LEASE',
  Nda = 'NDA',
}

export interface Contract {
  id: string
  contractNo: string
  name: string
  type: ContractType
  status: ContractStatus
  partyA: string
  partyB: string
  amount: number
  startDate: string
  endDate: string
  signedDate?: string
  fileName?: string
  remark?: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

export interface ContractClause {
  id: string
  contractId: string
  title: string
  content: string
  sortOrder: number
}
