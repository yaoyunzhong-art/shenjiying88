/**
 * 🦞 链16: Admin→Storefront→Mobile→API→Domain→SDK 全链路 SKU 生命周期 + 缓存一致性
 * 
 * 路径: Admin 创建/编辑/上架SKU → Storefront 在线展示 → Mobile 浏览/下单
 *      → API 库存校验 → Domain 仓储(缓存一致性·多端一致) → SDK 事件通知
 * 
 * 覆盖模块: admin-web · storefront-web · mobile · api · domain · sdk (6 模块)
 * 新增模式: 全链路 SKU 生命周期 + 多端缓存一致性
 * 
 * Pulse-Nightly-09 新增
 */

import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';

// ========== 仓储层 (in-memory) ==========
interface SkuRecord {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'draft' | 'published' | 'discontinued';
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderRecord {
  id: string;
  skuId: string;
  quantity: number;
  source: string;
  totalPrice: number;
  timestamp: string;
}

interface SdkEventRecord {
  eventType: string;
  skuId: string;
  payload: any;
  timestamp: string;
}

const skuStore: Map<string, SkuRecord> = new Map();
const orderStore: Map<string, OrderRecord> = new Map();
const sdkEventStore: SdkEventRecord[] = [];
const cacheStore: Map<string, any> = new Map(); // 模拟缓存层
const processedRequestIds: Set<string> = new Set(); // 幂等性

function seedStore() {
  skuStore.clear();
  orderStore.clear();
  sdkEventStore.length = 0;
  cacheStore.clear();
  processedRequestIds.clear();

  const baseSkus: SkuRecord[] = [
    { id: 'sku_pre_01', name: '预售款·夏季冰咖啡机', category: '餐饮设备', price: 2999, stock: 100, status: 'draft', version: 1, createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
    { id: 'sku_pub_01', name: '已上架·智能自助售货柜 A1', category: '自助设备', price: 8999, stock: 50, status: 'published', version: 3, createdAt: '2026-06-15T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
    { id: 'sku_pub_02', name: '已上架·商用制冰机 Pro', category: '餐饮设备', price: 15999, stock: 1000, status: 'published', version: 2, createdAt: '2026-06-20T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
    { id: 'sku_dis_01', name: '停售·老款咖啡机 V1', category: '餐饮设备', price: 1999, stock: 0, status: 'discontinued', version: 5, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  ];
  for (const sku of baseSkus) {
    skuStore.set(sku.id, { ...sku });
    cacheStore.set(`sku:${sku.id}`, { ...sku });
  }
}

const ADMIN_SOURCE = 'admin-web';
const STOREFRONT_SOURCE = 'storefront-web';
const MOBILE_SOURCE = 'mobile';

// ========== Mock 服务的模拟函数 ==========

// Admin: 创建/编辑/上架 SKU
function adminCreateSku(sku: Omit<SkuRecord, 'id' | 'version' | 'createdAt' | 'updatedAt'> & { id?: string }): { success: boolean; sku?: SkuRecord; error?: string } {
  const id = sku.id || `sku_${Date.now()}_${String(Math.random()).slice(2, 8)}`;
  if (skuStore.has(id) && skuStore.get(id)!.status !== 'discontinued') {
    return { success: false, error: 'duplicate_sku_id' };
  }
  const now = new Date().toISOString();
  const record: SkuRecord = {
    id,
    name: sku.name,
    category: sku.category,
    price: sku.price,
    stock: sku.stock,
    status: 'draft',
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  skuStore.set(id, record);
  invalidateCache(`sku:${id}`);
  emitSdkEvent('sku.created', id, { name: sku.name, category: sku.category });
  return { success: true, sku: record };
}

function adminPublishSku(skuId: string): { success: boolean; sku?: SkuRecord; error?: string } {
  const sku = skuStore.get(skuId);
  if (!sku) return { success: false, error: 'sku_not_found' };
  if (sku.status === 'discontinued') return { success: false, error: 'cannot_publish_discontinued' };
  sku.status = 'published';
  sku.version++;
  sku.updatedAt = new Date().toISOString();
  skuStore.set(skuId, { ...sku });
  invalidateCache(`sku:${skuId}`);
  emitSdkEvent('sku.published', skuId, { name: sku.name, price: sku.price });
  return { success: true, sku: { ...sku } };
}

function adminUpdateSku(skuId: string, updates: Partial<Pick<SkuRecord, 'name' | 'price' | 'stock'>>): { success: boolean; sku?: SkuRecord; error?: string } {
  const sku = skuStore.get(skuId);
  if (!sku) return { success: false, error: 'sku_not_found' };
  if (sku.status === 'discontinued') return { success: false, error: 'cannot_update_discontinued' };
  if (updates.price !== undefined && updates.price < 0) return { success: false, error: 'negative_price' };
  if (updates.stock !== undefined && updates.stock < 0) return { success: false, error: 'negative_stock' };
  Object.assign(sku, updates);
  sku.version++;
  sku.updatedAt = new Date().toISOString();
  skuStore.set(skuId, { ...sku });
  invalidateCache(`sku:${skuId}`);
  const changeDesc = Object.keys(updates).join(',');
  emitSdkEvent('sku.updated', skuId, { ...updates, changeDesc });
  return { success: true, sku: { ...sku } };
}

// Storefront: 展示已上架 SKU
function storefrontGetPublishedSkus(): { items: SkuRecord[] } {
  return {
    items: Array.from(skuStore.values()).filter(s => s.status === 'published'),
  };
}

function storefrontGetSkuDetail(skuId: string): { success: boolean; sku?: SkuRecord; error?: string } {
  const cached = cacheStore.get(`sku:${skuId}`);
  if (cached) return { success: true, sku: { ...cached } };
  const sku = skuStore.get(skuId);
  if (!sku) return { success: false, error: 'sku_not_found' };
  // 更新缓存
  cacheStore.set(`sku:${skuId}`, { ...sku });
  return { success: true, sku: { ...sku } };
}

// Mobile: 下单校验
let mobileOrderCounter = 0;
function mobilePlaceOrder(order: { skuId: string; quantity: number; source?: string }): { success: boolean; orderId?: string; error?: string } {
  mobileOrderCounter++;
  const reqId = `mobile_order_${Date.now()}_${mobileOrderCounter}`;
  if (processedRequestIds.has(reqId)) {
    return { success: true, alreadyProcessed: true, orderId: `existing_${order.skuId}` };
  }
  const sku = skuStore.get(order.skuId);
  if (!sku) return { success: false, error: 'sku_not_found' };
  if (sku.status !== 'published') return { success: false, error: 'sku_not_available' };
  if (order.quantity <= 0) return { success: false, error: 'invalid_quantity' };
  if (order.quantity > 10) return { success: false, error: 'quantity_exceeds_limit' };
  if (sku.stock < order.quantity) return { success: false, error: 'insufficient_stock' };

  sku.stock -= order.quantity;
  sku.version++;
  sku.updatedAt = new Date().toISOString();
  skuStore.set(order.skuId, { ...sku });
  invalidateCache(`sku:${order.skuId}`);

  const orderId = `order_${Date.now()}_${String(Math.random()).slice(2, 8)}`;
  const orderRecord: OrderRecord = {
    id: orderId,
    skuId: order.skuId,
    quantity: order.quantity,
    source: order.source || MOBILE_SOURCE,
    totalPrice: (sku.price * order.quantity),
    timestamp: new Date().toISOString(),
  };
  orderStore.set(orderId, orderRecord);
  processedRequestIds.add(reqId);
  emitSdkEvent('order.created', order.skuId, { orderId, quantity: order.quantity, totalPrice: orderRecord.totalPrice });
  return { success: true, orderId };
}

// Domain: 仓储层 — 缓存一致性
function domainCheckCacheConsistency(skuId: string): { consistent: boolean; storeValue?: SkuRecord; cacheValue?: any } {
  const storeV = skuStore.get(skuId);
  const cacheV = cacheStore.get(`sku:${skuId}`);
  if (!storeV) return { consistent: false, error: 'sku_not_found' };
  if (!cacheV) return { consistent: false, storeValue: storeV, cacheValue: null, error: 'cache_miss' };
  return {
    consistent: storeV.version === cacheV.version,
    storeValue: storeV,
    cacheValue: cacheV,
  };
}

function domainGetSkuFromStore(skuId: string): SkuRecord | undefined {
  return skuStore.get(skuId) ? { ...skuStore.get(skuId)! } : undefined;
}

// SDK: 事件通知
function sdkGetEvents(skuId?: string, eventType?: string): SdkEventRecord[] {
  return sdkEventStore.filter(e => {
    if (skuId && e.skuId !== skuId) return false;
    if (eventType && e.eventType !== eventType) return false;
    return true;
  });
}

function emitSdkEvent(eventType: string, skuId: string, payload: any) {
  sdkEventStore.push({ eventType, skuId, payload, timestamp: new Date().toISOString() });
}

// 缓存辅助
function invalidateCache(key: string) {
  cacheStore.delete(key);
}

// ========== 测试用例 ==========

describe('链16: SKU生命周期 + 缓存一致性 (Admin→Storefront→Mobile→API→Domain→SDK)', () => {

  before(() => {
    seedStore();
  });

  // --- Phase 1: Admin 创建 + 编辑 SKU ---
  test('[正例] Admin创建全新SKU → 存储成功, 触发SDK事件', () => {
    const r = adminCreateSku({
      name: '新品·全自动冰激凌机',
      category: '餐饮设备',
      price: 49999,
      stock: 30,
    });
    assert.ok(r.success, `创建失败: ${r.error}`);
    assert.ok(r.sku!.id);
    assert.equal(r.sku!.status, 'draft');
    assert.equal(r.sku!.version, 1);

    // SDK 事件触发
    const events = sdkGetEvents(r.sku!.id);
    assert.equal(events.length, 1);
    assert.equal(events[0].eventType, 'sku.created');
  });

  test('[正例] Admin上架SKU → 状态变为published, 触发SDK事件', () => {
    const r = adminPublishSku('sku_pre_01');
    assert.ok(r.success, `上架失败: ${r.error}`);
    assert.equal(r.sku!.status, 'published');

    const events = sdkGetEvents('sku_pre_01', 'sku.published');
    assert.equal(events.length, 1);
  });

  test('[正例] Admin更新SKU价格 → 价格生效, version递增', () => {
    const r = adminUpdateSku('sku_pub_01', { price: 7999 });
    assert.ok(r.success);
    assert.equal(r.sku!.price, 7999);
    assert.equal(r.sku!.version, 4); // 原version 3 → 4

    const events = sdkGetEvents('sku_pub_01', 'sku.updated');
    assert.equal(events.length, 1);
    assert.ok(events[0].payload.changeDesc);
  });

  test('[反例] Admin创建重复SKU → 拒绝', () => {
    const r = adminCreateSku({ name: '重复', category: '测试', price: 100, stock: 10, id: 'sku_pub_01' });
    assert.equal(r.success, false);
    assert.ok(r.error?.includes('duplicate'));
  });

  test('[反例] Admin更新负价格 → 拒绝', () => {
    const r = adminUpdateSku('sku_pub_01', { price: -100 });
    assert.equal(r.success, false);
    assert.equal(r.error, 'negative_price');
  });

  test('[反例] Admin上架已停售SKU → 拒绝', () => {
    const r = adminPublishSku('sku_dis_01');
    assert.equal(r.success, false);
    assert.equal(r.error, 'cannot_publish_discontinued');
  });

  // --- Phase 2: Storefront 展示已上架 SKU ---
  test('[正例] Storefront查询已上架列表 → 包含已发布SKU, 不包含草稿/停售', () => {
    const r = storefrontGetPublishedSkus();
    // 初始已发布: sku_pub_01, sku_pub_02, sku_pre_01(刚上架)
    assert.ok(r.items.length >= 3);
    const ids = r.items.map(s => s.id);
    assert.ok(ids.includes('sku_pub_01'));
    assert.ok(ids.includes('sku_pub_02'));
    assert.ok(ids.includes('sku_pre_01'));
    assert.ok(!ids.includes('sku_dis_01'));
  });

  test('[正例] Storefront查询某个已上架SKU详情 → 缓存命中, 数据与Store一致', () => {
    const r = storefrontGetSkuDetail('sku_pub_01');
    assert.ok(r.success);
    assert.equal(r.sku!.name, '已上架·智能自助售货柜 A1');
    assert.equal(r.sku!.price, 7999); // 已更新

    // 缓存一致性检查
    const cc = domainCheckCacheConsistency('sku_pub_01');
    assert.ok(cc.consistent, `缓存不一致: store=${JSON.stringify(cc.storeValue)}, cache=${JSON.stringify(cc.cacheValue)}`);
  });

  test('[反例] Storefront查询不存在的SKU → 返回not_found', () => {
    const r = storefrontGetSkuDetail('sku_nonexistent');
    assert.equal(r.success, false);
    assert.equal(r.error, 'sku_not_found');
  });

  test('[反例] Storefront查询停售SKU → 返回详情(允许查看历史)', () => {
    const r = storefrontGetSkuDetail('sku_dis_01');
    assert.ok(r.success);
    assert.equal(r.sku!.status, 'discontinued');
    // 缓存应包含停售状态
    assert.ok(cacheStore.has('sku:sku_dis_01'));
  });

  // --- Phase 3: Mobile 下单触发库存扣减 ---
  test('[正例] Mobile下订单库存充足 → 成功, 库存扣减', () => {
    const before = domainGetSkuFromStore('sku_pub_01')!.stock;
    const r = mobilePlaceOrder({ skuId: 'sku_pub_01', quantity: 2, source: MOBILE_SOURCE });
    assert.ok(r.success, `下单失败: ${r.error}`);
    assert.ok(r.orderId);

    const after = domainGetSkuFromStore('sku_pub_01')!.stock;
    assert.equal(after, before - 2);
  });

  test('[反例] Mobile下单库存不足 → 拒绝', () => {
    // 创建一个库存极少的SKU
    const created = adminCreateSku({ name: '极低库存商品', category: '测试', price: 1000, stock: 8 });
    assert.ok(created.success);
    const lowStockId = created.sku!.id;
    adminPublishSku(lowStockId);

    const stock = domainGetSkuFromStore(lowStockId)!.stock;
    assert.equal(stock, 8);

    // 尝试下单 10 件(>库存8)
    const r = mobilePlaceOrder({ skuId: lowStockId, quantity: 10, source: MOBILE_SOURCE });
    assert.equal(r.success, false);
    assert.equal(r.error, 'insufficient_stock');
  });

  test('[反例] Mobile下单草稿SKU → 拒绝', () => {
    // 先创建一个草稿SKU
    const created = adminCreateSku({ name: '尚未上架新品', category: '测试', price: 5000, stock: 100 });
    assert.ok(created.success);
    const draftId = created.sku!.id;
    const r = mobilePlaceOrder({ skuId: draftId, quantity: 1, source: MOBILE_SOURCE });
    assert.equal(r.success, false);
    assert.equal(r.error, 'sku_not_available');
  });

  test('[反例] Mobile下单超过单次限购 → 拒绝', () => {
    const r = mobilePlaceOrder({ skuId: 'sku_pub_01', quantity: 15, source: MOBILE_SOURCE });
    assert.equal(r.success, false);
    assert.equal(r.error, 'quantity_exceeds_limit');
  });

  test('[反例] Mobile下单无效数量 → 拒绝', () => {
    const r = mobilePlaceOrder({ skuId: 'sku_pub_01', quantity: -1, source: MOBILE_SOURCE });
    assert.equal(r.success, false);
    assert.equal(r.error, 'invalid_quantity');
  });

  // --- Phase 4: Admin 编辑后缓存一致性 ---
  test('[正例] Admin编辑SKU → 缓存自动失效, 下次查询命中最新值', () => {
    // 当前缓存存在 sku_pub_01
    const r1 = adminUpdateSku('sku_pub_01', { name: '已更新·智能自助售货柜 A1 Pro' });
    assert.ok(r1.success);
    assert.equal(r1.sku!.name, '已更新·智能自助售货柜 A1 Pro');

    // 缓存已被 invalidate
    const cacheMiss = cacheStore.get(`sku:sku_pub_01`);
    assert.equal(cacheMiss, undefined);

    // 下次查询重建缓存
    const detail = storefrontGetSkuDetail('sku_pub_01');
    assert.ok(detail.success);
    assert.equal(detail.sku!.name, '已更新·智能自助售货柜 A1 Pro');

    // 缓存一致性
    const cc = domainCheckCacheConsistency('sku_pub_01');
    assert.ok(cc.consistent, `编辑后缓存不一致`);
    assert.equal(cc.storeValue!.version, cc.cacheValue!.version);
  });

  test('[反例] Admin编辑停售SKU → 拒绝', () => {
    const r = adminUpdateSku('sku_dis_01', { name: '尝试修改' });
    assert.equal(r.success, false);
    assert.equal(r.error, 'cannot_update_discontinued');
  });

  // --- Phase 5: SDK 事件追溯 ---
  test('[正例] SDK事件按SKU查询 → 完整的生命周期事件链', () => {
    // sku_pre_01 是在 seedStore 中预置的, 通过 adminPublishSku 上架时触发 sku.published
    // 事件仅记录运行时触发, 不包含 seed 前的操作
    const events = sdkGetEvents('sku_pre_01');
    // seed 中无事件; 上架测试触发了 1 条 sku.published
    assert.ok(events.length >= 1, `expected >=1 event for sku_pre_01, got ${events.length}`);
    const types = events.map(e => e.eventType);
    assert.ok(types.includes('sku.published'), 'published事件应存在');
    // 注意: sku_pre_01 在 seed 中创建, 不是通过 adminCreateSku 创建的, 所以无 sku.created 事件
    // 若要测试完整生命周期链, 用 adminCreateSku + adminPublishSku
    
    // 创建一个新SKU并通过adminCreateSku触发创建事件
    const created = adminCreateSku({ name: 'SDK全链路测试', category: '测试', price: 5000, stock: 100 });
    assert.ok(created.success);
    const newSkuId = created.sku!.id;
    const createEvents = sdkGetEvents(newSkuId, 'sku.created');
    assert.equal(createEvents.length, 1, '创建事件应为1次');

    adminPublishSku(newSkuId);
    const pubEvents = sdkGetEvents(newSkuId, 'sku.published');
    assert.equal(pubEvents.length, 1);

    // 完整生命周期: created + published
    const allEvents = sdkGetEvents(newSkuId);
    assert.equal(allEvents.length, 2, '完整生命周期应有2个事件');
  });

  test('[正例] SDK事件按eventType筛选 → 仅返回指定类型', () => {
    const events = sdkGetEvents(undefined, 'order.created');
    assert.ok(events.length >= 1);
    for (const e of events) {
      assert.equal(e.eventType, 'order.created');
      assert.ok(e.payload.orderId);
      assert.ok(e.payload.totalPrice > 0);
    }
  });

  // --- Phase 6: 边界/极端场景 ---
  test('[边界] 连续多次下单同一SKU → 库存精确递减', () => {
    // 创建一个新SKU用于精确测试, 不受前序测试影响
    // 确保库存不足测试创建的SKU不影响本测试
    const lowStockSkus = Array.from(skuStore.values()).filter(s => s.stock === 8 && s.name === '极低库存商品');
    assert.equal(lowStockSkus.length, 1, '极低库存商品应只有1个');
    
    const created = adminCreateSku({ name: '递减测试专用商品', category: '测试', price: 1000, stock: 100 });
    assert.ok(created.success);
    const testSkuId = created.sku!.id;
    adminPublishSku(testSkuId);

    const initialStock = domainGetSkuFromStore(testSkuId)!.stock;
    assert.equal(initialStock, 100, `初始库存应为100, 实际${initialStock}`);
    const batchOrders = [
      { skuId: testSkuId, quantity: 3, source: MOBILE_SOURCE },
      { skuId: testSkuId, quantity: 5, source: MOBILE_SOURCE },
      { skuId: testSkuId, quantity: 2, source: MOBILE_SOURCE },
    ];
    let successCount = 0;
    for (const o of batchOrders) {
      const r = mobilePlaceOrder(o);
      if (r.success) successCount++;
    }
    assert.equal(successCount, 3);
    const finalStock = domainGetSkuFromStore(testSkuId)!.stock;
    assert.equal(finalStock, initialStock - 3 - 5 - 2);
  });

  test('[边界] Admin修改价格 → Storefront侧及时更新 → Mobile下单使用新价格', () => {
    // 创建一个新SKU确保不受前序测试干扰
    const created = adminCreateSku({ name: '价格测试专用商品', category: '测试', price: 15999, stock: 500 });
    assert.ok(created.success);
    const testSkuId = created.sku!.id;
    adminPublishSku(testSkuId);

    // 通过 Admin 修改价格
    adminUpdateSku(testSkuId, { price: 14999 });

    // Storefront 获取最新详情
    const sfDetail = storefrontGetSkuDetail(testSkuId);
    assert.equal(sfDetail.sku!.price, 14999);

    // Mobile 下单使用新价格
    const order = mobilePlaceOrder({ skuId: testSkuId, quantity: 1, source: MOBILE_SOURCE });
    assert.ok(order.success, `下单失败: ${order.error}`);
    assert.ok(order.orderId);
    const orderRec = orderStore.get(order.orderId!)!;
    assert.ok(orderRec, '订单记录应存在');
    assert.equal(orderRec.totalPrice, 14999 * 1);
  });

  test('[边界] 批量Admin操作 → SDK事件精确记录', () => {
    const sku1 = adminCreateSku({ name: '批量商品A', category: '快消', price: 1000, stock: 500 });
    const sku2 = adminCreateSku({ name: '批量商品B', category: '快消', price: 2000, stock: 300 });
    assert.ok(sku1.success);
    assert.ok(sku2.success);

    adminPublishSku(sku1.sku!.id);
    adminPublishSku(sku2.sku!.id);

    const createdEvents = sdkGetEvents(undefined, 'sku.created');
    const publishedEvents = sdkGetEvents(undefined, 'sku.published');
    // 新创建的2个sku触发
    assert.ok(createdEvents.filter(e => e.skuId === sku1.sku!.id).length === 1);
    assert.ok(createdEvents.filter(e => e.skuId === sku2.sku!.id).length === 1);
    assert.ok(publishedEvents.filter(e => e.skuId === sku1.sku!.id).length === 1);
    assert.ok(publishedEvents.filter(e => e.skuId === sku2.sku!.id).length === 1);
  });

  test('[边界] Admin更新库存 → Storefront缓存自动失效 → 下次查询已更新', () => {
    const sku = adminCreateSku({ name: '库存测试品', category: '测试', price: 999, stock: 500 });
    assert.ok(sku.success);
    const skuId = sku.sku!.id;
    adminPublishSku(skuId);

    // Storefront 触发缓存构建
    storefrontGetSkuDetail(skuId);
    assert.ok(cacheStore.has(`sku:${skuId}`));

    // Admin更新库存
    adminUpdateSku(skuId, { stock: 300 });
    // 缓存已失效
    assert.equal(cacheStore.has(`sku:${skuId}`), false);

    // Storefront 重新查询
    const after = storefrontGetSkuDetail(skuId);
    assert.equal(after.sku!.stock, 300);
  });
});
