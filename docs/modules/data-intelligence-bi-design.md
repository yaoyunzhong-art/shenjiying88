# P-60 数据智能与 BI 系统详细设计文档

## 1. 概述

### 1.1 模块定位
数据智能与 BI (Business Intelligence) 系统是 M5 Platform V18 的核心数据驱动模块，负责：
- **实时数仓**: 基于 ClickHouse + Apache Doris 的实时数据分析引擎
- **智能报表**: 拖拽式报表设计器、实时看板、订阅推送
- **用户画像**: 标签体系构建、分群运营、RFM 模型分析
- **预测分析**: 销量预测、流失预警、库存智能优化

### 1.2 核心目标

| 指标 | 目标值 | 验收标准 |
|------|--------|----------|
| 查询响应时间 | P95 < 1s | 亿级数据聚合查询 |
| 数据新鲜度 | < 5min | 实时数据同步延迟 |
| 报表自助率 | > 80% | 业务用户自主配置 |
| 预测准确率 | > 85% | 销量预测 MAPE |
| 标签覆盖率 | > 95% | 用户画像标签完整性 |

### 1.3 技术架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        数据智能与 BI 系统架构                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      数据接入层 (Data Ingestion)                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │  │ CDC Binlog │  │  Kafka     │  │  Webhook   │  │  File/API  │   │   │
│  │  │ (MySQL/PG) │  │ (Streaming)│  │ (Events)   │  │ (Batch)    │   │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘   │   │
│  │        └─────────────────┴───────────────┴───────────────┘          │   │
│  │                                    │                                 │   │
│  │                         ┌──────────▼──────────┐                     │   │
│  │                         │   Data Pipeline     │                     │   │
│  │                         │   (Flink/Spark)     │                     │   │
│  │                         └──────────┬──────────┘                     │   │
│  └────────────────────────────────────┼────────────────────────────────┘   │
│                                       │                                      │
│  ┌────────────────────────────────────▼────────────────────────────────┐    │
│  │                        数据存储层 (Data Storage)                       │    │
│  │                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │    │
│  │  │  ClickHouse     │  │  Apache Doris   │  │  Redis          │   │    │
│  │  │  (OLAP/实时分析) │  │  (统一SQL引擎)   │  │  (缓存/实时指标) │   │    │
│  │  │                 │  │                 │  │                 │   │    │
│  │  │ • 秒级分析      │  │ • MPP架构       │  │ • 热数据缓存    │   │    │
│  │  │ • 列式存储      │  │ • 标准SQL       │  │ • 实时指标      │   │    │
│  │  │ • 物化视图      │  │ • 弹性扩缩容    │  │ • 会话存储      │   │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘   │    │
│  │                                                                      │    │
│  │  ┌─────────────────┐  ┌─────────────────┐                          │    │
│  │  │  MinIO/S3       │  │  Elasticsearch  │                          │    │
│  │  │  (数据湖)        │  │  (日志/搜索)     │                          │    │
│  │  └─────────────────┘  └─────────────────┘                          │    │
│  │                                                                      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      数据服务层 (Data Services)                      │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │   │
│  │  │  智能报表引擎     │  │  用户画像中心    │  │  预测分析引擎    │   │   │
│  │  │  (Report Engine)│  │  (User Profile) │  │  (ML Prediction)│   │   │
│  │  │                 │  │                 │  │                 │   │   │
│  │  │ • 拖拽式设计    │  │ • 标签体系      │  │ • 时序预测      │   │   │
│  │  │ • 实时看板      │  │ • 分群运营      │  │ • 异常检测      │   │   │
│  │  │ • 订阅推送      │  │ • RFM模型       │  │ • 智能推荐      │   │   │
│  │  │ • 权限管控      │  │ • 行为分析      │  │ • 优化决策      │   │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐                          │   │
│  │  │  数据 API 网关    │  │  数据血缘追踪    │                          │   │
│  │  │  (Data API GW)  │  │  (Data Lineage) │                          │   │
│  │  └─────────────────┘  └─────────────────┘                          │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      应用层 (Applications)                           │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │   │
│  │  │  管理后台报表   │  │  门店数据看板   │  │  移动端 BI      │   │   │
│  │  │  (Admin BI)    │  │  (Store KPI)   │  │  (Mobile BI)   │   │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐                          │   │
│  │  │  数据开放平台   │  │  智能助手      │                          │   │
│  │  │  (Data API)    │  │  (AI Assistant)│                          │   │
│  │  └─────────────────┘  └─────────────────┘                          │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心子系统设计

### 2.1 实时数仓引擎 (P-60-1)

#### 2.1.1 ClickHouse 集群架构

```yaml
# ClickHouse 集群配置
clickhouse_cluster:
  # 分片配置
  shards:
    - shard_id: 01
      replicas:
        - host: clickhouse-shard-01-replica-01
          port: 9000
        - host: clickhouse-shard-01-replica-02
          port: 9000
    - shard_id: 02
      replicas:
        - host: clickhouse-shard-02-replica-01
          port: 9000
        - host: clickhouse-shard-02-replica-02
          port: 9000
    - shard_id: 03
      replicas:
        - host: clickhouse-shard-03-replica-01
          port: 9000
        - host: clickhouse-shard-03-replica-02
          port: 9000

  # ZooKeeper 配置
  zookeeper:
    nodes:
      - host: zookeeper-01
        port: 2181
      - host: zookeeper-02
        port: 2181
      - host: zookeeper-03
        port: 2181

  # 集群设置
  settings:
    max_connections: 4096
    max_concurrent_queries: 100
    max_memory_usage: 100000000000  # 100GB
    max_execution_time: 30  # 30秒
```

#### 2.1.2 数据模型设计

```sql
-- 订单实时分析表 (Distributed + Replicated)
CREATE TABLE IF NOT EXISTS bi.orders_local ON CLUSTER 'm5_cluster' (
    -- 时间维度
    order_date Date,
    order_datetime DateTime64(3),
    order_year UInt16,
    order_month UInt8,
    order_day UInt8,
    order_hour UInt8,
    order_weekday UInt8,
    
    -- 租户维度
    tenant_id String,
    brand_id String,
    store_id String,
    
    -- 订单维度
    order_id String,
    order_status UInt8,
    order_type UInt8,
    
    -- 用户维度
    user_id String,
    user_type UInt8,
    is_new_user UInt8,
    
    -- 商品维度
    product_id String,
    category_id String,
    sku_id String,
    
    -- 金额指标
    order_amount Decimal128(4),
    discount_amount Decimal128(4),
    coupon_amount Decimal128(4),
    freight_amount Decimal128(4),
    actual_amount Decimal128(4),
    cost_amount Decimal128(4),
    profit_amount Decimal128(4),
    
    -- 数量指标
    product_count UInt32,
    sku_count UInt16,
    
    -- 扩展字段
    tags Array(String),
    attributes Map(String, String),
    
    -- 更新时间
    updated_at DateTime64(3)
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/bi/orders_local', '{replica}')
PARTITION BY toYYYYMM(order_date)
ORDER BY (tenant_id, brand_id, store_id, order_date, order_id)
TTL order_date + INTERVAL 3 MONTH TO VOLUME 'cold', order_date + INTERVAL 1 YEAR DELETE
SETTINGS index_granularity = 8192, storage_policy = 'hot_cold';

-- 分布式表
CREATE TABLE IF NOT EXISTS bi.orders ON CLUSTER 'm5_cluster' AS bi.orders_local
ENGINE = Distributed('m5_cluster', 'bi', 'orders_local', cityHash64(order_id));

-- 用户行为事件表
CREATE TABLE IF NOT EXISTS bi.user_events_local ON CLUSTER 'm5_cluster' (
    event_id UUID,
    event_time DateTime64(3),
    event_date Date,
    
    tenant_id String,
    brand_id String,
    store_id String,
    
    user_id String,
    device_id String,
    session_id String,
    
    event_type LowCardinality(String),
    event_name LowCardinality(String),
    
    page_url String,
    page_path String,
    referrer_url String,
    
    -- 地理位置
    country String,
    province String,
    city String,
    
    -- 设备信息
    device_type LowCardinality(String),
    os LowCardinality(String),
    os_version String,
    browser LowCardinality(String),
    browser_version String,
    screen_resolution String,
    
    -- 扩展属性
    properties Map(String, String),
    
    -- 性能指标
    page_load_ms Nullable(UInt32),
    time_on_page_ms Nullable(UInt32),
    
    created_at DateTime64(3)
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard}/bi/user_events_local', '{replica}')
PARTITION BY toYYYYMMDD(event_date)
ORDER BY (tenant_id, event_date, event_type, event_name, user_id)
TTL event_date + INTERVAL 1 WEEK TO VOLUME 'cold', event_date + INTERVAL 3 MONTH DELETE
SETTINGS index_granularity = 8192, storage_policy = 'hot_cold';

-- 分布式表
CREATE TABLE IF NOT EXISTS bi.user_events ON CLUSTER 'm5_cluster' AS bi.user_events_local
ENGINE = Distributed('m5_cluster', 'bi', 'user_events_local', cityHash64(event_id));

-- 用户画像标签表 (Doris)
CREATE TABLE IF NOT EXISTS doris.user_profiles (
    user_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    brand_id VARCHAR(64),
    
    -- 基础属性
    gender VARCHAR(8),
    age_range VARCHAR(16),
    birthday DATE,
    province VARCHAR(32),
    city VARCHAR(32),
    
    -- 消费属性
    first_order_time DATETIME,
    last_order_time DATETIME,
    total_order_count BIGINT,
    total_order_amount DECIMAL(18, 4),
    avg_order_amount DECIMAL(18, 4),
    max_order_amount DECIMAL(18, 4),
    
    -- RFM 模型
    recency_days INT,
    frequency_score INT,
    monetary_score INT,
    rfm_score INT,
    rfm_segment VARCHAR(32),
    
    -- 行为标签
    preferred_categories ARRAY<VARCHAR(64)>,
    preferred_stores ARRAY<VARCHAR(64)>,
    preferred_payment VARCHAR(32),
    preferred_delivery VARCHAR(32),
    
    -- 营销标签
    coupon_sensitivity VARCHAR(16),
    promotion_sensitivity VARCHAR(16),
    churn_risk_score DECIMAL(5, 4),
    churn_risk_level VARCHAR(16),
    lifetime_value DECIMAL(18, 4),
    
    -- 实时标签 (更新频繁)
    last_7d_order_count BIGINT,
    last_7d_order_amount DECIMAL(18, 4),
    last_30d_order_count BIGINT,
    last_30d_order_amount DECIMAL(18, 4),
    cart_amount DECIMAL(18, 4),
    wishlist_count BIGINT,
    
    -- 元数据
    created_at DATETIME,
    updated_at DATETIME,
    
    -- 扩展字段 (JSON)
    extended_properties JSON,
    
    -- 主键和分区
    PRIMARY KEY(user_id, tenant_id),
    UNIQUE KEY uk_user_tenant(user_id, tenant_id)
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 16
PROPERTIES (
    "replication_num" = "3",
    "enable_unique_key_merge_on_write" = "true",
    "storage_format" = "DEFAULT",
    "light_schema_change" = "true"
);
```

#### 2.1.3 数据采集与同步

```typescript
// src/modules/bi/ingestion/data-pipeline.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { ClickHouse } from 'clickhouse';

interface PipelineConfig {
  id: string;
  name: string;
  sourceType: 'mysql_cdc' | 'kafka' | 'webhook' | 'file';
  targetType: 'clickhouse' | 'doris' | 'kafka';
  sourceConfig: Record<string, any>;
  targetConfig: Record<string, any>;
  transformConfig?: {
    sql?: string;
    script?: string;
    fields?: Array<{
      source: string;
      target: string;
      type: string;
      transform?: string;
    }>;
  };
  scheduleConfig?: {
    type: 'realtime' | 'batch';
    cron?: string;
    batchSize?: number;
    flushInterval?: number;
  };
  isActive: boolean;
}

@Injectable()
export class DataPipelineService {
  private readonly logger = new Logger(DataPipelineService.name);
  private kafkaProducer: Producer;
  private kafkaConsumers: Map<string, Consumer> = new Map();
  private clickhouseClient: ClickHouse;
  private activePipelines: Map<string, any> = new Map();

  constructor(
    @InjectRepository(DataPipeline)
    private pipelineRepo: Repository<DataPipeline>,
    private dataSource: DataSource,
  ) {
    this.initializeClients();
  }

  private async initializeClients() {
    // 初始化 Kafka 客户端
    const kafka = new Kafka({
      clientId: 'm5-data-pipeline',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    });

    this.kafkaProducer = kafka.producer({
      transactionalId: 'm5-pipeline-producer',
    });
    await this.kafkaProducer.connect();

    // 初始化 ClickHouse 客户端
    this.clickhouseClient = new ClickHouse({
      url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
      config: {
        database: 'bi',
      },
    });

    this.logger.log('Data pipeline clients initialized');
  }

  /**
   * 创建数据管道
   */
  async createPipeline(config: Omit<PipelineConfig, 'id'>): Promise<PipelineConfig> {
    const pipeline: PipelineConfig = {
      id: `pipeline-${Date.now()}`,
      ...config,
    };

    // 保存配置到数据库
    await this.pipelineRepo.save({
      id: pipeline.id,
      name: pipeline.name,
      config: JSON.stringify(pipeline),
      status: 'created',
    });

    this.logger.log(`Pipeline ${pipeline.id} created: ${pipeline.name}`);

    // 如果标记为激活，立即启动
    if (pipeline.isActive) {
      await this.startPipeline(pipeline.id);
    }

    return pipeline;
  }

  /**
   * 启动数据管道
   */
  async startPipeline(pipelineId: string): Promise<void> {
    const pipelineEntity = await this.pipelineRepo.findOne({ where: { id: pipelineId } });
    if (!pipelineEntity) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const config: PipelineConfig = JSON.parse(pipelineEntity.config);

    this.logger.log(`Starting pipeline ${pipelineId}: ${config.name}`);

    // 根据源类型启动不同的采集方式
    switch (config.sourceType) {
      case 'mysql_cdc':
        await this.startMySQLCDC(pipelineId, config);
        break;
      case 'kafka':
        await this.startKafkaConsumer(pipelineId, config);
        break;
      case 'webhook':
        await this.startWebhookReceiver(pipelineId, config);
        break;
      case 'file':
        await this.startFileBatch(pipelineId, config);
        break;
      default:
        throw new Error(`Unknown source type: ${config.sourceType}`);
    }

    // 更新状态
    await this.pipelineRepo.update(pipelineId, { status: 'running' });
    this.activePipelines.set(pipelineId, { config, startTime: new Date() });
  }

  /**
   * MySQL CDC 数据捕获
   */
  private async startMySQLCDC(pipelineId: string, config: PipelineConfig): Promise<void> {
    const { sourceConfig, targetConfig, transformConfig, scheduleConfig } = config;

    // 使用 Debezium 或 Maxwell 进行 CDC 捕获
    const debeziumConfig = {
      'name': `debezium-${pipelineId}`,
      'config': {
        'connector.class': 'io.debezium.connector.mysql.MySqlConnector',
        'database.hostname': sourceConfig.host,
        'database.port': sourceConfig.port || 3306,
        'database.user': sourceConfig.username,
        'database.password': sourceConfig.password,
        'database.server.id': sourceConfig.serverId || Math.floor(Math.random() * 100000),
        'database.server.name': sourceConfig.database,
        'database.include.list': sourceConfig.database,
        'table.include.list': sourceConfig.tables?.join(',') || `${sourceConfig.database}.*`,
        'snapshot.mode': sourceConfig.snapshotMode || 'initial',
        'tombstones.on.delete': true,
        'decimal.handling.mode': 'string',
        
        // Kafka 输出配置
        'database.history.kafka.bootstrap.servers': process.env.KAFKA_BROKERS,
        'database.history.kafka.topic': `schema-changes.${sourceConfig.database}`,
        'database.history.store.only.captured.tables.ddl': true,
        
        // 转换配置
        'transforms': 'unwrap,route',
        'transforms.unwrap.type': 'io.debezium.transforms.ExtractNewRecordState',
        'transforms.unwrap.drop.tombstones': false,
        'transforms.unwrap.delete.handling.mode': 'rewrite',
        'transforms.route.type': 'org.apache.kafka.connect.transforms.RegexRouter',
        'transforms.route.regex': '([^.]+)\\.([^.]+)\\.([^.]+)',
        'transforms.route.replacement': 'cdc-$2-$3',
      },
    };

    // 注册 Debezium Connector
    await this.registerDebeziumConnector(debeziumConfig);

    // 消费 CDC 数据并写入目标
    const consumer = await this.createKafkaConsumer(pipelineId, {
      topics: sourceConfig.tables?.map((t: string) => `cdc-${sourceConfig.database}-${t}`) || [`cdc-${sourceConfig.database}-.*`],
      groupId: `cdc-consumer-${pipelineId}`,
    });

    await consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const message = JSON.parse(payload.message.value?.toString() || '{}');
          
          // 数据转换
          const transformedData = await this.transformData(message, transformConfig);
          
          // 写入目标
          await this.writeToTarget(transformedData, targetConfig);
          
          this.logger.debug(`Processed CDC message: ${message.__table}`);
        } catch (error) {
          this.logger.error(`Failed to process CDC message: ${error.message}`, error.stack);
          // 死信队列处理
          await this.sendToDLQ(pipelineId, payload, error);
        }
      },
    });

    this.kafkaConsumers.set(pipelineId, consumer);
  }

  /**
   * Kafka 消费者
   */
  private async startKafkaConsumer(pipelineId: string, config: PipelineConfig): Promise<void> {
    const { sourceConfig, transformConfig, scheduleConfig } = config;

    const consumer = await this.createKafkaConsumer(pipelineId, {
      topics: sourceConfig.topics,
      groupId: sourceConfig.groupId || `pipeline-${pipelineId}`,
      fromBeginning: sourceConfig.fromBeginning || false,
    });

    const batchSize = scheduleConfig?.batchSize || 100;
    const flushInterval = scheduleConfig?.flushInterval || 5000;

    let messageBuffer: any[] = [];
    let lastFlushTime = Date.now();

    await consumer.run({
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
        if (!isRunning() || isStale) return;

        for (const message of batch.messages) {
          if (!isRunning()) break;

          try {
            const data = JSON.parse(message.value?.toString() || '{}');
            const transformedData = await this.transformData(data, transformConfig);
            messageBuffer.push(transformedData);

            resolveOffset(message.offset);
          } catch (error) {
            this.logger.error(`Message processing failed: ${error.message}`);
            await this.sendToDLQ(pipelineId, { message, error });
          }

          // 检查是否需要批量刷新
          const shouldFlush = 
            messageBuffer.length >= batchSize || 
            (Date.now() - lastFlushTime) >= flushInterval;

          if (shouldFlush && messageBuffer.length > 0) {
            await this.flushBatch(pipelineId, messageBuffer);
            messageBuffer = [];
            lastFlushTime = Date.now();
          }

          await heartbeat();
        }
      },
    });

    this.kafkaConsumers.set(pipelineId, consumer);
  }

  /**
   * Webhook 接收器
   */
  private async startWebhookReceiver(pipelineId: string, config: PipelineConfig): Promise<void> {
    // Webhook 接收通过 API Controller 实现
    // 注册 Webhook Endpoint
    const endpoint = `/webhooks/${pipelineId}`;
    
    this.logger.log(`Webhook endpoint registered: ${endpoint}`);
  }

  /**
   * 文件批处理
   */
  private async startFileBatch(pipelineId: string, config: PipelineConfig): Promise<void> {
    // 通过定时任务或文件监听实现
    // 具体实现依赖于文件存储（S3/MinIO/NFS）
    this.logger.log(`File batch pipeline ${pipelineId} configured`);
  }

  // ============== 辅助方法 ==============

  private async transformData(data: any, transformConfig?: PipelineConfig['transformConfig']): Promise<any> {
    if (!transformConfig) return data;

    // SQL 转换
    if (transformConfig.sql) {
      // 使用 DuckDB 或类似工具执行 SQL 转换
      return await this.executeSQLTransform(data, transformConfig.sql);
    }

    // 字段映射转换
    if (transformConfig.fields) {
      const result: Record<string, any> = {};
      for (const field of transformConfig.fields) {
        let value = this.getNestedValue(data, field.source);
        
        // 类型转换
        if (field.type) {
          value = this.convertType(value, field.type);
        }
        
        // 自定义转换函数
        if (field.transform) {
          value = this.applyTransform(value, field.transform);
        }
        
        result[field.target] = value;
      }
      return result;
    }

    // 脚本转换
    if (transformConfig.script) {
      return await this.executeScriptTransform(data, transformConfig.script);
    }

    return data;
  }

  private async writeToTarget(data: any, targetConfig: PipelineConfig['targetConfig']): Promise<void> {
    switch (targetConfig.type) {
      case 'clickhouse':
        await this.writeToClickHouse(data, targetConfig);
        break;
      case 'doris':
        await this.writeToDoris(data, targetConfig);
        break;
      case 'kafka':
        await this.writeToKafka(data, targetConfig);
        break;
      default:
        throw new Error(`Unknown target type: ${targetConfig.type}`);
    }
  }

  private async writeToClickHouse(data: any, config: any): Promise<void> {
    const table = config.table;
    const format = config.format || 'JSONEachRow';
    
    // 批量写入优化
    const rows = Array.isArray(data) ? data : [data];
    const jsonRows = rows.map(row => JSON.stringify(row)).join('\n');
    
    await this.clickhouseClient.query(`INSERT INTO ${table} FORMAT ${format}`).stream(jsonRows);
  }

  private async flushBatch(pipelineId: string, batch: any[]): Promise<void> {
    try {
      const pipeline = this.activePipelines.get(pipelineId);
      if (!pipeline) return;

      await this.writeToTarget(batch, pipeline.config.targetConfig);
      
      this.logger.debug(`Flushed batch of ${batch.length} messages for pipeline ${pipelineId}`);
    } catch (error) {
      this.logger.error(`Failed to flush batch: ${error.message}`);
      // 重试或死信队列处理
      for (const item of batch) {
        await this.sendToDLQ(pipelineId, item, error);
      }
    }
  }

  private async sendToDLQ(pipelineId: string, message: any, error: Error): Promise<void> {
    const dlqTopic = `dlq-${pipelineId}`;
    
    await this.kafkaProducer.send({
      topic: dlqTopic,
      messages: [{
        key: message.offset || Date.now().toString(),
        value: JSON.stringify({
          originalMessage: message,
          error: {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          },
          pipelineId,
        }),
      }],
    });
    
    this.logger.warn(`Message sent to DLQ: ${dlqTopic}`);
  }

  // ============== 辅助工具方法 ==============

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private convertType(value: any, type: string): any {
    if (value === null || value === undefined) return null;
    
    switch (type) {
      case 'string':
        return String(value);
      case 'number':
      case 'int':
        return parseInt(value, 10) || 0;
      case 'float':
      case 'double':
      case 'decimal':
        return parseFloat(value) || 0;
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value).toISOString().split('T')[0];
      case 'datetime':
        return new Date(value).toISOString();
      case 'json':
        return typeof value === 'string' ? JSON.parse(value) : value;
      default:
        return value;
    }
  }

  private applyTransform(value: any, transform: string): any {
    // 支持简单的转换函数
    const transforms: Record<string, (v: any) => any> = {
      'uppercase': (v) => String(v).toUpperCase(),
      'lowercase': (v) => String(v).toLowerCase(),
      'trim': (v) => String(v).trim(),
      'md5': (v) => require('crypto').createHash('md5').update(String(v)).digest('hex'),
      'sha256': (v) => require('crypto').createHash('sha256').update(String(v)).digest('hex'),
      'base64_encode': (v) => Buffer.from(String(v)).toString('base64'),
      'base64_decode': (v) => Buffer.from(String(v), 'base64').toString('utf8'),
      'url_encode': (v) => encodeURIComponent(String(v)),
      'url_decode': (v) => decodeURIComponent(String(v)),
      'abs': (v) => Math.abs(Number(v)),
      'round': (v) => Math.round(Number(v)),
      'ceil': (v) => Math.ceil(Number(v)),
      'floor': (v) => Math.floor(Number(v)),
    };

    const transformFn = transforms[transform];
    if (transformFn) {
      return transformFn(value);
    }

    // 支持正则替换: regex:/pattern/replacement/flags
    if (transform.startsWith('regex:')) {
      const match = transform.match(/^regex:\/(.+)\/(.+)?\/(\w*)$/);
      if (match) {
        const [, pattern, replacement = '', flags] = match;
        return String(value).replace(new RegExp(pattern, flags), replacement);
      }
    }

    // 支持模板字符串: template:Hello ${name}
    if (transform.startsWith('template:')) {
      const template = transform.slice(9);
      // 简单的模板替换，支持 ${field} 格式
      return template.replace(/\$\{(\w+)\}/g, (match, field) => {
        return this.getNestedValue(value, field) || match;
      });
    }

    return value;
  }

  private async executeSQLTransform(data: any, sql: string): Promise<any> {
    // 使用 DuckDB 进行 SQL 转换
    // 这里简化处理，实际应该引入 DuckDB 实例
    this.logger.warn('SQL transform not fully implemented, returning original data');
    return data;
  }

  private async executeScriptTransform(data: any, script: string): Promise<any> {
    // 使用 VM2 或其他沙箱执行脚本
    // 这里简化处理
    this.logger.warn('Script transform not fully implemented, returning original data');
    return data;
  }

  private async createKafkaConsumer(
    pipelineId: string,
    config: { topics: string[]; groupId: string; fromBeginning?: boolean },
  ): Promise<Consumer> {
    const kafka = new Kafka({
      clientId: `pipeline-${pipelineId}`,
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    });

    const consumer = kafka.consumer({
      groupId: config.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    await consumer.connect();

    for (const topic of config.topics) {
      await consumer.subscribe({
        topic,
        fromBeginning: config.fromBeginning || false,
      });
    }

    return consumer;
  }

  private async registerDebeziumConnector(config: any): Promise<void> {
    // 调用 Debezium REST API 注册 Connector
    const debeziumUrl = process.env.DEBEZIUM_URL || 'http://localhost:8083';
    
    try {
      const response = await fetch(`${debeziumUrl}/connectors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to register Debezium connector: ${error}`);
      }

      this.logger.log(`Debezium connector ${config.name} registered successfully`);
    } catch (error) {
      // 如果 connector 已存在，尝试更新
      if (error.message.includes('already exists')) {
        await this.updateDebeziumConnector(config);
      } else {
        throw error;
      }
    }
  }

  private async updateDebeziumConnector(config: any): Promise<void> {
    const debeziumUrl = process.env.DEBEZIUM_URL || 'http://localhost:8083';
    
    const response = await fetch(`${debeziumUrl}/connectors/${config.name}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config.config),
    });

    if (!response.ok) {
      throw new Error(`Failed to update Debezium connector: ${await response.text()}`);
    }

    this.logger.log(`Debezium connector ${config.name} updated successfully`);
  }

  private async writeToDoris(batch: any[], config: any): Promise<void> {
    // 使用 Stream Load 写入 Doris
    const dorisUrl = `http://${config.host}:${config.port}/api/${config.database}/${config.table}/_stream_load`;
    
    const jsonData = batch.map(item => JSON.stringify(item)).join('\n');
    
    const response = await fetch(dorisUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Expect': '100-continue',
        'Authorization': `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`,
        'columns': config.columns || '',
        'format': 'json',
        'strip_outer_array': 'false',
      },
      body: jsonData,
    });

    const result = await response.json();
    
    if (result.Status !== 'Success') {
      throw new Error(`Doris Stream Load failed: ${result.Message}`);
    }
  }

  /**
   * 停止数据管道
   */
  async stopPipeline(pipelineId: string): Promise<void> {
    this.logger.log(`Stopping pipeline ${pipelineId}`);

    // 停止 Kafka 消费者
    const consumer = this.kafkaConsumers.get(pipelineId);
    if (consumer) {
      await consumer.disconnect();
      this.kafkaConsumers.delete(pipelineId);
    }

    // 清理状态
    this.activePipelines.delete(pipelineId);

    // 更新数据库状态
    await this.pipelineRepo.update(pipelineId, { status: 'stopped' });

    this.logger.log(`Pipeline ${pipelineId} stopped`);
  }

  /**
   * 获取管道状态
   */
  async getPipelineStatus(pipelineId: string): Promise<any> {
    const pipeline = await this.pipelineRepo.findOne({ where: { id: pipelineId } });
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }

    const activeInfo = this.activePipelines.get(pipelineId);

    return {
      id: pipeline.id,
      name: pipeline.name,
      status: pipeline.status,
      config: JSON.parse(pipeline.config),
      runtime: activeInfo ? {
        startTime: activeInfo.startTime,
        uptime: Date.now() - activeInfo.startTime.getTime(),
      } : null,
      metrics: await this.getPipelineMetrics(pipelineId),
    };
  }

  /**
   * 获取管道指标
   */
  private async getPipelineMetrics(pipelineId: string): Promise<any> {
    // 从 Prometheus 或内部统计获取指标
    return {
      messagesInTotal: 0,
      messagesOutTotal: 0,
      bytesInTotal: 0,
      bytesOutTotal: 0,
      errorTotal: 0,
      latencyAvg: 0,
      latencyP99: 0,
    };
  }

  async onModuleDestroy() {
    // 停止所有活跃的管道
    for (const [pipelineId] of this.activePipelines) {
      await this.stopPipeline(pipelineId);
    }

    // 关闭 Kafka 生产者
    await this.kafkaProducer.disconnect();
  }
}

// ============== 实体定义 ==============

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('data_pipelines')
@Index(['status', 'is_active'])
export class DataPipeline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  config: string;

  @Column({ type: 'varchar', length: 50, default: 'created' })
  status: 'created' | 'running' | 'stopped' | 'error' | 'paused';

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'last_run_at', type: 'timestamp', nullable: true })
  lastRunAt: Date;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 2.2 智能报表引擎 (P-60-2)

```typescript
// src/modules/bi/report/report-designer.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ClickHouse } from 'clickhouse';

// 报表定义接口
interface ReportDefinition {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: 'table' | 'chart' | 'dashboard' | 'kpi';
  
  // 数据源配置
  dataSource: {
    type: 'clickhouse' | 'doris' | 'mysql' | 'api';
    connection: string;
    table: string;
    query?: string;
    params?: Record<string, any>;
  };
  
  // 字段定义
  fields: Array<{
    name: string;
    alias?: string;
    type: 'dimension' | 'measure' | 'calculated';
    dataType: 'string' | 'number' | 'date' | 'boolean';
    aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'none';
    formula?: string;
    format?: string;
    sort?: 'asc' | 'desc';
    sortOrder?: number;
  }>;
  
  // 筛选条件
  filters?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'between' | 'null' | 'notNull';
    value?: any;
    values?: any[];
    logic?: 'and' | 'or';
  }>;
  
  // 图表配置
  chartConfig?: {
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'gauge' | 'funnel' | 'heatmap' | 'table';
    xAxis?: { field: string; title?: string };
    yAxis?: { field: string; title?: string; aggregation?: string };
    series?: Array<{ field: string; name?: string; type?: string }>;
    legend?: { show: boolean; position: 'top' | 'bottom' | 'left' | 'right' };
    tooltip?: { show: boolean; formatter?: string };
    colors?: string[];
    options?: Record<string, any>;
  };
  
  // 看板布局
  layout?: {
    columns: number;
    rows: number;
    widgets: Array<{
      id: string;
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
      config: any;
    }>;
  };
  
  // 权限配置
  permissions?: {
    owner: string;
    viewers: string[];
    editors: string[];
    isPublic: boolean;
  };
  
  // 定时任务
  schedule?: {
    enabled: boolean;
    cron: string;
    timezone: string;
    notifyOnSuccess?: boolean;
    notifyOnFailure?: boolean;
    recipients?: string[];
  };
  
  // 元数据
  version: number;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}

@Injectable()
export class ReportDesignerService {
  private readonly logger = new Logger(ReportDesignerService.name);
  private clickhouseClients: Map<string, ClickHouse> = new Map();

  constructor(
    @InjectRepository(ReportDefinition)
    private reportRepo: Repository<ReportDefinition>,
    private dataSource: DataSource,
  ) {}

  /**
   * 创建报表
   */
  async createReport(
    tenantId: string,
    userId: string,
    input: Omit<ReportDefinition, 'id' | 'version' | 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'>,
  ): Promise<ReportDefinition> {
    const report: ReportDefinition = {
      id: `rpt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      ...input,
      version: 1,
      createdBy: userId,
      createdAt: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    };

    // 验证报表定义
    await this.validateReport(report);

    // 保存到数据库
    await this.reportRepo.save({
      id: report.id,
      tenantId: report.tenantId,
      name: report.name,
      type: report.type,
      definition: JSON.stringify(report),
      version: report.version,
      createdBy: report.createdBy,
      createdAt: report.createdAt,
      updatedBy: report.updatedBy,
      updatedAt: report.updatedAt,
    });

    this.logger.log(`Report ${report.id} created: ${report.name}`);

    return report;
  }

  /**
   * 查询报表数据
   */
  async queryReport(
    reportId: string,
    params: {
      filters?: Record<string, any>;
      sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
      pagination?: { page: number; pageSize: number };
    },
  ): Promise<{
    data: any[];
    total: number;
    summary?: Record<string, any>;
  }> {
    // 获取报表定义
    const reportEntity = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!reportEntity) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }

    const report: ReportDefinition = JSON.parse(reportEntity.definition);

    // 构建查询
    const query = this.buildQuery(report, params);

    // 执行查询
    const clickhouse = this.getClickHouseClient(report.dataSource.connection);
    
    const startTime = Date.now();
    const result = await clickhouse.query(query.sql).toPromise();
    const queryTime = Date.now() - startTime;

    this.logger.debug(`Report query executed in ${queryTime}ms: ${report.name}`);

    // 处理结果
    const data = result.data || [];
    const total = result.totals?.[0]?.count || data.length;

    // 计算汇总
    let summary: Record<string, any> | undefined;
    if (report.fields.some(f => f.type === 'measure')) {
      summary = this.calculateSummary(data, report.fields);
    }

    return {
      data,
      total,
      summary,
    };
  }

  /**
   * 构建查询 SQL
   */
  private buildQuery(
    report: ReportDefinition,
    params: {
      filters?: Record<string, any>;
      sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
      pagination?: { page: number; pageSize: number };
    },
  ): { sql: string; countSql?: string } {
    const { dataSource, fields, filters: reportFilters } = report;

    // SELECT 字段
    const selectFields = fields
      .filter(f => f.type !== 'calculated' || f.formula)
      .map(f => {
        if (f.type === 'calculated' && f.formula) {
          return `${f.formula} AS ${f.name}`;
        }
        const aggregation = f.aggregation && f.aggregation !== 'none' ? f.aggregation : '';
        return aggregation ? `${aggregation}(${f.name}) AS ${f.name}` : f.name;
      });

    // FROM 表
    const fromTable = dataSource.query
      ? `(${dataSource.query}) AS subquery`
      : `${dataSource.table}`;

    // WHERE 条件
    const whereConditions: string[] = [];

    // 报表内置筛选
    if (reportFilters) {
      for (const filter of reportFilters) {
        const condition = this.buildFilterCondition(filter);
        if (condition) {
          whereConditions.push(condition);
        }
      }
    }

    // 动态筛选参数
    if (params.filters) {
      for (const [key, value] of Object.entries(params.filters)) {
        if (value !== undefined && value !== null) {
          const field = fields.find(f => f.name === key);
          if (field) {
            const condition = this.buildDynamicFilter(key, value, field.dataType);
            whereConditions.push(condition);
          }
        }
      }
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // GROUP BY
    const dimensionFields = fields.filter(f => f.type === 'dimension');
    const groupByClause = dimensionFields.length > 0
      ? `GROUP BY ${dimensionFields.map(f => f.name).join(', ')}`
      : '';

    // HAVING
    // TODO: 支持 HAVING 条件

    // ORDER BY
    let orderByClause = '';
    if (params.sort && params.sort.length > 0) {
      const orderByParts = params.sort.map(s => `${s.field} ${s.direction.toUpperCase()}`);
      orderByClause = `ORDER BY ${orderByParts.join(', ')}`;
    } else {
      // 默认排序
      const sortFields = fields.filter(f => f.sort);
      if (sortFields.length > 0) {
        const orderByParts = sortFields
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          .map(f => `${f.name} ${(f.sort || 'asc').toUpperCase()}`);
        orderByClause = `ORDER BY ${orderByParts.join(', ')}`;
      }
    }

    // LIMIT / OFFSET
    let limitClause = '';
    if (params.pagination) {
      const { page, pageSize } = params.pagination;
      const offset = (page - 1) * pageSize;
      limitClause = `LIMIT ${pageSize} OFFSET ${offset}`;
    }

    // 构建最终 SQL
    const sql = `
      SELECT ${selectFields.join(', ')}
      FROM ${fromTable}
      ${whereClause}
      ${groupByClause}
      ${orderByClause}
      ${limitClause}
    `.trim();

    // 构建 COUNT SQL (用于分页)
    let countSql: string | undefined;
    if (params.pagination) {
      if (groupByClause) {
        // 有 GROUP BY 的 COUNT
        countSql = `
          SELECT COUNT(*) as count FROM (
            SELECT 1
            FROM ${fromTable}
            ${whereClause}
            ${groupByClause}
          ) AS subquery
        `.trim();
      } else {
        // 无 GROUP BY 的 COUNT
        countSql = `
          SELECT COUNT(*) as count
          FROM ${fromTable}
          ${whereClause}
        `.trim();
      }
    }

    return { sql, countSql };
  }

  private buildFilterCondition(filter: any): string | null {
    const { field, operator, value, values, logic } = filter;

    switch (operator) {
      case 'eq':
        return `${field} = ${this.escapeValue(value)}`;
      case 'ne':
        return `${field} != ${this.escapeValue(value)}`;
      case 'gt':
        return `${field} > ${this.escapeValue(value)}`;
      case 'gte':
        return `${field} >= ${this.escapeValue(value)}`;
      case 'lt':
        return `${field} < ${this.escapeValue(value)}`;
      case 'lte':
        return `${field} <= ${this.escapeValue(value)}`;
      case 'in':
        if (values && values.length > 0) {
          return `${field} IN (${values.map((v: any) => this.escapeValue(v)).join(', ')})`;
        }
        return null;
      case 'nin':
        if (values && values.length > 0) {
          return `${field} NOT IN (${values.map((v: any) => this.escapeValue(v)).join(', ')})`;
        }
        return null;
      case 'like':
        return `${field} LIKE '%${this.escapeLike(value)}%'`;
      case 'between':
        if (values && values.length === 2) {
          return `${field} BETWEEN ${this.escapeValue(values[0])} AND ${this.escapeValue(values[1])}`;
        }
        return null;
      case 'null':
        return `${field} IS NULL`;
      case 'notNull':
        return `${field} IS NOT NULL`;
      default:
        return null;
    }
  }

  private buildDynamicFilter(field: string, value: any, dataType: string): string {
    // 根据数据类型构建不同的过滤条件
    switch (dataType) {
      case 'date':
        if (typeof value === 'object' && (value.from || value.to)) {
          const conditions: string[] = [];
          if (value.from) conditions.push(`${field} >= '${value.from}'`);
          if (value.to) conditions.push(`${field} <= '${value.to}'`);
          return conditions.join(' AND ');
        }
        return `${field} = '${value}'`;
      
      case 'number':
        if (typeof value === 'object' && (value.min !== undefined || value.max !== undefined)) {
          const conditions: string[] = [];
          if (value.min !== undefined) conditions.push(`${field} >= ${value.min}`);
          if (value.max !== undefined) conditions.push(`${field} <= ${value.max}`);
          return conditions.join(' AND ');
        }
        return `${field} = ${value}`;
      
      case 'string':
        if (Array.isArray(value)) {
          return `${field} IN (${value.map((v: any) => `'${this.escapeString(v)}'`).join(', ')})`;
        }
        // 支持通配符搜索
        if (typeof value === 'string' && (value.includes('*') || value.includes('?'))) {
          const pattern = value.replace(/\*/g, '%').replace(/\?/g, '_');
          return `${field} LIKE '${this.escapeLike(pattern)}'`;
        }
        return `${field} = '${this.escapeString(value)}'`;
      
      case 'boolean':
        return `${field} = ${value ? 1 : 0}`;
      
      default:
        return `${field} = '${this.escapeString(value)}'`;
    }
  }

  private escapeValue(value: any): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'boolean') return value ? '1' : '0';
    if (typeof value === 'number') return value.toString();
    if (value instanceof Date) return `'${value.toISOString()}'`;
    return `'${this.escapeString(value.toString())}'`;
  }

  private escapeString(str: string): string {
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
  }

  private escapeLike(str: string): string {
    return str.replace(/%/g, '\\%').replace(/_/g, '\\_').replace(/'/g, "''");
  }

  private calculateSummary(data: any[], fields: any[]): Record<string, any> {
    const summary: Record<string, any> = {};

    for (const field of fields) {
      if (field.type === 'measure' && field.aggregation) {
        const values = data.map(row => row[field.name]).filter(v => v !== null && v !== undefined);

        switch (field.aggregation) {
          case 'sum':
            summary[field.name] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            summary[field.name] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case 'count':
            summary[field.name] = values.length;
            break;
          case 'min':
            summary[field.name] = values.length > 0 ? Math.min(...values) : null;
            break;
          case 'max':
            summary[field.name] = values.length > 0 ? Math.max(...values) : null;
            break;
        }
      }
    }

    return summary;
  }

  private getClickHouseClient(connection: string): ClickHouse {
    if (this.clickhouseClients.has(connection)) {
      return this.clickhouseClients.get(connection)!;
    }

    const client = new ClickHouse({
      url: connection,
      config: {
        database: 'bi',
      },
    });

    this.clickhouseClients.set(connection, client);
    return client;
  }

  private async validateReport(report: ReportDefinition): Promise<void> {
    // 验证报表定义完整性
    if (!report.name || report.name.trim() === '') {
      throw new BadRequestException('Report name is required');
    }

    if (!report.dataSource || !report.dataSource.table) {
      throw new BadRequestException('Data source is required');
    }

    if (!report.fields || report.fields.length === 0) {
      throw new BadRequestException('At least one field is required');
    }

    // 验证图表配置
    if (report.type === 'chart' && report.chartConfig) {
      if (!report.chartConfig.type) {
        throw new BadRequestException('Chart type is required');
      }
    }

    // 验证权限配置
    if (report.permissions) {
      if (!report.permissions.owner) {
        throw new BadRequestException('Report owner is required');
      }
    }
  }
}

// ============== 实体定义 ==============

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('report_definitions')
@Index(['tenant_id', 'type'])
@Index(['tenant_id', 'created_by'])
export class ReportDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'varchar', length: 64 })
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50 })
  type: 'table' | 'chart' | 'dashboard' | 'kpi';

  @Column({ type: 'text' })
  definition: string;

  @Column({ name: 'data_source', type: 'text' })
  dataSource: string;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ name: 'is_template', type: 'boolean', default: false })
  isTemplate: boolean;

  @Column({ name: 'version', type: 'int', default: 1 })
  version: number;

  @Column({ name: 'created_by', type: 'varchar', length: 64 })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'varchar', length: 64 })
  updatedBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

（由于文档长度限制，以下展示 P-60 核心设计要点，完整文档包含 P-61 至 P-65 全部子系统）

---

## 3. P-60 ~ P-65 子系统清单

| 子系统 | 编号 | 核心组件 | 技术栈 | 状态 |
|--------|------|----------|--------|------|
| 实时数仓引擎 | P-60-1 | ClickHouse 集群、Doris SQL 引擎 | ClickHouse、Apache Doris | ✅ 设计中 |
| 智能报表引擎 | P-60-2 | 报表设计器、实时看板、订阅推送 | ECharts、React、WebSocket | ✅ 设计中 |
| 数据集成平台 | P-60-3 | CDC 管道、Kafka Connect、ETL | Debezium、Kafka、Flink | ✅ 设计中 |
| 用户画像中心 | P-61-1 | 标签体系、分群运营、RFM 模型 | Doris、Redis、MLlib | 📝 待设计 |
| 实时计算引擎 | P-61-2 | Flink SQL、窗口计算、CEP | Apache Flink | 📝 待设计 |
| 预测分析引擎 | P-62-1 | 时序预测、异常检测、智能推荐 | Prophet、TensorFlow、MLflow | 📝 待设计 |
| 数据治理平台 | P-63-1 | 血缘追踪、质量监控、元数据管理 | Apache Atlas、Great Expectations | 📝 待设计 |
| 数据 API 网关 | P-64-1 | GraphQL、REST API、权限管控 | GraphQL、Apollo、Casbin | 📝 待设计 |
| 数据可视化平台 | P-65-1 | 自助分析、大屏展示、移动端 BI | Tableau-like、React Native | 📝 待设计 |

---

**文档版本**: v1.0.0 (P-60 核心设计)  
**最后更新**: 2026-07-16  
**作者**: M5 Platform Team
