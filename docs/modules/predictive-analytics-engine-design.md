# P-62 预测分析引擎详细设计文档

## 1. 概述

### 1.1 模块定位
预测分析引擎是 M5 Platform V18 数据智能体系的核心决策支持子系统，负责：
- **时序预测**: 基于历史数据的销量预测、流量预测、库存需求预测
- **异常检测**: 实时异常识别、根因分析、智能告警
- **智能推荐**: 个性化商品推荐、内容推荐、营销策略优化
- **优化决策**: 定价优化、库存优化、资源调度优化

### 1.2 核心目标

| 指标 | 目标值 | 验收标准 |
|------|--------|----------|
| 销量预测准确率 | MAPE < 15% | 7天滚动预测 |
| 异常检测召回率 | > 95% | 关键业务指标 |
| 推荐点击率 | 提升 30%+ | 对比基线 |
| 预测延迟 | < 5min | 批量预测任务 |
| 实时推理延迟 | < 100ms | P99 在线推理 |

### 1.3 技术架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        预测分析引擎架构                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     数据接入层 (Data Ingestion)                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │   │
│  │  │ 交易数据   │  │ 行为日志   │  │ 外部数据   │  │ 实时流     │   │   │
│  │  │ (CDC)      │  │ (Kafka)    │  │ (API)      │  │ (IoT)      │   │   │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘   │   │
│  │        └─────────────────┴───────────────┴───────────────┘          │   │
│  │                              │                                      │   │
│  │                   ┌──────────▼──────────┐                            │   │
│  │                   │   Feature Store      │                            │   │
│  │                   │  (Tecton/Feast)       │                            │   │
│  │                   └──────────┬──────────┘                            │   │
│  └─────────────────────────────┼──────────────────────────────────────┘   │
│                                │                                            │
│  ┌─────────────────────────────▼──────────────────────────────────────┐    │
│  │                     模型服务层 (Model Serving)                        │    │
│  │                                                                       │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │    │
│  │  │ 时序预测引擎     │  │ 异常检测引擎    │  │ 推荐引擎        │   │    │
│  │  │ (Prophet/ARIMA) │  │ (IsolationForest│  │ (Two-Tower/DSSM)│   │    │
│  │  │                 │  │ /AutoEncoder)   │  │                 │   │    │
│  │  │ • 销量预测      │  │ • 点异常检测    │  │ • 商品推荐      │   │    │
│  │  │ • 流量预测      │  │ • 上下文异常    │  │ • 内容推荐      │   │    │
│  │  │ • 库存预测      │  │ • 集合异常      │  │ • 营销策略      │   │    │
│  │  │ • 价格弹性      │  │ • 时序异常      │  │ • 搜索排序      │   │    │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │    │
│  │           └────────────────────┴────────────────────┘              │    │
│  │                              │                                    │    │
│  │                   ┌──────────▼──────────┐                          │    │
│  │                   │   Model Registry   │                          │    │
│  │                   │  (MLflow/Kubeflow)  │                          │    │
│  │                   │                     │                          │    │
│  │                   │ • 版本管理         │                          │    │
│  │                   │ • A/B Test        │                          │    │
│  │                   │ • 模型监控         │                          │    │
│  │                   │ • 自动回滚         │                          │    │
│  │                   └──────────┬──────────┘                          │    │
│  │                              │                                    │    │
│  │  ┌─────────────────────────┼─────────────────────────┐          │    │
│  │  │         推理服务 (Inference Serving)                │          │    │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐   │          │    │
│  │  │  │ REST API   │  │ gRPC       │  │ 批量推理    │   │          │    │
│  │  │  │ (Online)   │  │ (Streaming)│  │ (Offline)  │   │          │    │
│  │  │  └────────────┘  └────────────┘  └────────────┘   │          │    │
│  │  │                                                   │          │    │
│  │  │  • 动态扩缩容 (HPA)                               │          │    │
│  │  │  • 负载均衡 (Ingress)                             │          │    │
│  │  │  • 缓存优化 (Redis)                               │          │    │
│  │  │  • 流控保护 (Rate Limit)                          │          │    │
│  │  └──────────────────────────────────────────────────┘          │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心算法详解

### 2.1 时序预测算法

```typescript
// src/modules/bi/prediction/models/time-series.model.ts
import * as tf from '@tensorflow/tfjs-node';
import { Prophet } from 'prophet'; // Facebook Prophet
import * as ARIMA from 'arima';

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  // 可选的外部回归变量
  regressors?: Record<string, number>;
}

export interface PredictionResult {
  forecast: Array<{
    timestamp: Date;
    value: number;
    lower: number;
    upper: number;
  }>;
  metrics: {
    mape: number;
    rmse: number;
    mae: number;
    r2: number;
  };
  modelInfo: {
    type: string;
    params: Record<string, any>;
    trainingTime: number;
  };
}

export class TimeSeriesPredictor {
  private model: any;
  private modelType: 'prophet' | 'arima' | 'lstm' | 'ensemble';

  constructor(modelType: TimeSeriesPredictor['modelType'] = 'prophet') {
    this.modelType = modelType;
  }

  /**
   * 使用 Prophet 进行预测
   */
  async predictWithProphet(
    data: TimeSeriesData[],
    periods: number,
    options: {
      seasonality?: 'additive' | 'multiplicative';
      yearlySeasonality?: boolean;
      weeklySeasonality?: boolean;
      dailySeasonality?: boolean;
      changepointPriorScale?: number;
      regressors?: string[];
    } = {}
  ): Promise<PredictionResult> {
    const startTime = Date.now();

    // 准备 Prophet 格式的数据
    const prophetData = data.map(d => ({
      ds: d.timestamp,
      y: d.value,
      ...d.regressors,
    }));

    // 初始化 Prophet 模型
    const prophet = new Prophet({
      seasonality_mode: options.seasonality || 'additive',
      yearly_seasonality: options.yearlySeasonality ?? true,
      weekly_seasonality: options.weeklySeasonality ?? true,
      daily_seasonality: options.dailySeasonality ?? false,
      changepoint_prior_scale: options.changepointPriorScale ?? 0.05,
    });

    // 添加外部回归变量
    if (options.regressors) {
      for (const regressor of options.regressors) {
        prophet.add_regressor(regressor);
      }
    }

    // 训练模型
    await prophet.fit(prophetData);

    // 生成未来预测
    const future = prophet.make_future_dataframe({
      periods,
      freq: this.inferFrequency(data),
    });

    // 如果有外部回归变量，需要为未来填充值
    if (options.regressors) {
      // 这里简化处理，实际应该使用预测值或默认值
      for (const regressor of options.regressors) {
        future[regressor] = 0;
      }
    }

    const forecast = await prophet.predict(future);

    // 计算评估指标
    const metrics = this.calculateMetrics(data, forecast);

    // 格式化预测结果
    const result: PredictionResult = {
      forecast: forecast.map((f: any) => ({
        timestamp: f.ds,
        value: f.yhat,
        lower: f.yhat_lower,
        upper: f.yhat_upper,
      })),
      metrics,
      modelInfo: {
        type: 'prophet',
        params: {
          seasonality: options.seasonality || 'additive',
          yearlySeasonality: options.yearlySeasonality ?? true,
          weeklySeasonality: options.weeklySeasonality ?? true,
          changepointPriorScale: options.changepointPriorScale ?? 0.05,
        },
        trainingTime: Date.now() - startTime,
      },
    };

    return result;
  }

  /**
   * 使用 ARIMA 进行预测
   */
  async predictWithARIMA(
    data: TimeSeriesData[],
    periods: number,
    options: {
      p?: number;  // 自回归阶数
      d?: number;  // 差分阶数
      q?: number;  // 移动平均阶数
      seasonal?: {
        P?: number;
        D?: number;
        Q?: number;
        s?: number;  // 季节周期
      };
    } = {}
  ): Promise<PredictionResult> {
    const startTime = Date.now();

    // 提取数值序列
    const values = data.map(d => d.value);

    // 创建 ARIMA 模型
    const arima = new ARIMA({
      p: options.p ?? 2,
      d: options.d ?? 1,
      q: options.q ?? 2,
      ...(options.seasonal && {
        P: options.seasonal.P ?? 1,
        D: options.seasonal.D ?? 1,
        Q: options.seasonal.Q ?? 1,
        s: options.seasonal.s ?? 12,
      }),
    });

    // 训练模型
    arima.train(values);

    // 生成预测
    const predictions = arima.predict(periods);

    // 构建预测结果
    const lastTimestamp = data[data.length - 1].timestamp;
    const frequency = this.inferFrequency(data);

    const forecast = predictions.map((value: number, i: number) => {
      const timestamp = new Date(lastTimestamp.getTime() + (i + 1) * frequency);
      return {
        timestamp,
        value,
        lower: value * 0.9,  // 简化的置信区间
        upper: value * 1.1,
      };
    });

    // 计算评估指标（使用训练集的最后一部分作为验证集）
    const trainSize = Math.floor(values.length * 0.8);
    const trainValues = values.slice(0, trainSize);
    const testValues = values.slice(trainSize);

    const arimaValidate = new ARIMA({
      p: options.p ?? 2,
      d: options.d ?? 1,
      q: options.q ?? 2,
    });
    arimaValidate.train(trainValues);
    const validatePredictions = arimaValidate.predict(testValues.length);

    const metrics = this.calculateMetrics(
      testValues.map((v, i) => ({ timestamp: new Date(), value: v })),
      validatePredictions.map((v: number, i: number) => ({ ds: new Date(), yhat: v }))
    );

    return {
      forecast,
      metrics,
      modelInfo: {
        type: 'arima',
        params: {
          p: options.p ?? 2,
          d: options.d ?? 1,
          q: options.q ?? 2,
          seasonal: options.seasonal,
        },
        trainingTime: Date.now() - startTime,
      },
    };
  }

  // ============== 私有辅助方法 ==============

  private inferFrequency(data: TimeSeriesData[]): number {
    // 推断数据频率（毫秒）
    if (data.length < 2) return 24 * 60 * 60 * 1000; // 默认天级

    const intervals: number[] = [];
    for (let i = 1; i < Math.min(data.length, 10); i++) {
      intervals.push(data[i].timestamp.getTime() - data[i-1].timestamp.getTime());
    }

    // 使用中位数作为频率估计
    intervals.sort((a, b) => a - b);
    return intervals[Math.floor(intervals.length / 2)];
  }

  private calculateMetrics(
    actual: TimeSeriesData[],
    predicted: Array<{ ds: Date; yhat: number }>
  ): { mape: number; rmse: number; mae: number; r2: number } {
    if (actual.length === 0 || predicted.length === 0) {
      return { mape: 0, rmse: 0, mae: 0, r2: 0 };
    }

    const n = Math.min(actual.length, predicted.length);
    let sumSquaredError = 0;
    let sumAbsoluteError = 0;
    let sumAbsolutePercentageError = 0;
    let sumActual = 0;

    for (let i = 0; i < n; i++) {
      const actualValue = actual[i].value;
      const predictedValue = predicted[i].yhat;
      const error = actualValue - predictedValue;

      sumSquaredError += error * error;
      sumAbsoluteError += Math.abs(error);
      sumAbsolutePercentageError += Math.abs(error / actualValue);
      sumActual += actualValue;
    }

    const meanActual = sumActual / n;
    let sumSquaredTotal = 0;
    for (let i = 0; i < n; i++) {
      sumSquaredTotal += Math.pow(actual[i].value - meanActual, 2);
    }

    return {
      mape: (sumAbsolutePercentageError / n) * 100,
      rmse: Math.sqrt(sumSquaredError / n),
      mae: sumAbsoluteError / n,
      r2: 1 - (sumSquaredError / sumSquaredTotal),
    };
  }
}
```

---

## 2. 模型服务架构

```typescript
// src/modules/bi/prediction/serving/model-server.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs-node';
import * as onnx from 'onnxruntime-node';
import { Redis } from 'ioredis';

interface ModelArtifact {
  id: string;
  name: string;
  version: string;
  framework: 'tensorflow' | 'pytorch' | 'onnx' | 'sklearn';
  format: 'saved_model' | 'h5' | 'pt' | 'onnx' | 'pickle';
  path: string;
  metadata: {
    inputShape: number[];
    outputShape: number[];
    preprocessing: string;
    postprocessing: string;
    classes?: string[];
  };
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1?: number;
    auc?: number;
  };
  createdAt: Date;
}

@Injectable()
export class ModelServerService {
  private readonly logger = new Logger(ModelServerService.name);
  private loadedModels: Map<string, tf.LayersModel | onnx.InferenceSession> = new Map();
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  /**
   * 加载模型
   */
  async loadModel(artifact: ModelArtifact): Promise<void> {
    const modelKey = `${artifact.name}:${artifact.version}`;

    if (this.loadedModels.has(modelKey)) {
      this.logger.log(`Model ${modelKey} already loaded`);
      return;
    }

    this.logger.log(`Loading model: ${modelKey}`);

    try {
      if (artifact.framework === 'tensorflow') {
        const model = await tf.loadLayersModel(`file://${artifact.path}/model.json`);
        this.loadedModels.set(modelKey, model);
      } else if (artifact.framework === 'onnx') {
        const session = await onnx.InferenceSession.create(`${artifact.path}/model.onnx`);
        this.loadedModels.set(modelKey, session);
      }

      // 缓存模型元数据
      await this.redis.setex(
        `model:metadata:${modelKey}`,
        3600,
        JSON.stringify(artifact.metadata)
      );

      this.logger.log(`Model ${modelKey} loaded successfully`);
    } catch (error) {
      this.logger.error(`Failed to load model ${modelKey}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 执行推理
   */
  async predict(
    modelName: string,
    version: string,
    input: number[] | number[][]
  ): Promise<{
    predictions: number[] | number[][];
    latency: number;
    modelVersion: string;
  }> {
    const modelKey = `${modelName}:${version}`;
    const model = this.loadedModels.get(modelKey);

    if (!model) {
      throw new Error(`Model ${modelKey} not loaded`);
    }

    const startTime = Date.now();

    let predictions: number[] | number[][];

    if (model instanceof tf.LayersModel) {
      // TensorFlow 模型推理
      const tensor = tf.tensor(input);
      const output = model.predict(tensor) as tf.Tensor;
      predictions = await output.data() as any;
      tensor.dispose();
      output.dispose();
    } else {
      // ONNX 模型推理
      const tensor = new onnx.Tensor(input, 'float32', [input.length, input[0].length]);
      const feeds = { input: tensor };
      const results = await model.run(feeds);
      predictions = results.output.data as any;
    }

    const latency = Date.now() - startTime;

    return {
      predictions,
      latency,
      modelVersion: version,
    };
  }

  /**
   * 批量预测
   */
  async batchPredict(
    modelName: string,
    version: string,
    inputs: number[][][],
    options: {
      batchSize?: number;
      maxConcurrency?: number;
    } = {}
  ): Promise<Array<{
    predictions: number[] | number[][];
    latency: number;
  }>> {
    const batchSize = options.batchSize || 32;
    const maxConcurrency = options.maxConcurrency || 4;

    const results: Array<{ predictions: number[] | number[][]; latency: number }> = [];

    // 分批处理
    for (let i = 0; i < inputs.length; i += batchSize * maxConcurrency) {
      const batches: Promise<any>[] = [];

      for (let j = 0; j < maxConcurrency && i + j * batchSize < inputs.length; j++) {
        const start = i + j * batchSize;
        const end = Math.min(start + batchSize, inputs.length);
        const batch = inputs.slice(start, end);

        batches.push(
          Promise.all(
            batch.map(input => this.predict(modelName, version, input))
          )
        );
      }

      const batchResults = await Promise.all(batches);
      for (const result of batchResults) {
        results.push(...result);
      }
    }

    return results;
  }

  /**
   * 卸载模型
   */
  async unloadModel(modelName: string, version: string): Promise<void> {
    const modelKey = `${modelName}:${version}`;
    const model = this.loadedModels.get(modelKey);

    if (!model) {
      this.logger.warn(`Model ${modelKey} not found`);
      return;
    }

    // 释放模型资源
    if (model instanceof tf.LayersModel) {
      model.dispose();
    } else {
      await model.release();
    }

    this.loadedModels.delete(modelKey);

    // 清除缓存
    await this.redis.del(`model:metadata:${modelKey}`);

    this.logger.log(`Model ${modelKey} unloaded successfully`);
  }

  /**
   * 获取模型状态
   */
  async getModelStatus(modelName: string, version: string): Promise<{
    loaded: boolean;
    metadata?: any;
    memoryUsage?: number;
  }> {
    const modelKey = `${modelName}:${version}`;
    const loaded = this.loadedModels.has(modelKey);

    const result: any = { loaded };

    if (loaded) {
      const metadata = await this.redis.get(`model:metadata:${modelKey}`);
      if (metadata) {
        result.metadata = JSON.parse(metadata);
      }

      // 获取内存使用（简化实现）
      result.memoryUsage = 0;
    }

    return result;
  }
}
```

---

## 3. 模型管理 MLOps

```typescript
// src/modules/bi/prediction/mlops/model-registry.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3 } from 'aws-sdk';

interface ModelVersion {
  id: string;
  modelName: string;
  version: string;
  stage: 'development' | 'staging' | 'production' | 'archived';
  framework: string;
  metrics: Record<string, number>;
  artifacts: {
    path: string;
    checksum: string;
    size: number;
  };
  parameters: Record<string, any>;
  tags: string[];
  createdBy: string;
  createdAt: Date;
}

@Injectable()
export class ModelRegistryService {
  private readonly logger = new Logger(ModelRegistryService.name);
  private s3: S3;

  constructor(
    @InjectRepository(ModelVersion)
    private modelVersionRepo: Repository<ModelVersion>,
  ) {
    this.s3 = new S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
  }

  /**
   * 注册模型版本
   */
  async registerModel(
    modelName: string,
    version: string,
    artifacts: {
      localPath: string;
      s3Bucket?: string;
      s3Prefix?: string;
    },
    metadata: {
      framework: string;
      metrics: Record<string, number>;
      parameters: Record<string, any>;
      tags?: string[];
    },
    createdBy: string
  ): Promise<ModelVersion> {
    // 检查版本是否已存在
    const existing = await this.modelVersionRepo.findOne({
      where: { modelName, version },
    });

    if (existing) {
      throw new Error(`Model version ${modelName}:${version} already exists`);
    }

    // 上传 artifacts 到 S3
    const s3Bucket = artifacts.s3Bucket || process.env.MODEL_BUCKET;
    const s3Prefix = artifacts.s3Prefix || `${modelName}/${version}`;

    const uploadResult = await this.uploadArtifacts(
      artifacts.localPath,
      s3Bucket,
      s3Prefix
    );

    // 创建版本记录
    const modelVersion = this.modelVersionRepo.create({
      id: `mv-${Date.now()}`,
      modelName,
      version,
      stage: 'development',
      framework: metadata.framework,
      metrics: metadata.metrics,
      artifacts: {
        path: `s3://${s3Bucket}/${s3Prefix}`,
        checksum: uploadResult.checksum,
        size: uploadResult.size,
      },
      parameters: metadata.parameters,
      tags: metadata.tags || [],
      createdBy,
      createdAt: new Date(),
    });

    await this.modelVersionRepo.save(modelVersion);

    this.logger.log(`Model ${modelName}:${version} registered successfully`);

    return modelVersion;
  }

  /**
   * 转换模型阶段
   */
  async transitionStage(
    modelName: string,
    version: string,
    newStage: 'development' | 'staging' | 'production' | 'archived',
    transitionedBy: string,
    reason?: string
  ): Promise<ModelVersion> {
    const modelVersion = await this.modelVersionRepo.findOne({
      where: { modelName, version },
    });

    if (!modelVersion) {
      throw new Error(`Model version ${modelName}:${version} not found`);
    }

    const oldStage = modelVersion.stage;
    modelVersion.stage = newStage;

    await this.modelVersionRepo.save(modelVersion);

    // 记录转换历史
    await this.logStageTransition(
      modelName,
      version,
      oldStage,
      newStage,
      transitionedBy,
      reason
    );

    // 如果是升级到 production，执行部署流程
    if (newStage === 'production') {
      await this.deployToProduction(modelName, version);
    }

    this.logger.log(
      `Model ${modelName}:${version} transitioned from ${oldStage} to ${newStage}`
    );

    return modelVersion;
  }

  /**
   * 获取模型版本列表
   */
  async listModelVersions(
    modelName: string,
    options: {
      stage?: string;
      tags?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ versions: ModelVersion[]; total: number }> {
    const query = this.modelVersionRepo.createQueryBuilder('mv')
      .where('mv.modelName = :modelName', { modelName });

    if (options.stage) {
      query.andWhere('mv.stage = :stage', { stage: options.stage });
    }

    if (options.tags && options.tags.length > 0) {
      query.andWhere('mv.tags @> :tags', { tags: options.tags });
    }

    const total = await query.getCount();

    query.orderBy('mv.createdAt', 'DESC');

    if (options.limit) {
      query.take(options.limit);
    }

    if (options.offset) {
      query.skip(options.offset);
    }

    const versions = await query.getMany();

    return { versions, total };
  }

  // ============== 私有辅助方法 ==============

  private async uploadArtifacts(
    localPath: string,
    s3Bucket: string,
    s3Prefix: string
  ): Promise<{ checksum: string; size: number }> {
    // 实现 artifacts 上传到 S3 的逻辑
    // 这里简化实现
    return {
      checksum: 'md5-hash',
      size: 1024 * 1024, // 1MB
    };
  }

  private async logStageTransition(
    modelName: string,
    version: string,
    fromStage: string,
    toStage: string,
    transitionedBy: string,
    reason?: string
  ): Promise<void> {
    // 记录阶段转换历史
    // 可以存储到数据库或审计日志系统
    this.logger.log(
      `Stage transition logged: ${modelName}:${version} ${fromStage} -> ${toStage} by ${transitionedBy}`
    );
  }

  private async deployToProduction(
    modelName: string,
    version: string
  ): Promise<void> {
    // 执行生产环境部署流程
    // 1. 验证模型签名
    // 2. 部署到推理服务集群
    // 3. 更新负载均衡配置
    // 4. 启动金丝雀发布
    // 5. 监控指标验证

    this.logger.log(`Initiating production deployment for ${modelName}:${version}`);

    // 实际部署逻辑...
  }
}
```

---

**文档版本**: v1.0.0 (P-62 核心设计)  
**最后更新**: 2026-07-16  
**作者**: M5 Platform Team
