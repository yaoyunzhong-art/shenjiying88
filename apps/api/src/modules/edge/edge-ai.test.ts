import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// edge-ai.test.ts - T123-2 Edge AI 推理测试
import { EdgeInferenceService, OfflineRecognitionService, EdgeModelCache } from './edge-ai.service';

describe('EdgeInferenceService', () => {
  let service: EdgeInferenceService;

  beforeEach(() => {
    service = new EdgeInferenceService();
  });

  describe('listDevices', () => {
    it('should return registered devices', () => {
      const devices = service.listDevices();
      expect(devices.length).toBeGreaterThan(0);
      expect(devices[0]).toHaveProperty('deviceId');
      expect(devices[0]).toHaveProperty('platform');
    });
  });

  describe('loadModel', () => {
    it('should load model and return model info', async () => {
      const info = await service.loadModel('face-detect-v1', 'edge-001');
      expect(info.modelId).toBe('face-detect-v1');
      expect(info.sizeMb).toBeGreaterThan(0);
      expect(info.framework).toMatch(/tensorrt|onnx|tflite|coreml/);
    });

    it('should throw if device not found', async () => {
      await expect(service.loadModel('model-1', 'invalid-device')).rejects.toThrow('not found');
    });
  });

  describe('runInference', () => {
    it('should run inference after loading model', async () => {
      await service.loadModel('face-detect-v1', 'edge-001');
      const result = await service.runInference<{ result: string }>('face-detect-v1', { test: true }, 'edge-001');
      expect(result.modelId).toBe('face-detect-v1');
      expect(result.latencyMs).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should throw if model not loaded', async () => {
      await expect(service.runInference('unloaded-model', {}, 'edge-001')).rejects.toThrow('not loaded');
    });
  });

  describe('getModelStatus', () => {
    it('should return correct status after loading', async () => {
      await service.loadModel('test-model', 'edge-001');
      const status = service.getModelStatus('test-model', 'edge-001');
      expect(status.loaded).toBe(true);
      expect(status.info).toBeDefined();
    });

    it('should return loaded=false for unloaded model', () => {
      const status = service.getModelStatus('never-loaded-model', 'edge-001');
      expect(status.loaded).toBe(false);
    });
  });

  describe('unloadModel', () => {
    it('should unload model and update status', async () => {
      await service.loadModel('temp-model', 'edge-001');
      await service.unloadModel('temp-model', 'edge-001');
      const status = service.getModelStatus('temp-model', 'edge-001');
      expect(status.loaded).toBe(false);
    });
  });
});

describe('OfflineRecognitionService', () => {
  let edgeService: EdgeInferenceService;
  let offlineService: OfflineRecognitionService;

  beforeEach(() => {
    edgeService = new EdgeInferenceService();
    offlineService = new OfflineRecognitionService(edgeService);
  });

  describe('recognizeFace', () => {
    it('should return face recognition result', async () => {
      const result = await offlineService.recognizeFace(Buffer.from('fake-image') as any, 'edge-001');
      expect(result.faceId).toMatch(/^face_/);
      expect(result.embedding).toHaveLength(128);
      expect(result.boundingBox).toHaveProperty('x');
      expect(result.boundingBox).toHaveProperty('y');
      expect(result.matchScore).toBeGreaterThan(0.7);
    });

    it('should throw if device not support voice', async () => {
      // edge-002 只支持 face/qr, 不支持 voice
      await expect(offlineService.recognizeVoice(Buffer.from('audio') as any, 'edge-002')).rejects.toThrow('does not support voice');
    });
  });

  describe('recognizeVoice', () => {
    it('should return voice recognition result', async () => {
      const result = await offlineService.recognizeVoice(Buffer.from('fake-audio') as any, 'edge-001');
      expect(result.transcript).toBeTruthy();
      expect(result.language).toBe('zh-CN');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.words).toBeInstanceOf(Array);
    });

    it('should throw if device not support voice', async () => {
      await expect(offlineService.recognizeVoice(Buffer.from('audio') as any, 'edge-002')).rejects.toThrow('does not support voice');
    });
  });

  describe('recognizeQRCode', () => {
    it('should return QR code result', async () => {
      const result = await offlineService.recognizeQRCode(Buffer.from('qr-image') as any, 'edge-002');
      expect(result.data).toMatch(/^https?:\/\//);
      expect(result.format).toBe('QR_CODE');
      expect(result.boundingBox).toHaveProperty('x');
    });
  });

  describe('batchRecognize', () => {
    it('should process batch items', async () => {
      const items = [
        { type: 'face' as const, data: new Uint8Array() as any, id: 'item-1' },
        { type: 'qrcode' as const, data: new Uint8Array() as any, id: 'item-2' },
      ];
      const results = await offlineService.batchRecognize(items, 'edge-002');
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle mixed success/failure in batch', async () => {
      const items = [
        { type: 'face' as const, data: new Uint8Array() as any, id: 'item-1' },
        { type: 'voice' as const, data: new Uint8Array() as any, id: 'item-2' }, // edge-002 不支持 voice
      ];
      const results = await offlineService.batchRecognize(items, 'edge-002');
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeTruthy();
    });
  });
});

describe('EdgeModelCache', () => {
  let cache: EdgeModelCache;

  beforeEach(() => {
    cache = new EdgeModelCache();
  });

  describe('cacheModel', () => {
    it('should cache model and return cached entry', async () => {
      const entry = await cache.cacheModel('model-a', 'v1.0');
      expect(entry.modelId).toBe('model-a');
      expect(entry.version).toBe('v1.0');
      expect(entry.cachedAt).toBeGreaterThan(0);
      expect(entry.sizeMb).toBeGreaterThan(0);
    });
  });

  describe('getCachedModel', () => {
    it('should retrieve cached model after caching', async () => {
      await cache.cacheModel('model-b', 'v2.0');
      const entry = await cache.getCachedModel('model-b');
      expect(entry).not.toBeNull();
      expect(entry!.modelId).toBe('model-b');
    });

    it('should return null for non-cached model', async () => {
      const entry = await cache.getCachedModel('never-cached');
      expect(entry).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('should remove cached model after invalidation', async () => {
      await cache.cacheModel('model-c', 'v1.0');
      await cache.invalidateCache('model-c');
      const entry = await cache.getCachedModel('model-c');
      expect(entry).toBeNull();
    });

    it('should not throw when invalidating non-existent model', async () => {
      await expect(cache.invalidateCache('non-existent')).resolves.toBeUndefined();
    });
  });
});
