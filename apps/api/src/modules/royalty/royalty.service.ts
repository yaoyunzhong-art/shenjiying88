import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  RoyaltyType,
  RoyaltyStatus,
  type RoyaltyRule,
  type RoyaltyCalculation,
  type RoyaltyCalculationInput,
} from './royalty.entity'

// ── 内存存储（Phase 1 简化实现，后续可替换为 DB） ──
const royaltyRuleStore = new Map<string, RoyaltyRule>()
const royaltyCalculationStore = new Map<string, RoyaltyCalculation>()

// ── Service Input Types ──

export interface CreateRoyaltyRuleInput {
  tenantContext: RequestTenantContext
  brandId: string
  collabProjectId?: string
  name: string
  royaltyType: RoyaltyType
  rate: number
  fixedAmount: number
  tierConfig?: string
  effectiveDate: string
  expirationDate?: string
  description?: string
}

export interface UpdateRoyaltyRuleInput {
  name?: string
  royaltyType?: RoyaltyType
  rate?: number
  fixedAmount?: number
  tierConfig?: string
  status?: RoyaltyStatus
  effectiveDate?: string
  expirationDate?: string
  description?: string
}

export interface RoyaltyRuleFilter {
  brandId?: string
  royaltyType?: RoyaltyType
  status?: RoyaltyStatus
  collabProjectId?: string
}

export interface CalculationFilter {
  brandId?: string
  ruleId?: string
  settled?: boolean
  startDate?: string
  endDate?: string
}

@Injectable()
export class RoyaltyService {
  // ── 分润规则管理 ──

  /**
   * 创建分润规则
   */
  createRule(input: CreateRoyaltyRuleInput): RoyaltyRule {
    // 验证率范围
    if (input.rate < 0 || input.rate > 100) {
      throw new Error('Royalty rate must be between 0 and 100')
    }
    // RevenueShare 类型 rate 不能为 0
    if (input.royaltyType === RoyaltyType.RevenueShare && input.rate === 0) {
      throw new Error('Revenue share royalty must have a rate greater than 0')
    }
    // FixedAmount 类型 fixedAmount 不能为 0
    if (input.royaltyType === RoyaltyType.FixedAmount && input.fixedAmount <= 0) {
      throw new Error('Fixed amount royalty must have a positive fixed amount')
    }
    // 验证生效日期
    if (input.expirationDate && new Date(input.expirationDate) <= new Date(input.effectiveDate)) {
      throw new Error('Expiration date must be after effective date')
    }

    const now = new Date().toISOString()
    const rule: RoyaltyRule = {
      ruleId: `royalty-${randomUUID()}`,
      tenantContext: input.tenantContext,
      tenantId: input.tenantContext.tenantId,
      brandId: input.brandId,
      collabProjectId: input.collabProjectId,
      name: input.name,
      royaltyType: input.royaltyType,
      rate: input.rate,
      fixedAmount: input.fixedAmount,
      tierConfig: input.tierConfig,
      status: RoyaltyStatus.Active,
      effectiveDate: input.effectiveDate,
      expirationDate: input.expirationDate,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    }
    royaltyRuleStore.set(rule.ruleId, rule)
    return rule
  }

  /**
   * 根据 ID 查找分润规则
   */
  findRuleById(ruleId: string, tenantId: string): RoyaltyRule | undefined {
    const rule = royaltyRuleStore.get(ruleId)
    if (!rule || rule.tenantContext.tenantId !== tenantId) {
      return undefined
    }
    return rule
  }

  /**
   * 查询分润规则列表
   */
  findAllRules(tenantId: string, filter?: RoyaltyRuleFilter): RoyaltyRule[] {
    const results: RoyaltyRule[] = []
    for (const rule of royaltyRuleStore.values()) {
      if (rule.tenantContext.tenantId !== tenantId) continue
      if (filter?.brandId && rule.brandId !== filter.brandId) continue
      if (filter?.royaltyType && rule.royaltyType !== filter.royaltyType) continue
      if (filter?.status && rule.status !== filter.status) continue
      if (filter?.collabProjectId && rule.collabProjectId !== filter.collabProjectId) continue
      results.push(rule)
    }
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return results
  }

  /**
   * 更新分润规则
   */
  updateRule(ruleId: string, tenantId: string, input: UpdateRoyaltyRuleInput): RoyaltyRule {
    const rule = royaltyRuleStore.get(ruleId)
    if (!rule || rule.tenantContext.tenantId !== tenantId) {
      throw new Error(`Royalty rule not found: ${ruleId}`)
    }

    if (input.name !== undefined) rule.name = input.name
    if (input.royaltyType !== undefined) rule.royaltyType = input.royaltyType
    if (input.rate !== undefined) {
      if (input.rate < 0 || input.rate > 100) {
        throw new Error('Royalty rate must be between 0 and 100')
      }
      rule.rate = input.rate
    }
    if (input.fixedAmount !== undefined) {
      if (input.fixedAmount < 0) {
        throw new Error('Fixed amount must be non-negative')
      }
      rule.fixedAmount = input.fixedAmount
    }
    if (input.tierConfig !== undefined) rule.tierConfig = input.tierConfig
    if (input.status !== undefined) rule.status = input.status
    if (input.effectiveDate !== undefined) rule.effectiveDate = input.effectiveDate
    if (input.expirationDate !== undefined) rule.expirationDate = input.expirationDate
    if (input.description !== undefined) rule.description = input.description

    rule.updatedAt = new Date().toISOString()
    royaltyRuleStore.set(ruleId, rule)
    return rule
  }

  /**
   * 删除分润规则
   */
  deleteRule(ruleId: string, tenantId: string): void {
    const rule = royaltyRuleStore.get(ruleId)
    if (!rule || rule.tenantContext.tenantId !== tenantId) {
      throw new Error(`Royalty rule not found: ${ruleId}`)
    }
    royaltyRuleStore.delete(ruleId)
  }

  // ── 分润计算引擎 ──

  /**
   * 根据品牌+订单+有效时间，找到匹配的分润规则
   *
   * 匹配优先级：
   *  1. 指定 ruleId（精确匹配）
   *  2. 指定 collabProjectId → 匹配项目级规则
   *  3. 品牌级最新有效规则
   */
  private findMatchingRule(
    input: RoyaltyCalculationInput,
    tenantId: string,
  ): RoyaltyRule {
    const now = new Date().toISOString()

    // 精确匹配
    if (input.ruleId) {
      const rule = royaltyRuleStore.get(input.ruleId)
      if (!rule || rule.tenantContext.tenantId !== tenantId) {
        throw new Error(`Royalty rule not found: ${input.ruleId}`)
      }
      if (rule.status !== RoyaltyStatus.Active) {
        throw new Error(`Royalty rule ${input.ruleId} is not active`)
      }
      if (now < rule.effectiveDate) {
        throw new Error(`Royalty rule ${input.ruleId} is not yet effective`)
      }
      if (rule.expirationDate && now > rule.expirationDate) {
        throw new Error(`Royalty rule ${input.ruleId} has expired`)
      }
      return rule
    }

    // 按品牌+有效时间匹配
    const candidates: RoyaltyRule[] = []
    for (const rule of royaltyRuleStore.values()) {
      if (rule.tenantContext.tenantId !== tenantId) continue
      if (rule.brandId !== input.brandId) continue
      if (rule.status !== RoyaltyStatus.Active) continue
      if (now < rule.effectiveDate) continue
      if (rule.expirationDate && now > rule.expirationDate) continue
      // 如果指定了 collabProjectId，优先匹配
      if (input.collabProjectId && rule.collabProjectId !== input.collabProjectId) continue
      // 如果没有指定 collabProjectId，只匹配品牌级规则（无 collabProjectId）
      if (!input.collabProjectId && rule.collabProjectId) continue
      candidates.push(rule)
    }

    if (candidates.length === 0) {
      throw new Error(
        `No active royalty rule found for brand ${input.brandId}${input.collabProjectId ? ` and collab ${input.collabProjectId}` : ''}`,
      )
    }

    // 取最新创建的
    candidates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return candidates[0]
  }

  /**
   * 计算分润
   *
   * 计算器模式，根据规则类型计算分润金额
   */
  calculate(input: RoyaltyCalculationInput, tenantId: string): RoyaltyCalculation {
    const rule = this.findMatchingRule(input, tenantId)

    let royaltyAmount: number
    switch (rule.royaltyType) {
      case RoyaltyType.RevenueShare:
        // 按比例：订单金额 × 分润率 / 100
        royaltyAmount = Math.round(input.orderAmount * rule.rate / 100)
        break

      case RoyaltyType.FixedAmount:
        royaltyAmount = rule.fixedAmount
        break

      case RoyaltyType.Tiered:
        royaltyAmount = this.calculateTiered(input.orderAmount, rule)
        break

      default:
        throw new Error(`Unsupported royalty type: ${rule.royaltyType}`)
    }

    const now = new Date().toISOString()
    const calculation: RoyaltyCalculation = {
      calculationId: `calc-${randomUUID()}`,
      tenantContext: rule.tenantContext,
      tenantId,
      ruleId: rule.ruleId,
      brandId: rule.brandId,
      orderId: input.orderId,
      orderAmount: input.orderAmount,
      appliedRate: rule.rate,
      appliedType: rule.royaltyType,
      royaltyAmount,
      description: input.description,
      calculatedAt: now,
      settled: false,
    }
    royaltyCalculationStore.set(calculation.calculationId, calculation)
    return calculation
  }

  /**
   * 计算阶梯分润
   *
   * tierConfig JSON 格式：`[{"min":0, "max":100000, "rate":5}, {"min":100000, "max":-1, "rate":8}]`
   * max 为 -1 表示无上限
   */
  private calculateTiered(orderAmount: number, rule: RoyaltyRule): number {
    if (!rule.tierConfig) {
      // 无阶梯配置，回退到 rate
      return Math.round(orderAmount * rule.rate / 100)
    }

    let tiers: Array<{ min: number; max: number; rate: number }>
    try {
      tiers = JSON.parse(rule.tierConfig) as Array<{ min: number; max: number; rate: number }>
    } catch {
      throw new Error(`Invalid tier config for rule ${rule.ruleId}`)
    }

    if (!Array.isArray(tiers) || tiers.length === 0) {
      throw new Error(`Invalid tier config for rule ${rule.ruleId}: empty tiers`)
    }

    for (const tier of tiers) {
      if (orderAmount >= tier.min && (tier.max === -1 || orderAmount <= tier.max)) {
        return Math.round(orderAmount * tier.rate / 100)
      }
    }
    // 没有匹配的阶梯，回退到基础 rate
    return Math.round(orderAmount * rule.rate / 100)
  }

  // ── 分润计算结果查询 ──

  /**
   * 按 ID 查询分润计算结果
   */
  findCalculationById(calculationId: string, tenantId: string): RoyaltyCalculation | undefined {
    const calc = royaltyCalculationStore.get(calculationId)
    if (!calc || calc.tenantContext.tenantId !== tenantId) {
      return undefined
    }
    return calc
  }

  /**
   * 查询分润计算结果列表
   */
  findAllCalculations(tenantId: string, filter?: CalculationFilter): RoyaltyCalculation[] {
    const results: RoyaltyCalculation[] = []
    for (const calc of royaltyCalculationStore.values()) {
      if (calc.tenantContext.tenantId !== tenantId) continue
      if (filter?.brandId && calc.brandId !== filter.brandId) continue
      if (filter?.ruleId && calc.ruleId !== filter.ruleId) continue
      if (filter?.settled !== undefined && calc.settled !== filter.settled) continue
      if (filter?.startDate && calc.calculatedAt < filter.startDate) continue
      if (filter?.endDate && calc.calculatedAt > filter.endDate) continue
      results.push(calc)
    }
    results.sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime())
    return results
  }

  /**
   * 批量结算回流分润
   */
  settleCalculations(calculationIds: string[], tenantId: string): number {
    let settledCount = 0
    for (const calcId of calculationIds) {
      const calc = royaltyCalculationStore.get(calcId)
      if (!calc || calc.tenantContext.tenantId !== tenantId) {
        throw new Error(`Royalty calculation not found: ${calcId}`)
      }
      if (calc.settled) {
        throw new Error(`Royalty calculation ${calcId} is already settled`)
      }
      calc.settled = true
      calc.settledAt = new Date().toISOString()
      royaltyCalculationStore.set(calcId, calc)
      settledCount++
    }
    return settledCount
  }

  /** 测试辅助：清空存储 */
  static _resetStoreForTest(): void {
    royaltyRuleStore.clear()
    royaltyCalculationStore.clear()
  }
}
