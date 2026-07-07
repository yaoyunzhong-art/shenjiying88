// edge-ai.service.ts - T123-2 Edge AI 推理任务
// 用途: 边缘 AI 推理 + 离线识别 + 模型缓存
import { Injectable, Logger } from '@nestjs/common';

// ============ Types ============

export interface EdgeDevice {
  deviceId: string;
  name: string;
  platform: 'android' | 'ios' | 'linux' | 'windows';
  capabilities: string[];
  memoryMb: number;
  status: 'online' | 'offline' | 'busy';
}

export interface ModelInfo {
  modelId: string;
  version: string;
  sizeMb: number;
  framework: 'tensorrt' | 'onnx' | 'tflite' | 'coreml';
  inputShape: number[];
  outputShape: number[];
}

export interface InferenceResult<T = unknown> {
  modelId: string;
  output: T;
  latencyMs: number;
  confidence?: number;
  deviceId: string;
  timestamp: number;
}

export interface FaceRecognitionResult {
  faceId: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  landmarks: Array<{ x: number; y: number }>;
  embedding: number[];
  matchScore?: number;
  personId?: string;
}

export interface VoiceRecognitionResult {
  transcript: string;
  language: string;
  confidence: number;
  words: Array<{ word: string; startMs: number; endMs: number }>;
}

export interface QRCodeResult {
  data: string;
  format: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  rotation: number;
}

export interface BatchRecognitionItem {
  type: 'face' | 'voice' | 'qrcode';
  data: string | ArrayBuffer;
  id: string;
}

export interface BatchRecognitionResult {
  itemId: string;
  type: 'face' | 'voice' | 'qrcode';
  success: boolean;
  result?: FaceRecognitionResult | VoiceRecognitionResult | QRCodeResult;
  error?: string;
}

export interface CachedModel {
  modelId: string;
  version: string;
  cachedAt: number;
  sizeMb: number;
  deviceId: string;
}

// ============ EdgeInferenceService ============

/**
 * EdgeInferenceService - 边缘 AI 推理服务
 *
 * 支持在边缘设备上运行轻量级 AI 模型推理
 */
@Injectable()
export class EdgeInferenceService {
  private readonly logger = new Logger(EdgeInferenceService.name);
  private readonly deviceRegistry = new Map<string, EdgeDevice>();
  private readonly modelRegistry = new Map<string, Map<string, ModelInfo>>(); // deviceId -> modelId -> ModelInfo
  private readonly loadedModels = new Map<string, Set<string>>(); // deviceId -> Set<modelId>

  constructor() {
    this.registerMockDevices();
  }

  private registerMockDevices(): void {
    const devices: EdgeDevice[] = [
      { deviceId: 'edge-001', name: 'Edge Gateway A', platform: 'linux', capabilities: ['face', 'voice', 'qr'], memoryMb: 4096, status: 'online' },
      { deviceId: 'edge-002', name: 'Mobile Edge B', platform: 'android', capabilities: ['face', 'qr'], memoryMb: 2048, status: 'online' },
      { deviceId: 'edge-003', name: 'IoT Camera C', platform: 'linux', capabilities: ['face'], memoryMb: 1024, status: 'offline' },
      { deviceId: 'edge-004', name: 'Edge Gateway D', platform: 'linux', capabilities: ['face', 'voice'], memoryMb: 3072, status: 'online' },
    ];
    for (const d of devices) this.deviceRegistry.set(d.deviceId, d);
  }

  /** 列出所有注册设备 */
  listDevices(): EdgeDevice[] {
    return Array.from(this.deviceRegistry.values());
  }

  /** 在边缘设备上运行推理 */
  async runInference<T = unknown>(modelId: string, input: unknown, deviceId: string): Promise<InferenceResult<T>> {
    const start = Date.now();
    const device = this.deviceRegistry.get(deviceId);
    if (!device) throw new Error(`Device ${deviceId} not found`);
    if (device.status === 'offline') throw new Error(`Device ${deviceId} is offline`);
    if (device.status === 'busy') throw new Error(`Device ${deviceId} is busy`);

    const loaded = this.loadedModels.get(deviceId);
    if (!loaded || !loaded.has(modelId)) {
      throw new Error(`Model ${modelId} not loaded on device ${deviceId}`);
    }

    this.logger.log(`Running inference: model=${modelId} device=${deviceId}`);

    // 模拟推理延迟
    await this.delay(10 + Math.random() * 50);
    const latencyMs = Date.now() - start;

    const result: InferenceResult<T> = {
      modelId,
      output: this.generateMockOutput<T>(modelId, input),
      latencyMs,
      confidence: 0.85 + Math.random() * 0.14,
      deviceId,
      timestamp: Date.now(),
    };
    return result;
  }

  /** 加载模型到边缘设备 */
  async loadModel(modelId: string, deviceId: string): Promise<ModelInfo> {
    const device = this.deviceRegistry.get(deviceId);
    if (!device) throw new Error(`Device ${deviceId} not found`);
    if (device.status === 'offline') throw new Error(`Device ${deviceId} is offline`);

    if (!this.modelRegistry.has(deviceId)) {
      this.modelRegistry.set(deviceId, new Map());
    }
    const registry = this.modelRegistry.get(deviceId)!;

    if (registry.has(modelId)) {
      const existing = registry.get(modelId)!;
      this.logger.log(`Model ${modelId} already registered on ${deviceId}, version ${existing.version}`);
    }

    const modelInfo = this.generateModelInfo(modelId);
    registry.set(modelId, modelInfo);

    if (!this.loadedModels.has(deviceId)) {
      this.loadedModels.set(deviceId, new Set());
    }
    this.loadedModels.get(deviceId)!.add(modelId);

    this.logger.log(`Loaded model ${modelId} (${modelInfo.sizeMb}MB) on device ${deviceId}`);
    return modelInfo;
  }

  /** 卸载模型 */
  async unloadModel(modelId: string, deviceId: string): Promise<void> {
    const loaded = this.loadedModels.get(deviceId);
    if (loaded) {
      loaded.delete(modelId);
    }
    const registry = this.modelRegistry.get(deviceId);
    if (registry) {
      registry.delete(modelId);
    }
    this.logger.log(`Unloaded model ${modelId} from device ${deviceId}`);
  }

  /** 获取模型状态 */
  getModelStatus(modelId: string, deviceId: string): { loaded: boolean; info?: ModelInfo } {
    const registry = this.modelRegistry.get(deviceId);
    const loaded = this.loadedModels.get(deviceId);
    const isLoaded = loaded?.has(modelId) ?? false;
    return {
      loaded: isLoaded,
      info: registry?.get(modelId),
    };
  }

  private generateModelInfo(modelId: string): ModelInfo {
    const frameworks: Array<'tensorrt' | 'onnx' | 'tflite' | 'coreml'> = ['tensorrt', 'onnx', 'tflite', 'coreml'];
    return {
      modelId,
      version: `v${Date.now().toString(36).slice(-4)}`,
      sizeMb: Math.floor(10 + Math.random() * 90),
      framework: frameworks[Math.floor(Math.random() * frameworks.length)],
      inputShape: [1, 3, 224, 224],
      outputShape: [1, 1000],
    };
  }

  private generateMockOutput<T>(modelId: string, input: unknown): T {
    if (typeof input === 'string' && input.startsWith('embedding:')) {
      return { embedding: Array.from({ length: 128 }, () => Math.random()) } as T;
    }
    if (typeof input === 'string' && input.startsWith('classify:')) {
      return { class: Math.floor(Math.random() * 1000), label: `class_${Math.floor(Math.random() * 1000)}` } as T;
    }
    return { result: 'ok', input } as T;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============ OfflineRecognitionService ============

/**
 * OfflineRecognitionService - 离线识别服务
 *
 * 离线环境下的人脸、语音、二维码识别
 */
@Injectable()
export class OfflineRecognitionService {
  private readonly logger = new Logger(OfflineRecognitionService.name);
  private readonly edgeInference: EdgeInferenceService;

  constructor(edgeInference: EdgeInferenceService) {
    this.edgeInference = edgeInference;
  }

  /** 离线人脸识别 */
  async recognizeFace(imageData: ArrayBuffer | string, deviceId: string): Promise<FaceRecognitionResult> {
    const device = this.edgeInference.listDevices().find((d) => d.deviceId === deviceId);
    if (!device) throw new Error(`Device ${deviceId} not found`);
    if (!device.capabilities.includes('face')) throw new Error(`Device ${deviceId} does not support face recognition`);

    this.logger.log(`Recognizing face on device ${deviceId}`);
    await this.delay(50 + Math.random() * 100);

    const embedding = Array.from({ length: 128 }, () => Math.random() * 2 - 1);
    return {
      faceId: `face_${Date.now().toString(36)}`,
      boundingBox: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200, width: 150, height: 180 },
      landmarks: Array.from({ length: 5 }, () => ({ x: Math.random() * 300, y: Math.random() * 400 })),
      embedding,
      matchScore: 0.7 + Math.random() * 0.3,
    };
  }

  /** 离线语音识别 */
  async recognizeVoice(audioData: ArrayBuffer | string, deviceId: string): Promise<VoiceRecognitionResult> {
    const device = this.edgeInference.listDevices().find((d) => d.deviceId === deviceId);
    if (!device) throw new Error(`Device ${deviceId} not found`);
    if (!device.capabilities.includes('voice')) throw new Error(`Device ${deviceId} does not support voice recognition`);

    this.logger.log(`Recognizing voice on device ${deviceId}`);
    await this.delay(100 + Math.random() * 200);

    const words = ['你好', '世界', '语音', '识别'].map((w, i) => ({
      word: w,
      startMs: i * 500,
      endMs: (i + 1) * 500,
    }));
    return {
      transcript: words.map((w) => w.word).join(''),
      language: 'zh-CN',
      confidence: 0.8 + Math.random() * 0.2,
      words,
    };
  }

  /** 离线二维码识别 */
  async recognizeQRCode(imageData: ArrayBuffer | string, deviceId: string): Promise<QRCodeResult> {
    const device = this.edgeInference.listDevices().find((d) => d.deviceId === deviceId);
    if (!device) throw new Error(`Device ${deviceId} not found`);
    if (!device.capabilities.includes('qr')) throw new Error(`Device ${deviceId} does not support QR code recognition`);

    this.logger.log(`Recognizing QR code on device ${deviceId}`);
    await this.delay(20 + Math.random() * 50);

    return {
      data: `https://example.com/qr/${Date.now().toString(36)}`,
      format: 'QR_CODE',
      boundingBox: { x: 50, y: 50, width: 200, height: 200 },
      rotation: Math.random() * 360,
    };
  }

  /** 批量离线识别 */
  async batchRecognize(items: BatchRecognitionItem[], deviceId: string): Promise<BatchRecognitionResult[]> {
    const results: BatchRecognitionResult[] = [];
    for (const item of items) {
      try {
        let result: FaceRecognitionResult | VoiceRecognitionResult | QRCodeResult;
        switch (item.type) {
          case 'face':
            result = await this.recognizeFace(item.data, deviceId);
            break;
          case 'voice':
            result = await this.recognizeVoice(item.data, deviceId);
            break;
          case 'qrcode':
            result = await this.recognizeQRCode(item.data, deviceId);
            break;
        }
        results.push({ itemId: item.id, type: item.type, success: true, result });
      } catch (err) {
        results.push({ itemId: item.id, type: item.type, success: false, error: String(err) });
      }
    }
    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ============ EdgeModelCache ============

/**
 * EdgeModelCache - 边缘模型缓存
 *
 * 管理边缘模型的本地缓存
 */
@Injectable()
export class EdgeModelCache {
  private readonly logger = new Logger(EdgeModelCache.name);
  private readonly cache = new Map<string, CachedModel>();

  /** 缓存模型 */
  async cacheModel(modelId: string, version: string): Promise<CachedModel> {
    const entry: CachedModel = {
      modelId,
      version,
      cachedAt: Date.now(),
      sizeMb: Math.floor(10 + Math.random() * 90),
      deviceId: 'local-cache',
    };
    this.cache.set(modelId, entry);
    this.logger.log(`Cached model ${modelId} version ${version} (${entry.sizeMb}MB)`);
    return entry;
  }

  /** 获取缓存模型 */
  async getCachedModel(modelId: string): Promise<CachedModel | null> {
    return this.cache.get(modelId) ?? null;
  }

  /** 失效缓存 */
  async invalidateCache(modelId: string): Promise<void> {
    const existed = this.cache.has(modelId);
    this.cache.delete(modelId);
    if (existed) {
      this.logger.log(`Invalidated cache for model ${modelId}`);
    }
  }

  /** 列出所有缓存 */
  listCachedModels(): CachedModel[] {
    return Array.from(this.cache.values());
  }

  /** 清理过期缓存 */
  async cleanExpired(ttlMs: number): Promise<number> {
    const now = Date.now();
    let count = 0;
    for (const [modelId, entry] of this.cache.entries()) {
      if (now - entry.cachedAt > ttlMs) {
        this.cache.delete(modelId);
        count++;
      }
    }
    if (count > 0) {
      this.logger.log(`Cleaned ${count} expired cache entries`);
    }
    return count;
  }
}

// ============ EdgeNodeService ============

/**
 * EdgeNodeService - 边缘节点管理服务
 *
 * 注册、更新、删除、查询边缘节点
 */
@Injectable()
export class EdgeNodeService {
  private readonly logger = new Logger(EdgeNodeService.name);
  private readonly deviceRegistry = new Map<string, EdgeDevice>();

  constructor() {
    this.registerMockDevices();
  }

  private registerMockDevices(): void {
    const devices: EdgeDevice[] = [
      { deviceId: 'edge-001', name: 'Edge Node A', platform: 'linux', capabilities: ['face', 'voice', 'qr'], memoryMb: 4096, status: 'online' },
      { deviceId: 'edge-002', name: 'Mobile Node B', platform: 'android', capabilities: ['face', 'qr'], memoryMb: 2048, status: 'online' },
    ];
    for (const d of devices) this.deviceRegistry.set(d.deviceId, d);
  }

  /** 列出所有边缘节点 */
  listDevices(): EdgeDevice[] {
    return Array.from(this.deviceRegistry.values());
  }

  /** 获取指定节点 */
  getDevice(deviceId: string): EdgeDevice | undefined {
    return this.deviceRegistry.get(deviceId);
  }

  /** 注册新的边缘节点 */
  registerDevice(device: EdgeDevice): EdgeDevice {
    this.deviceRegistry.set(device.deviceId, device);
    this.logger.log(`Registered edge device: ${device.deviceId} (${device.name})`);
    return device;
  }

  /** 更新边缘节点 */
  updateDevice(deviceId: string, updates: Partial<EdgeDevice>): EdgeDevice | null {
    const existing = this.deviceRegistry.get(deviceId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.deviceRegistry.set(deviceId, updated);
    this.logger.log(`Updated edge device: ${deviceId}`);
    return updated;
  }

  /** 删除边缘节点 */
  removeDevice(deviceId: string): boolean {
    const existed = this.deviceRegistry.has(deviceId);
    this.deviceRegistry.delete(deviceId);
    if (existed) {
      this.logger.log(`Removed edge device: ${deviceId}`);
    }
    return existed;
  }

  /** 更新节点状态 */
  updateDeviceStatus(deviceId: string, status: 'online' | 'offline' | 'busy'): EdgeDevice | null {
    return this.updateDevice(deviceId, { status });
  }
}

