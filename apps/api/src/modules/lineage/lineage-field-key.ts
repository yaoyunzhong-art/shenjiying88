import type { FieldRef } from './data-lineage.service'

/**
 * Lineage 字段键工具集
 * 集中维护 `${tableName}.${fieldName}` 字符串编码 + Map 注册 + 去重 + 反查模板
 *
 * 取代 data-lineage.service.ts 中 4 处重复模板:
 * - fieldKey (2 处)
 * - registerDashboard / registerAPI (2 处共享 14 行模板)
 * - getAffectedDashboards / getAffectedAPIs (2 处共享 4 行模板)
 * - deduplicateDashboards / deduplicateAPIs (2 处共享 7 行模板)
 */

/**
 * 字段 → 字符串键
 * 集中维护编码规则;若改为 "{table}:{field}" 改这里 1 处
 */
export function fieldKey(tableName: string, fieldName: string): string {
  return `${tableName}.${fieldName}`
}

/**
 * 字符串键 → 字段 (fieldKey 反向)
 */
export function parseFieldKey(key: string): FieldRef {
  const dotIndex = key.indexOf('.')
  return {
    tableName: key.substring(0, dotIndex),
    fieldName: key.substring(dotIndex + 1),
  }
}

/**
 * 通用去重 — 按 keyFn(item) 去重,保留首次出现
 */
export function deduplicateByKey<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const k = keyFn(item)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/**
 * 通用注册 — 把 item 注册到以 fieldKey 为键的 Map<string, T[]>
 * 自动按 getId(item) 在同字段下 dedup
 *
 * @param registry 形如 dashboardRegistry/apiRegistry 的 Map
 * @param item 要注册的项 (必须含 fields: FieldRef[] 字段)
 * @param getId 取 item 的唯一 id (dashboardId / apiId)
 */
export function registerFieldInMap<T extends { fields: FieldRef[] }>(
  registry: Map<string, T[]>,
  item: T,
  getId: (item: T) => string
): void {
  for (const field of item.fields) {
    const key = fieldKey(field.tableName, field.fieldName)
    if (!registry.has(key)) {
      registry.set(key, [])
    }
    const existing = registry.get(key)!
    const id = getId(item)
    if (!existing.some((e) => getId(e) === id)) {
      existing.push(item)
    }
  }
}

/**
 * 通用反查 — 给定 FieldRef, 返回注册表里所有相关项
 */
export function getAffectedFromMap<T>(registry: Map<string, T[]>, fieldRef: FieldRef): T[] {
  return registry.get(fieldKey(fieldRef.tableName, fieldRef.fieldName)) ?? []
}
