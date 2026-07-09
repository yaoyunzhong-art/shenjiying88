/**
 * 🐜 自动: [license-package] [A] contract 补全
 *
 * License Package：跨模块合约类型
 * 定义 license-package 模块对外暴露的稳定合约接口，
 * 供其它模块（license, license-renewal, saas-billing 等）消费。
 */
import { LicensePackage } from './entities/license-package.entity'

// ─── 合约子集 ──────────────────────────────────────────────────────────

/**
 * License 套餐合约（跨模块安全子集）
 */
export interface LicensePackageContract {
  id: string
  name: string
  price: number
  duration: number
  durationUnit: string
  maxUsers: number
  maxStores: number
  isActive: boolean
}

// ─── 合约工厂函数 ───────────────────────────────────────────────────────

/**
 * 从完整实体创建合约子集
 */
export function toLicensePackageContract(full: LicensePackage): LicensePackageContract {
  return {
    id: full.id,
    name: full.name,
    price: full.price,
    duration: full.duration,
    durationUnit: full.durationUnit,
    maxUsers: full.maxUsers,
    maxStores: full.maxStores,
    isActive: full.isActive,
  }
}

// ─── 导出原始类型 ───────────────────────────────────────────────────────

export type { LicensePackage }
