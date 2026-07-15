/**
 * edge.service.ts — Edge Service (canonical name)
 *
 * 🐜 V18: 边缘AI推理服务
 * - aiInference() — 在指定边缘设备上运行AI推理
 * - getModelStatus() — 查询模型加载状态
 * - cacheModel() — 缓存模型到本地
 * - listModels() — 列出所有可用模型
 * - healthCheck() — 边缘节点健康检查
 */

import { Injectable, Logger } from '@nestjs/common';
import { EdgeInferenceService, EdgeModelCache, type ModelInfo, type InferenceResult, type CachedModel } from './edge-ai.service';

// ==================== 类型定义 ====================

export interface EdgeServiceHealth {
  status: 'ok' | 'degraded' | 'down';
  totalDevices: number;
  onlineDevices: number;
  onlineModels: number;
  cachedModels: number;
  uptime: number;
  timestamp: number;
}

export interface CachedModelEntry {
  modelId: string;
  version: string;
  sizeMb: number;
  cachedAt: number;
}

// ==================== EdgeService ====================

/**
 * EdgeService — 边缘AI推理服务门面
 *
 * 封装边缘AI推理能力：
 * 1. aiInference — 在指定设备上运行模型推理
 * 2. getModelStatus — 查询模型的加载/缓存状态
 * 3. cacheModel — 缓存模型到本地存储
 * 4. listModels — 罗列所有已注册/缓存的模型
 * 5. healthCheck — 整体健康度报告
 */
@Injectable()
export class EdgeService {
  private readonly logger = new Logger(EdgeService.name);
  private readonly startTime = Date.now();
  private readonly onDeviceModels = new Map<string, Map<string, ModelInfo>>(); // deviceId → modelId → ModelInfo

  private static readonly DEFAULT_MODELS = [
    { modelId: 'face-detect-v1', description: '人脸检测模型 v1', framework: 'tensorrt' as const, sizeMb: 48 },
    { modelId: 'voice-recognize-v2', description: '语音识别模型 v2', framework: 'onnx' as const, sizeMb: 32 },
    { modelId: 'qr-scan-v1', description: '二维码扫描模型 v1', framework: 'tflite' as const, sizeMb: 8 },
    { modelId: 'ocr-text-v2', description: 'OCR文字识别 v2', framework: 'onnx' as const, sizeMb: 64 },
    { modelId: 'nlp-intent-v1', description: 'NLP意图识别 v1', framework: 'tensorrt' as const, sizeMb: 24 },
  ];

  constructor(
    private readonly inferenceService: EdgeInferenceService,
    private readonly modelCache: EdgeModelCache,
  ) {
    this.registerDefaultModels();
  }

  private registerDefaultModels(): void {
    for (const device of this.inferenceService.listDevices()) {
      const deviceModels = new Map<string, ModelInfo>();
      for (const def of EdgeService.DEFAULT_MODELS) {
        if (device.capabilities.includes(def.modelId.split('-')[0])) {
          deviceModels.set(def.modelId, {
            modelId: def.modelId,
            version: 'v1.0.0',
            sizeMb: def.sizeMb,
            framework: def.framework,
            inputShape: [1, 3, 224, 224],
            outputShape: [1, 1000],
          });
        }
      }
      this.onDeviceModels.set(device.deviceId, deviceModels);
    }
    this.logger.log(`Registered ${EdgeService.DEFAULT_MODELS.length} default model definitions`);
  }

  /**
   * aiInference — 在指定边缘设备上运行AI推理
   *
   * @param modelId 模型ID
   * @param input 输入数据
   * @param deviceId 目标设备ID
   * @returns 推理结果（输出、延迟、置信度等）
   */
  async aiInference<TInput = unknown, TOutput = unknown>(
    modelId: string,
    input: TInput,
    deviceId: string,
  ): Promise<InferenceResult<TOutput>> {
    this.logger.log(`aiInference: model=${modelId} device=${deviceId}`);

    const availableModels = this.onDeviceModels.get(deviceId);
    if (!availableModels) {
      throw new Error(`Device ${deviceId} not found`);
    }
    if (!availableModels.has(modelId)) {
      throw new Error(`Model ${modelId} not available on device ${deviceId}`);
    }

    // 如果模型未加载到推理引擎，自动加载
    const status = this.inferenceService.getModelStatus(modelId, deviceId);
    if (!status.loaded) {
      await this.inferenceService.loadModel(modelId, deviceId);
    }

    const result = await this.inferenceService.runInference<TOutput>(modelId, input, deviceId);
    return result;
  }

  /**
   * getModelStatus — 查询指定模型的加载与缓存状态
   *
   * @param modelId 模型ID
   * @param deviceId 可选设备ID
   * @returns 模型的加载状态、缓存状态和元信息
   */
  async getModelStatus(
    modelId: string,
    deviceId?: string,
  ): Promise<{
    loaded: boolean;
    cached: boolean;
    cachedEntry: CachedModelEntry | null;
    deviceInfo: { deviceId: string; loaded: boolean; modelInfo: ModelInfo | null }[];
  }> {
    this.logger.log(`getModelStatus: model=${modelId} device=${deviceId ?? 'any'}`);

    const cachedEntry = await this.modelCache.getCachedModel(modelId);
    const deviceInfo: { deviceId: string; loaded: boolean; modelInfo: ModelInfo | null }[] = [];

    if (deviceId) {
      const status = this.inferenceService.getModelStatus(modelId, deviceId);
      const deviceModels = this.onDeviceModels.get(deviceId);
      deviceInfo.push({
        deviceId,
        loaded: status.loaded,
        modelInfo: status.info ?? deviceModels?.get(modelId) ?? null,
      });
    } else {
      for (const deviceId of this.onDeviceModels.keys()) {
        const status = this.inferenceService.getModelStatus(modelId, deviceId);
        const deviceModels = this.onDeviceModels.get(deviceId);
        deviceInfo.push({
          deviceId,
          loaded: status.loaded,
          modelInfo: status.info ?? deviceModels?.get(modelId) ?? null,
        });
      }
    }

    return {
      loaded: deviceInfo.some((d) => d.loaded),
      cached: cachedEntry !== null,
      cachedEntry: cachedEntry
        ? { modelId: cachedEntry.modelId, version: cachedEntry.version, sizeMb: cachedEntry.sizeMb, cachedAt: cachedEntry.cachedAt }
        : null,
      deviceInfo,
    };
  }

  /**
   * cacheModel — 缓存模型到本地存储
   *
   * @param modelId 模型ID
   * @param version 版本号
   * @returns 缓存条目信息
   */
  async cacheModel(modelId: string, version: string): Promise<CachedModelEntry> {
    this.logger.log(`cacheModel: model=${modelId} version=${version}`);
    const entry = await this.modelCache.cacheModel(modelId, version);
    return { modelId: entry.modelId, version: entry.version, sizeMb: entry.sizeMb, cachedAt: entry.cachedAt };
  }

  /**
   * listModels — 列出所有可用的边缘AI模型
   *
   * @returns 模型列表，包含各设备上的部署状态
   */
  async listModels(): Promise<{
    models: Array<{
      modelId: string;
      description: string;
      framework: string;
      sizeMb: number;
      deployedDevices: string[];
      cached: boolean;
    }>;
    total: number;
  }> {
    this.logger.log('listModels');

    const cachedModels = this.modelCache.listCachedModels().map((c) => c.modelId);
    const cachedSet = new Set(cachedModels);

    const models = EdgeService.DEFAULT_MODELS.map((def) => {
      const deployedDevices: string[] = [];
      for (const [deviceId, deviceModels] of this.onDeviceModels.entries()) {
        if (deviceModels.has(def.modelId)) {
          deployedDevices.push(deviceId);
        }
      }
      return {
        modelId: def.modelId,
        description: def.description,
        framework: def.framework,
        sizeMb: def.sizeMb,
        deployedDevices,
        cached: cachedSet.has(def.modelId),
      };
    });

    return { models, total: models.length };
  }

  /**
   * healthCheck — 边缘节点健康检查
   *
   * @returns 服务健康状况报告
   */
  async healthCheck(): Promise<EdgeServiceHealth> {
    const allDevices = this.inferenceService.listDevices();
    const onlineDevices = allDevices.filter((d) => d.status === 'online');
    const loadedCount = this.countLoadedModels();
    const cachedModels = this.modelCache.listCachedModels().length;

    const status: 'ok' | 'degraded' | 'down' =
      onlineDevices.length === allDevices.length
        ? 'ok'
        : onlineDevices.length > 0
          ? 'degraded'
          : 'down';

    return {
      status,
      totalDevices: allDevices.length,
      onlineDevices: onlineDevices.length,
      onlineModels: loadedCount,
      cachedModels,
      uptime: Date.now() - this.startTime,
      timestamp: Date.now(),
    };
  }

  private countLoadedModels(): number {
    let count = 0;
    for (const models of this.onDeviceModels.values()) {
      count += models.size;
    }
    return count;
  }
}
