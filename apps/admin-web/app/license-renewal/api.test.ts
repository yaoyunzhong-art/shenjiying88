/**
 * Test for license-renewal API layer
 * 覆盖: 正例·反例·边界·所有 API 方法
 */
import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { renewalApi } from './api';

describe('renewalApi', () => {
  // ---- 正例 ----

  it('getStrategies calls correct endpoint', async () => {
    const mockData = [{ id: '1', name: 'Basic' }];
    mock.method(global, 'fetch', async () =>
      new Response(JSON.stringify({ success: true, data: mockData }), { status: 200 })
    );

    const result = await renewalApi.getStrategies();
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(result.data, mockData);
  });

  it('getRecords sends pagination params', async () => {
    const mockResponse = { list: [], total: 0, page: 1, pageSize: 10 };
    mock.method(global, 'fetch', async (url: string) => {
      assert.ok(url.includes('page=1'));
      assert.ok(url.includes('pageSize=10'));
      return new Response(JSON.stringify({ success: true, data: mockResponse }), { status: 200 });
    });

    const result = await renewalApi.getRecords({ page: 1, pageSize: 10 });
    assert.strictEqual(result.success, true);
  });

  it('getRecords sends optional filter params', async () => {
    mock.method(global, 'fetch', async (url: string) => {
      assert.ok(url.includes('status=active'));
      assert.ok(url.includes('licenseName=Pro'));
      assert.ok(url.includes('startDate=2026-01-01'));
      assert.ok(url.includes('endDate=2026-12-31'));
      return new Response(JSON.stringify({ success: true, data: { list: [], total: 0, page: 1, pageSize: 10 } }), { status: 200 });
    });

    await renewalApi.getRecords({ page: 1, pageSize: 10, status: 'active', licenseName: 'Pro', dateRange: ['2026-01-01', '2026-12-31'] });
  });

  it('createStrategy sends POST with body', async () => {
    const dto = { name: 'Pro', price: 299, duration: 12, durationUnit: 'month' as const, maxUsers: 100, maxStores: 10, isActive: true };
    mock.method(global, 'fetch', async (_url: string, opts: RequestInit) => {
      assert.strictEqual(opts.method, 'POST');
      const body = JSON.parse(opts.body as string);
      assert.strictEqual(body.name, 'Pro');
      return new Response(JSON.stringify({ success: true, data: { id: '123', ...dto } }), { status: 200 });
    });

    const result = await renewalApi.createStrategy(dto);
    assert.strictEqual(result.success, true);
  });

  it('getStrategyById fetches a single strategy', async () => {
    const mockData = { id: 'strategy-1', name: 'Basic' };
    mock.method(global, 'fetch', async (url: string) => {
      assert.ok(url.includes('strategy-1'));
      return new Response(JSON.stringify({ success: true, data: mockData }), { status: 200 });
    });

    const result = await renewalApi.getStrategyById('strategy-1');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.id, 'strategy-1');
  });

  it('updateStrategy sends PUT with body', async () => {
    const update = { name: 'Advanced', price: 599 };
    mock.method(global, 'fetch', async (_url: string, opts: RequestInit) => {
      assert.strictEqual(opts.method, 'PUT');
      const body = JSON.parse(opts.body as string);
      assert.strictEqual(body.name, 'Advanced');
      return new Response(JSON.stringify({ success: true, data: { id: 'strategy-1', ...update } }), { status: 200 });
    });

    const result = await renewalApi.updateStrategy('strategy-1', update);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.name, 'Advanced');
  });

  it('deleteStrategy sends DELETE', async () => {
    mock.method(global, 'fetch', async (url: string, opts: RequestInit) => {
      assert.ok(url.includes('strategy-1'));
      assert.strictEqual(opts.method, 'DELETE');
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });

    const result = await renewalApi.deleteStrategy('strategy-1');
    assert.strictEqual(result.success, true);
  });

  it('toggleAutoRenewal sends PATCH with enabled flag', async () => {
    mock.method(global, 'fetch', async (url: string, opts: RequestInit) => {
      assert.ok(url.includes('auto-renewal'));
      assert.strictEqual(opts.method, 'PATCH');
      const body = JSON.parse(opts.body as string);
      assert.strictEqual(body.enabled, true);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });

    const result = await renewalApi.toggleAutoRenewal('license-1', true);
    assert.strictEqual(result.success, true);
  });

  // ---- 反例 ----

  it('handles API error gracefully (500)', async () => {
    mock.method(global, 'fetch', async () =>
      new Response(null, { status: 500 })
    );

    const result = await renewalApi.getStrategies();
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('500'));
  });

  it('handles network error gracefully', async () => {
    mock.method(global, 'fetch', async () => { throw new Error('Network failure'); });

    const result = await renewalApi.getStrategyById('nonexistent');
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('Network'));
  });

  it('handles 404 for single strategy', async () => {
    mock.method(global, 'fetch', async () =>
      new Response(null, { status: 404 })
    );

    const result = await renewalApi.getStrategyById('not-found');
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('404'));
  });

  it('handles delete on non-existent strategy', async () => {
    mock.method(global, 'fetch', async () =>
      new Response(null, { status: 404 })
    );

    const result = await renewalApi.deleteStrategy('no-such-strategy');
    assert.strictEqual(result.success, false);
  });

  // ---- 边界 ----

  it('handles empty records list gracefully', async () => {
    mock.method(global, 'fetch', async () =>
      new Response(JSON.stringify({ success: true, data: { list: [], total: 0, page: 1, pageSize: 10 } }), { status: 200 })
    );

    const result = await renewalApi.getRecords({ page: 1, pageSize: 10 });
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.list.length, 0);
  });

  it('toggleAutoRenewal sends disabled flag', async () => {
    mock.method(global, 'fetch', async (_url: string, opts: RequestInit) => {
      const body = JSON.parse(opts.body as string);
      assert.strictEqual(body.enabled, false);
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });

    const result = await renewalApi.toggleAutoRenewal('license-1', false);
    assert.strictEqual(result.success, true);
  });
});
