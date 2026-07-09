/**
 * order-service.test.ts — L1 合约测试
 *
 * 守护:
 *   - STATUS_CONFIG: 5 种 status 必须有 label/color/bg + 文案与 page 层匹配
 *   - OrderService.getOrders: 请求/异常/Mock回退
 *   - OrderService.getOrderDetail: 请求/异常
 *   - OrderService.cancelOrder: 请求/异常
 *   - MOCK_ORDERS: 5 条测试数据结构完整性
 */

import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService, STATUS_CONFIG, type OrderStatus, type Order } from '../order-service';

// ─── STATUS_CONFIG ──────────────────────────────────────

describe('[order-service] STATUS_CONFIG', () => {
  const expected: OrderStatus[] = ['pending', 'paid', 'completed', 'cancelled', 'refunded'];

  it('5 种 status 必须齐备', () => {
    const keys = Object.keys(STATUS_CONFIG).sort();
    assert.deepEqual(keys, expected.sort());
  });

  it('每种 status 必须含 label/color/bg 3 字段', () => {
    for (const s of expected) {
      const cfg = STATUS_CONFIG[s];
      assert.ok(typeof cfg.label === 'string' && cfg.label.length > 0, `${s}.label 必填`);
      assert.ok(typeof cfg.color === 'string' && cfg.color.length > 0, `${s}.color 必填`);
      assert.ok(typeof cfg.bg === 'string' && cfg.bg.length > 0, `${s}.bg 必填`);
    }
  });

  it('文案与 page 层 order-status-badge 标签对应', () => {
    // page 层使用: pending→待支付 paid→已支付 completed→已完成 cancelled→已取消 refunded→已退款
    assert.equal(STATUS_CONFIG.pending.label, '待支付');
    assert.equal(STATUS_CONFIG.paid.label, '已支付');
    assert.equal(STATUS_CONFIG.completed.label, '已完成');
    assert.equal(STATUS_CONFIG.cancelled.label, '已取消');
    assert.equal(STATUS_CONFIG.refunded.label, '已退款');
  });

  it('颜色值不能相同 (避免退化合并)', () => {
    const colors = expected.map((s) => STATUS_CONFIG[s].color);
    const unique = new Set(colors);
    assert.ok(unique.size >= 4, '至少 4 种不同颜色');
  });
});

// ─── Mock helper ─────────────────────────────────────────

function createMockFetch(responseStatus: number, responseBody: unknown, throwOnCall = false) {
  return mock.fn(async (_url: string, _init?: RequestInit) => {
    if (throwOnCall) throw new Error('Network error');
    return {
      ok: responseStatus >= 200 && responseStatus < 300,
      status: responseStatus,
      json: async () => responseBody,
    } as Response;
  });
}

// ─── OrderService ───────────────────────────────────────

describe('[order-service] OrderService.getOrders', () => {
  it('正常请求返回订单列表', async () => {
    const mockData = {
      data: {
        orders: [{ id: 'o1', orderNo: 'TEST001' }],
        total: 1,
        pendingCount: 0,
      },
    };
    const fetchMock = createMockFetch(200, mockData);
    const svc = new OrderService('http://test');
    globalThis.fetch = fetchMock;

    const result = await svc.getOrders({ page: 1, pageSize: 10 });
    assert.equal(result.success, true);
    assert.ok(result.data);
    assert.equal(result.data.orders.length, 1);
    assert.equal(result.data.orders[0].id, 'o1');
    assert.equal(result.data.total, 1);

    // 验证请求 URL 包含正确参数
    const callUrl = fetchMock.mock.calls[0].arguments[0] as string;
    assert.ok(callUrl.includes('/orders'));
    assert.ok(callUrl.includes('page=1'));
    assert.ok(callUrl.includes('pageSize=10'));
  });

  it('status 参数过滤传递正确', async () => {
    const fetchMock = createMockFetch(200, { data: { orders: [], total: 0, pendingCount: 0 } });
    globalThis.fetch = fetchMock;

    const svc = new OrderService('http://test');
    await svc.getOrders({ status: 'pending' });

    const callUrl = fetchMock.mock.calls[0].arguments[0] as string;
    assert.ok(callUrl.includes('status=pending'));
  });

  it('后端返回非 200 → 返回 error 对象', async () => {
    const fetchMock = createMockFetch(400, { code: 'BAD_REQUEST', message: '参数错误' });
    globalThis.fetch = fetchMock;

    const svc = new OrderService('http://test');
    const result = await svc.getOrders();
    assert.equal(result.success, false);
    assert.equal(result.error?.code, 'BAD_REQUEST');
    assert.equal(result.error?.message, '参数错误');
  });

  it('fetch 抛异常 → 降级返回 Mock 数据', async () => {
    const fetchMock = createMockFetch(200, null, true);
    globalThis.fetch = fetchMock;

    const svc = new OrderService('http://test');
    const result = await svc.getOrders();
    // 由于 catch 内降级到 mock
    assert.equal(result.success, true);
    assert.ok(result.data);
    assert.equal(result.data.orders.length, 5); // MOCK_ORDERS
    assert.equal(result.data.pendingCount, 1); // 只有 o3 是 pending
  });

  it('MOCK 数据包含 pendingCount 正确计数', () => {
    // 直接验证私有方法行为通过 getOrders 异常触发
    // 已在上一条验证 total=5, pendingCount=1
  });

  it('无 options 调用 → 默认 page=1, pageSize=20', async () => {
    const fetchMock = createMockFetch(200, { data: { orders: [], total: 0, pendingCount: 0 } });
    globalThis.fetch = fetchMock;

    const svc = new OrderService('http://test');
    await svc.getOrders();

    const callUrl = fetchMock.mock.calls[0].arguments[0] as string;
    assert.ok(callUrl.includes('page=1'));
    assert.ok(callUrl.includes('pageSize=20'));
  });
});

describe('[order-service] OrderService.getOrderDetail', () => {
  it('正常请求返回订单详情', async () => {
    const mockData = { data: { id: 'o1', orderNo: 'DETAIL001', totalAmount: 199 } };
    const fetchMock = createMockFetch(200, mockData);
    globalThis.fetch = fetchMock;

    const svc = new OrderService('http://test');
    const result = await svc.getOrderDetail('o1');
    assert.equal(result.success, true);
    assert.ok(result.data);
    assert.equal(result.data.id, 'o1');
    assert.equal(result.data.orderNo, 'DETAIL001');

    const callUrl = fetchMock.mock.calls[0].arguments[0] as string;
    assert.ok(callUrl.includes('/orders/o1'));
  });

  it('后端返回非 200 → 返回 error', async () => {
    const fetchMock = createMockFetch(404, { code: 'NOT_FOUND', message: '订单不存在' });
    globalThis.fetch = fetchMock;

    const svc = new OrderService('http://test');
    const result = await svc.getOrderDetail('nonexistent');
    assert.equal(result.success, false);
    assert.equal(result.error?.code, 'NOT_FOUND');
    assert.equal(result.error?.message, '订单不存在');
  });

  it('fetch 抛异常 → 返回 error 对象 (不降级)', async () => {
    const fetchMock = createMockFetch(200, null, true);
    globalThis.fetch = fetchMock;

    const svc = new OrderService('http://test');
    const result = await svc.getOrderDetail('o1');
    assert.equal(result.success, false);
    assert.equal(result.error?.code, 'NETWORK_ERROR');
    assert.equal(result.error?.message, '网络错误');
  });
});

describe('[order-service] OrderService.cancelOrder', () => {
  it('正常取消返回 success: true', async () => {
    const fetchMock = createMockFetch(200, { data: null });
    globalThis.fetch = fetchMock;

    const svc = new OrderService('http://test');
    const result = await svc.cancelOrder('o3');
    assert.equal(result.success, true);
    assert.equal(result.error, undefined);

    const callUrl = fetchMock.mock.calls[0].arguments[0] as string;
    const callInit = fetchMock.mock.calls[0].arguments[1] as RequestInit;
    assert.ok(callUrl.includes('/orders/o3/cancel'));
    assert.equal(callInit.method, 'POST');
  });

  it('后端拒绝取消 → 返回 error', async () => {
    const fetchMock = createMockFetch(400, { code: 'CANCEL_REFUSED', message: '订单不允许取消' });
    globalThis.fetch = fetchMock;

    const svc = new OrderService('http://test');
    const result = await svc.cancelOrder('o1');
    assert.equal(result.success, false);
    assert.equal(result.error?.code, 'CANCEL_REFUSED');
  });

  it('fetch 抛异常 → 返回 NETWORK_ERROR', async () => {
    const fetchMock = createMockFetch(200, null, true);
    globalThis.fetch = fetchMock;

    const svc = new OrderService('http://test');
    const result = await svc.cancelOrder('o1');
    assert.equal(result.success, false);
    assert.equal(result.error?.code, 'NETWORK_ERROR');
  });
});

// ─── MOCK_ORDERS 数据完整性 ──────────────────────────────

describe('[order-service] MOCK_ORDERS 数据完整性', () => {
  // 重新构造 Service 来触发 mock 数据
  let mockOrders: Order[] = [];

  it('通过异常降级获取 MOCK_ORDERS', async () => {
    const fetchMock = createMockFetch(200, null, true);
    globalThis.fetch = fetchMock;

    const svc = new OrderService('http://test');
    const result = await svc.getOrders();
    assert.equal(result.success, true);
    assert.ok(result.data);
    mockOrders = result.data.orders;
    assert.equal(mockOrders.length, 5);
  });

  it('每条 MOCK 订单必须包含核心字段', () => {
    for (const o of mockOrders) {
      assert.ok(typeof o.id === 'string' && o.id.length > 0, 'id 必填');
      assert.ok(typeof o.orderNo === 'string' && o.orderNo.length > 0, 'orderNo 必填');
      assert.ok(typeof o.storeName === 'string' && o.storeName.length > 0, 'storeName 必填');
      assert.ok(typeof o.totalAmount === 'number' && o.totalAmount > 0, 'totalAmount 必为正数');
      assert.ok(typeof o.itemCount === 'number' && o.itemCount > 0, 'itemCount 必为正整数');
      assert.ok(typeof o.createdAt === 'string' && o.createdAt.length > 0, 'createdAt 必填');
      assert.ok(['pending', 'paid', 'completed', 'cancelled', 'refunded'].includes(o.status), `status 必须是合法值, 当前=${o.status}`);
      assert.ok(Array.isArray(o.items), 'items 必须是数组');
      assert.ok(o.items.length > 0, 'items 不能为空');
    }
  });

  it('每条 MOCK 订单的 items 子项必须含 name/quantity/price', () => {
    for (const o of mockOrders) {
      for (const item of o.items) {
        assert.ok(typeof item.name === 'string' && item.name.length > 0);
        assert.ok(typeof item.quantity === 'number' && item.quantity >= 1);
        assert.ok(typeof item.price === 'number' && item.price > 0);
      }
    }
  });

  it('5 种 status 各出现一次 (避免重复或缺失)', () => {
    const statuses = mockOrders.map((o) => o.status).sort();
    assert.deepEqual(statuses, ['cancelled', 'completed', 'paid', 'pending', 'refunded']);
  });
});
