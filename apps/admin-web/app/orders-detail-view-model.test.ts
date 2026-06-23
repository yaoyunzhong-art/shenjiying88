/**
 * orders-detail-view-model.test.ts — Unit tests for order detail view model
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  loadOrderDetail,
  getStatusColor,
  type OrderDetailViewModel,
} from '../app/orders-detail-view-model';
import { MOCK_ORDERS, ORDER_STATUS_FLOW } from '../app/orders-data';

describe('orders-detail-view-model', () => {
  describe('loadOrderDetail', () => {
    it('should return view model for valid order id', () => {
      const vm = loadOrderDetail('ord-001');
      assert.ok(vm, 'should find order ord-001');
      assert.strictEqual(vm!.order.id, 'ord-001');
      assert.strictEqual(vm!.order.orderNo, 'ORD-20260620-0001');
      assert.ok(vm!.statusLabel.length > 0, 'should have status label');
      assert.ok(vm!.channelLabel.length > 0, 'should have channel label');
    });

    it('should return null for invalid order id', () => {
      const vm = loadOrderDetail('nonexistent');
      assert.strictEqual(vm, null);
    });

    it('should return correct status for delivered order', () => {
      const vm = loadOrderDetail('ord-001')!;
      assert.strictEqual(vm.statusLabel, '已签收');
      assert.strictEqual(vm.statusVariant, 'success');
    });

    it('should return correct status for pending order', () => {
      const vm = loadOrderDetail('ord-005')!;
      assert.strictEqual(vm.statusLabel, '待确认');
      assert.strictEqual(vm.statusVariant, 'warning');
    });

    it('should return correct status for cancelled order', () => {
      const vm = loadOrderDetail('ord-006')!;
      assert.strictEqual(vm.statusLabel, '已取消');
      assert.strictEqual(vm.statusVariant, 'danger');
    });

    it('terminal status should have empty nextStatuses', () => {
      const vm = loadOrderDetail('ord-006')!; // cancelled
      assert.strictEqual(vm.nextStatuses.length, 0);
      assert.strictEqual(vm.isTerminal, true);
    });

    it('non-terminal status should have nextStatuses', () => {
      const vm = loadOrderDetail('ord-005')!; // pending
      assert.ok(vm.nextStatuses.length > 0, 'pending should have next statuses');
      assert.strictEqual(vm.isTerminal, false);
    });

    it('should have correct next statuses for pending', () => {
      const vm = loadOrderDetail('ord-005')!;
      const nextKeys = vm.nextStatuses.map((s) => s.key);
      assert.ok(nextKeys.includes('confirmed'));
      assert.ok(nextKeys.includes('cancelled'));
    });

    it('should load all mock orders successfully', () => {
      for (const order of MOCK_ORDERS) {
        const vm = loadOrderDetail(order.id);
        assert.ok(vm, `should find order ${order.id}`);
        assert.strictEqual(vm!.order.id, order.id);
      }
    });
  });

  describe('getStatusColor', () => {
    it('should return green for delivered', () => {
      assert.strictEqual(getStatusColor('delivered'), '#4ade80');
    });

    it('should return red for cancelled', () => {
      assert.strictEqual(getStatusColor('cancelled'), '#f87171');
    });

    it('should return red for refunded', () => {
      assert.strictEqual(getStatusColor('refunded'), '#f87171');
    });

    it('should return yellow for processing', () => {
      assert.strictEqual(getStatusColor('processing'), '#fbbf24');
    });

    it('should return default for unknown status', () => {
      assert.strictEqual(getStatusColor('unknown'), '#94a3b8');
    });
  });

  describe('ORDER_STATUS_FLOW consistency with view model', () => {
    it('nextStatuses in view model should match ORDER_STATUS_FLOW', () => {
      for (const order of MOCK_ORDERS) {
        const vm = loadOrderDetail(order.id)!;
        const flowNext = ORDER_STATUS_FLOW[order.status] || [];
        assert.strictEqual(
          vm.nextStatuses.length,
          flowNext.length,
          `nextStatuses mismatch for order ${order.id} (${order.status})`
        );
        const vmKeys = vm.nextStatuses.map((s) => s.key).sort();
        const flowKeys = [...flowNext].sort();
        assert.deepStrictEqual(vmKeys, flowKeys);
      }
    });
  });
});
