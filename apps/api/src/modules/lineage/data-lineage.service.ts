import { Injectable } from '@nestjs/common'
import {
  fieldKey,
  deduplicateByKey,
  registerFieldInMap,
  getAffectedFromMap,
} from './lineage-field-key'

/**
 * 字段级血缘引用
 */
export interface FieldRef {
  tableName: string
  fieldName: string
}

/**
 * 血缘边的类型
 */
export type LineageEdgeType = 'DIRECT' | 'TRANSFORM'

/**
 * 血缘边
 */
export interface LineageEdge {
  type: LineageEdgeType
  from: FieldRef
  to: FieldRef
  transform?: string
}

/**
 * 血缘节点
 */
export interface LineageNode {
  tableName: string
  fieldName: string
  upstreamCount: number
  downstreamCount: number
}

/**
 * 血缘图
 */
export interface LineageGraph {
  nodes: LineageNode[]
  edges: LineageEdge[]
}

/**
 * 影响分析结果
 */
export interface ImpactResult {
  fieldRef: FieldRef
  affectedDashboards: DashboardRef[]
  affectedAPIs: APIRef[]
  riskLevel: RiskLevel
  downstreamFields: FieldRef[]
  upstreamFields: FieldRef[]
}

/**
 * 仪表板引用
 */
export interface DashboardRef {
  dashboardId: string
  dashboardName: string
  fields: FieldRef[]
}

/**
 * API 引用
 */
export interface APIRef {
  apiId: string
  apiName: string
  endpoint: string
  fields: FieldRef[]
}

/**
 * 风险等级
 */
export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

/**
 * 变更风险评估
 */
export interface RiskAssessment {
  level: RiskLevel
  score: number
  reasons: string[]
  affectedObjects: number
}

/**
 * DataLineageTracker - 数据血缘追踪器
 * 负责追踪字段级血缘关系和转换血缘
 */
@Injectable()
export class DataLineageTracker {
  /**
   * 血缘图存储: key = "tableName.fieldName"
   */
  private readonly lineageMap = new Map<string, Set<string>>()

  /**
   * 转换血缘存储: key = "tableName.fieldName", value = source field refs
   */
  private readonly transformMap = new Map<string, FieldRef[]>()

  /**
   * 反向索引: source -> targets
   */
  private readonly reverseIndex = new Map<string, Set<string>>()

  private parseFieldKey(key: string): FieldRef {
    const dotIndex = key.indexOf('.')
    return {
      tableName: key.substring(0, dotIndex),
      fieldName: key.substring(dotIndex + 1),
    }
  }

  /**
   * 追踪字段级血缘
   * 记录 outputField 的上游是 sourceField
   */
  trackField(tableName: string, fieldName: string, source: FieldRef): void {
    const targetKey = fieldKey(tableName, fieldName)
    const sourceKey = fieldKey(source.tableName, source.fieldName)

    if (!this.lineageMap.has(targetKey)) {
      this.lineageMap.set(targetKey, new Set())
    }
    this.lineageMap.get(targetKey)!.add(sourceKey)

    if (!this.reverseIndex.has(sourceKey)) {
      this.reverseIndex.set(sourceKey, new Set())
    }
    this.reverseIndex.get(sourceKey)!.add(targetKey)
  }

  /**
   * 追踪转换血缘
   * 记录 output 字段由 inputs[] 多个字段计算转换而来
   */
  trackTransform(output: FieldRef, inputs: FieldRef[]): void {
    const outputKey = fieldKey(output.tableName, output.fieldName)
    this.transformMap.set(outputKey, [...inputs])

    for (const input of inputs) {
      this.trackField(output.tableName, output.fieldName, input)
    }
  }

  /**
   * 获取上游血缘
   * 返回指定字段的所有上游字段（直接上游 + 转换上游）
   */
  getUpstream(tableName: string, fieldName: string): FieldRef[] {
    const targetKey = fieldKey(tableName, fieldName)
    const directSources = this.lineageMap.get(targetKey)

    if (!directSources) {
      return []
    }

    const result: FieldRef[] = []
    for (const sourceKey of directSources) {
      result.push(this.parseFieldKey(sourceKey))
    }
    return result
  }

  /**
   * 获取下游影响
   * 返回依赖指定字段的所有下游字段
   */
  getDownstream(tableName: string, fieldName: string): FieldRef[] {
    const sourceKey = fieldKey(tableName, fieldName)
    const targets = this.reverseIndex.get(sourceKey)

    if (!targets) {
      return []
    }

    const result: FieldRef[] = []
    for (const targetKey of targets) {
      result.push(this.parseFieldKey(targetKey))
    }
    return result
  }

  /**
   * 获取血缘图
   * @param rootTable 根表名（为空则返回全图）
   * @param depth 深度限制（1=直接上下游, 2=二级, 0=无限）
   */
  getLineageGraph(rootTable?: string, depth = 0): LineageGraph {
    const nodes = new Map<string, LineageNode>()
    const edges: LineageEdge[] = []

    const visitedNodes = new Set<string>()
    const visitedEdges = new Set<string>()

    const traverse = (tableName: string, fieldName: string, currentDepth: number) => {
      if (depth > 0 && currentDepth > depth) {
        return
      }

      const key = fieldKey(tableName, fieldName)
      if (visitedNodes.has(key)) {
        return
      }
      visitedNodes.add(key)

      const upstream = this.getUpstream(tableName, fieldName)
      const downstream = this.getDownstream(tableName, fieldName)

      nodes.set(key, {
        tableName,
        fieldName,
        upstreamCount: upstream.length,
        downstreamCount: downstream.length
      })

      for (const src of upstream) {
        const srcKey = fieldKey(src.tableName, src.fieldName)
        const edgeKey = `${srcKey}->${key}`
        if (!visitedEdges.has(edgeKey)) {
          visitedEdges.add(edgeKey)
          edges.push({
            type: 'DIRECT',
            from: src,
            to: { tableName, fieldName }
          })
        }
        traverse(src.tableName, src.fieldName, currentDepth + 1)
      }

      for (const dst of downstream) {
        const dstKey = fieldKey(dst.tableName, dst.fieldName)
        const edgeKey = `${key}->${dstKey}`
        if (!visitedEdges.has(edgeKey)) {
          visitedEdges.add(edgeKey)
          edges.push({
            type: 'DIRECT',
            from: { tableName, fieldName },
            to: dst
          })
        }
        traverse(dst.tableName, dst.fieldName, currentDepth + 1)
      }
    }

    if (rootTable) {
      for (const [key] of this.lineageMap) {
        if (key.startsWith(`${rootTable}.`)) {
          const { tableName, fieldName } = this.parseFieldKey(key)
          traverse(tableName, fieldName, 0)
        }
      }
      for (const [key] of this.transformMap) {
        if (key.startsWith(`${rootTable}.`)) {
          const { tableName, fieldName } = this.parseFieldKey(key)
          traverse(tableName, fieldName, 0)
        }
      }
    } else {
      for (const key of this.lineageMap.keys()) {
        const { tableName, fieldName } = this.parseFieldKey(key)
        traverse(tableName, fieldName, 0)
      }
    }

    return {
      nodes: Array.from(nodes.values()),
      edges
    }
  }

  /**
   * 重置所有血缘数据（仅用于测试）
   */
  reset(): void {
    this.lineageMap.clear()
    this.transformMap.clear()
    this.reverseIndex.clear()
  }
}

/**
 * ImpactAnalyzer - 影响分析器
 * 负责分析字段变更的影响范围
 */
@Injectable()
export class ImpactAnalyzer {
  /**
   * 仪表板注册表: fieldKey -> DashboardRef[]
   */
  private readonly dashboardRegistry = new Map<string, DashboardRef[]>()

  /**
   * API 注册表: fieldKey -> APIRef[]
   */
  private readonly apiRegistry = new Map<string, APIRef[]>()

  constructor(private readonly lineageTracker: DataLineageTracker) {}

  /**
   * 注册仪表板使用的字段
   */
  registerDashboard(dashboard: DashboardRef): void {
    registerFieldInMap(this.dashboardRegistry, dashboard, (d) => d.dashboardId)
  }

  /**
   * 注册 API 使用的字段
   */
  registerAPI(api: APIRef): void {
    registerFieldInMap(this.apiRegistry, api, (a) => a.apiId)
  }

  /**
   * 获取受影响的仪表板
   */
  getAffectedDashboards(fieldRef: FieldRef): DashboardRef[] {
    return getAffectedFromMap(this.dashboardRegistry, fieldRef)
  }

  /**
   * 获取受影响的 API
   */
  getAffectedAPIs(fieldRef: FieldRef): APIRef[] {
    return getAffectedFromMap(this.apiRegistry, fieldRef)
  }

  /**
   * 分析字段变更影响范围
   */
  analyzeImpact(tableName: string, fieldName: string): ImpactResult {
    const fieldRef: FieldRef = { tableName, fieldName }
    const directDownstream = this.lineageTracker.getDownstream(tableName, fieldName)
    const upstreamFields = this.lineageTracker.getUpstream(tableName, fieldName)

    const downstreamFields: FieldRef[] = []
    const affectedDashboards: DashboardRef[] = []
    const affectedAPIs: APIRef[] = []

    const collectAffected = (fields: FieldRef[]) => {
      for (const f of fields) {
        affectedDashboards.push(...this.getAffectedDashboards(f))
        affectedAPIs.push(...this.getAffectedAPIs(f))
      }
    }

    collectAffected([fieldRef])
    collectAffected(directDownstream)

    const visited = new Set<string>()
    const queue = [...directDownstream]
    while (queue.length > 0) {
      const current = queue.shift()!
      const key = fieldKey(current.tableName, current.fieldName)
      if (visited.has(key)) continue
      visited.add(key)
      downstreamFields.push(current)
      const subDownstream = this.lineageTracker.getDownstream(current.tableName, current.fieldName)
      collectAffected(subDownstream)
      for (const sd of subDownstream) {
        const sdKey = fieldKey(sd.tableName, sd.fieldName)
        if (!visited.has(sdKey)) {
          queue.push(sd)
        }
      }
    }

    const uniqueDashboards = deduplicateByKey(affectedDashboards, (d) => d.dashboardId)
    const uniqueAPIs = deduplicateByKey(affectedAPIs, (a) => a.apiId)

    return {
      fieldRef,
      affectedDashboards: uniqueDashboards,
      affectedAPIs: uniqueAPIs,
      riskLevel: this.estimateRiskLevel(uniqueDashboards.length, uniqueAPIs.length, downstreamFields.length),
      downstreamFields,
      upstreamFields
    }
  }

  /**
   * 评估变更风险等级
   */
  estimateRiskChange(change: {
    tableName: string
    fieldName: string
    changeType: 'TYPE_CHANGE' | 'NULLABLE_CHANGE' | 'NAME_CHANGE' | 'DELETE'
  }): RiskAssessment {
    const impact = this.analyzeImpact(change.tableName, change.fieldName)
    return this.estimateRiskLevelWithDetails(
      impact.affectedDashboards.length,
      impact.affectedAPIs.length,
      impact.downstreamFields.length,
      change.changeType
    )
  }

  private estimateRiskLevel(
    dashboardCount: number,
    apiCount: number,
    downstreamCount: number
  ): RiskLevel {
    if (dashboardCount >= 3 || apiCount >= 5 || downstreamCount >= 10) {
      return 'HIGH'
    }
    if (dashboardCount >= 1 || apiCount >= 2 || downstreamCount >= 3) {
      return 'MEDIUM'
    }
    return 'LOW'
  }

  private estimateRiskLevelWithDetails(
    dashboardCount: number,
    apiCount: number,
    downstreamCount: number,
    changeType: string
  ): RiskAssessment {
    let score = 0
    const reasons: string[] = []

    score += dashboardCount * 30
    if (dashboardCount > 0) {
      reasons.push(`影响 ${dashboardCount} 个仪表板`)
    }

    score += apiCount * 20
    if (apiCount > 0) {
      reasons.push(`影响 ${apiCount} 个 API`)
    }

    score += downstreamCount * 5
    if (downstreamCount > 0) {
      reasons.push(`下游 ${downstreamCount} 个字段`)
    }

    if (changeType === 'DELETE') {
      score += 50
      reasons.push('字段被删除')
    } else if (changeType === 'TYPE_CHANGE') {
      score += 30
      reasons.push('字段类型变更')
    } else if (changeType === 'NAME_CHANGE') {
      score += 20
      reasons.push('字段名称变更')
    }

    let level: RiskLevel = 'LOW'
    if (score >= 80) {
      level = 'HIGH'
    } else if (score >= 40) {
      level = 'MEDIUM'
    }

    return {
      level,
      score,
      reasons,
      affectedObjects: dashboardCount + apiCount + downstreamCount
    }
  }

  /**
   * 重置注册表（仅用于测试）
   */
  reset(): void {
    this.dashboardRegistry.clear()
    this.apiRegistry.clear()
  }
}
