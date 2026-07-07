/**
 * Test for license-renewal API layer
 */
import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { renewalApi } from './api';

describe('renewalApi', () => {
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

  it('handles API error gracefully', async () => {
    mock.method(global, 'fetch', async () =>
      new Response(null, { status: 500 })
    );

    const result = await renewalApi.getStrategies();
    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('500'));
  });
});
