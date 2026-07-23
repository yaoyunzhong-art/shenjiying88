import { afterEach, beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentService, MockPaymentGateway } from './payment.service';
import { OrderService } from './order.service';

// ── Mocks ───────────────────────────────────────────────────────────────────

function createMockOrderService() {
  const orders = new Map<string, any>();
  return {
    getById: vi.fn((orderId: string, tenantId: string) => {
      const order = orders.get(orderId);
      if (!order || order.tenantId !== tenantId) return null;
      return order;
    }),
    markPaid: vi.fn(),
    _setOrder: (order: any) => orders.set(order.id, order),
  } as unknown as Mocked<OrderService> & { _setOrder: (order: any) => void };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeValidInput(overrides: Record<string, any> = {}) {
  return {
    orderId: overrides.orderId ?? 'ORD-20260723-00001',
    method: 'WECHAT' as const,
    amountCents: overrides.amountCents ?? 1000,
    ...overrides,
  };
}

function makeValidOpts(overrides: Record<string, any> = {}) {
  return {
    tenantId: overrides.tenantId ?? 'tenant-1',
    userId: overrides.userId ?? 'user-1',
    ...overrides,
  };
}

function makePendingOrder(overrides: Record<string, any> = {}) {
  return {
    id: 'ORD-20260723-00001',
    tenantId: 'tenant-1',
    status: 'PENDING',
    totalCents: 1000,
    items: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PaymentService', () => {
  let service: PaymentService;
  let orderService: ReturnType<typeof createMockOrderService>;
  let gateway: MockPaymentGateway;

  beforeEach(() => {
    orderService = createMockOrderService();
    gateway = new MockPaymentGateway();
    service = new PaymentService(orderService, gateway, undefined, undefined);
  });

  afterEach(() => {
    service._clear();
    vi.clearAllMocks();
  });

  // ── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a payment successfully', async () => {
      orderService._setOrder(makePendingOrder());

      const payment = await service.create(makeValidInput(), makeValidOpts());

      expect(payment).toBeDefined();
      expect(payment.id).toMatch(/^PAY-/);
      expect(payment.status).toBe('PENDING');
      expect(payment.orderId).toBe('ORD-20260723-00001');
      expect(payment.tenantId).toBe('tenant-1');
    });

    it('should throw BadRequestException when tenantId is empty', async () => {
      await expect(
        service.create(makeValidInput(), makeValidOpts({ tenantId: '' })),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when orderId is empty', async () => {
      await expect(
        service.create(makeValidInput({ orderId: '' }), makeValidOpts()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when amountCents is zero', async () => {
      await expect(
        service.create(makeValidInput({ amountCents: 0 }), makeValidOpts()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when amountCents is negative', async () => {
      await expect(
        service.create(makeValidInput({ amountCents: -100 }), makeValidOpts()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      await expect(
        service.create(makeValidInput(), makeValidOpts()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for cross-tenant payment access', async () => {
      orderService._setOrder(makePendingOrder({ tenantId: 'tenant-2' }));

      await expect(
        service.create(makeValidInput(), makeValidOpts()),
      ).rejects.toThrow('cross_tenant_payment_access');
    });

    it('should throw BadRequestException when order is not PENDING', async () => {
      orderService._setOrder(makePendingOrder({ status: 'PAID' }));

      await expect(
        service.create(makeValidInput(), makeValidOpts()),
      ).rejects.toThrow('order_not_pending');
    });

    it('should throw BadRequestException on amount mismatch', async () => {
      orderService._setOrder(makePendingOrder({ totalCents: 2000 }));

      await expect(
        service.create(makeValidInput({ amountCents: 1000 }), makeValidOpts()),
      ).rejects.toThrow('amount_mismatch');
    });

    it('should be idempotent (same orderId + method returns same payment)', async () => {
      orderService._setOrder(makePendingOrder());

      const p1 = await service.create(makeValidInput(), makeValidOpts());
      const p2 = await service.create(makeValidInput(), makeValidOpts());

      expect(p1.id).toBe(p2.id);
    });

    it('should handle different payment methods', async () => {
      orderService._setOrder(makePendingOrder());

      const p1 = await service.create(
        makeValidInput({ method: 'WECHAT' }),
        makeValidOpts(),
      );
      const p2 = await service.create(
        makeValidInput({ method: 'ALIPAY' }),
        makeValidOpts(),
      );

      expect(p1.id).not.toBe(p2.id);
      expect(p1.method).toBe('WECHAT');
      expect(p2.method).toBe('ALIPAY');
    });

    it('should return existing payment when same idem key has SUCCESS status', async () => {
      orderService._setOrder(makePendingOrder());

      const p1 = await service.create(makeValidInput(), makeValidOpts());
      service.confirm(p1.id, 'txn-123', 'tenant-1');

      const p2 = await service.create(makeValidInput(), makeValidOpts());
      expect(p2.id).toBe(p1.id);
      expect(p2.status).toBe('SUCCESS');
    });
  });

  // ── confirm ─────────────────────────────────────────────────────────────

  describe('confirm', () => {
    it('should confirm a PENDING payment', async () => {
      orderService._setOrder(makePendingOrder());
      const payment = await service.create(makeValidInput(), makeValidOpts());

      const confirmed = service.confirm(payment.id, 'txn-001', 'tenant-1');

      expect(confirmed.status).toBe('SUCCESS');
      expect(confirmed.providerTxnId).toBe('txn-001');
      expect(confirmed.paidAt).toBeDefined();
      expect(orderService.markPaid).toHaveBeenCalled();
    });

    it('should throw BadRequestException when paymentId is empty', () => {
      expect(() => service.confirm('', 'txn-001', 'tenant-1')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when providerTxnId is empty', () => {
      expect(() => service.confirm('PAY-xxx', '', 'tenant-1')).toThrow(BadRequestException);
    });

    it('should throw NotFoundException when payment not found', () => {
      expect(() => service.confirm('NONEXISTENT', 'txn-001', 'tenant-1')).toThrow(NotFoundException);
    });

    it('should throw BadRequestException for cross-tenant confirm', async () => {
      orderService._setOrder(makePendingOrder());
      const payment = await service.create(makeValidInput(), makeValidOpts());

      expect(() => service.confirm(payment.id, 'txn-001', 'tenant-2')).toThrow('cross_tenant_payment_access');
    });

    it('should be idempotent when called twice with same params', async () => {
      orderService._setOrder(makePendingOrder());
      const payment = await service.create(makeValidInput(), makeValidOpts());

      const c1 = service.confirm(payment.id, 'txn-001', 'tenant-1');
      const c2 = service.confirm(payment.id, 'txn-001', 'tenant-1');

      expect(c1.id).toBe(c2.id);
      expect(c2.status).toBe('SUCCESS');
    });

    it('should throw when providerTxnId is already bound to a different payment', async () => {
      orderService._setOrder(makePendingOrder({ id: 'ORD-20260723-00001' }));
      const p1 = await service.create(makeValidInput({ orderId: 'ORD-20260723-00001' }), makeValidOpts());
      service.confirm(p1.id, 'txn-001', 'tenant-1');

      orderService._setOrder(makePendingOrder({ id: 'ORD-20260723-00002' }));
      const p2 = await service.create(
        makeValidInput({ orderId: 'ORD-20260723-00002' }),
        makeValidOpts({ tenantId: 'tenant-1' }),
      );

      expect(() => service.confirm(p2.id, 'txn-001', 'tenant-1')).toThrow('payment_callback_mismatch');
    });
  });

  // ── query ───────────────────────────────────────────────────────────────

  describe('query', () => {
    it('should return payment as-is when status is not PENDING', async () => {
      orderService._setOrder(makePendingOrder());
      const payment = await service.create(makeValidInput(), makeValidOpts());
      service.confirm(payment.id, 'txn-001', 'tenant-1');

      const q = await service.query(payment.id, 'tenant-1');
      expect(q.status).toBe('SUCCESS');
    });

    it('should throw NotFoundException for non-existent payment', async () => {
      await expect(service.query('NONEXISTENT', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for cross-tenant query', async () => {
      orderService._setOrder(makePendingOrder());
      const payment = await service.create(makeValidInput(), makeValidOpts());

      await expect(service.query(payment.id, 'tenant-2')).rejects.toThrow('cross_tenant_payment_access');
    });
  });

  // ── getById ─────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('should return null for non-existent payment', () => {
      expect(service.getById('NONEXISTENT', 'tenant-1')).toBeNull();
    });

    it('should return null for cross-tenant access', async () => {
      orderService._setOrder(makePendingOrder());
      const payment = await service.create(makeValidInput(), makeValidOpts());

      expect(service.getById(payment.id, 'tenant-2')).toBeNull();
    });

    it('should return the payment when found', async () => {
      orderService._setOrder(makePendingOrder());
      const payment = await service.create(makeValidInput(), makeValidOpts());

      const found = service.getById(payment.id, 'tenant-1');
      expect(found).not.toBeNull();
      expect(found!.id).toBe(payment.id);
    });
  });

  // ── listByOrder ──────────────────────────────────────────────────────────

  describe('listByOrder', () => {
    it('should return payments for an order sorted by createdAt desc', async () => {
      orderService._setOrder(makePendingOrder());
      const p1 = await service.create(makeValidInput({ method: 'WECHAT' }), makeValidOpts());
      const p2 = await service.create(makeValidInput({ method: 'ALIPAY' }), makeValidOpts());

      const list = service.listByOrder('ORD-20260723-00001', 'tenant-1');
      expect(list).toHaveLength(2);
      // newest first
      expect(list[0].createdAt >= list[1].createdAt).toBe(true);
    });

    it('should return empty array for non-existent order', () => {
      expect(service.listByOrder('NONEXISTENT', 'tenant-1')).toEqual([]);
    });
  });

  // ── MockPaymentGateway ────────────────────────────────────────────────────

  describe('MockPaymentGateway', () => {
    it('should create prepay with correct structure', async () => {
      const mg = new MockPaymentGateway();
      const result = await mg.createPrepay({ id: 'ORD-001', totalCents: 1000 }, 'WECHAT');

      expect(result.prepayId).toMatch(/^mock_prepay_/);
      expect(result.codeUrl).toBeDefined();
      expect(result.expiresAt).toBeDefined();
    });

    it('should query with SUCCESS status', async () => {
      const mg = new MockPaymentGateway();
      const result = await mg.query('txn-001');

      expect(result.status).toBe('SUCCESS');
      expect(result.paidAt).toBeDefined();
    });

    it('should refund with providerRefundId', async () => {
      const mg = new MockPaymentGateway();
      const result = await mg.refund({
        paymentId: 'PAY-xxx',
        amountCents: 500,
        reason: 'customer_request',
      });

      expect(result.providerRefundId).toMatch(/^mock_refund_/);
    });
  });

  // ── _clear / _size ───────────────────────────────────────────────────────

  describe('test helpers', () => {
    it('_clear should remove all payments', async () => {
      orderService._setOrder(makePendingOrder());
      await service.create(makeValidInput(), makeValidOpts());
      expect(service._size()).toBe(1);

      service._clear();
      expect(service._size()).toBe(0);
    });
  });
});
