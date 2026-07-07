import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict';
import { ConfigService } from '@nestjs/config';
import { SandboxLytAdapter } from './sandbox-lyt.adapter';

it('SandboxLytAdapter calls sandbox member endpoint', async () => {
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const url = String(input);
    const headers = init?.headers as Record<string, string>;
    assert.equal(url, 'https://sandbox.lyt.local/members/member-001');
    assert.equal(headers['x-lyt-mode'], 'sandbox');
    assert.equal(typeof headers['x-lyt-signature'], 'string');
    assert.equal(typeof headers['x-lyt-request-id'], 'string');
    assert.equal(headers['x-lyt-retry-attempt'], '0');
    assert.ok(init?.signal);

    return new Response(JSON.stringify({ member_id: 'member-001', nick_name: 'Sandbox Member', level_code: 'SILVER' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof fetch;

  const adapter = new SandboxLytAdapter(new ConfigService());
  const member = await adapter.getMember('member-001');

  assert.equal(adapter.adapterMode, 'sandbox');
  assert.equal(member.memberId, 'member-001');
  assert.equal(member.nickname, 'Sandbox Member');
  assert.equal(member.levelName, 'SILVER');
});

it('SandboxLytAdapter posts order payload to sandbox endpoint', async () => {
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const url = String(input);
    assert.equal(url, 'https://sandbox.lyt.local/orders');
    assert.equal(init?.method, 'POST');
    assert.deepEqual(JSON.parse(String(init?.body)), {
      store_id: 'store-001',
      lines: [{ sku_id: 'sku-001', qty: 2, unit_price: 44 }]
    });

    return new Response(JSON.stringify({ order_id: 'sandbox-001', amount: 88, payable_amount: 88, status: 'INIT' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof fetch;

  const adapter = new SandboxLytAdapter(new ConfigService());
  const result = await adapter.createOrder({
    storeId: 'store-001',
    items: [{ skuId: 'sku-001', quantity: 2, price: 44 }]
  });

  assert.equal(result.orderId, 'sandbox-001');
  assert.equal(result.totalAmount, 88);
  assert.equal(result.status, 'CREATED');
});

it('SandboxLytAdapter retries retryable failures before succeeding', async () => {
  let attempts = 0;

  globalThis.fetch = (async (_input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    attempts += 1;
    const headers = init?.headers as Record<string, string>;
    assert.equal(headers['x-lyt-retry-attempt'], String(attempts - 1));

    if (attempts < 3) {
      return new Response(JSON.stringify({ code: 'TEMP_UNAVAILABLE', message: 'retry later' }), {
        status: 503,
        headers: { 'content-type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ store_id: 'store-rt', pass_result: 'ALLOWED' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof fetch;

  const adapter = new SandboxLytAdapter(new ConfigService());
  const result = await adapter.syncGateEvent('store-rt', 'pass-001');

  assert.equal(attempts, 3);
  assert.equal(result.accepted, true);
  assert.equal(result.storeId, 'store-rt');
});

it('SandboxLytAdapter honors ConfigService endpoint override', async () => {
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
    assert.equal(String(input), 'https://sandbox-override.lyt.local/devices/device-007/status');

    return new Response(JSON.stringify({ device_id: 'device-007', device_status: 'ONLINE' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  }) as typeof fetch;

  const adapter = new SandboxLytAdapter(
    new ConfigService({
      lyt: {
        adapters: {
          sandbox: {
            baseUrl: 'https://sandbox-override.lyt.local'
          }
        }
      }
    })
  );
  const result = await adapter.getDeviceStatus('device-007');

  assert.equal(result.deviceId, 'device-007');
  assert.equal(result.status, 'ONLINE');
});
