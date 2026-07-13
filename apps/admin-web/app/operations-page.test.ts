import assert from 'node:assert/strict';
import { describe, it, test } from 'node:test';
import { adminRuntimeOperationDetails, adminRuntimeOperationsPreset, adminRuntimeOperationsRoute } from './operations-data';

test('admin operations route: exposes shared list/detail route contract', () => {
  assert.equal(adminRuntimeOperationsRoute.href, '/operations');
  assert.equal(adminRuntimeOperationsRoute.detailHrefBase, '/operations');
  assert.equal(adminRuntimeOperationsRoute.backHref, '/operations');
  assert.equal(adminRuntimeOperationsRoute.title, '治理操作中心');
  assert.match(adminRuntimeOperationsRoute.description, /审批执行/);
});

test('admin operations route: reuses shared admin preset and detail mock data', () => {
  assert.equal(adminRuntimeOperationsPreset.labels?.statusSectionTitle, '治理状态');
  assert.deepEqual(adminRuntimeOperationsPreset.searchFields, ['id', 'type', 'targetId', 'status']);
  assert.equal(adminRuntimeOperationsPreset.includeColumns?.includes('targetId'), true);
  assert.equal(adminRuntimeOperationDetails['op-1']?.op.type, 'runtime-replay');
  assert.equal(adminRuntimeOperationDetails['op-2']?.op.type, 'secret-rotation');
  assert.equal(adminRuntimeOperationDetails['op-3']?.op.status, 'failed');
});

test('admin operations route: notFound message embeds operation id', () => {
  assert.equal(adminRuntimeOperationsRoute.emptyMessage('op-404'), '治理操作 op-404 不存在');
});

describe('operations-page — 正例·正例结构', () => {
  it('adminRuntimeOperationsRoute 应包含所有必需字段', () => {
    const expected = ['href', 'detailHrefBase', 'backHref', 'title', 'description', 'emptyMessage'];
    for (const key of expected) {
      assert.ok(key in adminRuntimeOperationsRoute, `缺少字段: ${key}`);
    }
  });
  it('adminRuntimeOperationsPreset 应包含 searchFields', () => {
    assert.ok(Array.isArray(adminRuntimeOperationsPreset.searchFields));
    assert.ok(adminRuntimeOperationsPreset.searchFields.length > 0);
  });
  it('adminRuntimeOperationsPreset 应包含 labels', () => {
    assert.ok(adminRuntimeOperationsPreset.labels);
    assert.ok(typeof adminRuntimeOperationsPreset.labels === 'object');
  });
  it('adminRuntimeOperationsPreset.labels 应包含 statusSectionTitle', () => {
    assert.ok(typeof adminRuntimeOperationsPreset.labels.statusSectionTitle === 'string');
  });
  it('detailHrefBase 应不含 protocol', () => {
    assert.ok(!adminRuntimeOperationsRoute.detailHrefBase.startsWith('http'));
  });
});

describe('operations-page — 正例·mock数据', () => {
  it('adminRuntimeOperationDetails 应包含 op-1', () => {
    assert.ok(adminRuntimeOperationDetails['op-1']);
  });
  it('adminRuntimeOperationDetails 应包含 op-2', () => {
    assert.ok(adminRuntimeOperationDetails['op-2']);
  });
  it('adminRuntimeOperationDetails 应包含 op-3', () => {
    assert.ok(adminRuntimeOperationDetails['op-3']);
  });
  it('adminRuntimeOperationDetails["op-1"] 应含 op.type', () => {
    assert.ok(typeof adminRuntimeOperationDetails['op-1'].op.type === 'string');
  });
  it('adminRuntimeOperationDetails["op-3"] 应为 failed', () => {
    assert.equal(adminRuntimeOperationDetails['op-3'].op.status, 'failed');
  });
  it('preset.includeColumns 应包含 type', () => {
    assert.ok(adminRuntimeOperationsPreset.includeColumns.includes('type'));
  });
  it('preset.includeColumns 应包含 targetId', () => {
    assert.ok(adminRuntimeOperationsPreset.includeColumns.includes('targetId'));
  });
  it('preset.includeColumns 应包含 createdAt', () => {
    assert.ok(adminRuntimeOperationsPreset.includeColumns.includes('createdAt'));
  });
  it('preset.includeColumns 应包含 id', () => {
    assert.ok(adminRuntimeOperationsPreset.includeColumns.includes('id'));
  });
});

describe('operations-page — 边界·防御', () => {
  it('emptyMessage 应正确拼入 id', () => {
    const id = 'non-existent-id';
    const msg = adminRuntimeOperationsRoute.emptyMessage(id);
    assert.ok(msg.includes(id));
  });
  it('emptyMessage 应非空', () => {
    assert.ok(adminRuntimeOperationsRoute.emptyMessage('test').length > 0);
  });
  it('emptyMessage 不应包含 undefined', () => {
    assert.ok(!adminRuntimeOperationsRoute.emptyMessage('test').includes('undefined'));
  });
  it('操作详情条目应含 detail 字段', () => {
    const keys = Object.keys(adminRuntimeOperationDetails);
    for (const k of keys) {
      assert.ok(adminRuntimeOperationDetails[k]);
      assert.ok(typeof adminRuntimeOperationDetails[k] === 'object');
    }
  });
});

describe('operations-page — 反例', () => {
  it('不存在的操作应返回非匹配消息', () => {
    const msg = adminRuntimeOperationsRoute.emptyMessage('op-9999');
    assert.ok(msg.includes('不存在'));
  });
  it('空字符串作为 emptyMessage 参数应正常工作', () => {
    const msg = adminRuntimeOperationsRoute.emptyMessage('');
    assert.ok(typeof msg === 'string');
    assert.ok(msg.length > 0);
  });
});

describe('operations-page — 正例-pages扩展', () => {
  it('emptyMessage 应接受带特殊字符的 id', () => {
    const msg = adminRuntimeOperationsRoute.emptyMessage('op_123-ABC');
    assert.ok(msg.includes('op_123-ABC'));
  });

  it('adminRuntimeOperationsPreset.labels 应包含 searchPlaceholder', () => {
    assert.ok(typeof adminRuntimeOperationsPreset.labels.searchPlaceholder === 'string');
  });

  it('adminRuntimeOperationsPreset.labels 应包含 all', () => {
    assert.ok(typeof adminRuntimeOperationsPreset.labels.all === 'string');
  });

  it('adminRuntimeOperationsPreset.labels 应包含 typeSectionTitle', () => {
    assert.ok(typeof adminRuntimeOperationsPreset.labels.typeSectionTitle === 'string');
  });
});

describe('operations-page — 边界-time', () => {
  it('all operations have non-empty id', () => {
    const ops = Object.values(adminRuntimeOperationDetails);
    for (const detail of ops) {
      assert.ok(detail.op.id && detail.op.id.length > 0, `操作缺少 id`);
    }
  });

  it('op.type 应为已知类型之一', () => {
    const known = ['runtime-replay', 'secret-rotation', 'approval-execution'];
    const ops = Object.values(adminRuntimeOperationDetails);
    for (const detail of ops) {
      assert.ok(known.includes(detail.op.type), `未知 op.type: ${detail.op.type}`);
    }
  });

  it('createdAt exists for all operations', () => {
    const ops = Object.values(adminRuntimeOperationDetails);
    for (const detail of ops) {
      assert.ok(detail.op.createdAt, `${detail.op.id}: 缺少 createdAt`);
    }
  });

  it('all operations have valid status', () => {
    const knownStatuses = ['running', 'completed', 'failed', 'pending'];
    const ops = Object.values(adminRuntimeOperationDetails);
    for (const detail of ops) {
      assert.ok(knownStatuses.includes(detail.op.status), `${detail.op.id}: 未知 status ${detail.op.status}`);
    }
  });
});
