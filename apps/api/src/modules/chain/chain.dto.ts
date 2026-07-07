/**
 * chain.dto.ts — 智能合约 DTO
 *
 * 积分清算、分账合约、智能合约部署的请求/响应 DTO
 */

// ─── 积分清算 ────────────────────────────────────────────────

export class CreateSettlementDto {
  payerId!: string
  payerName!: string
  payees!: Array<{
    payeeId: string
    payeeName: string
    amount: number
  }>
}

export class ApproveSettlementDto {
  contractId!: string
}

export class ExecuteSettlementDto {
  contractId!: string
}

export class CancelSettlementDto {
  contractId!: string
}

// ─── 分账合约 ────────────────────────────────────────────────

export class CreateRevenueShareDto {
  totalRevenue!: number
  participants!: Array<{
    participantId: string
    participantName: string
    ratio: number
  }>
}

export class DistributeRevenueDto {
  contractId!: string
}

// ─── 合约执行器 ──────────────────────────────────────────────

export class DeployContractDto {
  contractType!: 'PointsSettlement' | 'RevenueShare'
  params!: Record<string, unknown>
}

export class ExecuteContractDto {
  contractId!: string
}

// ─── 智能合约（链上） ────────────────────────────────────────

export class DeploySmartContractDto {
  name!: string
  params!: string[]
}

export class ExecuteSmartMethodDto {
  contractId!: string
  method!: string
  args!: string[]
}

export class QueryContractDto {
  contractId!: string
  method!: string
}

export class VerifyContractDto {
  contractId!: string
  sourceCode!: string
  compiler!: string
}

export class EstimateGasDto {
  contractId!: string
  method!: string
  args!: string[]
}

// ─── 通用响应 ────────────────────────────────────────────────

export class ApiResponse<T = unknown> {
  success!: boolean
  data?: T
  message?: string
  error?: string
}
