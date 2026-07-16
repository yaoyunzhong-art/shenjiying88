# P-61 用户画像中心与实时计算引擎详细设计文档

## 1. 概述

### 1.1 模块定位
用户画像中心与实时计算引擎是 M5 Platform V18 数据智能体系的核心子系统，负责：
- **用户画像中心**: 统一标签体系、RFM 模型、分群运营、生命周期管理
- **实时计算引擎**: 基于 Apache Flink 的流式计算、窗口分析、CEP 复杂事件处理

### 1.2 核心目标

| 指标 | 目标值 | 验收标准 |
|------|--------|----------|
| 标签计算延迟 | < 5min | 从事件发生到标签更新 |
| 实时窗口延迟 | < 1s | Flink 处理延迟 P99 |
| 画像查询响应 | < 100ms | 单用户画像查询 P95 |
| 标签准确率 | > 95% | 抽样验证 |
| 分群覆盖率 | > 90% | 活跃用户覆盖 |

### 1.3 技术架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    用户画像中心与实时计算引擎架构                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     数据采集层 (Data Collection)                   │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │  │ 行为事件   │  │ 交易数据   │  │ 设备信息   │  │ 社交数据   │   │   │
│  │  │ (Kafka)    │  │ (CDC)      │  │ (Log)      │  │ (API)      │   │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘   │   │
│  │        └─────────────────┴───────────────┴───────────────┘          │   │
│  │                              │                                      │   │
│  │                   ┌──────────▼──────────┐                            │   │
│  │                   │   Kafka Cluster     │                            │   │
│  │                   │  (3 Brokers / 3ZK)  │                            │   │
│  │                   └──────────┬──────────┘                            │   │
│  └───────────────────────────────┼──────────────────────────────────────┘   │
│                                  │                                            │
│  ┌───────────────────────────────▼──────────────────────────────────────┐    │
│  │                     实时计算引擎 (Flink Processing)                     │    │
│  │                                                                       │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │    │
│  │  │ 事件流处理      │  │ 窗口计算        │  │ CEP 复杂事件    │   │    │
│  │  │ (Event Time)   │  │ (Tumbling/Sliding)│  │ (Pattern Match) │   │    │
│  │  │                 │  │                 │  │                 │   │    │
│  │  │ • Watermark    │  │ • 实时聚合      │  │ • 异常检测      │   │    │
│  │  │ • Event Time   │  │ • 会话分析      │  │ • 行为序列      │   │    │
│  │  │ • Late Data    │  │ • 漏斗分析      │  │ • 规则引擎      │   │    │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │    │
│  │           └────────────────────┴────────────────────┘              │    │
│  │                              │                                    │    │
│  │                   ┌──────────▼──────────┐                          │    │
│  │                   │   Flink SQL API    │                          │    │
│  │                   │  (DDL/DML/UDF/UDAF) │                          │    │
│  │                   └──────────┬──────────┘                          │    │
│  │                              │                                      │    │
│  │  ┌─────────────────────────┼─────────────────────────┐          │    │
│  │  │         状态管理 (State Backend)                      │          │    │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │          │    │
│  │  │  │ RocksDB    │  │ Incremental│  │ TTL State  │   │          │    │
│  │  │  │ (本地磁盘)  │  │ Checkpoint │  │ (过期清理) │   │          │    │
│  │  │  └────────────┘  └────────────┘  └────────────┘   │          │    │
│  │  └──────────────────────────────────────────────────┘          │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     用户画像中心 (User Profile Center)               │   │
│  │                                                                       │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │   │
│  │  │ 标签体系        │  │ RFM 模型        │  │ 生命周期管理    │   │   │
│  │  │ (Tag System)    │  │ (RFM Model)    │  │ (Lifecycle)    │   │   │
│  │  │                 │  │                 │  │                 │   │   │
│  │  │ • 基础标签      │  │ • Recency      │  │ • 新客期        │   │   │
│  │  │ • 行为标签      │  │ • Frequency    │  │ • 成长期        │   │   │
│  │  │ • 交易标签      │  │ • Monetary     │  │ • 成熟期        │   │   │
│  │  │ • 预测标签      │  │ • 分群计算     │  │ • 衰退期        │   │   │
│  │  │ • 实时标签      │  │ • 价值分层     │  │ • 流失预警      │   │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │   │
│  │           └────────────────────┴────────────────────┘              │   │
│  │                              │                                    │   │
│  │                   ┌──────────▼──────────┐                          │   │
│  │                   │   分群运营中心       │                          │   │
│  │                   │  (Segmentation)      │                          │   │
│  │                   │                      │                          │   │
│  │                   │ • 规则分群          │                          │   │
│  │                   │ • 标签组合分群      │                          │   │
│  │                   │ • Lookalike 扩展    │                          │   │
│  │                   │ • 动态分群          │                          │   │
│  │                   │ • 分群效果分析      │                          │   │
│  │                   └──────────┬──────────┘                          │   │
│  │                              │                                    │   │
│  │  ┌─────────────────────────┼─────────────────────────┐          │   │
│  │  │         数据存储层 (Storage)                        │          │   │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │          │   │
│  │  │  │ Doris      │  │ Redis      │  │ HBase      │   │          │   │
│  │  │  │ (标签主库)  │  │ (热数据)   │  │ (宽表)     │   │          │   │
│  │  │  └────────────┘  └────────────┘  └────────────┘   │          │   │
│  │  └──────────────────────────────────────────────────┘          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心子系统设计

### 2.1 实时标签计算引擎

```typescript
// src/modules/bi/profile/tag-compute-engine.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TableClient, AzureNamedKeyCredential } from '@azure/data-tables';
import { TableServiceClient } from '@azure/data-tables';

interface TagDefinition {
  id: string;
  name: string;
  code: string;
  category: 'basic' | 'behavior' | 'transaction' | 'predictive' | 'realtime';
  valueType: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'json';
  computeMode: 'batch' | 'realtime' | 'hybrid';
  sourceType: 'sql' | 'flink_sql' | 'udf' | 'api' | 'manual';
  sourceConfig: {
    query?: string;
    table?: string;
    dependencies?: string[];
    udfClass?: string;
    apiEndpoint?: string;
  };
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  ttl?: number;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UserTagValue {
  userId: string;
  tenantId: string;
  tagId: string;
  tagCode: string;
  value: any;
  valueType: string;
  score?: number;
  confidence?: number;
  source: string;
  computedAt: Date;
  expiresAt?: Date;
  version: number;
}

@Injectable()
export class TagComputeEngineService {
  private readonly logger = new Logger(TagComputeEngineService.name);
  private tableClient: TableClient;
  private flinkJobManager: any; // Flink JobManager 客户端

  constructor(
    @InjectRepository(TagDefinition)
    private tagDefRepo: Repository<TagDefinition>,
    private dataSource: DataSource,
  ) {
    this.initializeStorage();
  }

  private async initializeStorage() {
    // 初始化 Azure Table Storage 或其他存储
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (connectionString) {
      this.tableClient = TableClient.fromConnectionString(
        connectionString,
        'userTags'
      );
    }
  }

  /**
   * 注册标签定义
   */
  async registerTag(definition: Omit<TagDefinition, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<TagDefinition> {
    // 验证标签定义
    await this.validateTagDefinition(definition);

    // 检查标签代码唯一性
    const existing = await this.tagDefRepo.findOne({
      where: { code: definition.code, isActive: true },
    });

    if (existing) {
      throw new Error(`Tag with code '${definition.code}' already exists`);
    }

    // 创建标签定义
    const tagDef: TagDefinition = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...definition,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.tagDefRepo.save(tagDef);

    // 根据计算模式启动相应的计算任务
    if (tagDef.computeMode === 'realtime' || tagDef.computeMode === 'hybrid') {
      await this.deployRealtimeTagJob(tagDef);
    }

    this.logger.log(`Tag '${tagDef.name}' registered successfully`);

    return tagDef;
  }

  /**
   * 批量计算标签
   */
  async computeTagsBatch(
    tagIds: string[],
    options: {
      tenantId?: string;
      userIds?: string[];
      dateRange?: { start: Date; end: Date };
      priority?: 'low' | 'normal' | 'high';
    } = {},
  ): Promise<{ jobId: string; status: string; estimatedTime: number }> {
    // 创建批处理作业
    const jobId = `tag-batch-${Date.now()}`;

    // 获取标签定义
    const tagDefs = await this.tagDefRepo.findByIds(tagIds);

    // 构建计算依赖图
    const dependencyGraph = this.buildDependencyGraph(tagDefs);

    // 提交 Flink 批处理作业
    await this.submitFlinkBatchJob(jobId, tagDefs, dependencyGraph, options);

    this.logger.log(`Batch tag computation job '${jobId}' submitted`);

    return {
      jobId,
      status: 'running',
      estimatedTime: this.estimateComputeTime(tagDefs, options),
    };
  }

  /**
   * 查询用户画像
   */
  async getUserProfile(
    userId: string,
    tenantId: string,
    options: {
      tagCategories?: string[];
      includeRealtime?: boolean;
      includeScore?: boolean;
    } = {},
  ): Promise<{
    userId: string;
    tenantId: string;
    tags: Record<string, any>;
    rfm?: {
      recency: number;
      frequency: number;
      monetary: number;
      score: number;
      segment: string;
    };
    lifecycle?: string;
    updatedAt: Date;
  }> {
    // 从存储中查询标签值
    const tagValues = await this.queryUserTagValues(userId, tenantId, options);

    // 组织为结构化画像
    const profile = {
      userId,
      tenantId,
      tags: this.organizeTags(tagValues),
      rfm: this.extractRFM(tagValues),
      lifecycle: this.extractLifecycle(tagValues),
      updatedAt: this.getLatestUpdateTime(tagValues),
    };

    return profile;
  }

  /**
   * 用户分群
   */
  async createSegment(
    definition: {
      name: string;
      description?: string;
      rules: Array<{
        type: 'tag' | 'behavior' | 'rfm' | 'sql';
        condition: Record<string, any>;
        logic?: 'and' | 'or';
      }>;
      refreshMode: 'realtime' | 'scheduled' | 'manual';
      refreshCron?: string;
    },
    tenantId: string,
  ): Promise<{
    segmentId: string;
    estimatedSize: number;
    status: string;
  }> {
    const segmentId = `seg-${Date.now()}`;

    // 解析分群规则
    const parsedRules = await this.parseSegmentRules(definition.rules);

    // 转换为 Flink SQL 或 Doris SQL
    const query = this.buildSegmentQuery(parsedRules, tenantId);

    // 执行估算查询
    const estimatedSize = await this.estimateSegmentSize(query);

    // 保存分群定义
    await this.saveSegmentDefinition(segmentId, definition, query, tenantId);

    // 根据刷新模式调度任务
    if (definition.refreshMode === 'realtime') {
      await this.deployRealtimeSegmentJob(segmentId, query);
    }

    return {
      segmentId,
      estimatedSize,
      status: 'created',
    };
  }

  // ============== 私有辅助方法 ==============

  private async validateTagDefinition(definition: any): Promise<void> {
    // 验证标签定义完整性和合法性
    if (!definition.name || !definition.code) {
      throw new Error('Tag name and code are required');
    }

    if (!['basic', 'behavior', 'transaction', 'predictive', 'realtime'].includes(definition.category)) {
      throw new Error('Invalid tag category');
    }

    // 验证计算模式配置
    if (definition.computeMode === 'realtime' && !definition.sourceConfig.query) {
      throw new Error('Realtime tags require Flink SQL query');
    }
  }

  private async deployRealtimeTagJob(tagDef: TagDefinition): Promise<void> {
    // 构建 Flink SQL 作业
    const flinkSQL = this.buildFlinkSQLForTag(tagDef);

    // 提交到 Flink JobManager
    const jobConfig = {
      jobName: `tag-${tagDef.code}`,
      parallelism: 4,
      checkpointing: {
        mode: 'EXACTLY_ONCE',
        interval: 60000,
        timeout: 600000,
      },
      restartStrategy: {
        type: 'fixed-delay',
        attempts: 3,
        delay: 10000,
      },
    };

    // 调用 Flink REST API 提交作业
    const jobId = await this.submitFlinkJob(flinkSQL, jobConfig);

    this.logger.log(`Realtime tag job deployed: ${tagDef.code} (Job ID: ${jobId})`);
  }

  private buildFlinkSQLForTag(tagDef: TagDefinition): string {
    // 构建 Flink SQL DDL 和 DML
    const sourceTable = tagDef.sourceConfig.table;
    const query = tagDef.sourceConfig.query;

    // 构建 CREATE TABLE DDL
    const ddl = `
      CREATE TABLE user_behavior (
        user_id STRING,
        tenant_id STRING,
        event_type STRING,
        event_time TIMESTAMP(3),
        properties MAP<STRING, STRING>,
        WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
      ) WITH (
        'connector' = 'kafka',
        'topic' = '${sourceTable}',
        'properties.bootstrap.servers' = '${process.env.KAFKA_BROKERS}',
        'format' = 'json',
        'scan.startup.mode' = 'latest-offset'
      );
    `;

    // 构建 INSERT INTO DML
    const dml = `
      INSERT INTO user_tags
      SELECT 
        user_id,
        tenant_id,
        '${tagDef.code}' as tag_code,
        ${query} as tag_value,
        '${tagDef.valueType}' as value_type,
        NOW() as computed_at
      FROM user_behavior
      WHERE tenant_id IS NOT NULL
      GROUP BY user_id, tenant_id;
    `;

    return `${ddl}\n${dml}`;
  }

  private async submitFlinkJob(sql: string, config: any): Promise<string> {
    // 调用 Flink REST API
    const flinkUrl = process.env.FLINK_URL || 'http://localhost:8081';
    
    const response = await fetch(`${flinkUrl}/v1/jars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        programArgs: sql,
        parallelism: config.parallelism,
        jobName: config.jobName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit Flink job: ${await response.text()}`);
    }

    const result = await response.json();
    return result.jobid;
  }

  private buildDependencyGraph(tagDefs: TagDefinition[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const tagDef of tagDefs) {
      const dependencies = tagDef.sourceConfig.dependencies || [];
      graph.set(tagDef.id, dependencies);
    }

    return graph;
  }

  private async submitFlinkBatchJob(
    jobId: string,
    tagDefs: TagDefinition[],
    dependencyGraph: Map<string, string[]>,
    options: any,
  ): Promise<void> {
    // 拓扑排序确定执行顺序
    const executionOrder = this.topologicalSort(dependencyGraph);

    // 构建 Flink Batch SQL
    const batchSQL = this.buildBatchSQL(tagDefs, executionOrder, options);

    // 提交批处理作业
    await this.submitFlinkJob(batchSQL, {
      jobName: `batch-tags-${jobId}`,
      parallelism: options.priority === 'high' ? 8 : 4,
      checkpointing: { enabled: false }, // 批处理不需要 checkpoint
    });
  }

  private topologicalSort(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const result: string[] = [];

    const visit = (node: string) => {
      if (temp.has(node)) {
        throw new Error('Circular dependency detected');
      }
      if (visited.has(node)) return;

      temp.add(node);
      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        visit(dep);
      }
      temp.delete(node);
      visited.add(node);
      result.push(node);
    };

    for (const node of graph.keys()) {
      visit(node);
    }

    return result;
  }

  private buildBatchSQL(tagDefs: TagDefinition[], executionOrder: string[], options: any): string {
    // 构建批量标签计算的 SQL
    const sqlParts: string[] = [];

    for (const tagId of executionOrder) {
      const tagDef = tagDefs.find(t => t.id === tagId);
      if (!tagDef) continue;

      const tagSQL = this.buildTagSQL(tagDef, options);
      sqlParts.push(tagSQL);
    }

    return sqlParts.join('\n');
  }

  private buildTagSQL(tagDef: TagDefinition, options: any): string {
    // 根据标签定义构建 SQL
    return `
      INSERT INTO user_tags
      SELECT 
        user_id,
        tenant_id,
        '${tagDef.code}' as tag_code,
        ${tagDef.sourceConfig.query} as tag_value,
        '${tagDef.valueType}' as value_type,
        NOW() as computed_at
      FROM ${tagDef.sourceConfig.table}
      WHERE ${options.tenantId ? `tenant_id = '${options.tenantId}'` : '1=1'}
      GROUP BY user_id, tenant_id;
    `;
  }

  private estimateComputeTime(tagDefs: TagDefinition[], options: any): number {
    // 估算计算时间（秒）
    const baseTime = 60; // 基础时间 1 分钟
    const perTagTime = 30; // 每个标签 30 秒
    const userCountFactor = options.userIds ? options.userIds.length / 1000 : 1;

    return Math.ceil((baseTime + tagDefs.length * perTagTime) * userCountFactor);
  }

  private async queryUserTagValues(
    userId: string,
    tenantId: string,
    options: any,
  ): Promise<UserTagValue[]> {
    // 从存储中查询用户标签值
    // 这里简化实现，实际应该从 Doris/Redis 等存储中查询
    return [];
  }

  private organizeTags(tagValues: UserTagValue[]): Record<string, any> {
    // 将标签值组织为结构化对象
    const result: Record<string, any> = {};

    for (const tagValue of tagValues) {
      const parts = tagValue.tagCode.split('.');
      let current = result;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }

      current[parts[parts.length - 1]] = {
        value: tagValue.value,
        score: tagValue.score,
        confidence: tagValue.confidence,
        computedAt: tagValue.computedAt,
      };
    }

    return result;
  }

  private extractRFM(tagValues: UserTagValue[]): any {
    // 提取 RFM 数据
    const recency = tagValues.find(t => t.tagCode === 'rfm.recency');
    const frequency = tagValues.find(t => t.tagCode === 'rfm.frequency');
    const monetary = tagValues.find(t => t.tagCode === 'rfm.monetary');
    const score = tagValues.find(t => t.tagCode === 'rfm.score');
    const segment = tagValues.find(t => t.tagCode === 'rfm.segment');

    if (!recency || !frequency || !monetary) {
      return undefined;
    }

    return {
      recency: recency.value,
      frequency: frequency.value,
      monetary: monetary.value,
      score: score?.value,
      segment: segment?.value,
    };
  }

  private extractLifecycle(tagValues: UserTagValue[]): string | undefined {
    // 提取生命周期阶段
    const lifecycle = tagValues.find(t => t.tagCode === 'lifecycle.stage');
    return lifecycle?.value;
  }

  private getLatestUpdateTime(tagValues: UserTagValue[]): Date {
    // 获取最新的更新时间
    if (tagValues.length === 0) {
      return new Date();
    }

    return tagValues.reduce((latest, tag) => {
      return tag.computedAt > latest ? tag.computedAt : latest;
    }, tagValues[0].computedAt);
  }

  private async parseSegmentRules(rules: any[]): Promise<any[]> {
    // 解析分群规则
    return rules.map(rule => {
      if (rule.type === 'tag') {
        return {
          ...rule,
          sql: this.buildTagRuleSQL(rule.condition),
        };
      } else if (rule.type === 'behavior') {
        return {
          ...rule,
          sql: this.buildBehaviorRuleSQL(rule.condition),
        };
      } else if (rule.type === 'rfm') {
        return {
          ...rule,
          sql: this.buildRFMRuleSQL(rule.condition),
        };
      } else if (rule.type === 'sql') {
        return rule;
      }
      return rule;
    });
  }

  private buildTagRuleSQL(condition: any): string {
    // 构建标签规则 SQL
    const { tagCode, operator, value } = condition;
    
    switch (operator) {
      case 'eq':
        return `tag_${tagCode} = '${value}'`;
      case 'ne':
        return `tag_${tagCode} != '${value}'`;
      case 'gt':
        return `tag_${tagCode} > ${value}`;
      case 'gte':
        return `tag_${tagCode} >= ${value}`;
      case 'lt':
        return `tag_${tagCode} < ${value}`;
      case 'lte':
        return `tag_${tagCode} <= ${value}`;
      case 'in':
        return `tag_${tagCode} IN (${value.map((v: string) => `'${v}'`).join(', ')})`;
      case 'between':
        return `tag_${tagCode} BETWEEN ${value[0]} AND ${value[1]}`;
      default:
        return '1=1';
    }
  }

  private buildBehaviorRuleSQL(condition: any): string {
    // 构建行为规则 SQL
    const { eventType, timeRange, count, operator } = condition;
    
    return `
      (
        SELECT COUNT(*) 
        FROM user_events 
        WHERE user_id = u.user_id 
          AND event_type = '${eventType}'
          AND event_time >= '${timeRange.start}'
          AND event_time <= '${timeRange.end}'
      ) ${operator} ${count}
    `;
  }

  private buildRFMRuleSQL(condition: any): string {
    // 构建 RFM 规则 SQL
    const { r, f, m } = condition;
    
    const conditions: string[] = [];
    
    if (r) {
      conditions.push(`rfm_recency ${r.operator} ${r.value}`);
    }
    if (f) {
      conditions.push(`rfm_frequency ${f.operator} ${f.value}`);
    }
    if (m) {
      conditions.push(`rfm_monetary ${m.operator} ${m.value}`);
    }
    
    return conditions.join(' AND ');
  }

  private buildSegmentQuery(parsedRules: any[], tenantId: string): string {
    // 构建分群查询 SQL
    const whereConditions = parsedRules.map((rule, index) => {
      const sql = rule.sql || '1=1';
      const logic = index > 0 ? (rule.logic || 'AND') : '';
      return `${logic} (${sql})`;
    }).join(' ');

    return `
      SELECT DISTINCT user_id
      FROM user_profiles
      WHERE tenant_id = '${tenantId}'
        AND ${whereConditions}
    `;
  }

  private async estimateSegmentSize(query: string): Promise<number> {
    // 估算分群大小
    const estimateQuery = `SELECT COUNT(*) as count FROM (${query}) AS t`;
    
    try {
      // 执行抽样估算
      const result = await this.dataSource.query(estimateQuery);
      return result[0]?.count || 0;
    } catch (error) {
      this.logger.warn(`Failed to estimate segment size: ${error.message}`);
      return 0;
    }
  }

  private async saveSegmentDefinition(
    segmentId: string,
    definition: any,
    query: string,
    tenantId: string,
  ): Promise<void> {
    // 保存分群定义到数据库
    await this.dataSource.query(
      `INSERT INTO segments (id, name, description, definition, query, tenant_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        segmentId,
        definition.name,
        definition.description,
        JSON.stringify(definition),
        query,
        tenantId,
      ]
    );
  }

  private async deployRealtimeSegmentJob(segmentId: string, query: string): Promise<void> {
    // 部署实时分群 Flink 作业
    this.logger.log(`Deploying realtime segment job: ${segmentId}`);
    
    // 构建 Flink SQL
    const flinkSQL = `
      CREATE TABLE user_events (
        user_id STRING,
        tenant_id STRING,
        event_type STRING,
        event_time TIMESTAMP(3),
        WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
      ) WITH (
        'connector' = 'kafka',
        'topic' = 'user_events',
        'properties.bootstrap.servers' = '${process.env.KAFKA_BROKERS}',
        'format' = 'json'
      );

      CREATE TABLE segment_users (
        user_id STRING,
        tenant_id STRING,
        segment_id STRING,
        joined_at TIMESTAMP(3),
        PRIMARY KEY (user_id, segment_id) NOT ENFORCED
      ) WITH (
        'connector' = 'jdbc',
        'url' = '${process.env.JDBC_URL}',
        'table-name' = 'segment_users',
        'username' = '${process.env.JDBC_USERNAME}',
        'password' = '${process.env.JDBC_PASSWORD}'
      );

      INSERT INTO segment_users
      SELECT 
        user_id,
        tenant_id,
        '${segmentId}' as segment_id,
        NOW() as joined_at
      FROM (${query}) AS t;
    `;

    // 提交 Flink 作业
    await this.submitFlinkJob(flinkSQL, {
      jobName: `segment-${segmentId}`,
      parallelism: 2,
    });
  }
}
```

（文档继续包含 RFM 模型实现、生命周期管理、Flink CEP 复杂事件处理等完整设计...）

---

## 3. 核心算法与模型

### 3.1 RFM 模型实现

```typescript
// src/modules/bi/profile/models/rfm.model.ts
export class RFMModel {
  /**
   * 计算 RFM 得分
   */
  static calculateScore(
    recency: number,    // 距离上次购买的天数
    frequency: number,  // 购买次数
    monetary: number,   // 累计消费金额
    thresholds?: {
      r: [number, number, number, number];  // R 分位数阈值
      f: [number, number, number, number];  // F 分位数阈值
      m: [number, number, number, number];  // M 分位数阈值
    }
  ): {
    r: number;
    f: number;
    m: number;
    score: number;
    segment: string;
  } {
    // 默认阈值（可根据业务调整）
    const defaultThresholds = {
      r: [7, 30, 90, 180],    // 最近7天=5分, 30天=4分, 90天=3分, 180天=2分
      f: [1, 2, 5, 10],       // 1次=1分, 2次=2分, 5次=3分, 10次=4分
      m: [100, 500, 1000, 5000], // 100元=1分, 500元=2分, 1000元=3分, 5000元=4分
    };

    const t = thresholds || defaultThresholds;

    // 计算 R 得分（越小越好，所以倒序）
    let r = 1;
    if (recency <= t.r[0]) r = 5;
    else if (recency <= t.r[1]) r = 4;
    else if (recency <= t.r[2]) r = 3;
    else if (recency <= t.r[3]) r = 2;

    // 计算 F 得分
    let f = 1;
    if (frequency >= t.f[3]) f = 5;
    else if (frequency >= t.f[2]) f = 4;
    else if (frequency >= t.f[1]) f = 3;
    else if (frequency >= t.f[0]) f = 2;

    // 计算 M 得分
    let m = 1;
    if (monetary >= t.m[3]) m = 5;
    else if (monetary >= t.m[2]) m = 4;
    else if (monetary >= t.m[1]) m = 3;
    else if (monetary >= t.m[0]) m = 2;

    // 计算综合得分
    const score = r * 100 + f * 10 + m;

    // 确定客户分层
    const segment = this.determineSegment(r, f, m);

    return { r, f, m, score, segment };
  }

  /**
   * 确定客户分层
   */
  private static determineSegment(r: number, f: number, m: number): string {
    // 重要价值客户: R 高, F 高, M 高
    if (r >= 4 && f >= 4 && m >= 4) return '重要价值客户';
    
    // 重要发展客户: R 高, F 低, M 高
    if (r >= 4 && f <= 2 && m >= 4) return '重要发展客户';
    
    // 重要保持客户: R 低, F 高, M 高
    if (r <= 2 && f >= 4 && m >= 4) return '重要保持客户';
    
    // 重要挽留客户: R 低, F 低, M 高
    if (r <= 2 && f <= 2 && m >= 4) return '重要挽留客户';
    
    // 一般价值客户: R 高, F 高, M 低
    if (r >= 4 && f >= 4 && m <= 2) return '一般价值客户';
    
    // 一般发展客户: R 高, F 低, M 低
    if (r >= 4 && f <= 2 && m <= 2) return '一般发展客户';
    
    // 一般保持客户: R 低, F 高, M 低
    if (r <= 2 && f >= 4 && m <= 2) return '一般保持客户';
    
    // 一般挽留客户: R 低, F 低, M 低
    if (r <= 2 && f <= 2 && m <= 2) return '一般挽留客户';
    
    return '普通客户';
  }

  /**
   * 计算 RFM 分位数阈值
   */
  static calculateThresholds(userData: Array<{ recency: number; frequency: number; monetary: number }>): {
    r: [number, number, number, number];
    f: [number, number, number, number];
    m: [number, number, number, number];
  } {
    const recencies = userData.map(u => u.recency).sort((a, b) => a - b);
    const frequencies = userData.map(u => u.frequency).sort((a, b) => a - b);
    const monetaries = userData.map(u => u.monetary).sort((a, b) => a - b);

    const getPercentile = (arr: number[], p: number) => {
      const index = Math.ceil((p / 100) * arr.length) - 1;
      return arr[Math.max(0, index)];
    };

    return {
      r: [
        getPercentile(recencies, 20),
        getPercentile(recencies, 40),
        getPercentile(recencies, 60),
        getPercentile(recencies, 80),
      ],
      f: [
        getPercentile(frequencies, 20),
        getPercentile(frequencies, 40),
        getPercentile(frequencies, 60),
        getPercentile(frequencies, 80),
      ],
      m: [
        getPercentile(monetaries, 20),
        getPercentile(monetaries, 40),
        getPercentile(monetaries, 60),
        getPercentile(monetaries, 80),
      ],
    };
  }
}
```

---

**文档版本**: v1.0.0 (P-61 核心设计)  
**最后更新**: 2026-07-16  
**作者**: M5 Platform Team
