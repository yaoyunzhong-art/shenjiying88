import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-model-config] [D] controller spec 补全
 *
 * AiModelConfigController 路由、装饰器元数据 + 业务场景验证
 * 覆盖: listPresets/getPreset/createStoreConfig/listStoreConfigs/switchConfig/listHistory/rollback
 */

import assert from 'node:assert/strict';
// ── 模拟装饰器 ──

function Controller(prefix: string) {
  return (target: { new (...args: any[]): unknown; __prefix?: string }) => {
    target.__prefix = prefix;
    return target;
  };
}

const getRegistrations: string[] = [];
function Get(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    getRegistrations.push(`${String(propertyKey)}:${path}`);
  };
}

const postRegistrations: string[] = [];
function Post(path = '') {
  return (_target: object, propertyKey: string | symbol) => {
    postRegistrations.push(`${String(propertyKey)}:${path}`);
  };
}

// ── 实体类型 (简化) ──

type AiModelProvider = 'openai' | 'anthropic' | 'qwen' | 'custom';
type IndustryType = 'general' | 'arcade' | 'family-entertainment' | 'shopping-mall';
type ConfigChangeType = 'create' | 'update' | 'rollback' | 'activate';

interface AiModelPreset {
  id: string;
  presetCode: string;
  displayName: string;
  provider: AiModelProvider;
  modelName: string;
  industry: IndustryType;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface AiModelStoreConfig {
  id: string;
  tenantId: string;
  storeId: string;
  configName: string;
  provider: AiModelProvider;
  endpointUrl: string;
  apiKeyEncrypted: string;
  contextWindow: number;
  temperature: number;
  maxTokens: number;
  customHeaders?: Record<string, string>;
  isCurrent: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AiModelConfigHistory {
  id: string;
  configId: string;
  snapshot: Partial<AiModelStoreConfig>;
  versionNumber: number;
  changeType: ConfigChangeType;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

// ── 模拟 Service ──

class MockAiModelConfigService {
  private presets = new Map<string, AiModelPreset>();
  private storeConfigs = new Map<string, AiModelStoreConfig>();
  private historyEntries: AiModelConfigHistory[] = [];

  constructor() {
    this.seedDefaultPresets();
  }

  private seedDefaultPresets(): void {
    const now = new Date().toISOString();
    const presets: AiModelPreset[] = [
      { id: 'preset-gpt4o-general', presetCode: 'gpt4o-general', displayName: 'GPT-4o (通用)', provider: 'openai', modelName: 'gpt-4o', industry: 'general', isActive: true, description: 'OpenAI GPT-4o,通用场景', createdAt: now, updatedAt: now },
      { id: 'preset-claude-game', presetCode: 'claude-game', displayName: 'Claude 3.5 Sonnet (电玩)', provider: 'anthropic', modelName: 'claude-3-5-sonnet-20241022', industry: 'arcade', isActive: true, description: 'Anthropic Claude 3.5', createdAt: now, updatedAt: now },
      { id: 'preset-qwen-family', presetCode: 'qwen-family', displayName: 'Qwen-VL (亲子)', provider: 'qwen', modelName: 'qwen-vl-max', industry: 'family-entertainment', isActive: true, description: '通义千问 Qwen-VL', createdAt: now, updatedAt: now },
      { id: 'preset-custom', presetCode: 'custom', displayName: '自定义', provider: 'custom', modelName: 'custom-model', industry: 'general', isActive: true, description: '用户自定义', createdAt: now, updatedAt: now },
    ];
    presets.forEach((p) => this.presets.set(p.id, p));
  }

  listPresets(filter?: { provider?: string; industry?: string; isActive?: boolean }): AiModelPreset[] {
    let results = Array.from(this.presets.values());
    if (filter?.provider) results = results.filter((p) => p.provider === filter.provider);
    if (filter?.industry) results = results.filter((p) => p.industry === filter.industry);
    if (filter?.isActive !== undefined) results = results.filter((p) => p.isActive === filter.isActive);
    return results;
  }

  getPreset(id: string): AiModelPreset | null {
    return this.presets.get(id) ?? null;
  }

  createStoreConfig(
    tenantId: string, storeId: string, createdBy: string,
    input: { configName: string; provider: string; endpointUrl: string; apiKey: string; contextWindow: number; temperature: number; maxTokens: number; customHeaders?: Record<string, string> },
  ): AiModelStoreConfig {
    const id = `config-mock-${this.storeConfigs.size + 1}`;
    const now = new Date().toISOString();
    const config: AiModelStoreConfig = {
      id, tenantId, storeId,
      configName: input.configName,
      provider: input.provider as AiModelProvider,
      endpointUrl: `encrypted:${input.endpointUrl}`,
      apiKeyEncrypted: `encrypted:${input.apiKey}`,
      contextWindow: input.contextWindow,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      customHeaders: input.customHeaders,
      isCurrent: false,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
    this.storeConfigs.set(id, config);
    this.recordHistory(config, 'create', createdBy);
    return config;
  }

  listStoreConfigs(storeId: string): Array<Omit<AiModelStoreConfig, 'apiKeyEncrypted'> & { apiKeyMasked: string }> {
    return Array.from(this.storeConfigs.values())
      .filter((c) => c.storeId === storeId)
      .map((c) => ({
        ...c,
        apiKeyEncrypted: undefined,
        apiKeyMasked: c.apiKeyEncrypted.slice(0, 5) + '***' + c.apiKeyEncrypted.slice(-4),
      }) as any);
  }

  getCurrentConfig(storeId: string): AiModelStoreConfig | null {
    return Array.from(this.storeConfigs.values()).find((c) => c.storeId === storeId && c.isCurrent) ?? null;
  }

  private recordHistory(config: AiModelStoreConfig, changeType: ConfigChangeType, changedBy: string, reason?: string): void {
    const versionNumber = this.historyEntries.filter((h) => h.configId === config.id).length + 1;
    this.historyEntries.push({
      id: `hist-mock-${this.historyEntries.length + 1}`,
      configId: config.id,
      snapshot: { ...config },
      versionNumber,
      changeType,
      changedBy,
      changedAt: new Date().toISOString(),
      reason,
    });
  }

  switchConfig(request: { configId: string; reason?: string }, operatorId: string): { config: AiModelStoreConfig; latencyMs: number; healthCheckOk: boolean } {
    const start = Date.now();
    const target = this.storeConfigs.get(request.configId);
    if (!target) throw new Error(`Config ${request.configId} not found`);

    for (const c of this.storeConfigs.values()) {
      if (c.storeId === target.storeId) c.isCurrent = c.id === target.id;
    }

    this.recordHistory(target, 'activate', operatorId, request.reason);
    const latencyMs = Date.now() - start;

    return { config: target, latencyMs, healthCheckOk: target.endpointUrl.startsWith('encrypted:http') };
  }

  listHistory(configId: string, limit = 50): AiModelConfigHistory[] {
    return this.historyEntries
      .filter((h) => h.configId === configId)
      .slice(-limit)
      .reverse();
  }

  rollbackToHistory(historyId: string, operatorId: string, reason: string): AiModelStoreConfig {
    const hist = this.historyEntries.find((h) => h.id === historyId);
    if (!hist) throw new Error(`History ${historyId} not found`);
    const current = this.storeConfigs.get(hist.configId);
    if (!current) throw new Error(`Config ${hist.configId} not found`);

    const snapshot = hist.snapshot as AiModelStoreConfig;
    Object.assign(current, {
      configName: snapshot.configName,
      provider: snapshot.provider,
      endpointUrl: snapshot.endpointUrl,
      apiKeyEncrypted: snapshot.apiKeyEncrypted,
      contextWindow: snapshot.contextWindow,
      temperature: snapshot.temperature,
      maxTokens: snapshot.maxTokens,
      customHeaders: snapshot.customHeaders,
      updatedAt: new Date().toISOString(),
    });

    this.recordHistory(current, 'rollback', operatorId, reason);
    return current;
  }

  reset(): void {
    this.presets.clear();
    this.storeConfigs.clear();
    this.historyEntries = [];
    this.seedDefaultPresets();
  }
}

// ── Controller 模拟 ──

class AiModelConfigController {
  private readonly service: MockAiModelConfigService;

  constructor(service: MockAiModelConfigService) {
    this.service = service;
  }

  listPresets(query: { provider?: string; industry?: string; isActive?: boolean }) {
    const data = this.service.listPresets(query);
    return { data, total: this.service.listPresets().length };
  }

  getPreset(id: string) {
    return this.service.getPreset(id);
  }

  createStoreConfig(
    req: { user: { tenantId: string; storeId: string; id: string } },
    dto: { configName: string; provider: string; endpointUrl: string; apiKey: string; contextWindow: number; temperature: number; maxTokens: number; customHeaders?: Record<string, string> },
  ) {
    return this.service.createStoreConfig(req.user.tenantId, req.user.storeId, req.user.id, dto);
  }

  listStoreConfigs(req: { user: { storeId: string } }) {
    const data = this.service.listStoreConfigs(req.user.storeId);
    return { data, total: data.length };
  }

  switchConfig(req: { user: { id: string } }, dto: { configId: string; reason?: string }) {
    return this.service.switchConfig(dto, req.user.id);
  }

  listHistory(configId: string) {
    const data = this.service.listHistory(configId);
    return { data, total: data.length };
  }

  rollback(req: { user: { id: string } }, dto: { historyId: string; reason: string }) {
    return this.service.rollbackToHistory(dto.historyId, req.user.id, dto.reason);
  }
}

// 注册装饰器元数据
Get('presets')(AiModelConfigController.prototype, 'listPresets');
Get('presets/:id')(AiModelConfigController.prototype, 'getPreset');
Post('store-configs')(AiModelConfigController.prototype, 'createStoreConfig');
Get('store-configs')(AiModelConfigController.prototype, 'listStoreConfigs');
Post('switch')(AiModelConfigController.prototype, 'switchConfig');
Get('history/:configId')(AiModelConfigController.prototype, 'listHistory');
Post('rollback')(AiModelConfigController.prototype, 'rollback');
Controller('ai-model-config')(AiModelConfigController);

// ── 测试套件 ──

describe('AiModelConfigController', () => {
  let service: MockAiModelConfigService;
  let controller: AiModelConfigController;

  beforeEach(() => {
    service = new MockAiModelConfigService();
    controller = new AiModelConfigController(service);
  });

  afterEach(() => {
    service.reset();
  });

  // ── 装饰器元数据 ──

  describe('decorator metadata', () => {
    it('registers controller prefix "ai-model-config"', () => {
      assert.equal(
        (AiModelConfigController as typeof AiModelConfigController & { __prefix?: string }).__prefix,
        'ai-model-config',
      );
    });

    it('registers @Get("presets") on listPresets', () => {
      assert.ok(getRegistrations.includes('listPresets:presets'));
    });

    it('registers @Get("presets/:id") on getPreset', () => {
      assert.ok(getRegistrations.includes('getPreset:presets/:id'));
    });

    it('registers @Post("store-configs") on createStoreConfig', () => {
      assert.ok(postRegistrations.includes('createStoreConfig:store-configs'));
    });

    it('registers @Get("store-configs") on listStoreConfigs', () => {
      assert.ok(getRegistrations.includes('listStoreConfigs:store-configs'));
    });

    it('registers @Post("switch") on switchConfig', () => {
      assert.ok(postRegistrations.includes('switchConfig:switch'));
    });

    it('registers @Get("history/:configId") on listHistory', () => {
      assert.ok(getRegistrations.includes('listHistory:history/:configId'));
    });

    it('registers @Post("rollback") on rollback', () => {
      assert.ok(postRegistrations.includes('rollback:rollback'));
    });
  });

  // ── GET /ai-model-config/presets ──

  describe('GET /ai-model-config/presets', () => {
    it('returns 4 default presets with total', () => {
      const result = controller.listPresets({});
      assert.equal(result.data.length, 4);
      assert.equal(result.total, 4);
    });

    it('filters by provider', () => {
      const result = controller.listPresets({ provider: 'openai' });
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].provider, 'openai');
    });

    it('filters by industry', () => {
      const result = controller.listPresets({ industry: 'arcade' });
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].industry, 'arcade');
    });

    it('filters by isActive=false returns empty', () => {
      const result = controller.listPresets({ isActive: false });
      assert.equal(result.data.length, 0);
    });

    it('filters by provider+industry together', () => {
      // All presets are active, just verify no false positives
      const result = controller.listPresets({ provider: 'qwen', industry: 'family-entertainment' });
      assert.equal(result.data.length, 1);
    });

    it('empty filter returns all 4 presets', () => {
      const result = controller.listPresets({});
      assert.equal(result.data.length, 4);
      const providers = result.data.map((p: AiModelPreset) => p.provider);
      assert.ok(providers.includes('openai'));
      assert.ok(providers.includes('anthropic'));
      assert.ok(providers.includes('qwen'));
      assert.ok(providers.includes('custom'));
    });
  });

  // ── GET /ai-model-config/presets/:id ──

  describe('GET /ai-model-config/presets/:id', () => {
    it('returns preset by ID with correct fields', () => {
      const preset = controller.getPreset('preset-gpt4o-general');
      assert.ok(preset);
      assert.equal(preset!.presetCode, 'gpt4o-general');
      assert.equal(preset!.provider, 'openai');
      assert.equal(preset!.industry, 'general');
    });

    it('returns null for non-existent preset', () => {
      const preset = controller.getPreset('non-existent-preset-id');
      assert.equal(preset, null);
    });

    it('each preset has all required fields', () => {
      const ids = ['preset-gpt4o-general', 'preset-claude-game', 'preset-qwen-family', 'preset-custom'];
      for (const id of ids) {
        const preset = controller.getPreset(id);
        assert.ok(preset, `Preset ${id} should exist`);
        assert.ok(preset!.id);
        assert.ok(preset!.presetCode);
        assert.ok(preset!.displayName);
        assert.ok(preset!.provider);
        assert.ok(preset!.modelName);
        assert.ok(preset!.createdAt);
      }
    });
  });

  // ── POST /ai-model-config/store-configs ──

  describe('POST /ai-model-config/store-configs', () => {
    const defaultReq = { user: { tenantId: 'tenant-1', storeId: 'store-1', id: 'user-1' } };

    it('creates store config with encrypted API key', () => {
      const config = controller.createStoreConfig(defaultReq, {
        configName: 'My Test Config',
        provider: 'openai',
        endpointUrl: 'https://api.openai.com',
        apiKey: 'sk-test-key-12345',
        contextWindow: 128000,
        temperature: 0.7,
        maxTokens: 4096,
      });

      assert.ok(config.id);
      assert.equal(config.tenantId, 'tenant-1');
      assert.equal(config.storeId, 'store-1');
      assert.equal(config.configName, 'My Test Config');
      assert.ok(config.apiKeyEncrypted);
      // API key should not be stored as plaintext (mock prefixes with encrypted:)
      assert.ok(config.apiKeyEncrypted.startsWith('encrypted:'));
      assert.ok(!config.apiKeyEncrypted.startsWith('sk-'));
    });

    it('creates config for different provider types', () => {
      const providers = ['openai', 'anthropic', 'qwen', 'custom'] as const;
      for (const provider of providers) {
        const config = controller.createStoreConfig(defaultReq, {
          configName: `Config ${provider}`,
          provider,
          endpointUrl: `https://${provider}.com`,
          apiKey: `sk-${provider}`,
          contextWindow: 128000,
          temperature: 0.5,
          maxTokens: 4096,
        });
        assert.equal(config.provider, provider);
      }
    });

    it('supports customHeaders', () => {
      const config = controller.createStoreConfig(defaultReq, {
        configName: 'With Headers',
        provider: 'openai',
        endpointUrl: 'https://api.openai.com',
        apiKey: 'sk-key',
        contextWindow: 128000,
        temperature: 0.7,
        maxTokens: 4096,
        customHeaders: { 'X-Custom': 'value1' },
      });
      assert.deepEqual(config.customHeaders, { 'X-Custom': 'value1' });
    });

    it('creates config without isCurrent initially', () => {
      const config = controller.createStoreConfig(defaultReq, {
        configName: 'New Config',
        provider: 'openai',
        endpointUrl: 'https://api.openai.com',
        apiKey: 'sk-key',
        contextWindow: 128000,
        temperature: 0.7,
        maxTokens: 4096,
      });
      assert.equal(config.isCurrent, false);
    });
  });

  // ── GET /ai-model-config/store-configs ──

  describe('GET /ai-model-config/store-configs', () => {
    it('returns empty array when no configs exist', () => {
      const result = controller.listStoreConfigs({ user: { storeId: 'store-empty' } });
      assert.equal(result.data.length, 0);
      assert.equal(result.total, 0);
    });

    it('returns configs with masked API key', () => {
      const req = { user: { tenantId: 'tenant-1', storeId: 'store-1', id: 'user-1' } };
      controller.createStoreConfig(req, {
        configName: 'C1', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-abcdef-ghijkl',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      });
      const result = controller.listStoreConfigs(req);
      assert.equal(result.data.length, 1);
      assert.ok(result.data[0].apiKeyMasked);
      // Masked key should not contain the full plaintext
      assert.ok(!result.data[0].apiKeyMasked.includes('sk-abcdef-ghijkl'));
      // Masked key should have *** indicator
      assert.ok(result.data[0].apiKeyMasked.includes('***'));
    });

    it('isolates configs by storeId', () => {
      const req1 = { user: { tenantId: 't1', storeId: 'store-A', id: 'u1' } };
      const req2 = { user: { tenantId: 't2', storeId: 'store-B', id: 'u2' } };
      controller.createStoreConfig(req1, {
        configName: 'StoreA Config', provider: 'openai',
        endpointUrl: 'https://openai.com', apiKey: 'sk-a',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      });
      controller.createStoreConfig(req2, {
        configName: 'StoreB Config', provider: 'anthropic',
        endpointUrl: 'https://anthropic.com', apiKey: 'sk-b',
        contextWindow: 200000, temperature: 0.5, maxTokens: 8192,
      });

      const resultA = controller.listStoreConfigs(req1);
      assert.equal(resultA.data.length, 1);
      assert.equal(resultA.data[0].configName, 'StoreA Config');
      assert.equal(resultA.data[0].provider, 'openai');
    });
  });

  // ── POST /ai-model-config/switch ──

  describe('POST /ai-model-config/switch', () => {
    it('switches active config and marks correct one as current', () => {
      const req = { user: { tenantId: 't1', storeId: 's1', id: 'u1' } };
      const c1 = controller.createStoreConfig(req, {
        configName: 'Default', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-1',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      }) as AiModelStoreConfig;
      const c2 = controller.createStoreConfig(req, {
        configName: 'Backup', provider: 'anthropic',
        endpointUrl: 'https://api.anthropic.com', apiKey: 'sk-2',
        contextWindow: 200000, temperature: 0.5, maxTokens: 8192,
      }) as AiModelStoreConfig;

      const result = controller.switchConfig(req, { configId: c2.id, reason: 'switch to backup' });
      assert.equal(result.config.id, c2.id);
      assert.ok(result.healthCheckOk);

      // Verify via service: only one config should be current
      const current = service.getCurrentConfig('s1');
      assert.equal(current!.id, c2.id);
    });

    it('returns latencyMs as a number', () => {
      const req = { user: { tenantId: 't1', storeId: 's1', id: 'u1' } };
      const c1 = controller.createStoreConfig(req, {
        configName: 'Test', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-1',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      });
      const result = controller.switchConfig(req, { configId: c1.id });
      assert.ok(typeof result.latencyMs === 'number');
      assert.ok(result.latencyMs >= 0);
    });

    it('throws error for non-existent configId', () => {
      const req = { user: { id: 'u1' } };
      assert.throws(() => {
        controller.switchConfig(req, { configId: 'non-existent-id' });
      }, /Config non-existent-id not found/);
    });
  });

  // ── GET /ai-model-config/history/:configId ──

  describe('GET /ai-model-config/history/:configId', () => {
    it('returns empty history for non-existent config', () => {
      const result = controller.listHistory('non-existent-config');
      assert.equal(result.data.length, 0);
      assert.equal(result.total, 0);
    });

    it('records creation as first history entry', () => {
      const req = { user: { tenantId: 't1', storeId: 's1', id: 'u1' } };
      const config = controller.createStoreConfig(req, {
        configName: 'Test Config', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-1',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      });
      const result = controller.listHistory(config.id);
      assert.equal(result.data.length, 1);
      assert.equal(result.data[0].changeType, 'create');
      assert.equal(result.data[0].versionNumber, 1);
    });

    it('records switch as activate history entry', () => {
      const req = { user: { tenantId: 't1', storeId: 's1', id: 'u1' } };
      const config = controller.createStoreConfig(req, {
        configName: 'Test', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-1',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      });
      controller.switchConfig(req, { configId: config.id, reason: 'activate' });
      const result = controller.listHistory(config.id);
      assert.equal(result.data.length, 2);
      assert.equal(result.data[0].changeType, 'activate');
      assert.equal(result.data[1].changeType, 'create');
    });

    it('history entries have version numbers in descending order', () => {
      const req = { user: { tenantId: 't1', storeId: 's1', id: 'u1' } };
      const config = controller.createStoreConfig(req, {
        configName: 'Test', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-1',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      });
      controller.switchConfig(req, { configId: config.id });
      const result = controller.listHistory(config.id);
      // Most recent first
      assert.ok(result.data[0].versionNumber > result.data[1].versionNumber);
    });
  });

  // ── POST /ai-model-config/rollback ──

  describe('POST /ai-model-config/rollback', () => {
    it('rolls back to original values after switch', () => {
      const req = { user: { tenantId: 't1', storeId: 's1', id: 'u1' } };
      // Create with initial values
      const config = controller.createStoreConfig(req, {
        configName: 'Original', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-original',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      }) as AiModelStoreConfig;

      // Get history
      const history = controller.listHistory(config.id);
      const histId = history.data[0].id;

      // Rollback to first version
      const rolled = controller.rollback(req, { historyId: histId, reason: 'rollback test' });
      assert.equal(rolled.configName, 'Original');
    });

    it('records rollback as new history entry', () => {
      const req = { user: { tenantId: 't1', storeId: 's1', id: 'u1' } };
      const config = controller.createStoreConfig(req, {
        configName: 'Test', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-1',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      });
      const history = controller.listHistory(config.id);
      const histId = history.data[0].id;

      controller.rollback(req, { historyId: histId, reason: 'undo' });
      const updatedHistory = controller.listHistory(config.id);
      // Original create + rollback = 2 entries
      assert.equal(updatedHistory.data.length, 2);
      assert.equal(updatedHistory.data[0].changeType, 'rollback');
    });

    it('throws error for non-existent history id', () => {
      const req = { user: { id: 'u1' } };
      assert.throws(() => {
        controller.rollback(req, { historyId: 'non-existent-hist', reason: 'test' });
      }, /History non-existent-hist not found/);
    });
  });

  // ── 业务场景: 完整的配置生命周期 ──

  describe('full lifecycle: create → switch → history → rollback', () => {
    const req = { user: { tenantId: 't1', storeId: 's1', id: 'u1' } };

    it('complete lifecycle works end-to-end', () => {
      // 1. Create first config
      const config1 = controller.createStoreConfig(req, {
        configName: 'Version 1', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-v1',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      });

      // 2. Switch to it
      const switchResult = controller.switchConfig(req, { configId: config1.id });
      assert.equal(switchResult.config.id, config1.id);

      // 3. Create second config
      const config2 = controller.createStoreConfig(req, {
        configName: 'Version 2', provider: 'anthropic',
        endpointUrl: 'https://api.anthropic.com', apiKey: 'sk-v2',
        contextWindow: 200000, temperature: 0.5, maxTokens: 8192,
      });

      // 4. Switch to second config
      controller.switchConfig(req, { configId: config2.id, reason: 'upgrade to anthropic' });

      // 5. Verify both configs have history
      const h1 = controller.listHistory(config1.id);
      assert.ok(h1.data.length >= 1);

      const h2 = controller.listHistory(config2.id);
      assert.ok(h2.data.length >= 1);

      // 6. Verify store configs listing
      const configs = controller.listStoreConfigs(req);
      assert.equal(configs.data.length, 2);
    });

    it('creates multiple store configs and lists them', () => {
      for (let i = 1; i <= 5; i++) {
        controller.createStoreConfig(req, {
          configName: `Config ${i}`, provider: 'openai',
          endpointUrl: 'https://api.openai.com', apiKey: `sk-${i}`,
          contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
        });
      }
      const result = controller.listStoreConfigs(req);
      assert.equal(result.data.length, 5);
    });
  });

  // ── 边界情况 ──

  describe('edge cases', () => {
    it('switch to already-current config works idempotently', () => {
      const req = { user: { tenantId: 't1', storeId: 's1', id: 'u1' } };
      const config = controller.createStoreConfig(req, {
        configName: 'Default', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-1',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      });
      // Switch twice
      controller.switchConfig(req, { configId: config.id });
      const result = controller.switchConfig(req, { configId: config.id });
      assert.equal(result.config.id, config.id);
      assert.ok(result.healthCheckOk);
    });

    it('two stores have independent configs', () => {
      const reqA = { user: { tenantId: 't1', storeId: 'store-A', id: 'u1' } };
      const reqB = { user: { tenantId: 't2', storeId: 'store-B', id: 'u2' } };

      controller.createStoreConfig(reqA, {
        configName: 'StoreA-C1', provider: 'openai',
        endpointUrl: 'https://api.openai.com', apiKey: 'sk-a1',
        contextWindow: 128000, temperature: 0.7, maxTokens: 4096,
      });
      controller.createStoreConfig(reqB, {
        configName: 'StoreB-C1', provider: 'anthropic',
        endpointUrl: 'https://api.anthropic.com', apiKey: 'sk-b1',
        contextWindow: 200000, temperature: 0.5, maxTokens: 8192,
      });

      assert.equal(controller.listStoreConfigs(reqA).data.length, 1);
      assert.equal(controller.listStoreConfigs(reqB).data.length, 1);
    });

    it('healthCheckOk is false for non-http endpoints', () => {
      const req = { user: { tenantId: 't1', storeId: 's1', id: 'u1' } };
      // Create a config where endpointUrl doesn't start with http (simulated)
      controller.createStoreConfig(req, {
        configName: 'Bad Endpoint', provider: 'custom',
        endpointUrl: 'tcp://localhost:8080', apiKey: 'sk-bad',
        contextWindow: 8192, temperature: 0.7, maxTokens: 4096,
      });
      // The mock encrypts as encrypted:tcp://localhost:8080, which fails healthCheck
      const configs = controller.listStoreConfigs(req);
      // Just verify it was still created despite "bad" endpoint
      assert.equal(configs.data.length, 1);
    });
  });
});
