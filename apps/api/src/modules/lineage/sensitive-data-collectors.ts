import type { FieldClassification, SensitiveCategory } from './sensitive-data.service'

/**
 * Sensitive-data 合规收集 helpers
 * 取代 sensitive-data.service.ts ComplianceReporter 中 3 类模板:
 * - 嵌套 Map 收集所有 PII/个人信息 (2 处)
 * - compliance issues 检查 (2 处)
 * - filter by entity/entityId (4 处)
 */

/**
 * 5 个敏感分类 (GDPR 关注的)
 * NONE 单独处理 (非敏感)
 */
export const SENSITIVE_CATEGORIES: SensitiveCategory[] = [
  'PII',
  'FINANCIAL',
  'HEALTH',
  'CONTACT',
  'CREDENTIAL',
]

/**
 * 谓词: 分类是否属于敏感
 */
export function isSensitiveCategory(category: SensitiveCategory): boolean {
  return SENSITIVE_CATEGORIES.includes(category)
}

/**
 * 通用收集: 遍历 classifier 内所有分类,按 predicate 过滤
 *
 * @param getClassifications 返回嵌套 Map<tableName, Map<fieldName, classification>> 的访问函数
 * @param predicate 过滤谓词
 */
export function iterateAllClassifications(
  getClassifications: () => Map<string, Map<string, FieldClassification>>,
  predicate: (c: FieldClassification) => boolean
): FieldClassification[] {
  const result: FieldClassification[] = []
  const classifications = getClassifications()
  for (const fieldMap of classifications.values()) {
    for (const classification of fieldMap.values()) {
      if (predicate(classification)) {
        result.push(classification)
      }
    }
  }
  return result
}

/**
 * 通用过滤: 按 key 字段 (entity 或 entityId) 过滤记录
 */
export function filterRecordsByKey<T>(
  records: T[],
  value: string,
  key: 'entity' | 'entityId'
): T[] {
  return records.filter((r) => (r as unknown as Record<string, unknown>)[key] === value)
}
