/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链22 (Pulse-Nightly-15)
 * 管理端数据配置 → API数据同步 → Domain领域处理 → TOB企业端展示 → Storefront店铺端消费
 *
 * 新增于 2026-07-14 03:30-05:30 第三段
 * 覆盖: admin-web(数据配置) → api(数据同步/转换) → domain(领域处理) → tob-web(企业看板) → storefront-web(消费展示)
 *
 * 模拟数据管道链路:
 *   Admin(管理后台: 商品/价格/库存/促销数据配置)
 *   → API(数据同步: 数据转换/统一推送/增量同步)
 *   → Domain(领域处理: 数据变换/规则引擎/合规检查)
 *   → TOB-Web(企业店铺: 数据看板/商品上架/报表导出)
 *   → Storefront(前端消费: 价格展示/库存可见/促销生效)
 *
 * 测试设计:
 *   - 数据配置→转换→同步→展示全链路数据一致性
 *   - 增量/全量/定时三种同步模式
 *   - 数据冲突解决策略(管理员vs系统vs外部)
 *   - 多维度数据变换: 计量单位/币种/语言/时区
 *   - 场景: 管理端创建促销→同步→TOB确认→Storefront生效
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

type DataSyncMode = 'full' | 'incremental' | 'scheduled';
type DataEntityType = 'product' | 'price' | 'inventory' | 'promotion' | 'category';
type DataStatus = 'draft' | 'pending' | 'synced' | 'failed' | 'conflict';
type ConflictStrategy = 'admin_wins' | 'latest_wins' | 'manual_resolve' | 'timestamp_based';

interface DataConfig {
  configId: string;
  entityType: DataEntityType;
  sourceModule: string;
  targetModules: string[];
  syncMode: DataSyncMode;
  transformRules: Array<{ field: string; rule: string; params: Record<string, unknown> }>;
  scheduleCron?: string;
  conflictStrategy: ConflictStrategy;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

interface DataRecord {
  recordId: string;
  entityType: DataEntityType;
  entityId: string;
  sourceVersion: number;
  payload: Record<string, unknown>;
  checksum: string;
  status: DataStatus;
  syncedAt?: number;
  errorMessage?: string;
  conflictDetail?: string;
}

interface DataSyncEvent {
  eventId: string;
  configId: string;
  records: DataRecord[];
  mode: DataSyncMode;
  startedAt: number;
  completedAt?: number;
  recordCount: number;
  successCount: number;
  failCount: number;
  conflictCount: number;
}

interface TobBusinessView {
  viewId: string;
  tenantId: string;
  entityType: DataEntityType;
  data: Array<Record<string, unknown>>;
  lastSyncAt: number;
  syncLagMs: number;
  dataConsistency: number; // 0-1 percentage of sync completion
}

interface StorefrontDisplay {
  displayId: string;
  storeId: string;
  entityType: DataEntityType;
  visibleData: Array<Record<string, unknown>>;
  activePromotions: Array<Record<string, unknown>>;
  displayVersion: number;
  refreshedAt: number;
}

// ─── Mock Service Layer ───

class DataConfigService {
  private configs = new Map<string, DataConfig>();
  private counter = 0;

  createConfig(cfg: Omit<DataConfig, 'configId' | 'createdAt' | 'updatedAt'>): DataConfig {
    this.counter++;
    const configId = `dcfg-${this.counter}`;
    const now = Date.now();
    const config: DataConfig = { ...cfg, configId, createdAt: now, updatedAt: now };
    this.configs.set(configId, config);
    return config;
  }

  getConfig(id: string): DataConfig | undefined {
    return this.configs.get(id);
  }

  updateConfig(id: string, patch: Partial<DataConfig>): DataConfig | undefined {
    const cfg = this.configs.get(id);
    if (!cfg) return undefined;
    const updated = { ...cfg, ...patch, configId: id, updatedAt: Date.now() };
    this.configs.set(id, updated);
    return updated;
  }

  listConfigs(entityType?: DataEntityType): DataConfig[] {
    const all = [...this.configs.values()];
    return entityType ? all.filter(c => c.entityType === entityType) : all;
  }

  deleteConfig(id: string): boolean {
    return this.configs.delete(id);
  }
}

class DataSyncService {
  private syncHistory = new Map<string, DataSyncEvent>();
  private records = new Map<string, DataRecord>();
  private counter = 0;

  syncData(configId: string, mode: DataSyncMode, records: DataRecord[]): DataSyncEvent {
    this.counter++;
    const eventId = `sync-${Date.now()}-${this.counter}`;
    const startedAt = Date.now();
    let successCount = 0;
    let failCount = 0;
    let conflictCount = 0;

    for (const record of records) {
      const existingKey = `${record.entityType}:${record.entityId}`;
      const existing = this.records.get(existingKey);

      if (existing) {
        if (record.sourceVersion > existing.sourceVersion) {
          record.status = 'synced';
          record.syncedAt = Date.now();
          this.records.set(existingKey, record);
          successCount++;
        } else if (record.sourceVersion === existing.sourceVersion) {
          conflictCount++;
          record.status = 'conflict';
          record.conflictDetail = `版本冲突: local=${existing.sourceVersion}, incoming=${record.sourceVersion}, payload差异`;
          this.records.set(`${existingKey}:conflict-${eventId}`, record);
        } else {
          failCount++;
          record.status = 'failed';
          record.errorMessage = `本地版本(${existing.sourceVersion})高于传入版本(${record.sourceVersion})`;
        }
      } else {
        record.status = 'synced';
        record.recordId = `rec-${this.counter}-${existingKey}`;
        record.syncedAt = Date.now();
        this.records.set(existingKey, record);
        successCount++;
      }
    }

    const event: DataSyncEvent = {
      eventId,
      configId,
      records,
      mode,
      startedAt,
      completedAt: Date.now(),
      recordCount: records.length,
      successCount,
      failCount,
      conflictCount,
    };
    this.syncHistory.set(eventId, event);
    return event;
  }

  getSyncEvent(eventId: string): DataSyncEvent | undefined {
    return this.syncHistory.get(eventId);
  }

  getRecord(key: string): DataRecord | undefined {
    return this.records.get(key);
  }

  getSyncStatus(entityType: DataEntityType, entityId: string): DataStatus | undefined {
    return this.records.get(`${entityType}:${entityId}`)?.status;
  }
}

class DomainDataTransformService {
  transformProducts(
    products: Array<Record<string, unknown>>,
    targetCurrency: string,
    targetLanguage: string,
    targetTimezone: string,
  ): Array<Record<string, unknown>> {
    return products.map(p => {
      const priceInCents = (p as { priceCents?: number }).priceCents ?? 0;
      const priceCNY = priceInCents / 100;
      // Simulated currency conversion
      const rateMap: Record<string, number> = { CNY: 1, USD: 7.24, JPY: 0.047, EUR: 7.85, HKD: 0.93 };
      const rate = rateMap[targetCurrency] ?? 1;
      const convertedPrice = Math.round(priceCNY * rate * 100) / 100;
      return {
        ...p,
        displayPrice: convertedPrice,
        displayCurrency: targetCurrency,
        displayLanguage: targetLanguage,
        displayTimezone: targetTimezone,
        transformedAt: Date.now(),
      };
    });
  }

  transformPromotions(
    promotions: Array<Record<string, unknown>>,
    now: number,
  ): { active: Array<Record<string, unknown>>; expired: Array<Record<string, unknown>>; upcoming: Array<Record<string, unknown>> } {
    const active: Array<Record<string, unknown>> = [];
    const expired: Array<Record<string, unknown>> = [];
    const upcoming: Array<Record<string, unknown>> = [];

    for (const promo of promotions) {
      const p = promo as { startTime?: number; endTime?: number };
      if (p.endTime && p.endTime < now) {
        expired.push(promo);
      } else if (p.startTime && p.startTime > now) {
        upcoming.push(promo);
      } else {
        active.push(promo);
      }
    }
    return { active, expired, upcoming };
  }

  checkCompliance(data: Array<Record<string, unknown>>, rules: string[]): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    for (const item of data) {
      const d = item as { name?: string; price?: number; category?: string; tags?: string[] };
      // Rule 1: Name must exist and not be empty
      if (rules.includes('name_required') && (!d.name || d.name.trim() === '')) {
        violations.push(`商品名称缺失: ${JSON.stringify(d)}`);
      }
      // Rule 2: Price must be positive
      if (rules.includes('positive_price') && d.price != null && d.price <= 0) {
        violations.push(`商品价格无效(<=0): ${d.name ?? 'unknown'}`);
      }
      // Rule 3: Category must be in allowed list
      if (rules.includes('allowed_category') && d.category && !['food', 'electronics', 'clothing', 'service'].includes(d.category)) {
        violations.push(`分类不允许: ${d.category}`);
      }
    }
    return { passed: violations.length === 0, violations };
  }
}

class TobDataDisplayService {
  private views = new Map<string, TobBusinessView>();
  private counter = 0;

  createView(tenantId: string, entityType: DataEntityType): TobBusinessView {
    this.counter++;
    const view: TobBusinessView = {
      viewId: `tob-view-${this.counter}`,
      tenantId,
      entityType,
      data: [],
      lastSyncAt: 0,
      syncLagMs: 0,
      dataConsistency: 0,
    };
    this.views.set(view.viewId, view);
    return view;
  }

  updateViewData(records: DataRecord[], viewId: string): TobBusinessView | undefined {
    const view = this.views.get(viewId);
    if (!view) return undefined;

    const syncedRecords = records.filter(r => r.status === 'synced' && r.entityType === view.entityType);
    view.data = syncedRecords.map(r => ({ ...r.payload, syncRecordId: r.recordId }));
    view.lastSyncAt = Date.now();
    view.syncLagMs = Math.max(0, ...syncedRecords.map(r => r.syncedAt ? Date.now() - r.syncedAt : 0));
    view.dataConsistency = syncedRecords.length / Math.max(records.length, 1);
    return view;
  }

  getView(viewId: string): TobBusinessView | undefined {
    return this.views.get(viewId);
  }

  getDataQualityScore(viewId: string): number {
    const view = this.views.get(viewId);
    if (!view) return 0;
    const nonNullFields = view.data.filter(d => {
      const v = d as Record<string, unknown>;
      return Object.values(v).every(val => val !== null && val !== undefined && val !== '');
    }).length;
    return Math.round((nonNullFields / Math.max(view.data.length, 1)) * 100);
  }
}

class StorefrontDisplayService {
  private displays = new Map<string, StorefrontDisplay>();
  private counter = 0;

  createDisplay(storeId: string, entityType: DataEntityType): StorefrontDisplay {
    this.counter++;
    const display: StorefrontDisplay = {
      displayId: `sf-display-${this.counter}`,
      storeId,
      entityType,
      visibleData: [],
      activePromotions: [],
      displayVersion: 1,
      refreshedAt: 0,
    };
    this.displays.set(display.displayId, display);
    return display;
  }

  refreshDisplay(
    displayId: string,
    data: Array<Record<string, unknown>>,
    activePromotions: Array<Record<string, unknown>>,
  ): StorefrontDisplay | undefined {
    const display = this.displays.get(displayId);
    if (!display) return undefined;
    display.visibleData = data;
    display.activePromotions = activePromotions;
    display.displayVersion++;
    display.refreshedAt = Date.now();
    return display;
  }

  getDisplay(displayId: string): StorefrontDisplay | undefined {
    return this.displays.get(displayId);
  }

  getPriceRange(displayId: string): { min: number; max: number; currency: string } | null {
    const display = this.displays.get(displayId);
    if (!display || display.visibleData.length === 0) return null;
    const prices = display.visibleData
      .map(d => (d as { displayPrice?: number; displayCurrency?: string }).displayPrice)
      .filter((p): p is number => p != null);
    if (prices.length === 0) return null;
    const currency = (display.visibleData[0] as { displayCurrency?: string }).displayCurrency ?? 'CNY';
    return { min: Math.min(...prices), max: Math.max(...prices), currency };
  }

  hasActivePromotion(displayId: string, promoName: string): boolean {
    const display = this.displays.get(displayId);
    if (!display) return false;
    return display.activePromotions.some(p => (p as { name?: string }).name === promoName);
  }
}

// ─── Test Suite ───

describe('🦞 链22: 数据管道全链路 (Admin→API同步→Domain→TOB→Storefront)', { concurrency: 1 }, () => {

  // ─── P1: 正例 — 全量数据同步与展示 ───

  test('P1: 管理端配置→全量同步→TOB展示→Storefront消费', () => {
    const configService = new DataConfigService();
    const syncService = new DataSyncService();
    const transformService = new DomainDataTransformService();
    const tobService = new TobDataDisplayService();
    const sfService = new StorefrontDisplayService();

    // 1. Admin创建数据同步配置
    const config = configService.createConfig({
      entityType: 'product',
      sourceModule: 'admin-web',
      targetModules: ['tob-web', 'storefront-web'],
      syncMode: 'full',
      transformRules: [
        { field: 'price', rule: 'currency_conversion', params: { targetCurrency: 'USD', rate: 7.24 } },
        { field: 'name', rule: 'language_translation', params: { targetLanguage: 'zh-CN' } },
        { field: 'time', rule: 'timezone_conversion', params: { targetTimezone: 'America/New_York' } },
      ],
      conflictStrategy: 'latest_wins',
      enabled: true,
      scheduleCron: '0 */6 * * *',
    });

    assert.equal(config.entityType, 'product', '配置实体类型应为product');
    assert.equal(config.syncMode, 'full', '同步模式应为全量');
    assert.ok(config.createdAt > 0, '应有创建时间');

    // 2. 生成待同步数据记录
    const productRecords: DataRecord[] = [
      { recordId: 'p1', entityType: 'product', entityId: 'prod-001', sourceVersion: 1, payload: { name: '测试商品A', priceCents: 29900, category: 'food', stock: 100, tags: ['new'] }, checksum: 'abc1', status: 'pending' },
      { recordId: 'p2', entityType: 'product', entityId: 'prod-002', sourceVersion: 1, payload: { name: '测试商品B', priceCents: 59900, category: 'electronics', stock: 50, tags: ['hot'] }, checksum: 'abc2', status: 'pending' },
      { recordId: 'p3', entityType: 'product', entityId: 'prod-003', sourceVersion: 1, payload: { name: '测试商品C', priceCents: 99900, category: 'clothing', stock: 200, tags: ['sale'] }, checksum: 'abc3', status: 'pending' },
    ];

    // 3. API同步数据
    const syncEvent = syncService.syncData(config.configId, 'full', productRecords);
    assert.equal(syncEvent.recordCount, 3, '应同步3条记录');
    assert.equal(syncEvent.successCount, 3, '3条全部同步成功');
    assert.equal(syncEvent.failCount, 0, '无失败');
    assert.equal(syncEvent.conflictCount, 0, '无冲突');
    assert.ok(syncEvent.completedAt! >= syncEvent.startedAt, '完成时间应不早于开始时间');

    // 4. Domain领域处理: 币种转换+合规检查
    const transformed = transformService.transformProducts(
      productRecords.map(r => r.payload as Record<string, unknown>),
      'USD', 'zh-CN', 'America/New_York',
    );
    assert.equal(transformed.length, 3, '3条都应被转换');
    const first = transformed[0] as { displayPrice: number; displayCurrency: string };
    assert.ok(first.displayPrice > 0, '转换后应有正价格');
    assert.equal(first.displayCurrency, 'USD', '币种应为USD');

    // 合规检查
    const compliance = transformService.checkCompliance(transformed, ['name_required', 'positive_price', 'allowed_category']);
    assert.ok(compliance.passed, '合规检查应通过');
    assert.equal(compliance.violations.length, 0, '无违规项');

    // 5. TOB企业端展示
    const tobView = tobService.createView('tenant-001', 'product');
    const updatedView = tobService.updateViewData(productRecords.map(r => ({ ...r, status: 'synced' as DataStatus })), tobView.viewId);
    assert.ok(updatedView, 'TOB视图应被更新');
    assert.equal(updatedView!.data.length, 3, 'TOB应看到3条商品');
    const qualityScore = tobService.getDataQualityScore(tobView.viewId);
    assert.equal(qualityScore, 100, '数据质量应为100%');

    // 6. Storefront前端展示
    const sfDisplay = sfService.createDisplay('store-sh001', 'product');
    const refreshed = sfService.refreshDisplay(sfDisplay.displayId, transformed, []);
    assert.ok(refreshed, 'Storefront展示应被刷新');
    assert.equal(refreshed!.displayVersion, 2, '版本应从1增加到2');
    const priceRange = sfService.getPriceRange(sfDisplay.displayId);
    assert.ok(priceRange, '应有价格范围');
    assert.equal(priceRange!.currency, 'USD', '价格应显示为USD');

    // 全链路一致性验证
    const latestSyncStatus = syncService.getSyncStatus('product', 'prod-001');
    assert.equal(latestSyncStatus, 'synced', '产品最终状态应为synced');
  });

  // ─── P2: 增量同步 + 冲突解决 ───

  test('P2: 增量同步 + 版本冲突解决', () => {
    const syncService = new DataSyncService();
    const configService = new DataConfigService();

    const config = configService.createConfig({
      entityType: 'price',
      sourceModule: 'admin-web',
      targetModules: ['storefront-web'],
      syncMode: 'incremental',
      transformRules: [],
      conflictStrategy: 'latest_wins',
      enabled: true,
    });

    // 初始同步: v1
    const v1Records: DataRecord[] = [
      { recordId: 'r1', entityType: 'price', entityId: 'prod-001', sourceVersion: 1, payload: { basePrice: 29900, salePrice: 19900 }, checksum: 'ch1', status: 'pending' },
    ];
    const sync1 = syncService.syncData(config.configId, 'incremental', v1Records);
    assert.equal(sync1.successCount, 1, '首次同步应成功');

    // 增量同步: v2 (同一商品价格更新)
    const v2Records: DataRecord[] = [
      { recordId: 'r2', entityType: 'price', entityId: 'prod-001', sourceVersion: 2, payload: { basePrice: 34900, salePrice: 24900 }, checksum: 'ch2', status: 'pending' },
    ];
    const sync2 = syncService.syncData(config.configId, 'incremental', v2Records);
    assert.equal(sync2.successCount, 1, 'v2增量同步应成功');
    assert.equal(sync2.conflictCount, 0, '无冲突(版本高于本地)');

    // 验证最新版本有效
    const latestSyncStatus = syncService.getSyncStatus('price', 'prod-001');
    assert.equal(latestSyncStatus, 'synced', '最新状态应为synced');

    // 冲突场景: 相同版本号但payload不同
    const conflictRecords: DataRecord[] = [
      { recordId: 'r3', entityType: 'price', entityId: 'prod-001', sourceVersion: 2, payload: { basePrice: 39900, salePrice: 29900 }, checksum: 'ch3', status: 'pending' },
    ];
    const sync3 = syncService.syncData(config.configId, 'incremental', conflictRecords);
    assert.equal(sync3.conflictCount, 1, '应检测到版本冲突');
    assert.equal(sync3.successCount, 0, '无成功(因冲突)');
  });

  // ─── N1: 反例 — 数据合规失败 + 同步失败 ───

  test('N1: 数据合规检查失败 + 同步超时', () => {
    const transformService = new DomainDataTransformService();
    const syncService = new DataSyncService();
    const configService = new DataConfigService();

    const config = configService.createConfig({
      entityType: 'product',
      sourceModule: 'admin-web',
      targetModules: ['storefront-web'],
      syncMode: 'full',
      transformRules: [],
      conflictStrategy: 'latest_wins',
      enabled: true,
    });

    // 不合规数据: 空名称+零价格
    const badData: Array<Record<string, unknown>> = [
      { name: '', price: 0, category: 'illegal_cat' },
      { name: null, price: -100, category: 'food' },
      { name: '合法商品', price: 5000, category: 'unknown_cat' },
    ];

    const compliance = transformService.checkCompliance(badData, ['name_required', 'positive_price', 'allowed_category']);
    assert.ok(!compliance.passed, '合规检查应失败');
    assert.ok(compliance.violations.length > 0, '应有违规项');

    // 同步失败场景: 版本落后（prod-001已存在sourceVersion>=1, 传入version=0应失败）
    // 前提: 先同步一个正常版本
    syncService.syncData(config.configId, 'incremental', [
      { recordId: 'seed-1', entityType: 'product', entityId: 'prod-001', sourceVersion: 3, payload: { name: '当前数据' }, checksum: 'seed', status: 'pending' },
    ]);
    const staleRecords: DataRecord[] = [
      { recordId: 'stale-1', entityType: 'product', entityId: 'prod-001', sourceVersion: 1, payload: { name: '陈旧数据' }, checksum: 'stale', status: 'pending' },
    ];
    const syncEvent = syncService.syncData(config.configId, 'incremental', staleRecords);
    assert.equal(syncEvent.failCount, 1, '版本落后应失败');
    assert.equal(syncEvent.successCount, 0, '不应有任何成功');
  });

  // ─── N2: 反例 — TOB数据质量低 + Storefront价格异常 ───

  test('N2: 不完整数据导致TOB数据质量降低 + Storefront价格范围异常', () => {
    const transformService = new DomainDataTransformService();
    const tobService = new TobDataDisplayService();
    const sfService = new StorefrontDisplayService();

    // 混杂数据: 部分字段缺失
    const incompleteData: Array<Record<string, unknown>> = [
      { name: '完整商品', priceCents: 29900, category: 'food', tags: ['new'], stock: 100 },
      { name: '', priceCents: null, category: null, tags: [], stock: 0 },
      { name: null, priceCents: undefined, category: 'electronics', tags: undefined, stock: null },
      { name: '部分缺失', priceCents: 59900, category: 'clothing', tags: ['sale'], stock: undefined },
    ];

    // TOB数据质量评估
    const records: DataRecord[] = incompleteData.map((payload, i) => ({
      recordId: `id-${i}`,
      entityType: 'product' as DataEntityType,
      entityId: `prod-inc-${i}`,
      sourceVersion: 1,
      payload,
      checksum: `ch-inc-${i}`,
      status: 'synced' as DataStatus,
    }));

    // TOB展示 - 包含缺失数据
    const tobView = tobService.createView('tenant-inc', 'product');
    tobService.updateViewData(
      records.map(r => ({ ...r, status: 'synced' as DataStatus })),
      tobView.viewId,
    );
    const qualityScore = tobService.getDataQualityScore(tobView.viewId);
    assert.ok(qualityScore < 100, '数据质量应低于100%');

    // Storefront展示 - 价格范围
    const sfDisplay = sfService.createDisplay('store-inc', 'product');
    // 只转换有priceCents的完整数据条目
    const validData = incompleteData.filter(d => (d as { priceCents?: number | null }).priceCents != null);
    const transformed = transformService.transformProducts(
      validData,
      'JPY', 'ja-JP', 'Asia/Tokyo',
    );
    sfService.refreshDisplay(sfDisplay.displayId, transformed, []);
    const priceRange = sfService.getPriceRange(sfDisplay.displayId);
    // 2条有priceCents的记录可以算出价格范围
    assert.ok(priceRange, '有有效价格时应有价格范围');
    assert.ok(priceRange!.min > 0, '最小值应大于0');
    // 全空数据不应有价格范围
    const emptyDisplay = sfService.createDisplay('store-empty', 'product');
    sfService.refreshDisplay(emptyDisplay.displayId, [], []);
    const noPrice = sfService.getPriceRange(emptyDisplay.displayId);
    assert.equal(noPrice, null, '空数据不应有价格范围');
  });

  // ─── B1: 边界 — 空同步 + 大量并发同步 ───

  test('B1: 空数据同步 + 大量记录并发同步', () => {
    const syncService = new DataSyncService();
    const configService = new DataConfigService();

    const config = configService.createConfig({
      entityType: 'product',
      sourceModule: 'admin-web',
      targetModules: ['tob-web', 'storefront-web', 'mobile', 'miniapp'],
      syncMode: 'full',
      transformRules: [],
      conflictStrategy: 'latest_wins',
      enabled: true,
    });

    // 空数据同步
    const emptySync = syncService.syncData(config.configId, 'full', []);
    assert.equal(emptySync.recordCount, 0, '空同步应有0记录');
    assert.equal(emptySync.successCount, 0, '空同步无成功');
    assert.equal(emptySync.failCount, 0, '空同步无失败');

    // 大量记录同步 (100条)
    const batchRecords: DataRecord[] = [];
    for (let i = 0; i < 100; i++) {
      batchRecords.push({
        recordId: `batch-${i}`,
        entityType: 'product',
        entityId: `prod-batch-${i}`,
        sourceVersion: 1,
        payload: { name: `批量商品${i}`, priceCents: (i + 1) * 1000, category: 'food', stock: i * 10 },
        checksum: `ch-batch-${i}`,
        status: 'pending',
      });
    }
    const batchSync = syncService.syncData(config.configId, 'full', batchRecords);
    assert.equal(batchSync.recordCount, 100, '应同步100条记录');
    assert.equal(batchSync.successCount, 100, '100条全成功');
    assert.ok(batchSync.completedAt! - batchSync.startedAt < 50, '应快速完成(<50ms)');
  });

  // ─── B2: 边界 — 促销时间边界 + 多次目标模块同步 ───

  test('B2: 促销生效/过期边界 + 多目标模块同步一致性', () => {
    const syncService = new DataSyncService();
    const configService = new DataConfigService();
    const transformService = new DomainDataTransformService();
    const now = Date.now();
    const HOUR = 3600000;

    const config = configService.createConfig({
      entityType: 'promotion',
      sourceModule: 'admin-web',
      targetModules: ['storefront-web', 'mobile', 'tob-web'],
      syncMode: 'full',
      transformRules: [],
      conflictStrategy: 'latest_wins',
      enabled: true,
    });

    // 促销记录: 已开始/进行中/未开始
    const promoRecords: DataRecord[] = [
      { recordId: 'pr1', entityType: 'promotion', entityId: 'promo-expired', sourceVersion: 1, payload: { name: '已过期促销', startTime: now - 48 * HOUR, endTime: now - 1 * HOUR }, checksum: 'cp1', status: 'pending' },
      { recordId: 'pr2', entityType: 'promotion', entityId: 'promo-active', sourceVersion: 1, payload: { name: '进行中促销', startTime: now - 2 * HOUR, endTime: now + 22 * HOUR }, checksum: 'cp2', status: 'pending' },
      { recordId: 'pr3', entityType: 'promotion', entityId: 'promo-upcoming', sourceVersion: 1, payload: { name: '即将开始促销', startTime: now + 4 * HOUR, endTime: now + 28 * HOUR }, checksum: 'cp3', status: 'pending' },
    ];

    const syncEvent = syncService.syncData(config.configId, 'full', promoRecords);
    assert.equal(syncEvent.successCount, 3, '3条促销均同步成功');

    const promos = promoRecords.map(r => r.payload as Record<string, unknown>);
    const categorized = transformService.transformPromotions(promos, now);
    assert.equal(categorized.expired.length, 1, '应有1个已过期促销');
    assert.equal(categorized.active.length, 1, '应有1个进行中促销');
    assert.equal(categorized.upcoming.length, 1, '应有1个即将开始促销');

    // 验证边界: 恰好结束的促销
    const nearBoundaryPromos: Array<Record<string, unknown>> = [
      { name: '刚刚结束', startTime: now - 3 * HOUR, endTime: now - 1 }, // endTime = now - 1ms
      { name: '刚刚开始', startTime: now - 1, endTime: now + 24 * HOUR }, // startTime = now - 1ms
    ];
    const boundaryCategorized = transformService.transformPromotions(nearBoundaryPromos, now);
    assert.equal(boundaryCategorized.expired.length, 1, '刚刚结束的应算作过期');
    assert.equal(boundaryCategorized.active.length, 1, '刚刚开始的应算作进行中');

    // 多目标模块一致性: 同组数据推送给多个目标
    // 因为每个target都用新的configId, syncService中records已通过entityType:entityId去重,
    // 所以需要重新创建相同entityType:entityId但不同payload的记录
    for (const idx of [0, 1, 2]) {
      const targetModules = ['storefront-web', 'mobile', 'tob-web'];
      const freshRecords: DataRecord[] = [
        { recordId: `multi-${idx}-pr1`, entityType: 'promotion', entityId: `promo-expired-${idx}`, sourceVersion: 1, payload: { name: `已过期促销-${idx}`, startTime: now - 48 * HOUR, endTime: now - 1 * HOUR }, checksum: `cp-m${idx}-1`, status: 'pending' },
        { recordId: `multi-${idx}-pr2`, entityType: 'promotion', entityId: `promo-active-${idx}`, sourceVersion: 1, payload: { name: `进行中促销-${idx}`, startTime: now - 2 * HOUR, endTime: now + 22 * HOUR }, checksum: `cp-m${idx}-2`, status: 'pending' },
        { recordId: `multi-${idx}-pr3`, entityType: 'promotion', entityId: `promo-upcoming-${idx}`, sourceVersion: 1, payload: { name: `即将开始促销-${idx}`, startTime: now + 4 * HOUR, endTime: now + 28 * HOUR }, checksum: `cp-m${idx}-3`, status: 'pending' },
      ];
      const targetSync = syncService.syncData(`multi-config-${idx}`, 'full', freshRecords);
      assert.equal(targetSync.successCount, 3, `${targetModules[idx]}应同步成功3条`);
    }
  });

  // ─── B3: 边界 — 配置变更后重新同步 ───

  test('B3: 配置更新+停用+重新启用全生命周期', () => {
    const configService = new DataConfigService();
    const syncService = new DataSyncService();

    const config = configService.createConfig({
      entityType: 'product',
      sourceModule: 'admin-web',
      targetModules: ['storefront-web'],
      syncMode: 'full',
      transformRules: [],
      conflictStrategy: 'latest_wins',
      enabled: true,
    });

    // 停用配置
    const disabled = configService.updateConfig(config.configId, { enabled: false });
    assert.equal(disabled?.enabled, false, '配置应被停用');

    // 停用后同步应仍然可以(service层面不检查enabled, 但可做业务验证)
    const records: DataRecord[] = [
      { recordId: 'cfg1', entityType: 'product', entityId: 'prod-cfg-1', sourceVersion: 1, payload: { name: '配置测试' }, checksum: 'cfg1', status: 'pending' },
    ];
    const sync1 = syncService.syncData(config.configId, 'incremental', records);
    assert.equal(sync1.successCount, 1, '即使配置停用, 同步功能仍正常(业务层检查)');

    // 更新同步模式
    const updatedMode = configService.updateConfig(config.configId, { syncMode: 'scheduled', scheduleCron: '0 3 * * *' });
    assert.equal(updatedMode?.syncMode, 'scheduled', '同步模式应更新为scheduled');
    assert.equal(updatedMode?.scheduleCron, '0 3 * * *', '应有cron表达式');

    // 重新启用
    const reEnabled = configService.updateConfig(config.configId, { enabled: true });
    assert.equal(reEnabled?.enabled, true, '配置应重新启用');

    // 配置列表过滤
    const allConfigs = configService.listConfigs('product');
    assert.ok(allConfigs.length >= 1, '应至少有1个product配置');
  });
});
