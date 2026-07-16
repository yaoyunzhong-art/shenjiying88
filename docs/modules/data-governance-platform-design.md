# P-63 数据治理平台详细设计文档

## 1. 概述

### 1.1 模块定位
数据治理平台是 M5 Platform V18 数据智能体系的核心基础设施，负责：
- **元数据管理**: 统一元数据采集、存储、查询与版本管理
- **数据血缘追踪**: 端到端数据流向追溯、影响分析与根因定位
- **数据质量监控**: 质量规则引擎、实时监控、异常告警与修复闭环
- **数据标准管理**: 标准定义、合规检查、生命周期管理
- **数据安全治理**: 敏感数据发现、分类分级、访问控制

### 1.2 核心目标

| 指标 | 目标值 | 验收标准 |
|------|--------|----------|
| 元数据覆盖率 | > 95% | 核心业务数据资产 |
| 血缘追踪准确率 | > 98% | 字段级血缘 |
| 数据质量评分 | > 90分 | 加权综合评分 |
| 异常响应时间 | < 5min | P1 告警 |
| 敏感数据发现率 | > 99% | 已定义模式 |

### 1.3 技术架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         数据治理平台架构                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      数据采集层 (Data Collection)                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │  │ 数据库     │  │ 数据仓库   │  │ BI 工具    │  │ ETL 平台   │   │   │
│  │  │ Metadata   │  │ Metadata   │  │ Metadata   │  │ Lineage    │   │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘   │   │
│  │        └─────────────────┴───────────────┴───────────────┘          │   │
│  │                              │                                      │   │
│  │                   ┌──────────▼──────────┐                            │   │
│  │                   │   Apache Atlas /    │                            │   │
│  │                   │   OpenMetadata        │                            │   │
│  │                   └──────────┬──────────┘                            │   │
│  └─────────────────────────────┼──────────────────────────────────────┘   │
│                                │                                            │
│  ┌─────────────────────────────▼──────────────────────────────────────┐    │
│  │                       核心服务层 (Core Services)                      │    │
│  │                                                                       │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │    │
│  │  │ 元数据服务      │  │ 血缘追踪服务    │  │ 数据质量服务    │   │    │
│  │  │ (Metadata)    │  │ (Lineage)       │  │ (Quality)       │   │    │
│  │  │                 │  │                 │  │                 │   │    │
│  │  │ • 资产目录      │  │ • 血缘解析      │  │ • 规则引擎      │   │    │
│  │  │ • 业务术语      │  │ • 影响分析      │  │ • 质量评分      │   │    │
│  │  │ • 技术元数据    │  │ • 根因定位      │  │ • 异常检测      │   │    │
│  │  │ • 标签管理      │  │ • 版本对比      │  │ • 修复闭环      │   │    │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │    │
│  │           └────────────────────┴────────────────────┘              │    │
│  │                              │                                    │    │
│  │                   ┌──────────▼──────────┐                          │    │
│  │                   │   数据标准与安全     │                          │    │
│  │                   │   (Standards & Security)│                       │    │
│  │                   │                      │                          │    │
│  │                   │ • 标准定义          │                          │    │
│  │                   │ • 合规检查          │                          │    │
│  │                   │ • 敏感数据发现      │                          │    │
│  │                   │ • 分类分级          │                          │    │
│  │                   │ • 访问控制          │                          │    │
│  │                   └──────────┬──────────┘                          │    │
│  │                              │                                    │    │
│  │  ┌─────────────────────────┼─────────────────────────┐          │    │
│  │  │         存储层 (Storage)                              │          │    │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │          │    │
│  │  │  │ PostgreSQL │  │ Neo4j      │  │ Redis      │   │          │    │
│  │  │  │ (元数据)    │  │ (血缘图)    │  │ (缓存)      │   │          │    │
│  │  │  └────────────┘  └────────────┘  └────────────┘   │          │    │
│  │  └──────────────────────────────────────────────────┘          │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心模块详解

### 2.1 元数据管理服务

```typescript
// src/modules/bi/governance/metadata/metadata-service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import { ElasticsearchService } from '@nestjs/elasticsearch';

// 资产类型枚举
export enum AssetType {
  DATABASE = 'DATABASE',
  SCHEMA = 'SCHEMA',
  TABLE = 'TABLE',
  VIEW = 'VIEW',
  COLUMN = 'COLUMN',
  STORED_PROCEDURE = 'STORED_PROCEDURE',
  FUNCTION = 'FUNCTION',
  API = 'API',
  REPORT = 'REPORT',
  DASHBOARD = 'DASHBOARD',
  DATASET = 'DATASET',
  ML_MODEL = 'ML_MODEL',
}

// 资产状态枚举
export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
  DELETED = 'DELETED',
  DRAFT = 'DRAFT',
}

// 数据资产接口
export interface DataAsset {
  id: string;
  name: string;
  qualifiedName: string;
  type: AssetType;
  status: AssetStatus;
  tenantId: string;
  domain?: string;
  businessOwner?: string;
  technicalOwner?: string;
  description?: string;
  tags?: string[];
  attributes: Record<string, any>;
  customProperties?: Record<string, any>;
  classifications?: string[];
  sensitivityLevel?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  qualityScore?: number;
  popularity?: number;
  parentId?: string;
  childrenCount?: number;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  source?: string;
  sourceLocation?: string;
}

// 业务术语接口
export interface BusinessTerm {
  id: string;
  name: string;
  abbreviation?: string;
  definition: string;
  domain?: string;
  status: 'DRAFT' | 'APPROVED' | 'DEPRECATED';
  relatedTerms?: string[];
  steward?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 搜索过滤器接口
export interface AssetSearchFilter {
  query?: string;
  types?: AssetType[];
  status?: AssetStatus[];
  domains?: string[];
  tags?: string[];
  owners?: string[];
  sensitivityLevels?: string[];
  dateRange?: { start: Date; end: Date };
  tenantId: string;
}

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);

  constructor(
    @InjectRepository(DataAssetEntity)
    private assetRepo: Repository<DataAssetEntity>,
    @InjectRepository(BusinessTermEntity)
    private termRepo: Repository<BusinessTermEntity>,
    private dataSource: DataSource,
    private elasticsearch: ElasticsearchService,
  ) {}

  /**
   * 注册数据资产
   */
  async registerAsset(
    asset: Omit<DataAsset, 'id' | 'createdAt' | 'updatedAt'>,
    registeredBy: string
  ): Promise<DataAsset> {
    // 检查是否已存在
    const existing = await this.assetRepo.findOne({
      where: {
        qualifiedName: asset.qualifiedName,
        tenantId: asset.tenantId,
      },
    });

    if (existing) {
      // 更新现有资产
      return this.updateAsset(existing.id, asset, registeredBy);
    }

    // 创建新资产
    const newAsset = this.assetRepo.create({
      ...asset,
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: asset.status || AssetStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const saved = await this.assetRepo.save(newAsset);

    // 索引到 Elasticsearch
    await this.indexAsset(saved);

    this.logger.log(`Asset registered: ${saved.qualifiedName}`);

    return this.mapToDataAsset(saved);
  }

  /**
   * 更新数据资产
   */
  async updateAsset(
    assetId: string,
    updates: Partial<DataAsset>,
    updatedBy: string
  ): Promise<DataAsset> {
    const asset = await this.assetRepo.findOne({ where: { id: assetId } });

    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // 合并更新
    Object.assign(asset, updates, { updatedAt: new Date() });

    const saved = await this.assetRepo.save(asset);

    // 更新 Elasticsearch 索引
    await this.indexAsset(saved);

    this.logger.log(`Asset updated: ${saved.qualifiedName}`);

    return this.mapToDataAsset(saved);
  }

  /**
   * 搜索数据资产
   */
  async searchAssets(
    filter: AssetSearchFilter,
    options: {
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    assets: DataAsset[];
    total: number;
    facets: Record<string, { value: string; count: number }[]>;
  }> {
    const page = options.page || 1;
    const pageSize = options.pageSize || 20;

    // 构建 Elasticsearch 查询
    const esQuery = this.buildElasticsearchQuery(filter);

    // 执行搜索
    const result = await this.elasticsearch.search({
      index: 'data-assets',
      body: {
        query: esQuery,
        from: (page - 1) * pageSize,
        size: pageSize,
        sort: [
          { [options.sortBy || '_score']: { order: options.sortOrder || 'desc' } },
        ],
        aggs: {
          types: { terms: { field: 'type.keyword' } },
          domains: { terms: { field: 'domain.keyword' } },
          tags: { terms: { field: 'tags.keyword' } },
          sensitivityLevels: { terms: { field: 'sensitivityLevel.keyword' } },
        },
      },
    });

    // 解析结果
    const assets = result.hits.hits.map((hit: any) => hit._source as DataAsset);
    const total = result.hits.total.value;

    // 解析聚合结果
    const facets: Record<string, { value: string; count: number }[]> = {};
    for (const [key, agg] of Object.entries(result.aggregations as any)) {
      facets[key] = agg.buckets.map((b: any) => ({
        value: b.key,
        count: b.doc_count,
      }));
    }

    return { assets, total, facets };
  }

  // ============== 私有辅助方法 ==============

  private async indexAsset(asset: DataAssetEntity): Promise<void> {
    await this.elasticsearch.index({
      index: 'data-assets',
      id: asset.id,
      body: {
        ...this.mapToDataAsset(asset),
        indexedAt: new Date(),
      },
    });
  }

  private buildElasticsearchQuery(filter: AssetSearchFilter): any {
    const must: any[] = [
      { term: { tenantId: filter.tenantId } },
    ];

    if (filter.query) {
      must.push({
        multi_match: {
          query: filter.query,
          fields: ['name^3', 'qualifiedName^2', 'description', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    if (filter.types?.length) {
      must.push({ terms: { 'type.keyword': filter.types } });
    }

    if (filter.domains?.length) {
      must.push({ terms: { 'domain.keyword': filter.domains } });
    }

    if (filter.tags?.length) {
      must.push({ terms: { 'tags.keyword': filter.tags } });
    }

    if (filter.owners?.length) {
      must.push({
        bool: {
          should: [
            { terms: { 'businessOwner.keyword': filter.owners } },
            { terms: { 'technicalOwner.keyword': filter.owners } },
          ],
        },
      });
    }

    if (filter.dateRange) {
      must.push({
        range: {
          updatedAt: {
            gte: filter.dateRange.start,
            lte: filter.dateRange.end,
          },
        },
      });
    }

    return { bool: { must } };
  }

  private mapToDataAsset(entity: DataAssetEntity): DataAsset {
    return {
      id: entity.id,
      name: entity.name,
      qualifiedName: entity.qualifiedName,
      type: entity.type as AssetType,
      status: entity.status as AssetStatus,
      tenantId: entity.tenantId,
      domain: entity.domain,
      businessOwner: entity.businessOwner,
      technicalOwner: entity.technicalOwner,
      description: entity.description,
      tags: entity.tags || [],
      attributes: entity.attributes || {},
      customProperties: entity.customProperties,
      classifications: entity.classifications,
      sensitivityLevel: entity.sensitivityLevel as any,
      qualityScore: entity.qualityScore,
      popularity: entity.popularity,
      parentId: entity.parentId,
      childrenCount: entity.childrenCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      lastAccessedAt: entity.lastAccessedAt,
      source: entity.source,
      sourceLocation: entity.sourceLocation,
    };
  }
}
```

---

## 3. 数据血缘追踪

```typescript
// src/modules/bi/governance/lineage/lineage-service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j';
import { DataAsset } from '../metadata/metadata-service';

export interface LineageNode {
  id: string;
  type: 'TABLE' | 'COLUMN' | 'TRANSFORMATION' | 'JOB' | 'REPORT';
  name: string;
  qualifiedName: string;
  tenantId: string;
  properties: Record<string, any>;
}

export interface LineageEdge {
  id: string;
  fromId: string;
  toId: string;
  type: 'DERIVED_FROM' | 'TRANSFORMED_BY' | 'CONSUMED_BY' | 'PART_OF';
  properties: Record<string, any>;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

@Injectable()
export class LineageService {
  private readonly logger = new Logger(LineageService.name);

  constructor(private readonly neo4jService: Neo4jService) {}

  /**
   * 记录数据血缘关系
   */
  async recordLineage(
    source: LineageNode,
    target: LineageNode,
    relationship: {
      type: LineageEdge['type'];
      properties?: Record<string, any>;
    }
  ): Promise<void> {
    // 创建或更新节点
    await this.upsertNode(source);
    await this.upsertNode(target);

    // 创建关系
    const query = `
      MATCH (source:DataAsset {id: $sourceId})
      MATCH (target:DataAsset {id: $targetId})
      MERGE (source)-[r:${relationship.type}]->(target)
      SET r += $properties,
          r.updatedAt = datetime()
      RETURN r
    `;

    await this.neo4jService.write(query, {
      sourceId: source.id,
      targetId: target.id,
      properties: relationship.properties || {},
    });

    this.logger.log(
      `Lineage recorded: ${source.qualifiedName} -> ${target.qualifiedName} (${relationship.type})`
    );
  }

  /**
   * 获取上游血缘（数据来源）
   */
  async getUpstreamLineage(
    assetId: string,
    options: {
      maxDepth?: number;
      nodeTypes?: string[];
      includeProperties?: boolean;
    } = {}
  ): Promise<LineageGraph> {
    const maxDepth = options.maxDepth || 5;

    const query = `
      MATCH path = (asset:DataAsset {id: $assetId})<-[:DERIVED_FROM|TRANSFORMED_BY*1..${maxDepth}]-(upstream:DataAsset)
      WHERE $nodeTypes IS NULL OR upstream.type IN $nodeTypes
      WITH asset, upstream, path,
           relationships(path) as rels
      RETURN DISTINCT 
        upstream as node,
        rels as edges
    `;

    const result = await this.neo4jService.read(query, {
      assetId,
      nodeTypes: options.nodeTypes || null,
    });

    return this.parseLineageResult(result, assetId, options.includeProperties);
  }

  // ============== 私有辅助方法 ==============

  private async upsertNode(node: LineageNode): Promise<void> {
    const query = `
      MERGE (n:DataAsset {id: $id})
      SET n.name = $name,
          n.qualifiedName = $qualifiedName,
          n.type = $type,
          n.tenantId = $tenantId,
          n.updatedAt = datetime()
      RETURN n
    `;

    await this.neo4jService.write(query, {
      id: node.id,
      name: node.name,
      qualifiedName: node.qualifiedName,
      type: node.type,
      tenantId: node.tenantId,
    });
  }

  private parseLineageResult(
    result: any,
    rootAssetId: string,
    includeProperties?: boolean
  ): LineageGraph {
    const nodes: LineageNode[] = [];
    const edges: LineageEdge[] = [];
    const nodeIds = new Set<string>();
    const edgeSet = new Set<string>();

    for (const record of result.records) {
      const node = record.get('node');
      const rels = record.get('edges');

      // 添加节点
      if (!nodeIds.has(node.properties.id)) {
        nodes.push({
          id: node.properties.id,
          type: node.properties.type,
          name: node.properties.name,
          qualifiedName: node.properties.qualifiedName,
          tenantId: node.properties.tenantId,
          properties: includeProperties ? node.properties : undefined,
        });
        nodeIds.add(node.properties.id);
      }

      // 添加边
      if (rels) {
        for (const rel of rels) {
          const edgeKey = `${rel.start}-${rel.end}`;
          if (!edgeSet.has(edgeKey)) {
            edges.push({
              id: rel.identity.toString(),
              fromId: rel.start,
              toId: rel.end,
              type: rel.type,
              properties: includeProperties ? rel.properties : undefined,
            });
            edgeSet.add(edgeKey);
          }
        }
      }
    }

    return { nodes, edges };
  }

  private async indexAsset(asset: DataAssetEntity): Promise<void> {
    await this.elasticsearch.index({
      index: 'data-assets',
      id: asset.id,
      body: {
        ...this.mapToDataAsset(asset),
        indexedAt: new Date(),
      },
    });
  }

  private buildElasticsearchQuery(filter: AssetSearchFilter): any {
    const must: any[] = [
      { term: { tenantId: filter.tenantId } },
    ];

    if (filter.query) {
      must.push({
        multi_match: {
          query: filter.query,
          fields: ['name^3', 'qualifiedName^2', 'description', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    if (filter.types?.length) {
      must.push({ terms: { 'type.keyword': filter.types } });
    }

    if (filter.domains?.length) {
      must.push({ terms: { 'domain.keyword': filter.domains } });
    }

    if (filter.tags?.length) {
      must.push({ terms: { 'tags.keyword': filter.tags } });
    }

    if (filter.owners?.length) {
      must.push({
        bool: {
          should: [
            { terms: { 'businessOwner.keyword': filter.owners } },
            { terms: { 'technicalOwner.keyword': filter.owners } },
          ],
        },
      });
    }

    if (filter.dateRange) {
      must.push({
        range: {
          updatedAt: {
            gte: filter.dateRange.start,
            lte: filter.dateRange.end,
          },
        },
      });
    }

    return { bool: { must } };
  }

  private mapToDataAsset(entity: DataAssetEntity): DataAsset {
    return {
      id: entity.id,
      name: entity.name,
      qualifiedName: entity.qualifiedName,
      type: entity.type as AssetType,
      status: entity.status as AssetStatus,
      tenantId: entity.tenantId,
      domain: entity.domain,
      businessOwner: entity.businessOwner,
      technicalOwner: entity.technicalOwner,
      description: entity.description,
      tags: entity.tags || [],
      attributes: entity.attributes || {},
      customProperties: entity.customProperties,
      classifications: entity.classifications,
      sensitivityLevel: entity.sensitivityLevel as any,
      qualityScore: entity.qualityScore,
      popularity: entity.popularity,
      parentId: entity.parentId,
      childrenCount: entity.childrenCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      lastAccessedAt: entity.lastAccessedAt,
      source: entity.source,
      sourceLocation: entity.sourceLocation,
    };
  }
}
```

---

## 3. 数据血缘追踪

```typescript
// src/modules/bi/governance/lineage/lineage-service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j';
import { DataAsset } from '../metadata/metadata-service';

export interface LineageNode {
  id: string;
  type: 'TABLE' | 'COLUMN' | 'TRANSFORMATION' | 'JOB' | 'REPORT';
  name: string;
  qualifiedName: string;
  tenantId: string;
  properties: Record<string, any>;
}

export interface LineageEdge {
  id: string;
  fromId: string;
  toId: string;
  type: 'DERIVED_FROM' | 'TRANSFORMED_BY' | 'CONSUMED_BY' | 'PART_OF';
  properties: Record<string, any>;
}

export interface LineageGraph {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

@Injectable()
export class LineageService {
  private readonly logger = new Logger(LineageService.name);

  constructor(private readonly neo4jService: Neo4jService) {}

  /**
   * 记录数据血缘关系
   */
  async recordLineage(
    source: LineageNode,
    target: LineageNode,
    relationship: {
      type: LineageEdge['type'];
      properties?: Record<string, any>;
    }
  ): Promise<void> {
    // 创建或更新节点
    await this.upsertNode(source);
    await this.upsertNode(target);

    // 创建关系
    const query = `
      MATCH (source:DataAsset {id: $sourceId})
      MATCH (target:DataAsset {id: $targetId})
      MERGE (source)-[r:${relationship.type}]->(target)
      SET r += $properties,
          r.updatedAt = datetime()
      RETURN r
    `;

    await this.neo4jService.write(query, {
      sourceId: source.id,
      targetId: target.id,
      properties: relationship.properties || {},
    });

    this.logger.log(
      `Lineage recorded: ${source.qualifiedName} -> ${target.qualifiedName} (${relationship.type})`
    );
  }

  /**
   * 获取上游血缘（数据来源）
   */
  async getUpstreamLineage(
    assetId: string,
    options: {
      maxDepth?: number;
      nodeTypes?: string[];
      includeProperties?: boolean;
    } = {}
  ): Promise<LineageGraph> {
    const maxDepth = options.maxDepth || 5;

    const query = `
      MATCH path = (asset:DataAsset {id: $assetId})<-[:DERIVED_FROM|TRANSFORMED_BY*1..${maxDepth}]-(upstream:DataAsset)
      WHERE $nodeTypes IS NULL OR upstream.type IN $nodeTypes
      WITH asset, upstream, path,
           relationships(path) as rels
      RETURN DISTINCT 
        upstream as node,
        rels as edges
    `;

    const result = await this.neo4jService.read(query, {
      assetId,
      nodeTypes: options.nodeTypes || null,
    });

    return this.parseLineageResult(result, assetId, options.includeProperties);
  }

  // ============== 私有辅助方法 ==============

  private async upsertNode(node: LineageNode): Promise<void> {
    const query = `
      MERGE (n:DataAsset {id: $id})
      SET n.name = $name,
          n.qualifiedName = $qualifiedName,
          n.type = $type,
          n.tenantId = $tenantId,
          n.updatedAt = datetime()
      RETURN n
    `;

    await this.neo4jService.write(query, {
      id: node.id,
      name: node.name,
      qualifiedName: node.qualifiedName,
      type: node.type,
      tenantId: node.tenantId,
    });
  }

  private parseLineageResult(
    result: any,
    rootAssetId: string,
    includeProperties?: boolean
  ): LineageGraph {
    const nodes: LineageNode[] = [];
    const edges: LineageEdge[] = [];
    const nodeIds = new Set<string>();
    const edgeSet = new Set<string>();

    for (const record of result.records) {
      const node = record.get('node');
      const rels = record.get('edges');

      // 添加节点
      if (!nodeIds.has(node.properties.id)) {
        nodes.push({
          id: node.properties.id,
          type: node.properties.type,
          name: node.properties.name,
          qualifiedName: node.properties.qualifiedName,
          tenantId: node.properties.tenantId,
          properties: includeProperties ? node.properties : undefined,
        });
        nodeIds.add(node.properties.id);
      }

      // 添加边
      if (rels) {
        for (const rel of rels) {
          const edgeKey = `${rel.start}-${rel.end}`;
          if (!edgeSet.has(edgeKey)) {
            edges.push({
              id: rel.identity.toString(),
              fromId: rel.start,
              toId: rel.end,
              type: rel.type,
              properties: includeProperties ? rel.properties : undefined,
            });
            edgeSet.add(edgeKey);
          }
        }
      }
    }

    return { nodes, edges };
  }
}
```

---

**文档版本**: v1.0.0 (P-63 核心设计)  
**最后更新**: 2026-07-16  
**作者**: M5 Platform Team
