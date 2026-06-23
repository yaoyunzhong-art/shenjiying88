import assert from 'node:assert/strict';
import test from 'node:test';
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
