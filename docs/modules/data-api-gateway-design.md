# P-64 数据 API 网关详细设计文档

## 1. 概述

### 1.1 模块定位

数据 API 网关是 M5 Platform V18 数据智能体系的统一数据访问入口，负责：

- **统一协议接入**: 支持 GraphQL、REST、gRPC 多种协议，统一暴露数据能力
- **智能查询引擎**: 自动路由、查询优化、结果聚合与缓存
- **细粒度权限控制**: 行级/列级数据访问控制，支持 ABAC/RBAC 混合模型
- **API 生命周期管理**: 版本控制、灰度发布、流量管理、API 市场
- **可观测性**: 全链路追踪、性能监控、成本分析

### 1.2 核心目标

| 指标 | 目标值 | 验收标准 |
|------|--------|----------|
| 协议转换延迟 | < 5ms | GraphQL→SQL |
| 查询响应时间 | P95 < 100ms | 简单查询 |
| 并发处理能力 | > 10000 QPS | 单实例 |
| 权限校验延迟 | < 1ms | ABAC 决策 |
| API 可用性 | > 99.99% | 年度 SLA |
| 缓存命中率 | > 85% | L1+L2 缓存 |

### 1.3 技术架构

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          数据 API 网关架构                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        接入层 (Access Layer)                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  GraphQL     │  │  REST API    │  │  gRPC        │  │  WebSocket │  │   │
│  │  │  Endpoint    │  │  Endpoint    │  │  Endpoint    │  │  Endpoint  │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  │   │
│  │         └─────────────────┴───────────────────┘                │         │   │
│  │                              │                                 │         │   │
│  │                   ┌──────────▼──────────┐                      │         │   │
│  │                   │   Protocol Router   │                      │         │   │
│  │                   │   (协议适配/转换)     │                      │         │   │
│  │                   └──────────┬──────────┘                      │         │   │
│  └──────────────────────────────┼─────────────────────────────────┘         │
│                                 │                                              │
│  ┌──────────────────────────────▼─────────────────────────────────┐           │
│  │                     核心网关层 (Core Gateway)                    │           │
│  │                                                                  │           │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │           │
│  │  │   Query Engine  │  │   Access Control│  │   API Lifecycle │  │           │
│  │  │   (查询引擎)    │  │   (访问控制)    │  │   (生命周期)    │  │           │
│  │  │                 │  │                 │  │                 │  │           │
│  │  │ • Query Parser  │  │ • ABAC/RBAC     │  │ • Versioning    │  │           │
│  │  │ • AST Builder   │  │ • Row/Col ACL   │  │ • Canary        │  │           │
│  │  │ • SQL Generator │  │ • Rate Limit    │  │ • Deprecation   │  │           │
│  │  │ • Result Merge  │  │ • Audit Log     │  │ • Documentation │  │           │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │           │
│  │           │                    │                    │           │
│  │           └────────────────────┼────────────────────┘           │
│  │                                │                                │
│  │                     ┌───────────▼───────────┐                      │
│  │                     │   Execution Engine  │                      │
│  │                     │   (执行引擎)         │                      │
│  │                     │                     │                      │
│  │                     │ • Query Planning    │                      │
│  │                     │ • Parallel Fetch    │                      │
│  │                     │ • Result Caching    │                      │
│  │                     │ • Error Handling    │                      │
│  │                     └───────────┬───────┘                      │
│  └───────────────────────────────────┼──────────────────────────────┘
│                                      │
│  ┌──────────────────────────────────▼──────────────────────────────┐
│  │                        数据层 (Data Sources)                    │
│  │                                                                  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  │  PostgreSQL  │  │  ClickHouse  │  │    Redis     │          │
│  │  │  (主数据库)  │  │  (实时数仓)  │  │   (L2缓存)   │          │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │
│  │                                                                  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  │ Elasticsearch│  │    Kafka     │  │   MinIO      │          │
│  │  │   (搜索)     │  │   (流数据)   │  │  (对象存储)  │          │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │
│  │                                                                  │
│  └──────────────────────────────────────────────────────────────────┘
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## 2. 核心服务实现

### 2.1 查询引擎服务 (QueryEngineService)

```typescript
// apps/api/src/modules/data-gateway/services/query-engine.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'

// GraphQL AST 类型定义
interface GraphQLDocument {
  kind: 'Document'
  definitions: OperationDefinition[]
}

interface OperationDefinition {
  kind: 'OperationDefinition'
  operation: 'query' | 'mutation' | 'subscription'
  name?: { value: string }
  selectionSet: SelectionSet
  variableDefinitions?: VariableDefinition[]
}

interface SelectionSet {
  kind: 'SelectionSet'
  selections: (Field | FragmentSpread | InlineFragment)[]
}

interface Field {
  kind: 'Field'
  name: { value: string }
  alias?: { value: string }
  arguments?: Argument[]
  selectionSet?: SelectionSet
}

interface Argument {
  kind: 'Argument'
  name: { value: string }
  value: Value
}

type Value =
  | { kind: 'Variable'; name: { value: string } }
  | { kind: 'StringValue'; value: string }
  | { kind: 'IntValue'; value: string }
  | { kind: 'FloatValue'; value: string }
  | { kind: 'BooleanValue'; value: boolean }
  | { kind: 'NullValue' }
  | { kind: 'ListValue'; values: Value[] }
  | { kind: 'ObjectValue'; fields: ObjectField[] }

interface ObjectField {
  kind: 'ObjectField'
  name: { value: string }
  value: Value
}

interface VariableDefinition {
  kind: 'VariableDefinition'
  variable: { name: { value: string } }
  type: Type
  defaultValue?: Value
}

type Type =
  | { kind: 'NamedType'; name: { value: string } }
  | { kind: 'NonNullType'; type: Type }
  | { kind: 'ListType'; type: Type }

// 中间表示 (IR) 类型
interface QueryPlan {
  root: QueryNode
  variables: Map<string, unknown>
  fragments: Map<string, FragmentDefinition>
  operationType: 'query' | 'mutation' | 'subscription'
}

interface QueryNode {
  type: 'fetch' | 'join' | 'aggregate' | 'filter' | 'sort' | 'limit'
  dataSource: DataSourceRef
  fields: FieldSelection[]
  condition?: FilterCondition
  joins?: JoinSpec[]
  aggregations?: AggregationSpec[]
  sort?: SortSpec[]
  limit?: number
  offset?: number
  children?: QueryNode[]
}

interface DataSourceRef {
  type: 'postgresql' | 'clickhouse' | 'redis' | 'elasticsearch' | 'kafka'
  connection: string
  table?: string
  index?: string
}

interface FieldSelection {
  name: string
  alias?: string
  type: 'scalar' | 'relation' | 'computed'
  subFields?: FieldSelection[]
}

interface FilterCondition {
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'and' | 'or' | 'not'
  field?: string
  value?: unknown
  conditions?: FilterCondition[]
}

interface JoinSpec {
  type: 'inner' | 'left' | 'right' | 'full'
  target: DataSourceRef
  on: { leftField: string; rightField: string }
  fields: FieldSelection[]
}

interface AggregationSpec {
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'stddev' | 'variance'
  field: string
  alias: string
  groupBy?: string[]
}

interface SortSpec {
  field: string
  direction: 'asc' | 'desc'
  nulls?: 'first' | 'last'
}

// 执行结果类型
interface ExecutionResult {
  data: unknown
  errors: GraphQLError[]
  extensions: {
    executionTimeMs: number
    queryComplexity: number
    cacheHit: boolean
    dataSources: string[]
  }
}

interface GraphQLError {
  message: string
  path: (string | number)[]
  extensions: {
    code: string
    dataSource?: string
    originalError?: string
  }
}

@Injectable()
export class QueryEngineService {
  private readonly logger = new Logger(QueryEngineService.name)

  constructor(
    private readonly dataSource: DataSource,
    // 注入各数据源连接
    @Inject('CLICKHOUSE_CLIENT')
    private readonly clickhouse: unknown,
    @Inject('REDIS_CACHE')
    private readonly redis: unknown
  ) {}

  /**
   * 主查询执行入口
   * 流程: Parse → Validate → Plan → Optimize → Execute → Format
   */
  async execute(
    document: string | GraphQLDocument,
    variables?: Record<string, unknown>,
    context?: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      // Step 1: Parse
      const ast = typeof document === 'string' ? this.parse(document) : document

      // Step 2: Validate
      const validationErrors = this.validate(ast)
      if (validationErrors.length > 0) {
        return this.formatErrorResult(validationErrors, startTime)
      }

      // Step 3: Build Query Plan
      const plan = this.buildQueryPlan(ast, variables || {})

      // Step 4: Optimize
      const optimizedPlan = this.optimize(plan)

      // Step 5: Execute with access control
      const rawResult = await this.executeWithAccessControl(
        optimizedPlan,
        context || { user: null, roles: [], permissions: [] }
      )

      // Step 6: Format Response
      const result = this.formatResponse(rawResult, ast)

      return {
        data: result.data,
        errors: result.errors,
        extensions: {
          executionTimeMs: Date.now() - startTime,
          queryComplexity: this.calculateComplexity(ast),
          cacheHit: rawResult.cacheHit || false,
          dataSources: rawResult.dataSources || []
        }
      }
    } catch (error) {
      this.logger.error('Query execution failed:', error)
      return this.formatErrorResult(
        [{
          message: error instanceof Error ? error.message : 'Unknown error',
          path: [],
          extensions: { code: 'EXECUTION_ERROR' }
        }],
        startTime
      )
    }
  }

  /**
   * GraphQL 解析器
   */
  private parse(document: string): GraphQLDocument {
    // 简化的 GraphQL 解析器实现
    // 实际项目中使用 graphql-js 或 @graphql-tools
    const lines = document.trim().split('\n')
    const definitions: OperationDefinition[] = []

    let currentOperation: OperationDefinition | null = null
    let braceDepth = 0

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      // 简化的解析逻辑
      if (trimmed.startsWith('query') || trimmed.startsWith('mutation') || trimmed.startsWith('subscription')) {
        const match = trimmed.match(/^(query|mutation|subscription)\s*(\w+)?/)
        if (match) {
          currentOperation = {
            kind: 'OperationDefinition',
            operation: match[1] as 'query' | 'mutation' | 'subscription',
            name: match[2] ? { value: match[2] } : undefined,
            selectionSet: { kind: 'SelectionSet', selections: [] }
          }
          definitions.push(currentOperation)
        }
      }

      braceDepth += (trimmed.match(/{/g) || []).length
      braceDepth -= (trimmed.match(/}/g) || []).length
    }

    return { kind: 'Document', definitions }
  }

  /**
   * 查询验证
   */
  private validate(ast: GraphQLDocument): GraphQLError[] {
    const errors: GraphQLError[] = []

    for (const def of ast.definitions) {
      if (def.kind === 'OperationDefinition') {
        // 验证操作类型
        if (!['query', 'mutation', 'subscription'].includes(def.operation)) {
          errors.push({
            message: `Invalid operation type: ${def.operation}`,
            path: [def.name?.value || 'anonymous'],
            extensions: { code: 'INVALID_OPERATION' }
          })
        }

        // 验证选择集非空
        if (!def.selectionSet?.selections?.length) {
          errors.push({
            message: 'Operation must have at least one field selection',
            path: [def.name?.value || 'anonymous'],
            extensions: { code: 'EMPTY_SELECTION' }
          })
        }
      }
    }

    return errors
  }

  /**
   * 构建查询计划
   */
  private buildQueryPlan(
    ast: GraphQLDocument,
    variables: Record<string, unknown>
  ): QueryPlan {
    const operation = ast.definitions[0] as OperationDefinition

    return {
      root: this.buildQueryNode(operation.selectionSet, variables),
      variables: new Map(Object.entries(variables)),
      fragments: new Map(), // 简化处理，实际应解析 fragments
      operationType: operation.operation
    }
  }

  /**
   * 递归构建查询节点
   */
  private buildQueryNode(
    selectionSet: SelectionSet,
    variables: Record<string, unknown>,
    parentType?: string
  ): QueryNode {
    const fields: FieldSelection[] = []

    for (const selection of selectionSet.selections) {
      if (selection.kind === 'Field') {
        const field: FieldSelection = {
          name: selection.name.value,
          alias: selection.alias?.value,
          type: selection.selectionSet ? 'relation' : 'scalar'
        }

        if (selection.selectionSet) {
          field.subFields = this.extractSubFields(selection.selectionSet)
        }

        fields.push(field)
      }
    }

    // 根据字段智能选择数据源
    const dataSource = this.inferDataSource(fields, parentType)

    return {
      type: 'fetch',
      dataSource,
      fields,
      children: []
    }
  }

  /**
   * 提取子字段
   */
  private extractSubFields(selectionSet: SelectionSet): FieldSelection[] {
    const fields: FieldSelection[] = []

    for (const selection of selectionSet.selections) {
      if (selection.kind === 'Field') {
        const field: FieldSelection = {
          name: selection.name.value,
          alias: selection.alias?.value,
          type: selection.selectionSet ? 'relation' : 'scalar'
        }

        if (selection.selectionSet) {
          field.subFields = this.extractSubFields(selection.selectionSet)
        }

        fields.push(field)
      }
    }

    return fields
  }

  /**
   * 智能推断数据源
   */
  private inferDataSource(
    fields: FieldSelection[],
    parentType?: string
  ): DataSourceRef {
    // 根据字段类型和父类型智能选择数据源
    const hasAggregations = fields.some(
      f => f.name.match(/^(count|sum|avg|min|max|groupBy)$/)
    )

    const hasTimeSeries = fields.some(
      f => f.name.match(/^(timestamp|time|date|hour|day|month)$/) ||
           f.name.includes('At')
    )

    const hasSearch = fields.some(
      f => f.name.match(/^(search|match|query|text|keyword)$/)
    )

    if (hasAggregations || hasTimeSeries) {
      return {
        type: 'clickhouse',
        connection: 'clickhouse://analytics:9440/default'
      }
    }

    if (hasSearch) {
      return {
        type: 'elasticsearch',
        connection: 'elasticsearch://localhost:9200',
        index: this.inferIndexName(parentType)
      }
    }

    // 默认 PostgreSQL
    return {
      type: 'postgresql',
      connection: 'postgresql://localhost:5432/m5platform'
    }
  }

  /**
   * 推断索引名称
   */
  private inferIndexName(parentType?: string): string {
    if (!parentType) return 'default'
    return parentType.toLowerCase() + 's'
  }

  /**
   * 查询计划优化
   */
  private optimize(plan: QueryPlan): QueryPlan {
    return {
      ...plan,
      root: this.optimizeNode(plan.root)
    }
  }

  /**
   * 递归优化查询节点
   */
  private optimizeNode(node: QueryNode): QueryNode {
    // 合并相邻的 fetch 节点（如果来自同一数据源）
    if (node.type === 'fetch' && node.children) {
      const optimizedChildren = node.children.map(c => this.optimizeNode(c))

      // 尝试合并到父节点
      const mergeableChildren = optimizedChildren.filter(
        c => c.type === 'fetch' && c.dataSource.type === node.dataSource.type
      )

      if (mergeableChildren.length > 0) {
        return {
          ...node,
          fields: [...node.fields, ...mergeableChildren.flatMap(c => c.fields)],
          children: optimizedChildren.filter(c => !mergeableChildren.includes(c))
        }
      }

      return { ...node, children: optimizedChildren }
    }

    // 优化 filter + sort + limit 链
    if (node.type === 'filter' && node.children?.[0]?.type === 'sort') {
      const sortNode = node.children[0]
      if (sortNode.children?.[0]?.type === 'limit') {
        // 合并为单个 fetch with 子查询
        return {
          type: 'fetch',
          dataSource: node.dataSource,
          fields: node.fields,
          condition: node.condition,
          sort: sortNode.sort,
          limit: sortNode.children[0].limit,
          offset: sortNode.children[0].offset
        } as QueryNode
      }
    }

    return node
  }

  /**
   * 带访问控制的执行
   */
  private async executeWithAccessControl(
    plan: QueryPlan,
    context: ExecutionContext
  ): Promise<{ data: unknown; errors: GraphQLError[]; cacheHit: boolean; dataSources: string[] }> {
    const errors: GraphQLError[] = []
    const dataSources: Set<string> = new Set()

    // 检查权限
    const permissionCheck = await this.checkPermissions(plan, context)
    if (!permissionCheck.allowed) {
      return {
        data: null,
        errors: [{
          message: `Access denied: ${permissionCheck.reason}`,
          path: [],
          extensions: { code: 'ACCESS_DENIED' }
        }],
        cacheHit: false,
        dataSources: []
      }
    }

    // 应用行级/列级过滤
    const filteredPlan = this.applyRowColumnFilters(plan, context)

    // 执行查询
    const result = await this.executeNode(filteredPlan.root, context, errors, dataSources)

    return {
      data: result,
      errors,
      cacheHit: false, // 简化实现，实际应从缓存检查
      dataSources: Array.from(dataSources)
    }
  }

  /**
   * 权限检查
   */
  private async checkPermissions(
    plan: QueryPlan,
    context: ExecutionContext
  ): Promise<{ allowed: boolean; reason?: string }> {
    // ABAC 决策
    const requiredPermissions = this.extractRequiredPermissions(plan)

    for (const permission of requiredPermissions) {
      const hasPermission = await this.evaluateABAC(permission, context)
      if (!hasPermission) {
        return {
          allowed: false,
          reason: `Missing permission: ${permission.action} on ${permission.resource}`
        }
      }
    }

    return { allowed: true }
  }

  /**
   * 提取所需权限
   */
  private extractRequiredPermissions(plan: QueryPlan): Permission[] {
    const permissions: Permission[] = []

    const extractFromNode = (node: QueryNode): void => {
      if (node.dataSource) {
        permissions.push({
          action: node.type === 'fetch' ? 'read' : 'write',
          resource: `${node.dataSource.type}:${node.dataSource.table || 'default'}`,
          fields: node.fields.map(f => f.name)
        })
      }

      node.children?.forEach(extractFromNode)
    }

    extractFromNode(plan.root)
    return permissions
  }

  /**
   * ABAC 评估
   */
  private async evaluateABAC(
    permission: Permission,
    context: ExecutionContext
  ): Promise<boolean> {
    // RBAC 基础检查
    const hasRole = context.roles.some(role =>
      role.permissions?.some(
        p => p.action === permission.action &&
             (p.resource === '*' || p.resource === permission.resource)
      )
    )

    if (!hasRole) return false

    // ABAC 属性检查
    const attributes = context.attributes || {}

    // 时间限制
    if (attributes.timeRestriction) {
      const now = new Date()
      const hour = now.getHours()
      const [start, end] = attributes.timeRestriction.split('-').map(Number)
      if (hour < start || hour > end) return false
    }

    // 地理位置限制
    if (attributes.allowedLocations && attributes.currentLocation) {
      if (!attributes.allowedLocations.includes(attributes.currentLocation)) {
        return false
      }
    }

    // 数据敏感度检查
    if (attributes.clearanceLevel && permission.sensitivityLevel) {
      if (attributes.clearanceLevel < permission.sensitivityLevel) {
        return false
      }
    }

    return true
  }

  /**
   * 应用行级/列级过滤
   */
  private applyRowColumnFilters(
    plan: QueryPlan,
    context: ExecutionContext
  ): QueryPlan {
    const applyFilters = (node: QueryNode): QueryNode => {
      // 行级过滤
      const rowFilter = this.buildRowFilter(node, context)

      // 列级过滤
      const allowedFields = this.getAllowedFields(node, context)
      const filteredFields = node.fields.filter(f =>
        allowedFields.includes(f.name) || f.name.startsWith('_')
      )

      return {
        ...node,
        fields: filteredFields,
        condition: rowFilter
          ? node.condition
            ? { operator: 'and', conditions: [node.condition, rowFilter] }
            : rowFilter
          : node.condition,
        children: node.children?.map(applyFilters)
      }
    }

    return {
      ...plan,
      root: applyFilters(plan.root)
    }
  }

  /**
   * 构建行级过滤条件
   */
  private buildRowFilter(node: QueryNode, context: ExecutionContext): FilterCondition | null {
    const conditions: FilterCondition[] = []

    // 租户隔离
    if (context.tenantId && node.dataSource.table) {
      conditions.push({
        operator: 'eq',
        field: 'tenant_id',
        value: context.tenantId
      })
    }

    // 组织层级过滤
    if (context.orgHierarchy && node.dataSource.table) {
      conditions.push({
        operator: 'in',
        field: 'org_id',
        value: context.orgHierarchy
      })
    }

    // 数据所有者过滤
    if (context.userId && node.dataSource.table?.includes('private')) {
      conditions.push({
        operator: 'eq',
        field: 'owner_id',
        value: context.userId
      })
    }

    if (conditions.length === 0) return null
    if (conditions.length === 1) return conditions[0]

    return { operator: 'and', conditions }
  }

  /**
   * 获取允许访问的字段
   */
  private getAllowedFields(node: QueryNode, context: ExecutionContext): string[] {
    const allFields = node.fields.map(f => f.name)

    // 根据用户角色和敏感度确定允许字段
    const clearanceLevel = context.attributes?.clearanceLevel || 1
    const allowedFields: string[] = []

    for (const field of allFields) {
      // 检查字段敏感度
      const fieldSensitivity = this.getFieldSensitivity(node.dataSource.table, field)

      if (fieldSensitivity <= clearanceLevel) {
        allowedFields.push(field)
      }
    }

    return allowedFields
  }

  /**
   * 获取字段敏感度级别
   */
  private getFieldSensitivity(table: string | undefined, field: string): number {
    // 敏感字段映射
    const sensitivePatterns: Record<string, number> = {
      'password': 5,
      'ssn': 5,
      'credit_card': 5,
      'bank_account': 5,
      'salary': 4,
      'phone': 3,
      'email': 2,
      'address': 3,
      'ip_address': 2
    }

    const lowerField = field.toLowerCase()

    for (const [pattern, level] of Object.entries(sensitivePatterns)) {
      if (lowerField.includes(pattern)) {
        return level
      }
    }

    return 1 // 默认最低敏感度
  }

  /**
   * 递归执行查询节点
   */
  private async executeNode(
    node: QueryNode,
    context: ExecutionContext,
    errors: GraphQLError[],
    dataSources: Set<string>
  ): Promise<unknown> {
    try {
      // 记录数据源
      if (node.dataSource) {
        dataSources.add(`${node.dataSource.type}:${node.dataSource.table || 'default'}`)
      }

      switch (node.type) {
        case 'fetch':
          return await this.executeFetch(node, context, errors, dataSources)

        case 'join':
          return await this.executeJoin(node, context, errors, dataSources)

        case 'aggregate':
          return await this.executeAggregate(node, context)

        default:
          // 执行子节点
          if (node.children && node.children.length > 0) {
            const results: Record<string, unknown> = {}
            for (const child of node.children) {
              const result = await this.executeNode(child, context, errors, dataSources)
              if (child.fields[0]) {
                results[child.fields[0].alias || child.fields[0].name] = result
              }
            }
            return results
          }
          return null
      }
    } catch (error) {
      this.logger.error('Node execution failed:', error)
      errors.push({
        message: error instanceof Error ? error.message : 'Node execution failed',
        path: node.fields.map(f => f.name),
        extensions: {
          code: 'EXECUTION_ERROR',
          dataSource: node.dataSource?.type
        }
      })
      return null
    }
  }

  /**
   * 执行 Fetch 节点
   */
  private async executeFetch(
    node: QueryNode,
    context: ExecutionContext,
    errors: GraphQLError[],
    dataSources: Set<string>
  ): Promise<unknown> {
    const { type, connection, table, index } = node.dataSource!

    // 根据数据源类型选择执行器
    switch (type) {
      case 'postgresql':
        return this.executePostgresQuery(node, table!)

      case 'clickhouse':
        return this.executeClickHouseQuery(node, table!)

      case 'redis':
        return this.executeRedisQuery(node)

      case 'elasticsearch':
        return this.executeElasticsearchQuery(node, index!)

      default:
        throw new Error(`Unsupported data source type: ${type}`)
    }
  }

  /**
   * 执行 PostgreSQL 查询
   */
  private async executePostgresQuery(
    node: QueryNode,
    table: string
  ): Promise<unknown[]> {
    const fields = node.fields.map(f => `"${f.name}"`).join(', ')
    let sql = `SELECT ${fields} FROM "${table}"`

    // 添加 WHERE 条件
    if (node.condition) {
      sql += ` WHERE ${this.buildWhereClause(node.condition)}`
    }

    // 添加排序
    if (node.sort) {
      const orderBy = node.sort
        .map(s => `"${s.field}" ${s.direction.toUpperCase()}`)
        .join(', ')
      sql += ` ORDER BY ${orderBy}`
    }

    // 添加分页
    if (node.limit) {
      sql += ` LIMIT ${node.limit}`
    }
    if (node.offset) {
      sql += ` OFFSET ${node.offset}`
    }

    this.logger.debug('Executing PostgreSQL query:', sql)

    const result = await this.dataSource.query(sql)
    return result
  }

  /**
   * 构建 WHERE 子句
   */
  private buildWhereClause(condition: FilterCondition): string {
    switch (condition.operator) {
      case 'eq':
        return `"${condition.field}" = ${this.escapeValue(condition.value)}`
      case 'neq':
        return `"${condition.field}" != ${this.escapeValue(condition.value)}`
      case 'gt':
        return `"${condition.field}" > ${this.escapeValue(condition.value)}`
      case 'gte':
        return `"${condition.field}" >= ${this.escapeValue(condition.value)}`
      case 'lt':
        return `"${condition.field}" < ${this.escapeValue(condition.value)}`
      case 'lte':
        return `"${condition.field}" <= ${this.escapeValue(condition.value)}`
      case 'in':
        const values = Array.isArray(condition.value)
          ? condition.value.map(v => this.escapeValue(v)).join(', ')
          : this.escapeValue(condition.value)
        return `"${condition.field}" IN (${values})`
      case 'like':
        return `"${condition.field}" LIKE ${this.escapeValue(condition.value)}`
      case 'and':
        return `(${condition.conditions!.map(c => this.buildWhereClause(c)).join(' AND ')})`
      case 'or':
        return `(${condition.conditions!.map(c => this.buildWhereClause(c)).join(' OR ')})`
      case 'not':
        return `NOT (${this.buildWhereClause(condition.conditions![0])})`
      default:
        return 'TRUE'
    }
  }

  /**
   * 转义值
   */
  private escapeValue(value: unknown): string {
    if (value === null) return 'NULL'
    if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`
    if (typeof value === 'number') return String(value)
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
    if (value instanceof Date) return `'${value.toISOString()}'`
    return `'${JSON.stringify(value)}'`
  }

  /**
   * 执行 ClickHouse 查询
   */
  private async executeClickHouseQuery(
    node: QueryNode,
    table: string
  ): Promise<unknown[]> {
    // 简化实现，实际应使用 @clickhouse/client
    this.logger.debug('Executing ClickHouse query on table:', table)

    // 构建针对 ClickHouse 优化的 SQL
    const fields = node.fields.map(f => f.name).join(', ')
    let sql = `SELECT ${fields} FROM ${table}`

    if (node.condition) {
      sql += ` WHERE ${this.buildWhereClause(node.condition)}`
    }

    if (node.aggregations) {
      const aggFields = node.aggregations.map(a =>
        `${a.function}(${a.field}) AS ${a.alias}`
      ).join(', ')
      sql = sql.replace('SELECT ' + fields, 'SELECT ' + aggFields)

      if (node.aggregations[0].groupBy) {
        sql += ` GROUP BY ${node.aggregations[0].groupBy.join(', ')}`
      }
    }

    if (node.sort) {
      const orderBy = node.sort.map(s => `${s.field} ${s.direction.toUpperCase()}`).join(', ')
      sql += ` ORDER BY ${orderBy}`
    }

    if (node.limit) {
      sql += ` LIMIT ${node.limit}`
    }

    // 实际执行应使用 ClickHouse 客户端
    // const result = await this.clickhouse.query({ query: sql }).toPromise()
    this.logger.debug('ClickHouse SQL:', sql)

    return [] // 简化返回
  }

  /**
   * 执行 Redis 查询
   */
  private async executeRedisQuery(node: QueryNode): Promise<unknown> {
    const key = node.fields[0]?.name

    if (!key) {
      throw new Error('Redis query requires a key field')
    }

    // 简化实现，实际应使用 ioredis
    this.logger.debug('Executing Redis GET:', key)

    // const value = await this.redis.get(key)
    // return value ? JSON.parse(value) : null

    return null
  }

  /**
   * 执行 Elasticsearch 查询
   */
  private async executeElasticsearchQuery(
    node: QueryNode,
    index: string
  ): Promise<unknown[]> {
    // 构建 Elasticsearch DSL
    const query: Record<string, unknown> = {
      index,
      body: {
        query: node.condition
          ? this.buildESQuery(node.condition)
          : { match_all: {} },
        size: node.limit || 10
      }
    }

    if (node.sort) {
      query.body.sort = node.sort.map(s => ({
        [s.field]: { order: s.direction }
      }))
    }

    // 字段选择
    if (node.fields.length > 0) {
      query.body._source = node.fields.map(f => f.name)
    }

    this.logger.debug('Elasticsearch query:', JSON.stringify(query))

    // 实际执行应使用 @elastic/elasticsearch 客户端
    // const result = await this.elasticsearch.search(query)
    // return result.hits.hits.map(h => h._source)

    return []
  }

  /**
   * 构建 Elasticsearch 查询
   */
  private buildESQuery(condition: FilterCondition): Record<string, unknown> {
    switch (condition.operator) {
      case 'eq':
        return { term: { [condition.field!]: condition.value } }
      case 'neq':
        return { bool: { must_not: { term: { [condition.field!]: condition.value } } } }
      case 'gt':
        return { range: { [condition.field!]: { gt: condition.value } } }
      case 'gte':
        return { range: { [condition.field!]: { gte: condition.value } } }
      case 'lt':
        return { range: { [condition.field!]: { lt: condition.value } } }
      case 'lte':
        return { range: { [condition.field!]: { lte: condition.value } } }
      case 'in':
        return { terms: { [condition.field!]: condition.value } }
      case 'like':
        return { wildcard: { [condition.field!]: `*${condition.value}*` } }
      case 'and':
        return { bool: { must: condition.conditions!.map(c => this.buildESQuery(c)) } }
      case 'or':
        return { bool: { should: condition.conditions!.map(c => this.buildESQuery(c)) } }
      case 'not':
        return { bool: { must_not: this.buildESQuery(condition.conditions![0]) } }
      default:
        return { match_all: {} }
    }
  }

  /**
   * 执行 Join 节点
   */
  private async executeJoin(
    node: QueryNode,
    context: ExecutionContext,
    errors: GraphQLError[],
    dataSources: Set<string>
  ): Promise<unknown[]> {
    // 先执行左表
    const leftResults = await this.executeNode(
      { ...node, type: 'fetch' },
      context,
      errors,
      dataSources
    ) as unknown[]

    if (!leftResults.length) return []

    // 获取 join keys
    const joinKeys = node.joins?.[0]?.on
    if (!joinKeys) return leftResults

    // 提取右表查询 keys
    const rightKeys = leftResults.map(r => r[joinKeys.leftField as keyof typeof r])

    // 执行右表查询
    const rightNode: QueryNode = {
      type: 'fetch',
      dataSource: node.joins![0].target,
      fields: node.joins![0].fields,
      condition: {
        operator: 'in',
        field: joinKeys.rightField,
        value: rightKeys
      }
    }

    const rightResults = await this.executeNode(
      rightNode,
      context,
      errors,
      dataSources
    ) as unknown[]

    // 执行 join
    const joinedResults = leftResults.map(left => {
      const leftKey = left[joinKeys.leftField as keyof typeof left]
      const matchingRights = rightResults.filter(
        right => right[joinKeys.rightField as keyof typeof right] === leftKey
      )

      return {
        ...left,
        [node.joins![0].target.table!]: matchingRights.length === 1
          ? matchingRights[0]
          : matchingRights
      }
    })

    return joinedResults
  }

  /**
   * 执行聚合节点
   */
  private async executeAggregate(
    node: QueryNode,
    context: ExecutionContext
  ): Promise<unknown> {
    // 聚合操作应发送到 ClickHouse 或 PostgreSQL
    if (node.dataSource?.type === 'clickhouse') {
      return this.executeClickHouseQuery(node, node.dataSource.table!)
    }

    // 默认 PostgreSQL
    return this.executePostgresQuery(node, node.dataSource?.table || 'default')
  }

  /**
   * 格式化响应
   */
  private formatResponse(
    rawResult: { data: unknown; errors: GraphQLError[] },
    ast: GraphQLDocument
  ): { data: unknown; errors: GraphQLError[] } {
    // 简化实现，实际应根据 GraphQL 规范格式化响应
    return rawResult
  }

  /**
   * 计算查询复杂度
   */
  private calculateComplexity(ast: GraphQLDocument): number {
    const operation = ast.definitions[0] as OperationDefinition

    const countFields = (selectionSet: SelectionSet, depth: number): number => {
      let count = 0
      for (const selection of selectionSet.selections) {
        if (selection.kind === 'Field') {
          count += depth
          if (selection.selectionSet) {
            count += countFields(selection.selectionSet, depth + 1)
          }
        }
      }
      return count
    }

    return countFields(operation.selectionSet, 1)
  }

  /**
   * 格式化错误结果
   */
  private formatErrorResult(
    errors: GraphQLError[],
    startTime: number
  ): ExecutionResult {
    return {
      data: null,
      errors,
      extensions: {
        executionTimeMs: Date.now() - startTime,
        queryComplexity: 0,
        cacheHit: false,
        dataSources: []
      }
    }
  }
}

// 权限类型
interface Permission {
  action: 'create' | 'read' | 'update' | 'delete' | 'execute'
  resource: string
  fields?: string[]
  sensitivityLevel?: number
  conditions?: FilterCondition[]
}

// 执行上下文
interface ExecutionContext {
  user: { id: string; [key: string]: unknown } | null
  roles: Array<{
    name: string
    permissions?: Permission[]
  }>
  permissions: Permission[]
  tenantId?: string
  orgHierarchy?: string[]
  userId?: string
  attributes?: Record<string, unknown>
}

// Fragment 定义
interface FragmentDefinition {
  kind: 'FragmentDefinition'
  name: { value: string }
  typeCondition: { name: { value: string } }
  selectionSet: SelectionSet
}

// Inline Fragment 和 Fragment Spread 类型
interface InlineFragment {
  kind: 'InlineFragment'
  typeCondition?: { name: { value: string } }
  selectionSet: SelectionSet
}

interface FragmentSpread {
  kind: 'FragmentSpread'
  name: { value: string }
}
```

### 2.2 API 生命周期管理服务 (ApiLifecycleService)

```typescript
// apps/api/src/modules/data-gateway/services/api-lifecycle.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, LessThan, MoreThan } from 'typeorm'
import { ApiVersion, ApiStatus } from '../entities/api-version.entity'
import { ApiEndpoint, HttpMethod } from '../entities/api-endpoint.entity'
import { TrafficSplit } from '../entities/traffic-split.entity'

// API 版本策略类型
export type VersionStrategy = 'url' | 'header' | 'query' | 'content-negotiation'

// 灰度策略类型
export type CanaryStrategy = 'percentage' | 'header' | 'user-segment' | 'random'

// API 生命周期状态
export type LifecycleState = 'draft' | 'alpha' | 'beta' | 'stable' | 'deprecated' | 'sunset' | 'eol'

// API 版本信息
interface ApiVersionInfo {
  id: string
  apiName: string
  version: string
  status: LifecycleState
  releaseDate: Date
  sunsetDate?: Date
  eolDate?: Date
  breakingChanges: BreakingChange[]
  newFeatures: string[]
  deprecatedFeatures: string[]
  documentationUrl: string
  changelogUrl: string
  migrationGuideUrl?: string
}

interface BreakingChange {
  field: string
  oldBehavior: string
  newBehavior: string
  migrationPath: string
}

// 灰度发布配置
interface CanaryConfig {
  apiVersionId: string
  strategy: CanaryStrategy
  config: PercentageCanary | HeaderCanary | UserSegmentCanary | RandomCanary
  metrics: CanaryMetrics
}

interface PercentageCanary {
  type: 'percentage'
  percentage: number // 0-100
}

interface HeaderCanary {
  type: 'header'
  headerName: string
  headerValue: string
}

interface UserSegmentCanary {
  type: 'user-segment'
  segmentCriteria: Record<string, unknown>
}

interface RandomCanary {
  type: 'random'
  seed: number
}

interface CanaryMetrics {
  errorRateThreshold: number
  latencyThreshold: number
  minSampleSize: number
  autoRollback: boolean
}

// 流量分配规则
interface TrafficSplitRule {
  id: string
  apiId: string
  rules: SplitRule[]
  defaultVersion: string
}

interface SplitRule {
  version: string
  conditions: TrafficCondition[]
  weight: number
}

type TrafficCondition =
  | { type: 'header'; name: string; value: string }
  | { type: 'query'; name: string; value: string }
  | { type: 'user-agent'; pattern: string }
  | { type: 'ip-range'; ranges: string[] }
  | { type: 'time'; start: string; end: string; timezone: string }

@Injectable()
export class ApiLifecycleService {
  private readonly logger = new Logger(ApiLifecycleService.name)

  constructor(
    @InjectRepository(ApiVersion)
    private readonly apiVersionRepo: Repository<ApiVersion>,
    @InjectRepository(ApiEndpoint)
    private readonly apiEndpointRepo: Repository<ApiEndpoint>,
    @InjectRepository(TrafficSplit)
    private readonly trafficSplitRepo: Repository<TrafficSplit>
  ) {}

  /**
   * 创建 API 新版本
   */
  async createApiVersion(info: ApiVersionInfo): Promise<ApiVersion> {
    // 检查版本号格式
    if (!this.isValidSemver(info.version)) {
      throw new Error(`Invalid version format: ${info.version}. Expected semver (e.g., 1.0.0)`)
    }

    // 检查版本是否已存在
    const existing = await this.apiVersionRepo.findOne({
      where: {
        apiName: info.apiName,
        version: info.version
      }
    })

    if (existing) {
      throw new Error(`API version ${info.apiName}@${info.version} already exists`)
    }

    // 创建版本记录
    const apiVersion = this.apiVersionRepo.create({
      apiName: info.apiName,
      version: info.version,
      status: info.status,
      releaseDate: info.releaseDate,
      sunsetDate: info.sunsetDate,
      eolDate: info.eolDate,
      breakingChanges: info.breakingChanges,
      newFeatures: info.newFeatures,
      deprecatedFeatures: info.deprecatedFeatures,
      documentationUrl: info.documentationUrl,
      changelogUrl: info.changelogUrl,
      migrationGuideUrl: info.migrationGuideUrl
    })

    const saved = await this.apiVersionRepo.save(apiVersion)
    this.logger.log(`Created API version: ${info.apiName}@${info.version}`)

    return saved
  }

  /**
   * 设置灰度发布
   */
  async setupCanary(config: CanaryConfig): Promise<void> {
    const apiVersion = await this.apiVersionRepo.findOne({
      where: { id: config.apiVersionId }
    })

    if (!apiVersion) {
      throw new Error(`API version not found: ${config.apiVersionId}`)
    }

    // 验证灰度策略
    this.validateCanaryConfig(config)

    // 保存灰度配置
    await this.apiVersionRepo.update(config.apiVersionId, {
      canaryConfig: config,
      canaryStatus: 'running'
    })

    this.logger.log(
      `Started canary deployment for ${apiVersion.apiName}@${apiVersion.version} ` +
      `with strategy: ${config.strategy}`
    )
  }

  /**
   * 验证灰度配置
   */
  private validateCanaryConfig(config: CanaryConfig): void {
    switch (config.strategy) {
      case 'percentage':
        const pctConfig = config.config as PercentageCanary
        if (pctConfig.percentage < 0 || pctConfig.percentage > 100) {
          throw new Error('Percentage must be between 0 and 100')
        }
        break

      case 'header':
        const headerConfig = config.config as HeaderCanary
        if (!headerConfig.headerName || !headerConfig.headerValue) {
          throw new Error('Header name and value are required')
        }
        break

      case 'user-segment':
        const segmentConfig = config.config as UserSegmentCanary
        if (!segmentConfig.segmentCriteria || Object.keys(segmentConfig.segmentCriteria).length === 0) {
          throw new Error('Segment criteria are required')
        }
        break

      case 'random':
        // Random canary 不需要额外验证
        break

      default:
        throw new Error(`Unknown canary strategy: ${config.strategy}`)
    }
  }

  /**
   * 更新流量分配规则
   */
  async updateTrafficSplit(rule: TrafficSplitRule): Promise<void> {
    // 验证规则
    let totalWeight = 0
    for (const r of rule.rules) {
      totalWeight += r.weight
    }

    if (totalWeight > 100) {
      throw new Error(`Total weight cannot exceed 100, got ${totalWeight}`)
    }

    // 保存或更新规则
    const existing = await this.trafficSplitRepo.findOne({
      where: { apiId: rule.apiId }
    })

    if (existing) {
      await this.trafficSplitRepo.update(existing.id, {
        rules: rule.rules,
        defaultVersion: rule.defaultVersion,
        updatedAt: new Date()
      })
    } else {
      await this.trafficSplitRepo.save({
        apiId: rule.apiId,
        rules: rule.rules,
        defaultVersion: rule.defaultVersion
      })
    }

    this.logger.log(`Updated traffic split for API: ${rule.apiId}`)
  }

  /**
   * 确定请求应路由到哪个版本
   */
  async routeRequest(
    apiId: string,
    context: RouteContext
  ): Promise<{ version: string; shouldRoute: boolean }> {
    // 获取流量分配规则
    const trafficSplit = await this.trafficSplitRepo.findOne({
      where: { apiId }
    })

    if (!trafficSplit) {
      // 没有配置，使用默认版本
      return { version: 'latest', shouldRoute: true }
    }

    // 按条件匹配规则
    for (const rule of trafficSplit.rules) {
      if (this.matchesConditions(rule.conditions, context)) {
        return { version: rule.version, shouldRoute: true }
      }
    }

    // 没有匹配到规则，使用默认版本
    return { version: trafficSplit.defaultVersion, shouldRoute: true }
  }

  /**
   * 检查条件是否匹配
   */
  private matchesConditions(
    conditions: TrafficCondition[],
    context: RouteContext
  ): boolean {
    for (const condition of conditions) {
      switch (condition.type) {
        case 'header':
          if (context.headers?.[condition.name] !== condition.value) {
            return false
          }
          break

        case 'query':
          if (context.query?.[condition.name] !== condition.value) {
            return false
          }
          break

        case 'user-agent':
          if (!context.userAgent?.match(new RegExp(condition.pattern))) {
            return false
          }
          break

        case 'ip-range':
          if (!condition.ranges.some(range => this.isIpInRange(context.ip!, range))) {
            return false
          }
          break

        case 'time':
          const now = new Date()
          const timezone = condition.timezone || 'UTC'
          // 简化实现，实际应考虑时区
          const currentHour = now.getHours()
          const [startHour, endHour] = [condition.start, condition.end].map(t => parseInt(t))

          if (currentHour < startHour || currentHour > endHour) {
            return false
          }
          break
      }
    }

    return true
  }

  /**
   * 检查 IP 是否在范围内
   */
  private isIpInRange(ip: string, range: string): boolean {
    // 简化实现，实际应支持 CIDR 表示法
    if (range.includes('/')) {
      const [network, bits] = range.split('/')
      const mask = parseInt(bits)
      // IP 范围检查逻辑
      return ip.startsWith(network.substring(0, network.lastIndexOf('.')))
    }

    // 简单范围 (如 192.168.1.1-192.168.1.100)
    if (range.includes('-')) {
      const [start, end] = range.split('-')
      return this.ipToNumber(ip) >= this.ipToNumber(start) &&
             this.ipToNumber(ip) <= this.ipToNumber(end)
    }

    return ip === range
  }

  /**
   * IP 转数字
   */
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
  }

  /**
   * 验证 SemVer 格式
   */
  private isValidSemver(version: string): boolean {
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
    return semverRegex.test(version)
  }

  /**
   * 获取 API 版本列表
   */
  async listApiVersions(apiName: string): Promise<ApiVersionInfo[]> {
    const versions = await this.apiVersionRepo.find({
      where: { apiName },
      order: { releaseDate: 'DESC' }
    })

    return versions.map(v => ({
      id: v.id,
      apiName: v.apiName,
      version: v.version,
      status: v.status,
      releaseDate: v.releaseDate,
      sunsetDate: v.sunsetDate,
      eolDate: v.eolDate,
      breakingChanges: v.breakingChanges,
      newFeatures: v.newFeatures,
      deprecatedFeatures: v.deprecatedFeatures,
      documentationUrl: v.documentationUrl,
      changelogUrl: v.changelogUrl,
      migrationGuideUrl: v.migrationGuideUrl
    }))
  }

  /**
   * 废弃 API 版本
   */
  async deprecateApiVersion(
    apiVersionId: string,
    sunsetDate: Date,
    migrationGuide?: string
  ): Promise<void> {
    const apiVersion = await this.apiVersionRepo.findOne({
      where: { id: apiVersionId }
    })

    if (!apiVersion) {
      throw new Error(`API version not found: ${apiVersionId}`)
    }

    await this.apiVersionRepo.update(apiVersionId, {
      status: 'deprecated',
      sunsetDate,
      migrationGuideUrl: migrationGuide,
      updatedAt: new Date()
    })

    this.logger.log(
      `Deprecated API version ${apiVersion.apiName}@${apiVersion.version}, ` +
      `sunset date: ${sunsetDate.toISOString()}`
    )
  }

  /**
   * 获取灰度发布状态
   */
  async getCanaryStatus(apiVersionId: string): Promise<{
    status: 'running' | 'paused' | 'completed' | 'failed' | 'rolled-back'
    config: CanaryConfig
    metrics: {
      totalRequests: number
      errorRate: number
      avgLatency: number
      p95Latency: number
      p99Latency: number
    }
    startTime: Date
    estimatedCompletionTime?: Date
  } | null> {
    const apiVersion = await this.apiVersionRepo.findOne({
      where: { id: apiVersionId }
    })

    if (!apiVersion?.canaryConfig) {
      return null
    }

    // 模拟灰度指标（实际应从监控系统获取）
    return {
      status: apiVersion.canaryStatus || 'running',
      config: apiVersion.canaryConfig as CanaryConfig,
      metrics: {
        totalRequests: 15234,
        errorRate: 0.002,
        avgLatency: 45,
        p95Latency: 120,
        p99Latency: 200
      },
      startTime: apiVersion.createdAt,
      estimatedCompletionTime: apiVersion.sunsetDate
    }
  }
}

// 路由上下文
interface RouteContext {
  headers?: Record<string, string>
  query?: Record<string, string>
  userAgent?: string
  ip?: string
  user?: { id: string; [key: string]: unknown }
}

// 实体类定义（简化版）
export class ApiVersion {
  id!: string
  apiName!: string
  version!: string
  status!: LifecycleState
  releaseDate!: Date
  sunsetDate?: Date
  eolDate?: Date
  breakingChanges!: BreakingChange[]
  newFeatures!: string[]
  deprecatedFeatures!: string[]
  documentationUrl!: string
  changelogUrl!: string
  migrationGuideUrl?: string
  canaryConfig?: unknown
  canaryStatus?: string
  createdAt!: Date
  updatedAt!: Date
}

export class ApiEndpoint {
  id!: string
  apiVersionId!: string
  path!: string
  method!: HttpMethod
  operationName!: string
  description?: string
  parameters!: Parameter[]
  requestSchema?: unknown
  responseSchema!: unknown
  authRequired!: boolean
  rateLimit?: RateLimit
  createdAt!: Date
  updatedAt!: Date
}

export class TrafficSplit {
  id!: string
  apiId!: string
  rules!: TrafficSplitRule[]
  defaultVersion!: string
  createdAt!: Date
  updatedAt!: Date
}

interface Parameter {
  name: string
  in: 'query' | 'path' | 'header' | 'body'
  type: string
  required: boolean
  description?: string
  default?: unknown
}

interface RateLimit {
  requestsPerSecond: number
  burstSize: number
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'
```

### 2.3 访问控制服务 (AccessControlService)

```typescript
// apps/api/src/modules/data-gateway/services/access-control.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { CacheService } from '../../../infrastructure/cache/cache.service'

// 访问控制决策结果
interface AccessDecision {
  allowed: boolean
  reason?: string
  conditions?: PolicyCondition[]
  obligations?: Obligation[]
  advice?: Advice[]
}

// 策略条件
interface PolicyCondition {
  type: 'attribute' | 'environment' | 'resource' | 'action' | 'subject'
  attribute: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'regex' | 'exists'
  value?: unknown
}

// 义务（必须执行的操作）
interface Obligation {
  id: string
  action: 'log' | 'audit' | 'encrypt' | 'mask' | 'notify' | 'approve'
  parameters: Record<string, unknown>
  fulfilled: boolean
}

// 建议（推荐执行的操作）
interface Advice {
  id: string
  type: 'info' | 'warning' | 'critical'
  message: string
  suggestedAction?: string
}

// 访问请求上下文
interface AccessRequest {
  subject: {
    id: string
    type: 'user' | 'service' | 'application'
    attributes: Record<string, unknown>
    roles: string[]
    groups: string[]
    permissions?: string[]
  }
  resource: {
    type: string
    id: string
    attributes: Record<string, unknown>
    classification?: string
    owner?: string
  }
  action: {
    type: string
    scope?: string
    fields?: string[]
  }
  environment: {
    timestamp: Date
    ip: string
    userAgent?: string
    location?: string
    riskScore?: number
    trustScore?: number
  }
  request: {
    id: string
    path: string
    method: string
    headers: Record<string, string>
  }
}

// 策略集
interface PolicySet {
  id: string
  name: string
  description?: string
  policies: Policy[]
  combiningAlgorithm: 'deny-overrides' | 'permit-overrides' | 'first-applicable' | 'only-one-applicable' | 'ordered-deny-overrides' | 'ordered-permit-overrides'
  target?: PolicyCondition[]
  obligationExpressions?: Obligation[]
  adviceExpressions?: Advice[]
}

// 策略
interface Policy