/**
 * orders-page.test.ts — Unit tests for orders data and page logic
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_ORDERS,
  ORDER_STATUS_MAP,
  ORDER_CHANNEL_MAP,
  ORDER_STATUSES,
  ORDER_CHANNELS,
  ORDER_STATUS_FLOW,
  type OrderItem,
  type OrderStatus,
} from '../app/orders-data';

// ---- Data integrity ----

describe('orders-data', () => {
  describe('MOCK_ORDERS', () => {
    it('should contain at least 10 orders', () => {
      assert.ok(MOCK_ORDERS.length >= 10, `expected >= 10, got ${MOCK_ORDERS.length}`);
    });

    it('every order should have a unique id', () => {
      const ids = MOCK_ORDERS.map((o) => o.id);
      assert.strictEqual(new Set(ids).size, ids.length);
    });

    it('every order should have a unique orderNo', () => {
      const nos = MOCK_ORDERS.map((o) => o.orderNo);
      assert.strictEqual(new Set(nos).size, nos.length);
    });

    it('every order should have a valid status', () => {
      for (const o of MOCK_ORDERS) {
        assert.ok(
          ORDER_STATUSES.includes(o.status),
          `invalid status ${o.status} for ${o.id}`
        );
      }
    });

    it('every order should have a valid channel', () => {
      for (const o of MOCK_ORDERS) {
        assert.ok(
          ORDER_CHANNELS.includes(o.channel),
          `invalid channel ${o.channel} for ${o.id}`
        );
      }
    });

    it('every order totalAmount should be positive', () => {
      for (const o of MOCK_ORDERS) {
        assert.ok(o.totalAmount > 0, `totalAmount must be > 0, got ${o.totalAmount} for ${o.id}`);
      }
    });

    it('discount should not exceed totalAmount', () => {
      for (const o of MOCK_ORDERS) {
        assert.ok(
          o.discountAmount <= o.totalAmount,
          `discount ${o.discountAmount} > total ${o.totalAmount} for ${o.id}`
        );
      }
    });

    it('itemCount should be positive', () => {
      for (const o of MOCK_ORDERS) {
        assert.ok(o.itemCount > 0, `itemCount must be > 0, got ${o.itemCount} for ${o.id}`);
      }
    });

    it('customerName should not be empty', () => {
      for (const o of MOCK_ORDERS) {
        assert.ok(o.customerName.length > 0, `empty customerName for ${o.id}`);
      }
    });

    it('storeName should not be empty', () => {
      for (const o of MOCK_ORDERS) {
        assert.ok(o.storeName.length > 0, `empty storeName for ${o.id}`);
      }
    });
  });

  describe('ORDER_STATUS_MAP', () => {
    it('should have labels for all statuses', () => {
      for (const s of ORDER_STATUSES) {
        const entry = ORDER_STATUS_MAP[s];
        assert.ok(entry, `missing label for status ${s}`);
        assert.ok(entry.label.length > 0, `empty label for status ${s}`);
        assert.ok(
          ['success', 'warning', 'danger', 'neutral', 'info'].includes(entry.variant),
          `invalid variant ${entry.variant} for ${s}`
        );
      }
    });
  });

  describe('ORDER_CHANNEL_MAP', () => {
    it('should have labels for all channels', () => {
      for (const c of ORDER_CHANNELS) {
        const entry = ORDER_CHANNEL_MAP[c];
        assert.ok(entry, `missing label for channel ${c}`);
        assert.ok(entry.label.length > 0, `empty label for channel ${c}`);
      }
    });
  });
});

// ---- Filter logic ----

describe('orders filter logic', () => {
  it('status filter should return matching orders', () => {
    const pending = MOCK_ORDERS.filter((o) => o.status === 'pending');
    assert.ok(pending.length > 0, 'should have at least 1 pending order');
    for (const o of pending) {
      assert.strictEqual(o.status, 'pending');
    }
  });

  it('channel filter should return matching orders', () => {
    const online = MOCK_ORDERS.filter((o) => o.channel === 'online');
    assert.ok(online.length > 0, 'should have at least 1 online order');
    for (const o of online) {
      assert.strictEqual(o.channel, 'online');
    }
  });

  it('market filter should return matching orders', () => {
    const bj = MOCK_ORDERS.filter((o) => o.marketCode === 'CN-BJ');
    assert.ok(bj.length > 0, 'should have at least 1 CN-BJ order');
    for (const o of bj) {
      assert.strictEqual(o.marketCode, 'CN-BJ');
    }
  });

  it('amount range: under100 filter', () => {
    const under100 = MOCK_ORDERS.filter((o) => o.totalAmount < 100);
    assert.ok(under100.length > 0, 'should have at least 1 order under ¥100');
    for (const o of under100) {
      assert.ok(o.totalAmount < 100, `${o.id} amount ${o.totalAmount} should be < 100`);
    }
  });

  it('amount range: over300 filter', () => {
    const over300 = MOCK_ORDERS.filter((o) => o.totalAmount > 300);
    for (const o of over300) {
      assert.ok(o.totalAmount > 300, `${o.id} amount ${o.totalAmount} should be > 300`);
    }
  });

  it('combined filter: status + channel', () => {
    const result = MOCK_ORDERS.filter(
      (o) => o.status === 'delivered' && o.channel === 'online'
    );
    for (const o of result) {
      assert.strictEqual(o.status, 'delivered');
      assert.strictEqual(o.channel, 'online');
    }
  });

  it('search by orderNo should find match', () => {
    const keyword = 'ORD-20260620';
    const match = MOCK_ORDERS.filter((o) => o.orderNo.includes(keyword));
    assert.ok(match.length > 0, 'should find at least 1 matching order');
    for (const o of match) {
      assert.ok(o.orderNo.includes(keyword));
    }
  });

  it('search by customerName should find match', () => {
    const keyword = '张三';
    const match = MOCK_ORDERS.filter((o) => o.customerName.includes(keyword));
    assert.ok(match.length > 0, 'should find 张三');
    for (const o of match) {
      assert.ok(o.customerName.includes(keyword));
    }
  });

  it('search by storeName should find match', () => {
    const keyword = '朝阳';
    const match = MOCK_ORDERS.filter((o) => o.storeName.includes(keyword));
    assert.ok(match.length > 0, 'should find 朝阳 orders');
    for (const o of match) {
      assert.ok(o.storeName.includes(keyword) || o.marketCode === 'CN-BJ');
    }
  });
});

// ---- Status flow ----

describe('ORDER_STATUS_FLOW', () => {
  it('should define next statuses for all statuses', () => {
    for (const s of ORDER_STATUSES) {
      const next = ORDER_STATUS_FLOW[s];
      assert.ok(Array.isArray(next), `missing flow for ${s}`);
    }
  });

  it('terminal statuses should have empty next', () => {
    assert.deepStrictEqual(ORDER_STATUS_FLOW['cancelled'], []);
    assert.deepStrictEqual(ORDER_STATUS_FLOW['refunded'], []);
  });

  it('pending should allow confirmed and cancelled', () => {
    const next = ORDER_STATUS_FLOW['pending'];
    assert.ok(next.includes('confirmed'));
    assert.ok(next.includes('cancelled'));
  });

  it('delivered should allow refunded', () => {
    const next = ORDER_STATUS_FLOW['delivered'];
    assert.ok(next.includes('refunded'));
  });

  it('forward flow should not skip states (except to cancelled)', () => {
    // pending -> confirmed -> processing -> shipped -> delivered
    for (const s of ORDER_STATUSES) {
      const next = ORDER_STATUS_FLOW[s];
      for (const ns of next) {
        if (ns === 'cancelled') continue;
        const statusIndex = ORDER_STATUSES.indexOf(s);
        const nextIndex = ORDER_STATUSES.indexOf(ns);
        assert.ok(
          nextIndex > statusIndex || (s === 'delivered' && ns === 'refunded'),
          `${s} -> ${ns}: next should be later in flow or a terminal exception`
        );
      }
    }
  });
});

// ---- Stats computation ----

describe('orders stats computation', () => {
  it('total orders should match MOCK_ORDERS length', () => {
    assert.strictEqual(MOCK_ORDERS.length, 12);
  });

  it('completed revenue (delivered) should be > 0', () => {
    const delivered = MOCK_ORDERS.filter((o) => o.status === 'delivered');
    assert.ok(delivered.length > 0);
    const revenue = delivered.reduce((sum, o) => sum + o.paidAmount, 0);
    assert.ok(revenue > 0, 'revenue should be > 0');
  });

  it('cancelled + refunded should be > 0', () => {
    const cancelled = MOCK_ORDERS.filter(
      (o) => o.status === 'cancelled' || o.status === 'refunded'
    );
    assert.ok(cancelled.length > 0);
  });

  it('avg order value should be reasonable', () => {
    const avg =
      MOCK_ORDERS.reduce((sum, o) => sum + o.totalAmount, 0) / MOCK_ORDERS.length;
    assert.ok(avg > 50, `avg ${avg} should be > 50`);
    assert.ok(avg < 500, `avg ${avg} should be < 500`);
  });

  it('pending orders (status=pending or confirmed) count', () => {
    const pending = MOCK_ORDERS.filter(
      (o) => o.status === 'pending' || o.status === 'confirmed'
    );
    assert.ok(pending.length > 0, 'should have pending/confirmed orders');
  });
});
