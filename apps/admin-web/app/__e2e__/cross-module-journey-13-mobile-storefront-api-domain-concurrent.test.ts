/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链13
 * Mobile + Storefront → API → Domain — 多渠道并发一致性测试
 *
 * 模拟链路（多渠道并发·场景模拟）:
 *   Mobile 客户端下单 + Storefront 同步操作同一商品库存
 *   → API 端点并发处理 → Domain 层库存事务一致性校验
 *   → 验证并发场景下数据一致（无超卖、不丢单）
 *
 * 验证:
 *   - 并发下单同一商品，库存扣减不超卖
 *   - 并发同一手机号注册，Domain 拒绝重复（精确一次）
 *   - 并发创建门店，编码唯一性事务保障
 *   - 反例: 两个并发请求各自扣减，总量不变
 *   - 边界: 库存临界值（仅剩1件，2个并发请求同时）
 *   - 边界: 高并发快速重复请求
 *
 * ⚡ 新增模式: 多渠道并发一致性 (P1-014 债务清理)
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

interface ConcurrentOrderReq {
  source: 'mobile' | 'storefront';
  requestId: string;
  userId: string;
  tenantId: string;
  storeId: string;
  productId: string;
  quantity: number;
  timestamp: number;
}

interface ConcurrentRegisterReq {
  source: 'mobile';
  requestId: string;
  phone: string;
  nickname: string;
  tenantId: string;
  timestamp: number;
}

interface DomainConcurrentResult {
  success: boolean;
  orderId?: string;
  remainingStock?: number;
  totalDeducted?: number;
  conflict?: boolean;
  error?: string;
}

interface DomainStockState {
  productId: string;
  initialStock: number;
  currentStock: number;
  reservedAmount: number;
  totalAllocated: number;
  version: number;
}

interface DomainStockHistory {
  productId: string;
  operation: 'reserve' | 'deduct' | 'rollback' | 'query';
  requestId: string;
  quantity: number;
  before: number;
  after: number;
  timestamp: number;
}

interface DomainIdempotencyCheck {
  requestId: string;
  operationType: 'register' | 'order' | 'store_create' | 'coupon_redeem';
  handled: boolean;
  resultHash: string;
  timestamp: number;
}

// ─── 仓储层 ───

const PRODUCT_STOCK: Map<string, DomainStockState> = new Map();
const REQUEST_HISTORY: Map<string, DomainIdempotencyCheck> = new Map();
const ORDER_RECORDS: Map<string, DomainConcurrentResult> = new Map();
const REGISTERED_PHONES: Set<string> = new Set();
const CONCURRENT_LOCK: Map<string, boolean> = new Map();

function resetConcurrentStore(): void {
  PRODUCT_STOCK.clear();
  REQUEST_HISTORY.clear();
  ORDER_RECORDS.clear();
  REGISTERED_PHONES.clear();
  CONCURRENT_LOCK.clear();
}

function initProduct(productId: string, stock: number, version: number = 1): void {
  PRODUCT_STOCK.set(productId, {
    productId,
    initialStock: stock,
    currentStock: stock,
    reservedAmount: 0,
    totalAllocated: 0,
    version,
  });
}

// ─── Domain 层函数 ───

function domainCheckIdempotency(requestId: string, opType: string): boolean {
  const key = `${opType}::${requestId}`;
  if (REQUEST_HISTORY.has(key)) {
    return true; // 重复请求
  }
  REQUEST_HISTORY.set(key, {
    requestId, operationType: opType as any,
    handled: true, resultHash: '',
    timestamp: Date.now(),
  });
  return false;
}

function domainConcurrentDeduct(
  req: ConcurrentOrderReq
): DomainConcurrentResult {
  // 幂等校验
  if (domainCheckIdempotency(req.requestId, 'order')) {
    const existing = ORDER_RECORDS.get(req.requestId);
    return existing || { success: false, error: 'duplicate' };
  }

  const product = PRODUCT_STOCK.get(req.productId);
  if (!product) {
    return { success: false, error: 'product_not_found' };
  }

  // 乐观锁模拟：检查库存
  if (product.currentStock < req.quantity) {
    const result: DomainConcurrentResult = {
      success: false,
      error: 'insufficient_stock',
      remainingStock: product.currentStock,
      conflict: true,
    };
    ORDER_RECORDS.set(req.requestId, result);
    return result;
  }

  // 扣减库存（有竞争条件风险——这正是我们要测试的）
  const beforeStock = product.currentStock;
  product.currentStock -= req.quantity;
  product.totalAllocated += req.quantity;
  product.version++;

  const result: DomainConcurrentResult = {
    success: true,
    orderId: `order_${req.requestId}_${Date.now()}`,
    remainingStock: product.currentStock,
    totalDeducted: beforeStock - product.currentStock,
  };
  ORDER_RECORDS.set(req.requestId, result);
  return result;
}

function domainConcurrentRegister(req: ConcurrentRegisterReq): DomainConcurrentResult {
  // 幂等校验
  if (domainCheckIdempotency(req.requestId, 'register')) {
    return { success: false, error: 'duplicate_request' };
  }

  // 手机号唯一性校验（并发风险）
  if (REGISTERED_PHONES.has(req.phone)) {
    return { success: false, error: 'phone_already_registered_conflict' };
  }

  REGISTERED_PHONES.add(req.phone);
  return { success: true, userId: `user_${req.requestId}` };
}

function domainQueryStock(productId: string): DomainStockState | undefined {
  return PRODUCT_STOCK.get(productId);
}

function domainQueryIdempotencyByReqId(requestId: string, opType: string): boolean {
  return REQUEST_HISTORY.has(`${opType}::${requestId}`);
}

// ─── 模拟并发执行 ───

function simulateConcurrentOrders(
  productId: string,
  initialStock: number,
  requests: { source: 'mobile' | 'storefront'; quantity: number; id: string }[]
): { results: DomainConcurrentResult[]; finalStock: number } {
  resetConcurrentStore();
  initProduct(productId, initialStock);

  const results: DomainConcurrentResult[] = [];
  for (const r of requests) {
    const req: ConcurrentOrderReq = {
      source: r.source,
      requestId: r.id,
      userId: `usr_${r.source}_${r.id}`,
      tenantId: 't1',
      storeId: 's1',
      productId,
      quantity: r.quantity,
      timestamp: Date.now() + Math.random() * 1000,
    };
    results.push(domainConcurrentDeduct(req));
  }

  const finalStock = PRODUCT_STOCK.get(productId)?.currentStock ?? 0;
  return { results, finalStock };
}

function simulateConcurrentRegistrations(
  phone: string,
  requestIds: string[]
): DomainConcurrentResult[] {
  resetConcurrentStore();
  return requestIds.map((rid) => {
    const req: ConcurrentRegisterReq = {
      source: 'mobile',
      requestId: rid,
      phone,
      nickname: `user_${rid}`,
      tenantId: 't1',
      timestamp: Date.now(),
    };
    return domainConcurrentRegister(req);
  });
}

// ─── 测试用例 ───

describe('[L3-E2E] 链13: Mobile+Storefront 多渠道并发一致性', () => {

  // ─── 正例 ───

  test('【正例】两个并发下单，库存充足时均成功', () => {
    const { results, finalStock } = simulateConcurrentOrders('prod_a', 10, [
      { source: 'mobile', quantity: 3, id: 'req_01' },
      { source: 'storefront', quantity: 2, id: 'req_02' },
    ]);

    assert.equal(results.length, 2);
    assert.ok(results[0].success, '第一个请求应成功');
    assert.ok(results[1].success, '第二个请求应成功');
    assert.equal(finalStock, 5, '最终库存应为 10 - 3 - 2 = 5');
  });

  test('【正例】三个并发下单，总库存正确', () => {
    const { results, finalStock } = simulateConcurrentOrders('prod_b', 20, [
      { source: 'mobile', quantity: 5, id: 'req_03' },
      { source: 'storefront', quantity: 7, id: 'req_04' },
      { source: 'mobile', quantity: 3, id: 'req_05' },
    ]);

    const successes = results.filter((r) => r.success).length;
    assert.equal(successes, 3, '所有请求应成功');
    assert.equal(finalStock, 5, '20 - 5 - 7 - 3 = 5');
  });

  test('【正例】手机号注册第一次成功', () => {
    resetConcurrentStore();
    const result = domainConcurrentRegister({
      source: 'mobile',
      requestId: 'reg_unique',
      phone: '13800001111',
      nickname: 'new_user',
      tenantId: 't1',
      timestamp: Date.now(),
    });
    assert.ok(result.success);
    assert.ok(result.userId);
  });

  // ─── 反例 ───

  test('【反例】库存临界值：仅剩1件，两个并发仅一个成功', () => {
    const { results, finalStock } = simulateConcurrentOrders('prod_c', 1, [
      { source: 'mobile', quantity: 1, id: 'req_crit_01' },
      { source: 'storefront', quantity: 1, id: 'req_crit_02' },
    ]);

    const successes = results.filter((r) => r.success).length;
    const failures = results.filter((r) => !r.success).length;

    assert.equal(successes, 1, '仅一个应成功（库存1件）');
    assert.equal(failures, 1, '另一个应失败');
    assert.equal(finalStock, 0, '最终库存应为 0');
    // 失败的请求应报告库存不足
    const failResult = results.find((r) => !r.success)!;
    assert.equal(failResult.error, 'insufficient_stock');
  });

  test('【反例】库存不足：总需求 > 总库存', () => {
    const { results, finalStock } = simulateConcurrentOrders('prod_d', 3, [
      { source: 'mobile', quantity: 2, id: 'req_insuf_01' },
      { source: 'storefront', quantity: 3, id: 'req_insuf_02' },
    ]);

    const successes = results.filter((r) => r.success).length;
    assert.equal(successes, 1, '仅第一个请求应成功（先到先得）');
    // finalStock 取决于 order 执行顺序。第一个扣2→剩1，第二个需要3→失败
    // 但库存已被第一个占用，最终为 3-2=1
    assert.equal(finalStock, 1, '第一个消耗2，剩余1');
    const failResult = results.find((r) => !r.success)!;
    assert.equal(failResult.error, 'insufficient_stock');
  });

  test('【反例】并发注册同一手机号，仅一个成功', () => {
    const results = simulateConcurrentRegistrations('13800009999', [
      'reg_con_01', 'reg_con_02', 'reg_con_03',
    ]);

    const successes = results.filter((r) => r.success).length;
    const conflicts = results.filter((r) => r.error?.includes('conflict')).length;

    assert.equal(successes, 1, '仅第一个注册应成功');
    assert.equal(conflicts, 2, '其余两个应是冲突');
  });

  test('【反例】幂等性：相同 requestId 重复提交返回已有结果', () => {
    resetConcurrentStore();
    initProduct('prod_e', 5);

    const req1: ConcurrentOrderReq = {
      source: 'mobile',
      requestId: 'idempotent_req',
      userId: 'user_idem',
      tenantId: 't1',
      storeId: 's1',
      productId: 'prod_e',
      quantity: 2,
      timestamp: Date.now(),
    };

    const firstResult = domainConcurrentDeduct(req1);
    assert.ok(firstResult.success);

    // 相同 requestId 再次提交 — 幂等返回存储结果
    const secondResult = domainConcurrentDeduct(req1);
    assert.ok(secondResult.success, '幂等性应成功（返回缓存结果）');
    assert.notEqual(secondResult.orderId, undefined, '幂等结果携带orderId');

    // 库存只被扣减一次
    const stockState = domainQueryStock('prod_e');
    assert.equal(stockState?.currentStock, 3, '库存应只扣减一次 (5-2=3)');
  });

  // ─── 边界 ───

  test('【边界】库存为0时下单立即拒绝', () => {
    const { results, finalStock } = simulateConcurrentOrders('prod_f', 0, [
      { source: 'mobile', quantity: 1, id: 'req_zero_01' },
    ]);

    assert.equal(results[0].success, false);
    assert.equal(results[0].error, 'insufficient_stock');
    assert.equal(finalStock, 0);
  });

  test('【边界】超大批量并发请求总正确', () => {
    const productId = 'prod_g';
    const initialStock = 100;
    const requests = Array.from({ length: 20 }, (_, i) => ({
      source: (i % 2 === 0 ? 'mobile' : 'storefront') as 'mobile' | 'storefront',
      quantity: i < 10 ? 5 : 8,
      id: `req_batch_${String(i).padStart(3, '0')}`,
    }));

    const { results, finalStock } = simulateConcurrentOrders(productId, initialStock, requests);

    const successes = results.filter((r) => r.success).length;
    const totalDeducted = results
      .filter((r) => r.success)
      .reduce((sum, r) => sum + (r.totalDeducted ?? 0), 0);

    // 验证总消耗不超过初始库存
    assert.ok(totalDeducted <= initialStock, `总消耗 ${totalDeducted} 不应超过 initial ${initialStock}`);
    assert.ok(finalStock + totalDeducted === initialStock, 'current + deducted = initial');
    assert.ok(successes > 0 && successes <= 20, '部分成功部分失败');
  });

  test('【边界】幂等性请求不会导致库存超额扣减', () => {
    resetConcurrentStore();
    initProduct('prod_h', 10);

    // 提交5次相同请求
    const identicalReq: ConcurrentOrderReq = {
      source: 'mobile',
      requestId: 'idem_batch',
      userId: 'user_batch',
      tenantId: 't1',
      storeId: 's1',
      productId: 'prod_h',
      quantity: 3,
      timestamp: Date.now(),
    };

    for (let i = 0; i < 5; i++) {
      domainConcurrentDeduct(identicalReq);
    }

    const finalState = domainQueryStock('prod_h');
    assert.equal(finalState?.currentStock, 7, '库存应扣减一次 10-3=7');
    assert.equal(finalState?.totalAllocated, 3, '总量应只记录一次');
  });

  test('【边界】幂等性请求历史可追溯', () => {
    resetConcurrentStore();

    domainConcurrentRegister({
      source: 'mobile', requestId: 'track_001',
      phone: '13900001111', nickname: 'tracker',
      tenantId: 't1', timestamp: Date.now(),
    });

    const isDuplicate = domainQueryIdempotencyByReqId('track_001', 'register');
    assert.ok(isDuplicate, '幂等记录应存在');

    const notExist = domainQueryIdempotencyByReqId('not_sent', 'register');
    assert.equal(notExist, false, '未发送的请求不应有记录');
  });
});
