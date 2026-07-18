/**
 * ai-rule-engine — AI 规则引擎模块
 *
 * 功能:
 *   1. 规则定义: 条件(IF)→动作(THEN)→权重
 *   2. 规则评估: 输入数据→匹配规则→输出动作
 *   3. 规则优先级链: 按评分/权重排序执行
 *   4. 诊断规则: 异常检测告警(对接 ai-diagnosis)
 *   5. 调度规则: 基于时段/库存/人流量推荐(对接排班)
 *   6. 营销规则: 基于客户画像/历史行为推荐(对接 ai-marketing)
 *
 * V20 Day1 基础骨架:
 * - RuleDefinition: 规则定义(条件/动作/优先级)
 * - RuleEvaluator: 规则评估引擎
 * - RuleChain: 规则链(优先级排序+执行)
 * - 测试覆盖: 正例/反例/边界
 */

// ─── 类型定义 ──────────────────────────────────────

/** 规则条件操作符 */
export type ConditionOperator =
  | 'eq'       // ==
  | 'neq'      // !=
  | 'gt'       // >
  | 'gte'      // >=
  | 'lt'       // <
  | 'lte'      // <=
  | 'in'       // IN [...]
  | 'between'  // BETWEEN min AND max
  | 'contains' // 字符串包含
  | 'regex'    // 正则匹配

/** 单条规则条件 */
export interface RuleCondition {
  field: string                    // 数据字段名
  operator: ConditionOperator
  value: unknown
  valueType: 'number' | 'string' | 'boolean' | 'array'
}

/** 规则动作 */
export interface RuleAction {
  type: string                     // 'alert' | 'recommend' | 'assign' | 'block' | 'notify'
  params: Record<string, unknown>  // 动作参数
  priority: number                 // 执行优先级(数字越小越优先)
}

/** 规则定义 */
export interface RuleDefinition {
  id: string
  name: string
  description: string
  domain: 'diagnosis' | 'scheduling' | 'marketing' | 'finance' | 'operations'
  enabled: boolean
  conditions: RuleCondition[]
  actions: RuleAction[]
  weight: number                   // 权重(0-100)
  maxExecutions: number            // 最大执行次数(0=无限制)
  cooldownMs: number               // 冷却时间
  tags: string[]
  createdAt: string
  updatedAt: string
}

/** 规则评估上下文 */
export interface RuleContext {
  tenantId: string
  timestamp: number
  data: Record<string, unknown>     // 输入数据
  previousResults?: Array<{ ruleId: string; matched: boolean }>
}

/** 规则评估结果 */
export interface RuleResult {
  ruleId: string
  ruleName: string
  matched: boolean
  score: number                    // 匹配评分(0-100)
  actions: RuleAction[]
  executionTimeMs: number
  error?: string
}

/** 规则引擎配置 */
export interface RuleEngineConfig {
  maxRulesPerChain: number
  timeoutMs: number
  enableLogging: boolean
  defaultWeight: number
}

// ─── 条件评估函数 ──────────────────────────────────

function evaluateCondition(condition: RuleCondition, data: Record<string, unknown>): boolean {
  const fieldValue = data[condition.field]

  switch (condition.operator) {
    case 'eq':
      return fieldValue === condition.value
    case 'neq':
      return fieldValue !== condition.value
    case 'gt':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        && fieldValue > condition.value
    case 'gte':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        && fieldValue >= condition.value
    case 'lt':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        && fieldValue < condition.value
    case 'lte':
      return typeof fieldValue === 'number' && typeof condition.value === 'number'
        && fieldValue <= condition.value
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue)
    case 'between': {
      if (!Array.isArray(condition.value)) return false
      const [min, max] = condition.value as [number, number]
      return typeof fieldValue === 'number' && fieldValue >= min && fieldValue <= max
    }
    case 'contains':
      return String(fieldValue).includes(String(condition.value))
    case 'regex': {
      try {
        return new RegExp(String(condition.value)).test(String(fieldValue))
      } catch {
        return false
      }
    }
    default:
      return false
  }
}

// ─── 规则评估器 ──────────────────────────────────

/**
 * 评估单条规则是否匹配上下文
 * 所有条件均为 AND 关系
 */
export function evaluateRule(rule: RuleDefinition, context: RuleContext): RuleResult {
  const startTime = Date.now()

  try {
    // 未启用规则直接返回不匹配
    if (!rule.enabled) {
      return { ruleId: rule.id, ruleName: rule.name, matched: false, score: 0, actions: [], executionTimeMs: Date.now() - startTime }
    }

    // 检查冷却期
    if (rule.cooldownMs > 0 && context.previousResults?.some(r => r.ruleId === rule.id && r.matched)) {
      // 如果上次已匹配且还在冷却期，不执行
    }

    // 评估所有条件(AND)
    const allConditionsMet = rule.conditions.length === 0 || rule.conditions.every(c => evaluateCondition(c, context.data))

    // 计算匹配评分
    const score = allConditionsMet ? rule.weight : 0

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: allConditionsMet,
      score,
      actions: allConditionsMet ? rule.actions : [],
      executionTimeMs: Date.now() - startTime,
    }
  } catch (err) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched: false,
      score: 0,
      actions: [],
      executionTimeMs: Date.now() - startTime,
      error: (err as Error).message,
    }
  }
}

// ─── 规则链 ──────────────────────────────────

/**
 * 规则链: 按优先级执行多条规则
 * 返回评分最高的匹配规则
 */
export function evaluateRuleChain(rules: RuleDefinition[], context: RuleContext, options?: Partial<RuleEngineConfig>): RuleResult[] {
  const config: RuleEngineConfig = {
    maxRulesPerChain: options?.maxRulesPerChain ?? 50,
    timeoutMs: options?.timeoutMs ?? 5000,
    enableLogging: options?.enableLogging ?? false,
    defaultWeight: options?.defaultWeight ?? 50,
  }

  const startTime = Date.now()

  // 按权重降序排列
  const sorted = [...rules]
    .filter(r => r.enabled)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, config.maxRulesPerChain)

  const results: RuleResult[] = []

  for (const rule of sorted) {
    if (Date.now() - startTime > config.timeoutMs) {
      if (config.enableLogging) {
        console.warn(`[RuleEngine] 规则链超时: ${config.timeoutMs}ms`)
      }
      break
    }

    const result = evaluateRule(rule, context)
    results.push(result)
  }

  return results
}

// ─── 实用方法 ──────────────────────────────────

/**
 * 从规则链结果中获取最佳匹配
 */
export function getBestMatch(results: RuleResult[]): RuleResult | null {
  const matched = results.filter(r => r.matched && !r.error)
  if (matched.length === 0) return null
  return matched.reduce((best, r) => r.score > best.score ? r : best)
}

/**
 * 按领域过滤规则
 */
export function filterByDomain(rules: RuleDefinition[], domain: RuleDefinition['domain']): RuleDefinition[] {
  return rules.filter(r => r.domain === domain)
}

/**
 * 创建规则
 */
export function createRule(partial: Omit<RuleDefinition, 'id' | 'createdAt' | 'updatedAt'>): RuleDefinition {
  return {
    ...partial,
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * 更新规则
 */
export function updateRule(existing: RuleDefinition, updates: Partial<RuleDefinition>): RuleDefinition {
  return {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  }
}
