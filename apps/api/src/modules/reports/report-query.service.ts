import { Injectable, BadRequestException } from '@nestjs/common'
import type { ReportFilter, ReportFilterGroup, FilterOp } from './reports.entity'

/**
 * Phase-39 T169: ReportQueryService - DSL 解析
 *
 * 反模式 v4 命中:
 *  - input-validation-pattern: 字段白名单 + 操作符白名单
 *  - sql-injection-pattern (如未来 SQL): 不拼字符串
 *  - multi-tenant-data-isolation: 强制 tenantId
 *
 * DSL 格式:
 * {
 *   "AND": [
 *     { "field": "createdAt", "op": ">=", "value": "2024-01-01" },
 *     { "field": "status", "op": "in", "value": ["PAID", "COMPLETED"] },
 *     { "OR": [
 *       { "field": "source", "op": "=", "value": "wechat" },
 *       { "field": "source", "op": "=", "value": "alipay" }
 *     ]}
 *   ]
 * }
 */

const ALLOWED_OPS: FilterOp[] = ['=', '!=', '>', '>=', '<', '<=', 'in', 'notIn', 'between', 'like']

@Injectable()
export class ReportQueryService {
  /** 各数据源允许字段 (反模式 v4 whitelist) */
  private fieldWhitelists: Record<string, Set<string>> = {
    order: new Set(['id', 'orderId', 'status', 'totalCents', 'source', 'memberId', 'itemCount', 'createdAt']),
    payment: new Set(['id', 'orderId', 'amountCents', 'currency', 'method', 'status', 'createdAt']),
    refund: new Set(['id', 'paymentId', 'orderId', 'amountCents', 'reason', 'status', 'createdAt']),
    member: new Set(['id', 'level', 'source', 'status', 'lifecycleStage', 'createdAt', 'lastActiveAt']),
    inventory: new Set(['id', 'sku', 'name', 'category', 'totalQty', 'reservedQty', 'availableQty', 'lowStockThreshold', 'status', 'unitPriceCents'])
  }

  /**
   * 解析 DSL → ReportFilterGroup
   */
  parse(sourceType: keyof typeof this.fieldWhitelists, dsl: any): ReportFilterGroup {
    if (!dsl || typeof dsl !== 'object') {
      return { op: 'AND', conditions: [] }
    }
    const keys = Object.keys(dsl)
    if (keys.length === 0) return { op: 'AND', conditions: [] }
    // 顶层 AND/OR
    if (keys.length === 1 && (keys[0] === 'AND' || keys[0] === 'OR')) {
      return this.parseGroup(sourceType, keys[0] as 'AND' | 'OR', dsl[keys[0]])
    }
    // 单条件
    if (keys.length === 1) {
      const field = keys[0]
      this.validateField(sourceType, field)
      const condition = dsl[field]
      if (typeof condition !== 'object') {
        throw new BadRequestException(`invalid filter for ${field}`)
      }
      return {
        op: 'AND',
        conditions: this.parseConditions(sourceType, [{ field, ...condition }])
      }
    }
    // 多字段隐式 AND
    const conds = keys.map(k => ({ field: k, ...dsl[k] }))
    return { op: 'AND', conditions: this.parseConditions(sourceType, conds) }
  }

  private parseGroup(sourceType: keyof typeof this.fieldWhitelists, op: 'AND' | 'OR', arr: any[]): ReportFilterGroup {
    if (!Array.isArray(arr)) throw new BadRequestException(`${op} must be array`)
    const conditions: (ReportFilter | ReportFilterGroup)[] = []
    for (const item of arr) {
      if (!item || typeof item !== 'object') throw new BadRequestException('invalid condition')
      const keys = Object.keys(item)
      if (keys.length === 1 && (keys[0] === 'AND' || keys[0] === 'OR')) {
        conditions.push(this.parseGroup(sourceType, keys[0] as 'AND' | 'OR', item[keys[0]]))
      } else {
        conditions.push(...this.parseConditions(sourceType, [item]))
      }
    }
    return { op, conditions }
  }

  private parseConditions(sourceType: keyof typeof this.fieldWhitelists, items: any[]): ReportFilter[] {
    return items.map(item => {
      this.validateField(sourceType, item.field)
      this.validateOp(item.op)
      return { field: item.field, op: item.op, value: item.value }
    })
  }

  private validateField(sourceType: keyof typeof this.fieldWhitelists, field: string): void {
    const whitelist = this.fieldWhitelists[sourceType]
    if (!whitelist.has(field)) {
      throw new BadRequestException(`field ${field} not allowed for source ${sourceType}`)
    }
  }

  private validateOp(op: string): void {
    if (!ALLOWED_OPS.includes(op as FilterOp)) {
      throw new BadRequestException(`op ${op} not allowed, use one of: ${ALLOWED_OPS.join(', ')}`)
    }
  }
}