import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfigurationOperationDetailParam } from '@m5/types';
import {
  buildConfigurationOperationDetailHref,
  buildConfigurationOperationDeepLinks,
  getConfigurationOperationApprovalLabel,
  getConfigurationOperationApprovalVariant,
  loadConfigurationOperationDetail
} from './configuration-operation-view-model';
import type { ConfigurationGovernanceMetadataEntry } from '@m5/types';

function buildEntry(
  operation: string,
  overrides: Partial<ConfigurationGovernanceMetadataEntry> = {}
): ConfigurationGovernanceMetadataEntry {
  return {
    operation,
    rbac: {
      resource: 'configuration-governance',
      action: 'fallback-read',
      requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN'],
      requiredPermissions: ['foundation.governance.read']
    },
    approval: {
      required: false,
      approvalId: null,
      version: null,
      requestedBy: null,
      ticket: null,
      status: 'NOT_REQUIRED',
      submitted: false,
      persisted: false,
      decidedBy: null,
      decidedAt: null,
      updatedAt: null,
      execution: {
        attempts: 0,
        executed: false,
        executionStatus: null,
        executedAt: null,
        executedBy: null
      }
    },
    ...overrides
  };
}

function mockFetchOnce(payload: unknown, status = 200) {
  return async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      statusText: 'OK',
      json: async () => ({ code: 'OK', message: '', data: payload }),
      text: async () => JSON.stringify({ code: 'OK', message: '', data: payload })
    }) as Response;
}

test('configuration-operation-view-model: buildConfigurationOperationDetailHref encodes the operation', () => {
  assert.equal(
    buildConfigurationOperationDetailHref('secret.register'),
    '/configuration/operations/secret.register'
  );
  assert.equal(
    buildConfigurationOperationDetailHref('config entry/with space'),
    '/configuration/operations/config%20entry%2Fwith%20space'
  );
});

test('configuration-operation-view-model: readConfigurationOperationDetailParam decodes array/string/empty', () => {
  assert.equal(readConfigurationOperationDetailParam('secret.register'), 'secret.register');
  assert.equal(readConfigurationOperationDetailParam(['secret.register']), 'secret.register');
  assert.equal(readConfigurationOperationDetailParam(['secret.register', 'ignored']), 'secret.register');
  assert.equal(readConfigurationOperationDetailParam(undefined), null);
  assert.equal(readConfigurationOperationDetailParam([]), null);
  assert.equal(readConfigurationOperationDetailParam('config%20entry'), 'config entry');
});

test('configuration-operation-view-model: approval status labels cover the canonical states', () => {
  assert.equal(getConfigurationOperationApprovalLabel('PENDING'), '审批中');
  assert.equal(getConfigurationOperationApprovalLabel('APPROVED'), '已通过');
  assert.equal(getConfigurationOperationApprovalLabel('REJECTED'), '已驳回');
  assert.equal(getConfigurationOperationApprovalLabel('NOT_REQUIRED'), '无需审批');
  assert.equal(getConfigurationOperationApprovalLabel('SUPERSEDED'), '已替代');
  assert.equal(getConfigurationOperationApprovalVariant('REJECTED'), 'danger');
  assert.equal(getConfigurationOperationApprovalVariant('APPROVED'), 'success');
  assert.equal(getConfigurationOperationApprovalVariant('PENDING'), 'warning');
});

test('configuration-operation-view-model: buildConfigurationOperationDeepLinks maps required approval to PENDING filter', () => {
  const entry = buildEntry('secret.register', {
    approval: {
      required: true,
      approvalId: 'approval-001',
      version: 2,
      requestedBy: 'admin',
      ticket: 'ticket-001',
      status: 'PENDING',
      submitted: true,
      persisted: true,
      decidedBy: null,
      decidedAt: null,
      updatedAt: '2026-06-20T00:00:00.000Z',
      execution: {
        attempts: 1,
        executed: false,
        executionStatus: null,
        executedAt: null,
        executedBy: null
      }
    }
  });
  const links = buildConfigurationOperationDeepLinks(entry, { consumer: 'admin' });
  assert.equal(links.operationHref, '/configuration/operations/secret.register');
  assert.match(links.auditHref, /source=configuration-governance/);
  assert.match(links.auditHref, /purpose=configuration-secret\.register/);
  assert.equal(links.foundationHref, '/foundation?moduleKey=configuration-governance&consumer=admin');
  assert.equal(links.approvalsHref, '/approvals?status=PENDING');
  assert.equal(links.workspaceHref, '/configuration');
});

test('configuration-operation-view-model: buildConfigurationOperationDeepLinks falls back to ALL when not PENDING', () => {
  const entry = buildEntry('secret.rotate', {
    approval: {
      required: true,
      approvalId: 'approval-002',
      version: 1,
      requestedBy: 'admin',
      ticket: 'ticket-002',
      status: 'APPROVED',
      submitted: true,
      persisted: true,
      decidedBy: 'security',
      decidedAt: '2026-06-20T01:00:00.000Z',
      updatedAt: '2026-06-20T01:00:00.000Z',
      execution: {
        attempts: 1,
        executed: true,
        executionStatus: 'ok',
        executedAt: '2026-06-20T01:00:01.000Z',
        executedBy: 'security'
      }
    }
  });
  const links = buildConfigurationOperationDeepLinks(entry);
  assert.equal(links.approvalsHref, '/approvals?status=ALL');
});

test('configuration-operation-view-model: buildConfigurationOperationDeepLinks threads scope into workspace href', () => {
  const entry = buildEntry('config-entry.write');
  const links = buildConfigurationOperationDeepLinks(entry, {
    tenantId: 'tenant-A',
    brandId: 'brand-A',
    storeId: 'store-001',
    marketCode: 'cn-mainland'
  });
  assert.equal(
    links.workspaceHref,
    '/configuration?tenantId=tenant-A&brandId=brand-A&storeId=store-001&marketCode=cn-mainland'
  );
});

test('configuration-operation-view-model: loadConfigurationOperationDetail returns fallback for empty operation', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetchOnce([]);
  try {
    const snapshot = await loadConfigurationOperationDetail('');
    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.entry, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-operation-view-model: loadConfigurationOperationDetail returns API delivery with matched entry', async () => {
  const entry = buildEntry('feature-flag.write', {
    rbac: {
      resource: 'configuration-governance',
      action: 'feature-flag.write',
      requiredRoles: ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS'],
      requiredPermissions: ['configuration.feature-flag.write']
    }
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetchOnce([entry, buildEntry('secret.register')]);
  try {
    const snapshot = await loadConfigurationOperationDetail('feature-flag.write');
    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.notFound, false);
    assert.ok(snapshot.entry, 'matched entry should be present');
    assert.equal(snapshot.entry.operation, 'feature-flag.write');
    assert.equal(snapshot.related.length, 1);
    assert.equal(snapshot.related[0]?.operation, 'secret.register');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-operation-view-model: loadConfigurationOperationDetail flags notFound when operation is missing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mockFetchOnce([buildEntry('config-entry.write')]);
  try {
    const snapshot = await loadConfigurationOperationDetail('secret.rotate');
    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.notFound, true);
    assert.equal(snapshot.entry, null);
    assert.equal(snapshot.related.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('configuration-operation-view-model: loadConfigurationOperationDetail falls back when fetch rejects', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => {
    throw new Error('network down');
  }) as typeof fetch;
  try {
    const snapshot = await loadConfigurationOperationDetail('secret.register');
    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.notFound, false);
    assert.ok(snapshot.entry, 'entry should be present in fallback');
    assert.equal(snapshot.entry.operation, 'secret.register');
    assert.equal(snapshot.entry.rbac.resource, 'configuration-governance');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
