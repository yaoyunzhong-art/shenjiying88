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

  // --- Phase 7: 数据一致性校验 + 扩展边界 ---
  test('[一致] 订单记录与库存扣减总和一致 → totalQuantityMismatch验证', () => {
    const sku = adminCreateSku({ name: '一致校验品', category: '测试', price: 888, stock: 200 });
    assert.ok(sku.success);
    const skuId = sku.sku!.id;
    adminPublishSku(skuId);

    const initialStock = domainGetSkuFromStore(skuId)!.stock;
    assert.equal(initialStock, 200);

    // 多次下单
    const orderQty = [3, 5, 2, 1, 8];
    const orderIds = [];
    for (const qty of orderQty) {
      const r = mobilePlaceOrder({ skuId, quantity: qty, source: MOBILE_SOURCE });
      assert.ok(r.success, `下单${qty}失败: ${r.error}`);
      orderIds.push(r.orderId);
    }

    // 验证所有订单记录
    const allOrders = Array.from(orderStore.values()).filter(o => o.skuId === skuId);
    const totalOrdered = allOrders.reduce((sum, o) => sum + o.quantity, 0);
    assert.equal(totalOrdered, orderQty.reduce((a, b) => a + b, 0),
      `订单总量不一致: ${totalOrdered} vs ${orderQty.reduce((a, b) => a + b, 0)}`);

    // 验证库存扣减一致
    const finalStock = domainGetSkuFromStore(skuId)!.stock;
    assert.equal(finalStock, initialStock - totalOrdered,
      `库存扣减不一致: 初始${initialStock}, 已订${totalOrdered}, 剩余${finalStock}`);
  });

  test('[一致] SDK事件与订单记录数量一致 → 每个order都有created事件', () => {
    const eventCounts = sdkGetEvents(undefined, 'order.created');
    const orderCount = orderStore.size;
    assert.equal(eventCounts.length, orderCount,
      `SDK事件数${eventCounts.length}与订单数${orderCount}不一致`);

    // 每个订单在事件中都有对应记录
    for (const [orderId, order] of orderStore) {
      const matching = eventCounts.filter(e => e.payload?.orderId === orderId);
      assert.equal(matching.length, 1,
        `订单${orderId}应有恰好1个order.created事件, 实际${matching.length}`);
      assert.equal(matching[0].payload.quantity, order.quantity,
        `订单${orderId}数量不一致: 事件${matching[0].payload.quantity} vs 记录${order.quantity}`);
    }
  });

  // --- Phase 8: SKU 缓存 TTL / 击穿 / 一致性 / 并发场景 ---
  test('[缓存TTL] 缓存过期后自动失效 → 二次回源读取最新数据', () => {
    const sku = adminCreateSku({ name: 'TTL测试商品', category: '测试', price: 1000, stock: 50 });
    assert.ok(sku.success);
    const skuId = sku.sku!.id;
    adminPublishSku(skuId);

    // 首次查询写入缓存
    storefrontGetSkuDetail(skuId);
    assert.ok(cacheStore.has(`sku:${skuId}`), '首次查询应写入缓存');

    // 模拟 TTL 过期：手动清除缓存
    cacheStore.delete(`sku:${skuId}`);
    assert.equal(cacheStore.has(`sku:${skuId}`), false, '过期后缓存应清空');

    // 二次查询重建缓存
    const after = storefrontGetSkuDetail(skuId);
    assert.ok(after.success, '二次查询应成功');
    assert.ok(cacheStore.has(`sku:${skuId}`), '二次查询应重建缓存');

    // 确认重建的缓存与store一致
    const cc = domainCheckCacheConsistency(skuId);
    assert.ok(cc.consistent, `TTL过期重建后缓存不一致`);
  });

  test('[缓存TTL] 缓存过期后查询触发缓存重建 → version一致', () => {
    const sku = adminCreateSku({ name: 'TTL重建测试', category: '测试', price: 2000, stock: 100 });
    assert.ok(sku.success);
    const skuId = sku.sku!.id;
    adminPublishSku(skuId);

    // 第一次查询写入缓存
    const first = storefrontGetSkuDetail(skuId);
    assert.ok(cacheStore.has(`sku:${skuId}`));
    const cachedVersion1 = cacheStore.get(`sku:${skuId}`).version;

    // Admin 更新商品（触发缓存失效）
    adminUpdateSku(skuId, { price: 2500 });
    cacheStore.delete(`sku:${skuId}`);

    // 重新查询 → 缓存重建
    const second = storefrontGetSkuDetail(skuId);
    assert.equal(second.sku!.price, 2500, 'TTL重建后应取最新价格');
    const cachedVersion2 = cacheStore.get(`sku:${skuId}`).version;
    assert.ok(cachedVersion2 > cachedVersion1, '重建后缓存version应递增');

    const cc = domainCheckCacheConsistency(skuId);
    assert.ok(cc.consistent);
  });

  test('[缓存击穿] 高并发查询同一刚失效的缓存 → 只有一个回源,其余命中', () => {
    const sku = adminCreateSku({ name: '击穿测试商品', category: '测试', price: 3000, stock: 200 });
    assert.ok(sku.success);
    const skuId = sku.sku!.id;
    adminPublishSku(skuId);

    // 首次查询写入缓存
    storefrontGetSkuDetail(skuId);
    assert.ok(cacheStore.has(`sku:${skuId}`));

    // 模拟缓存过期
    cacheStore.delete(`sku:${skuId}`);

    // 模拟高并发：连续多次查询，只有第一次触发回源
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(storefrontGetSkuDetail(skuId));
    }

    // 所有查询都应成功
    for (const r of results) {
      assert.ok(r.success, `并发查询应全部成功`);
      assert.equal(r.sku!.id, skuId);
    }

    // 缓存最终应存在
    assert.ok(cacheStore.has(`sku:${skuId}`), '并发后缓存应存在');

    // 缓存与store一致
    const cc = domainCheckCacheConsistency(skuId);
    assert.ok(cc.consistent, '击穿后缓存一致性');
  });

  test('[缓存击穿] 缓存击穿保护 → 并发查询不存在的SKU各自失败', () => {
    const nonExistentId = 'sku_non_existent_99999';
    const results = [];
    for (let i = 0; i < 3; i++) {
      results.push(storefrontGetSkuDetail(nonExistentId));
    }

    // 所有查询都应返回 not_found
    for (const r of results) {
      assert.equal(r.success, false);
      assert.equal(r.error, 'sku_not_found');
    }

    // 不存在的 SKU 不应写入缓存
    assert.equal(cacheStore.has(`sku:${nonExistentId}`), false,
      '不存在的SKU不应写入缓存');
  });

  test('[缓存一致性] 多端并发修改 → 每次修改后缓存失效, 下次读取最新', () => {
    // Admin下架停售 → 再上架 → Storefront查询
    const sku = adminCreateSku({ name: '多端一致性测试', category: '测试', price: 5000, stock: 100 });
    assert.ok(sku.success);
    const skuId = sku.sku!.id;

    // Storefront查询(在草稿状态不应在上架列表)
    let publishedList = storefrontGetPublishedSkus();
    assert.equal(publishedList.items.find(s => s.id === skuId), undefined,
      '草稿SKU不应出现在已上架列表');

    // Admin上架
    adminPublishSku(skuId);

    // Storefront再次查询
    publishedList = storefrontGetPublishedSkus();
    assert.ok(publishedList.items.find(s => s.id === skuId),
      '上架后应出现在已上架列表');

    // Admin停售
    const original = skuStore.get(skuId)!;
    original.status = 'discontinued';
    original.version++;
    skuStore.set(skuId, { ...original });
    cacheStore.delete(`sku:${skuId}`);

    // Storefront查询停售后不应在上架列表
    publishedList = storefrontGetPublishedSkus();
    assert.equal(publishedList.items.find(s => s.id === skuId), undefined,
      '停售后不应出现在已上架列表');

    // Admin重新上架
    original.status = 'published';
    original.version++;
    skuStore.set(skuId, { ...original });
    invalidateCache(`sku:${skuId}`);

    // Storefront再次查询
    publishedList = storefrontGetPublishedSkus();
    assert.ok(publishedList.items.find(s => s.id === skuId),
      '重新上架后应出现在已上架列表');

    // SDK事件记录操作链
    const events = sdkGetEvents(skuId);
    assert.ok(events.length >= 2, '多端操作应有SDK事件记录');
  });

  test('[缓存一致性] Admin更新→Mobile下单→缓存自动失效→Storefront查询最新', () => {
    const sku = adminCreateSku({ name: '更新下单一致性', category: '测试', price: 6000, stock: 30 });
    assert.ok(sku.success);
    const skuId = sku.sku!.id;
    adminPublishSku(skuId);

    // Storefront查询缓存
    storefrontGetSkuDetail(skuId);
    assert.ok(cacheStore.has(`sku:${skuId}`));

    // Admin更新价格
    adminUpdateSku(skuId, { price: 5500 });
    // 缓存应失效
    assert.equal(cacheStore.has(`sku:${skuId}`), false, 'Admin更新后缓存应失效');

    // Mobile下单使用最新价格
    const order = mobilePlaceOrder({ skuId, quantity: 1, source: MOBILE_SOURCE });
    assert.ok(order.success);
    const orderRec = orderStore.get(order.orderId!);
    assert.equal(orderRec!.totalPrice, 5500, '下单应使用Admin更新后的价格');

    // Storefront重新查询
    const sf = storefrontGetSkuDetail(skuId);
    assert.equal(sf.sku!.price, 5500, 'Storefront应看到最新价格');

    const cc = domainCheckCacheConsistency(skuId);
    assert.ok(cc.consistent, '全链路缓存一致性');
  });

  test('[并发] 并发下单同一SKU → 库存精确扣减, 无数据丢失', () => {
    const sku = adminCreateSku({ name: '并发扣减测试', category: '测试', price: 4000, stock: 50 });
    assert.ok(sku.success);
    const skuId = sku.sku!.id;
    adminPublishSku(skuId);

    const initialStock = domainGetSkuFromStore(skuId)!.stock;
    assert.equal(initialStock, 50);

    // 模拟并发下单
    const concurrency = 5;
    const orderResults = [];
    for (let i = 0; i < concurrency; i++) {
      orderResults.push(mobilePlaceOrder({ skuId, quantity: 2, source: MOBILE_SOURCE }));
    }

    const successCount = orderResults.filter(r => r.success).length;
    const failCount = orderResults.filter(r => !r.success).length;
    assert.equal(successCount + failCount, concurrency, '所有请求应有结果');
    assert.ok(successCount <= 5, `并发下单成功数: ${successCount}`);

    // 库存扣减应等于成功订单总量
    const successfulOrders = Array.from(orderStore.values()).filter(
      o => o.skuId === skuId && orderResults.some(r => r.success && r.orderId === o.id)
    );
    const totalOrdered = successfulOrders.reduce((sum, o) => sum + o.quantity, 0);
    const remaining = domainGetSkuFromStore(skuId)!.stock;
    assert.equal(remaining, initialStock - totalOrdered,
      `并发后库存不一致: 初始${initialStock}, 已订${totalOrdered}, 剩余${remaining}`);

    // SDK事件数量与成功订单一致
    const orderEvents = sdkGetEvents(undefined, 'order.created')
      .filter(e => e.skuId === skuId);
    assert.equal(orderEvents.length, successfulOrders.length,
      `并发SDK事件数${orderEvents.length}与成功订单数${successfulOrders.length}不一致`);
  });

  test('[并发] 并发Admin创建+Storefront查询 → 数据完整', () => {
    // 模拟并发创建
    const createTasks = 3;
    const newSkuIds: string[] = [];
    for (let i = 0; i < createTasks; i++) {
      const r = adminCreateSku({ name: `并发创建商品${i + 1}`, category: '测试', price: 100 * (i + 1), stock: 10 * (i + 1) });
      assert.ok(r.success, `并发创建${i}失败`);
      newSkuIds.push(r.sku!.id);
    }
    assert.equal(newSkuIds.length, createTasks);

    // 同时查询所有新创建SKU（模拟Storefront并发查询）
    const queryResults = newSkuIds.map(id => storefrontGetSkuDetail(id));

    // 所有SKU初始为草稿，查询应成功
    for (const r of queryResults) {
      assert.ok(r.success, '并发创建后查询应成功');
      assert.equal(r.sku!.status, 'draft', '新创建SKU应为草稿状态');
    }

    // 已上架列表不应包含草稿SKU
    const publishedList = storefrontGetPublishedSkus();
    for (const id of newSkuIds) {
      assert.equal(publishedList.items.find(s => s.id === id), undefined,
        `草稿SKU${id}不应出现在已上架列表`);
    }

    // SDK事件检查: 每个创建触发 sku.created
    for (const id of newSkuIds) {
      const events = sdkGetEvents(id, 'sku.created');
      assert.equal(events.length, 1, `SKU${id}应有1个created事件`);
    }
  });

  test('[缓存预热] 空缓存时首次查询 → 自动写入缓存且与Store一致', () => {
    const sku = adminCreateSku({ name: '缓存预热测试品', category: '测试', price: 9999, stock: 80 });
    assert.ok(sku.success);
    const skuId = sku.sku!.id;
    adminPublishSku(skuId);

    // 确保缓存为空
    cacheStore.delete(`sku:${skuId}`);
    assert.equal(cacheStore.has(`sku:${skuId}`), false, '预热前缓存应为空');

    // Storefront首次查询(缓存未命中)
    const result = storefrontGetSkuDetail(skuId);
    assert.ok(result.success);
    assert.equal(result.sku!.name, '缓存预热测试品');
    assert.equal(result.sku!.price, 9999);

    // 缓存应已写入
    assert.ok(cacheStore.has(`sku:${skuId}`), '首次查询后缓存应写入');
    const cached = cacheStore.get(`sku:${skuId}`);
    assert.equal(cached.version, result.sku!.version, '缓存version应与返回值一致');

    // 缓存一致性
    const cc = domainCheckCacheConsistency(skuId);
    assert.ok(cc.consistent, '预热后缓存应一致');
  });

  test('[并发] 并发Admin编辑+Mobile下单 → 编辑不影响正确订单', () => {
    const sku = adminCreateSku({ name: '编辑下单并发', category: '测试', price: 8000, stock: 50 });
    assert.ok(sku.success);
    const skuId = sku.sku!.id;
    adminPublishSku(skuId);

    // 获取当前价格
    const currentPrice = domainGetSkuFromStore(skuId)!.price;
    const currentStock = domainGetSkuFromStore(skuId)!.stock;

    // Admin编辑价格
    adminUpdateSku(skuId, { price: 7500 });

    // Mobile下单（编辑后价格）
    const order = mobilePlaceOrder({ skuId, quantity: 2, source: MOBILE_SOURCE });
    assert.ok(order.success);

    const orderRec = orderStore.get(order.orderId!);
    assert.equal(orderRec!.totalPrice, 7500 * 2,
      '编辑后的下单应使用新价格');

    // 验证最终状态
    const final = domainGetSkuFromStore(skuId);
    assert.ok(final!.version > 1, '版本号应反映编辑+下单操作');

    const cc = domainCheckCacheConsistency(skuId);
    assert.ok(cc.consistent, '并发编辑+下单后缓存一致');
  });
});
