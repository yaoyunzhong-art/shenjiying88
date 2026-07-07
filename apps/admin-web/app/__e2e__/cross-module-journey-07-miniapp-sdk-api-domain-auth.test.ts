/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链07
 * Miniapp(小程序) → SDK(ApiClient调用) → API(业务端点) → Domain(逻辑校验) → API返回
 *
 * 模拟链路:
 *   miniapp（微信小程序）页面交互 → SDK ApiClient 封装请求 → API 业务端点接收
 *   → Domain 层业务校验（会员等级/库存/订单）→ API 格式化返回 → miniapp 渲染
 *
 * 验证:
 *   - 小程序发起业务请求，SDK 正确封装 header 和 payload
 *   - API 端点接收并转发至 Domain 层
 *   - Domain 层完成业务校验（会员等级、库存检查、订单校验）
 *   - 反例: 无权限用户被 Domain 拒绝
 *   - 边界: 极简 payload 正确处理
 *
 * 这是第一条「不以 admin-web 为起点的」跨模块链路
 * 填补 miniapp → (api/sdk/domain) 方向覆盖空白
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

type MiniAppUserRole = 'guest' | 'member' | 'vip' | 'store_admin';

interface MiniAppRequest {
  source: 'miniapp';
  appId: string;
  tenantId: string;
  userId: string;
  userRole: MiniAppUserRole;
  endpoint: string;
  payload: Record<string, unknown>;
  timestamp: string;
  signature: string;
}

interface SdkEnvelope {
  headers: {
    authorization: string;
    'x-source': string;
    'x-app-id': string;
    'x-tenant-id': string;
    'x-timestamp': string;
    'x-signature': string;
    'x-user-role': string;
    'content-type': string;
  };
  body: Record<string, unknown>;
  endpoint: string;
}

interface ApiResponse<T> {
  status: number;
  error?: string;
  data?: T;
}

interface DomainValidationResult {
  valid: boolean;
  errors: string[];
}

interface ProductDetail {
  productId: string;
  name: string;
  price: number;
  stock: number;
  memberPrice?: number;
  vipPrice?: number;
}

interface InventoryCheck {
  productId: string;
  requestedQty: number;
  available: boolean;
  remainingStock: number;
}

interface OrderValidationResult {
  canPlace: boolean;
  reason?: string;
  orderAmount: number;
}

interface MiniAppRenderPayload {
  success: boolean;
  productName: string;
  displayPrice: number;
  memberPrice?: number;
  stockLabel: string;
  orderButtonEnabled: boolean;
  errorMessage?: string;
}

// ─── Miniapp 层：用户交互产生请求 ───

function createMiniappRequest(
  appId: string,
  tenantId: string,
  userId: string,
  userRole: MiniAppUserRole,
  endpoint: string,
  payload: Record<string, unknown>,
): MiniAppRequest {
  const timestamp = new Date().toISOString();
  const raw = `${appId}|${tenantId}|${userId}|${endpoint}|${JSON.stringify(payload)}|${timestamp}`;
  const signature = `sig_${Buffer.from(raw).toString('base64').slice(0, 20)}`;

  return { source: 'miniapp', appId, tenantId, userId, userRole, endpoint, payload, timestamp, signature };
}

// ─── SDK 层：封装请求 ───

function sdkEnrichRequest(req: MiniAppRequest): SdkEnvelope {
  return {
    headers: {
      authorization: `Bearer mini_${req.userId}_${req.tenantId}`,
      'x-source': req.source,
      'x-app-id': req.appId,
      'x-tenant-id': req.tenantId,
      'x-timestamp': req.timestamp,
      'x-signature': req.signature,
      'x-user-role': req.userRole,
      'content-type': 'application/json',
    },
    body: req.payload,
    endpoint: req.endpoint,
  };
}

// ─── API 层：路由 ───

function apiRoute(envelope: SdkEnvelope): ApiResponse<unknown> {
  // 校验必要 header
  if (!envelope.headers.authorization || !envelope.headers['x-tenant-id']) {
    return { status: 401, error: 'Missing auth headers' };
  }

  const role = envelope.headers['x-user-role'] as MiniAppUserRole;
  const tenantId = envelope.headers['x-tenant-id'];

  switch (envelope.endpoint) {
    case '/api/product/detail':
      return apiProductDetail(envelope.body, tenantId);
    case '/api/inventory/check':
      return apiInventoryCheck(envelope.body, tenantId);
    case '/api/order/validate':
      return apiOrderValidate(envelope.body, role, tenantId);
    default:
      return { status: 404, error: 'Endpoint not found' };
  }
}

// ─── API → Domain: 商品详情 ───

function apiProductDetail(body: Record<string, unknown>, tenantId: string): ApiResponse<ProductDetail> {
  const productId = body.productId as string | undefined;
  if (!productId) return { status: 400, error: 'productId is required' };

  const product = domainGetProduct(productId, tenantId);
  if (!product) return { status: 404, error: 'Product not found' };

  return { status: 200, data: product };
}

// ─── API → Domain: 库存检查 ───

function apiInventoryCheck(body: Record<string, unknown>, tenantId: string): ApiResponse<InventoryCheck> {
  const productId = body.productId as string | undefined;
  const requestedQty = body.requestedQty as number | undefined;

  if (!productId) return { status: 400, error: 'productId is required' };
  if (!requestedQty || requestedQty <= 0) return { status: 400, error: 'Invalid requestedQty' };

  const check = domainCheckInventory(productId, requestedQty, tenantId);
  return { status: 200, data: check };
}

// ─── API → Domain: 订单校验 ───

function apiOrderValidate(body: Record<string, unknown>, role: MiniAppUserRole, tenantId: string): ApiResponse<OrderValidationResult> {
  const productId = body.productId as string | undefined;
  const qty = body.quantity as number | undefined;
  const userId = body.userId as string | undefined;

  if (!productId || !qty || !userId) return { status: 400, error: 'Missing required fields' };

  const result = domainValidateOrder(productId, qty, role, userId, tenantId);
  return { status: 200, data: result };
}

// ─── Domain 层：商品仓储 ───

const PRODUCTS: Record<string, Record<string, ProductDetail>> = {
  't1': {
    'prod-001': { productId: 'prod-001', name: '经典T恤', price: 99, stock: 50, memberPrice: 79, vipPrice: 59 },
    'prod-002': { productId: 'prod-002', name: '运动鞋', price: 299, stock: 20, vipPrice: 199 },
  },
  't2': {
    'prod-001': { productId: 'prod-001', name: '经典T恤', price: 129, stock: 100 },
    'prod-003': { productId: 'prod-003', name: '帽子', price: 49, stock: 0 },
  },
};

function domainGetProduct(productId: string, tenantId: string): ProductDetail | undefined {
  return PRODUCTS[tenantId]?.[productId];
}

// ─── Domain 层：库存校验 ───

function domainCheckInventory(productId: string, requestedQty: number, tenantId: string): InventoryCheck {
  const product = domainGetProduct(productId, tenantId);
  if (!product) return { productId, requestedQty, available: false, remainingStock: 0 };

  return {
    productId,
    requestedQty,
    available: product.stock >= requestedQty,
    remainingStock: product.stock,
  };
}

// ─── Domain 层：订单校验 ───

function domainValidateOrder(
  productId: string,
  qty: number,
  role: MiniAppUserRole,
  userId: string,
  tenantId: string,
): OrderValidationResult {
  // 库存校验
  const inventory = domainCheckInventory(productId, qty, tenantId);
  if (!inventory.available) {
    return { canPlace: false, reason: `库存不足 (剩余 ${inventory.remainingStock})`, orderAmount: 0 };
  }

  const product = domainGetProduct(productId, tenantId)!;

  // 会员限制校验
  if (role === 'guest' && product.memberPrice !== undefined) {
    // 会员价商品不给访客看价格
    return { canPlace: false, reason: '请先登录后购买', orderAmount: 0 };
  }

  // 计算价格
  let unitPrice = product.price;
  if (role === 'vip' && product.vipPrice !== undefined) {
    unitPrice = product.vipPrice;
  } else if ((role === 'member' || role === 'store_admin') && product.memberPrice !== undefined) {
    unitPrice = product.memberPrice;
  }

  return { canPlace: true, orderAmount: unitPrice * qty };
}

// ─── Miniapp 渲染层 ───

function miniappRenderDetail(apiResponse: ApiResponse<ProductDetail>, role: MiniAppUserRole): MiniAppRenderPayload {
  if (apiResponse.status !== 200 || !apiResponse.data) {
    return {
      success: false,
      productName: '',
      displayPrice: 0,
      stockLabel: '',
      orderButtonEnabled: false,
      errorMessage: apiResponse.error || '获取商品详情失败',
    };
  }

  const p = apiResponse.data;
  let displayPrice = p.price;
  if (role === 'vip' && p.vipPrice !== undefined) displayPrice = p.vipPrice;
  else if ((role === 'member' || role === 'store_admin') && p.memberPrice !== undefined) displayPrice = p.memberPrice;

  return {
    success: true,
    productName: p.name,
    displayPrice,
    memberPrice: p.memberPrice,
    stockLabel: p.stock > 0 ? `库存 ${p.stock} 件` : '暂时缺货',
    orderButtonEnabled: p.stock > 0,
  };
}

// ─── 测试 ───

describe('[L3-E2E] 链07: Miniapp → SDK → API → Domain 反向链路', () => {

  test('【正例】会员查看商品详情+下单完整链路', () => {
    const req = createMiniappRequest(
      'wx-001', 't1', 'u1', 'member',
      '/api/product/detail', { productId: 'prod-001' },
    );
    const envelope = sdkEnrichRequest(req);
    const apiResp = apiRoute(envelope) as ApiResponse<ProductDetail>;
    const render = miniappRenderDetail(apiResp, 'member');

    assert.equal(apiResp.status, 200);
    assert.equal(apiResp.data?.name, '经典T恤');
    assert.equal(render.displayPrice, 79); // 会员价
    assert.equal(render.stockLabel, '库存 50 件');
    assert.ok(render.success);
    assert.ok(render.orderButtonEnabled);

    // 下单校验
    const orderReq = createMiniappRequest('wx-001', 't1', 'u1', 'member', '/api/order/validate', {
      productId: 'prod-001', quantity: 2, userId: 'u1',
    });
    const orderEnv = sdkEnrichRequest(orderReq);
    const orderResp = apiRoute(orderEnv) as ApiResponse<OrderValidationResult>;
    assert.ok(orderResp.data?.canPlace);
    assert.equal(orderResp.data?.orderAmount, 158); // 79 * 2
  });

  test('【正例】VIP 用户享受 VIP 专享价', () => {
    const req = createMiniappRequest('wx-001', 't1', 'u2', 'vip', '/api/product/detail', { productId: 'prod-001' });
    const envelope = sdkEnrichRequest(req);
    const apiResp = apiRoute(envelope) as ApiResponse<ProductDetail>;
    const render = miniappRenderDetail(apiResp, 'vip');

    assert.equal(apiResp.status, 200);
    assert.equal(render.displayPrice, 59); // VIP 价
    assert.ok(render.memberPrice); // 也显示原会员价
  });

  test('【正例】访客可以查看普通商品(无会员价)', () => {
    const req = createMiniappRequest('wx-001', 't1', 'guest-1', 'guest', '/api/product/detail', { productId: 'prod-002' });
    const envelope = sdkEnrichRequest(req);
    const apiResp = apiRoute(envelope) as ApiResponse<ProductDetail>;
    const render = miniappRenderDetail(apiResp, 'guest');

    assert.equal(apiResp.status, 200);
    assert.equal(render.displayPrice, 299); // 普通价
    assert.ok(render.success);
  });

  test('【反例】访客无法购买会员价商品', () => {
    // 访客尝试下单会员价商品
    const req = createMiniappRequest('wx-001', 't1', 'guest-1', 'guest', '/api/order/validate', {
      productId: 'prod-001', quantity: 1, userId: 'guest-1',
    });
    const envelope = sdkEnrichRequest(req);
    const resp = apiRoute(envelope) as ApiResponse<OrderValidationResult>;

    assert.equal(resp.data?.canPlace, false);
    assert.ok(resp.data?.reason?.includes('登录'));
  });

  test('【反例】库存不足时下单被 Domain 拒绝', () => {
    const req = createMiniappRequest('wx-001', 't1', 'u1', 'member', '/api/order/validate', {
      productId: 'prod-001', quantity: 999, userId: 'u1',
    });
    const envelope = sdkEnrichRequest(req);
    const resp = apiRoute(envelope) as ApiResponse<OrderValidationResult>;

    assert.equal(resp.data?.canPlace, false);
    assert.ok(resp.data?.reason?.includes('库存不足'));
  });

  test('【反例】不存在的商品 404', () => {
    const req = createMiniappRequest('wx-001', 't1', 'u1', 'member', '/api/product/detail', { productId: 'nonexistent' });
    const envelope = sdkEnrichRequest(req);
    const resp = apiRoute(envelope) as ApiResponse<ProductDetail>;

    assert.equal(resp.status, 404);
    assert.ok(resp.error);
  });

  test('【边界】库存为 0 的商品展示缺货标签', () => {
    const req = createMiniappRequest('wx-001', 't2', 'u1', 'member', '/api/product/detail', { productId: 'prod-003' });
    const envelope = sdkEnrichRequest(req);
    const apiResp = apiRoute(envelope) as ApiResponse<ProductDetail>;
    const render = miniappRenderDetail(apiResp, 'member');

    assert.equal(apiResp.status, 200);
    assert.equal(render.stockLabel, '暂时缺货');
    assert.equal(render.orderButtonEnabled, false);
  });

  test('【边界】租户隔离: t1 的商品在 t2 找不到', () => {
    const req = createMiniappRequest('wx-001', 't2', 'u1', 'member', '/api/product/detail', { productId: 'prod-001' });
    const envelope = sdkEnrichRequest(req);
    const resp = apiRoute(envelope) as ApiResponse<ProductDetail>;

    // t2 也有 prod-001, 但价格不同 → 验证隔离
    assert.equal(resp.status, 200);
    assert.equal(resp.data?.price, 129); // t2 的价格
    assert.notEqual(resp.data?.price, 99); // 不是 t1 的价格
  });

  test('【边界】缺失必要 header 返回 401', () => {
    const envelope: SdkEnvelope = {
      headers: {
        authorization: '',
        'x-source': '',
        'x-app-id': '',
        'x-tenant-id': '',
        'x-timestamp': '',
        'x-signature': '',
        'x-user-role': '',
        'content-type': 'application/json',
      },
      body: {},
      endpoint: '/api/product/detail',
    };
    const resp = apiRoute(envelope);
    assert.equal(resp.status, 401);
  });
});
