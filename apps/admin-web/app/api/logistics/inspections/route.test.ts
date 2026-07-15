import { describe, it } from 'node:test';
import assert from 'node:assert';

const BASE = 'http://localhost:3000';
const TENANT = 'tenant-p30';

describe('inspections proxy', () => {
  it('GET /api/logistics/inspections 应返回列表', async () => {
    const res = await fetch(`${BASE}/api/logistics/inspections`, {
      headers: { 'x-tenant-id': TENANT },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });

  it('POST /api/logistics/inspections 应创建巡检', async () => {
    const res = await fetch(`${BASE}/api/logistics/inspections`, {
      method: 'POST',
      headers: { 'x-tenant-id': TENANT, 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipmentName: 'VR-01', assigneeName: '王工', scheduledAt: new Date().toISOString() }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.id);
  });

  it('应支持状态过滤', async () => {
    const res = await fetch(`${BASE}/api/logistics/inspections?status=scheduled`, {
      headers: { 'x-tenant-id': TENANT },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
  });
});
