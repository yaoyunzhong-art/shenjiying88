import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildOrderDetailFooterModel,
  getOrderDetailFooterActionStyle,
} from './order-detail-actions';

test('buildOrderDetailFooterModel returns pay action for pending order', () => {
  const model = buildOrderDetailFooterModel({
    status: 'PENDING',
  });

  assert.deepEqual(model, {
    layout: 'single',
    actions: [
      {
        key: 'pay',
        title: '去收款',
      },
    ],
  });
});

test('buildOrderDetailFooterModel returns back and refund actions for paid order', () => {
  const model = buildOrderDetailFooterModel({
    status: 'PAID',
  });

  assert.deepEqual(model, {
    layout: 'split',
    actions: [
      {
        key: 'back',
        title: '返回',
        variant: 'outline',
      },
      {
        key: 'refund',
        title: '申请退款',
        variant: 'outline',
      },
    ],
  });
});

test('buildOrderDetailFooterModel returns single back action for refunded order', () => {
  const model = buildOrderDetailFooterModel({
    status: 'REFUNDED',
  });

  assert.deepEqual(model, {
    layout: 'single',
    actions: [
      {
        key: 'back',
        title: '返回',
        variant: 'outline',
      },
    ],
  });
});

test('getOrderDetailFooterActionStyle switches style by layout', () => {
  const styles = {
    footerButton: { flex: 1 },
    fullWidthButton: { width: 100 },
  };

  assert.deepEqual(getOrderDetailFooterActionStyle('split', styles), { flex: 1 });
  assert.deepEqual(getOrderDetailFooterActionStyle('single', styles), { width: 100 });
});
