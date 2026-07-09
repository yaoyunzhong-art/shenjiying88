/**
 * 🐜 自动: [deploy] [A] contract 补全
 *
 * Deploy：跨模块合约类型
 * 定义 deploy 模块对外暴露的稳定合约接口，
 * 供其它模块（gateway, monitoring, health-dashboard 等）消费。
 */
import type {
  DeploymentPlan,
  ServerSpec,
  HelmValues,
  MonthlyCost,
  DeploymentStatus,
  DeploymentMode,
  ResourceSize,
} from './deploy.entity'

// ─── 合约子集 ──────────────────────────────────────────────────────────

/**
 * 部署计划合约（跨模块安全子集）
 */
export interface DeploymentPlanContract {
  planId: string
  mode: DeploymentMode
  size: ResourceSize
  serverSpec: ServerSpec
  estimatedCost: number
  components: string[]
}

/**
 * 月度成本合约（跨模块安全子集）
 */
export interface MonthlyCostContract {
  infrastructure: number
  bandwidth: number
  storage: number
  total: number
}

/**
 * 部署状态合约（跨模块安全子集）
 */
export interface DeploymentStatusContract {
  deploymentId: string
  planId: string
  status: DeploymentStatus
  startedAt: string
  updatedAt: string
  errorMessage?: string
}

// ─── 枚举合约 ───────────────────────────────────────────────────────────

export type DeploymentModeContract = DeploymentMode
export type DeploymentStatusContractEnum = DeploymentStatus
export type ResourceSizeContract = Extract<ResourceSize, 'small' | 'medium' | 'large'>

// ─── 合约工厂函数 ───────────────────────────────────────────────────────

/**
 * 从完整计划创建合约子集
 */
export function toDeploymentPlanContract(full: DeploymentPlan): DeploymentPlanContract {
  return {
    planId: full.planId,
    mode: full.mode,
    size: full.size,
    serverSpec: full.serverSpec,
    estimatedCost: full.estimatedCost,
    components: full.components,
  }
}

/**
 * 从完整月度成本创建合约子集
 */
export function toMonthlyCostContract(full: MonthlyCost): MonthlyCostContract {
  return {
    infrastructure: full.infrastructure,
    bandwidth: full.bandwidth,
    storage: full.storage,
    total: full.infrastructure + full.bandwidth + full.storage,
  }
}

// ─── 导出原始类型子集 ───────────────────────────────────────────────────

export type {
  DeploymentPlan,
  ServerSpec,
  HelmValues,
  MonthlyCost,
  DeploymentStatus,
  DeploymentMode,
  ResourceSize,
}
