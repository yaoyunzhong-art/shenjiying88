import assert from 'node:assert/strict';
import test from 'node:test';
import { ConfigService } from '@nestjs/config';
import { RealLytAdapter } from './real-lyt.adapter';
import { LytAdapterHttpError } from './http-lyt.adapter.base';

test('RealLytAdapter calls production-style member endpoint', async () => {
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const url = String(input);
    const headers = init?.headers as Record<string, string>;
    assert.equal(url, 'https://api.lyt.local/members/member-009');
    assert.equal(headers['x-lyt-mode'], 'real');
    assert.equal(typeof headers['x-lyt-signature'], 'string');
    assert.equal(headers['x-lyt-retry-attempt'], '0');

    return new Response(
      JSON.stringify({ member_id: 'member-009', nick_name: 'Real Member', mobile: '13900000000', level_name: 'GOLD' }),
      {
      status: 200,
      headers: { 'content-type': 'application/json' }
      }
    );
  }) as typeof fetch;

  const adapter = new RealLytAdapter(new ConfigService());
  const member = await adapter.getMember('member-009');

  assert.equal(adapter.adapterMode, 'real');
  assert.equal(member.memberId, 'member-009');
  assert.equal(member.nickname, 'Real Member');
  assert.equal(member.mobile, '13900000000');
  assert.equal(member.levelName, 'GOLD');
});

test('RealLytAdapter calls production-style device endpoint', async () => {
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
    const url = String(input);
    assert.equal(url, 'https://api.lyt.local/devices/device-prod-1/status');

    return new Response(JSON.stringify({ device_id: 'device-prod-1', device_status: 'ONLINE' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof fetch;

  const adapter = new RealLytAdapter(new ConfigService());
  const status = await adapter.getDeviceStatus('device-prod-1');

  assert.equal(status.deviceId, 'device-prod-1');
  assert.equal(status.status, 'ONLINE');
});

test('RealLytAdapter maps non-retryable http errors into LytAdapterHttpError', async () => {
  globalThis.fetch = (async () => {
    return new Response(JSON.stringify({ code: 'VALIDATION_FAILED', message: 'invalid coupon' }), {
      status: 422,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof fetch;

  const adapter = new RealLytAdapter(new ConfigService());

  await assert.rejects(
    () => adapter.applyDiscount('order-1', 'BAD'),
    (error: unknown) => {
      assert.ok(error instanceof LytAdapterHttpError);
      assert.equal(error.adapterMode, 'real');
      assert.equal(error.code, 'LYT_VALIDATION_ERROR');
      assert.equal(error.retryable, false);
      assert.equal(error.status, 422);
      return true;
    }
  );
});

test('RealLytAdapter maps standard order payload into vendor request and standard result', async () => {
  globalThis.fetch = (async (_input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    assert.deepEqual(JSON.parse(String(init?.body)), {
      store_id: 'store-1',
      member_id: 'member-1',
      lines: [{ sku_id: 'sku-1', qty: 1, unit_price: 99 }]
    });

    return new Response(JSON.stringify({ order_id: 'order-1', amount: 99, payable_amount: 79, status: 'SUCCESS' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof fetch;

  const adapter = new RealLytAdapter(new ConfigService());
  const result = await adapter.createOrder({
    storeId: 'store-1',
    memberId: 'member-1',
    items: [{ skuId: 'sku-1', quantity: 1, price: 99 }]
  });

  assert.deepEqual(result, {
    orderId: 'order-1',
    totalAmount: 79,
    status: 'PAID'
  });
});

test('RealLytAdapter maps repeated timeout failures into retryable timeout error', async () => {
  let attempts = 0;

  globalThis.fetch = (async () => {
    attempts += 1;
    const error = new Error('request timeout');
    error.name = 'TimeoutError';
    throw error;
  }) as typeof fetch;

  const adapter = new RealLytAdapter(new ConfigService());

  await assert.rejects(
    () => adapter.getDeviceStatus('device-timeout'),
    (error: unknown) => {
      assert.ok(error instanceof LytAdapterHttpError);
      assert.equal(error.code, 'LYT_TIMEOUT');
      assert.equal(error.retryable, true);
      return true;
    }
  );

  assert.equal(attempts, 2);
});
