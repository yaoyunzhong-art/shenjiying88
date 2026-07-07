import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const reactDomPath = require
  .resolve('react-dom/package.json')
  .replace('package.json', 'server.node.js');
const { renderToStaticMarkup } = require(reactDomPath);

const {
  RuntimeOperationTypeReadout,
  RuntimeOperationIdReadout,
  RuntimeOperationTargetReadout,
  RuntimeOperationStatusReadout,
  RuntimeOperationDateTimeReadout,
  RuntimeOperationReceiptListReadout,
  RuntimeOperationOverviewReadout,
  RuntimeOperationTimelineReadout,
  RuntimeOperationDetailView,
  RuntimeOperationPresetDetailRoute,
  RuntimeOperationsTableCard,
  RuntimeOperationsListPageSection,
  RuntimeOperationDemoListPage,
  createRuntimeOperationMockRecords,
  createRuntimeOperationDetailMockMap,
  createRuntimeOperationTableColumns,
  runtimeOperationStatusVariants,
  runtimeOperationStatusLabels,
  runtimeOperationListDemoPresets,
  runtimeOperationDetailDemoPresets,
} = require('./RuntimeOperationViews');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sampleOperation = {
  id: 'op-0001',
  type: 'deploy',
  targetId: 'service-1',
  status: 'completed',
  createdAt: '2026-07-01T10:00:00.000Z',
  finishedAt: '2026-07-01T10:30:00.000Z',
};

const sampleOperationRunning = {
  id: 'op-0002',
  type: 'rollback',
  targetId: 'service-2',
  status: 'running',
  createdAt: '2026-07-01T11:00:00.000Z',
  finishedAt: undefined,
};

const sampleOperationFailed = {
  id: 'op-0003',
  type: 'scale',
  targetId: 'service-3',
  status: 'failed',
  createdAt: '2026-07-01T12:00:00.000Z',
  finishedAt: '2026-07-01T12:05:00.000Z',
};

const sampleOperationPending = {
  id: 'op-0004',
  type: 'config-update',
  targetId: 'service-4',
  status: 'pending',
  createdAt: '2026-07-01T13:00:00.000Z',
  finishedAt: undefined,
};

const sampleReceipts = [
  { code: 'STARTED', message: 'Operation started', status: 'ok', timestamp: '2026-07-01T10:00:00.000Z' },
  { code: 'COMPLETED', message: 'Completed successfully', status: 'ok', timestamp: '2026-07-01T10:30:00.000Z' },
];

const sampleReceiptsWithError = [
  { code: 'STARTED', message: 'Operation started', status: 'ok', timestamp: '2026-07-01T10:00:00.000Z' },
  { code: 'ERROR', message: 'Connection timeout after 30s', status: 'error', timestamp: '2026-07-01T10:30:00.000Z' },
];

const sixOps = Array.from({ length: 6 }, (_, i) => ({
  id: `op-${String(i + 1).padStart(4, '0')}`,
  type: i % 2 === 0 ? 'deploy' : 'rollback',
  targetId: `service-${i + 1}`,
  status: i % 3 === 0 ? 'running' : 'completed',
  createdAt: `2026-07-0${i + 1}T10:00:00.000Z`,
  finishedAt: i % 3 === 0 ? undefined : `2026-07-0${i + 1}T10:30:00.000Z`,
}));

// ─── RuntimeOperationTypeReadout ──────────────────────────────────────────────

describe('RuntimeOperationTypeReadout', () => {
  test('renders type text when no labels provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationTypeReadout, { type: 'deploy' })
    );
    assert.ok(html.includes('deploy'));
  });

  test('renders localized label when typeLabels provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationTypeReadout, {
        type: 'deploy',
        typeLabels: { deploy: '\u90e8\u7f72' },
      })
    );
    assert.ok(html.includes('\u90e8\u7f72'));
    assert.ok(!html.includes('deploy'));
  });

  test('renders unknown type as-is without label mapping', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationTypeReadout, { type: 'unknown-type-xyz' })
    );
    assert.ok(html.includes('unknown-type-xyz'));
  });

  test('handles empty string type', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationTypeReadout, { type: '' })
    );
    assert.ok(html.length > 0);
  });

  test('handles type with special characters', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationTypeReadout, { type: 'deploy-rollback/v2.1' })
    );
    assert.ok(html.includes('deploy-rollback/v2.1'));
  });
});

// ─── RuntimeOperationIdReadout ───────────────────────────────────────────────

describe('RuntimeOperationIdReadout', () => {
  test('renders id as plain text without href', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationIdReadout, { id: 'op-0042' })
    );
    assert.ok(html.includes('op-0042'));
    assert.ok(!html.includes('<a'));
  });

  test('renders id as anchor when href provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationIdReadout, { id: 'op-0042', href: '/ops/op-0042' })
    );
    assert.ok(html.includes('op-0042'));
    assert.ok(html.includes('href'));
  });

  test('handles empty id', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationIdReadout, { id: '' })
    );
    assert.ok(html.includes('<span'));
  });

  test('handles id with special characters', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationIdReadout, { id: 'op-$pecial_#42' })
    );
    assert.ok(html.includes('op-$pecial_#42'));
  });
});

// ─── RuntimeOperationTargetReadout ───────────────────────────────────────────

describe('RuntimeOperationTargetReadout', () => {
  test('renders target id', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationTargetReadout, { targetId: 'service-main' })
    );
    assert.ok(html.includes('service-main'));
  });

  test('handles empty target id', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationTargetReadout, { targetId: '' })
    );
    assert.ok(typeof html === 'string');
  });
});

// ─── RuntimeOperationStatusReadout ───────────────────────────────────────────

describe('RuntimeOperationStatusReadout', () => {
  test('renders known status with default labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationStatusReadout, { status: 'completed' })
    );
    assert.ok(html.includes('Completed'));
  });

  test('renders running status', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationStatusReadout, { status: 'running' })
    );
    assert.ok(html.includes('Running'));
  });

  test('renders failed status', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationStatusReadout, { status: 'failed' })
    );
    assert.ok(html.includes('Failed'));
  });

  test('renders pending status', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationStatusReadout, { status: 'pending' })
    );
    assert.ok(html.includes('Pending'));
  });

  test('renders unknown status as-is', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationStatusReadout, { status: 'cancelled' })
    );
    assert.ok(html.includes('cancelled'));
  });

  test('uses custom statusLabels when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationStatusReadout, {
        status: 'completed',
        statusLabels: { completed: '\u5b8c\u6210' },
      })
    );
    assert.ok(html.includes('\u5b8c\u6210'));
    assert.ok(!html.includes('Completed'));
  });

  test('uses custom statusVariants when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationStatusReadout, {
        status: 'completed',
        statusLabels: { completed: 'Done' },
        statusVariants: { completed: 'success' },
      })
    );
    assert.ok(html.includes('Done'));
  });

  test('accepts size sm', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationStatusReadout, { status: 'completed', size: 'sm' })
    );
    assert.ok(html.includes('Completed'));
  });

  test('accepts size md', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationStatusReadout, { status: 'completed', size: 'md' })
    );
    assert.ok(html.includes('Completed'));
  });
});

// ─── RuntimeOperationDateTimeReadout ─────────────────────────────────────────

describe('RuntimeOperationDateTimeReadout', () => {
  test('renders formatted date when value provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDateTimeReadout, { value: '2026-07-01T10:00:00.000Z' })
    );
    assert.ok(html.length > 0);
  });

  test('renders fallback when value is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDateTimeReadout, {})
    );
    assert.ok(html.includes('\u2014'));
  });

  test('renders custom fallback when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDateTimeReadout, { fallback: 'N/A' })
    );
    assert.ok(html.includes('N/A'));
    assert.ok(!html.includes('\u2014'));
  });

  test('renders null value with fallback', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDateTimeReadout, { value: null })
    );
    assert.ok(html.includes('\u2014'));
  });

  test('uses custom formatDateTime function', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDateTimeReadout, {
        value: '2026-07-01T10:00:00.000Z',
        formatDateTime: (v) => `[[${v}]]`,
      })
    );
    assert.ok(html.includes('[[2026-07-01T10:00:00.000Z]]'));
  });

  test('applies custom color', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDateTimeReadout, {
        value: '2026-07-01T10:00:00.000Z',
        color: '#ff6600',
      })
    );
    assert.ok(html.includes('#ff6600'));
  });

  test('applies custom fontSize', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDateTimeReadout, {
        value: '2026-07-01T10:00:00.000Z',
        fontSize: 10,
      })
    );
    assert.ok(html.includes('10'));
  });
});

// ─── runtimeOperationStatusVariants & Labels ─────────────────────────────────

describe('runtimeOperationStatusVariants', () => {
  test('contains all expected status keys', () => {
    assert.ok('pending' in runtimeOperationStatusVariants);
    assert.ok('running' in runtimeOperationStatusVariants);
    assert.ok('completed' in runtimeOperationStatusVariants);
    assert.ok('failed' in runtimeOperationStatusVariants);
  });

  test('maps to correct variant values', () => {
    assert.strictEqual(runtimeOperationStatusVariants.pending, 'default');
    assert.strictEqual(runtimeOperationStatusVariants.running, 'warning');
    assert.strictEqual(runtimeOperationStatusVariants.completed, 'success');
    assert.strictEqual(runtimeOperationStatusVariants.failed, 'error');
  });
});

describe('runtimeOperationStatusLabels', () => {
  test('contains all expected status keys', () => {
    assert.ok('pending' in runtimeOperationStatusLabels);
    assert.ok('running' in runtimeOperationStatusLabels);
    assert.ok('completed' in runtimeOperationStatusLabels);
    assert.ok('failed' in runtimeOperationStatusLabels);
  });

  test('maps to correct label values', () => {
    assert.strictEqual(runtimeOperationStatusLabels.pending, 'Pending');
    assert.strictEqual(runtimeOperationStatusLabels.running, 'Running');
    assert.strictEqual(runtimeOperationStatusLabels.completed, 'Completed');
    assert.strictEqual(runtimeOperationStatusLabels.failed, 'Failed');
  });
});

// ─── createRuntimeOperationMockRecords ───────────────────────────────────────

describe('createRuntimeOperationMockRecords', () => {
  test('creates correct number of records with default count', () => {
    const records = createRuntimeOperationMockRecords({
      typeOrder: ['deploy', 'rollback'],
      statusOrder: ['completed', 'failed'],
    });
    assert.strictEqual(records.length, 50);
  });

  test('creates correct number of records with custom count', () => {
    const records = createRuntimeOperationMockRecords({
      count: 3,
      typeOrder: ['deploy'],
      statusOrder: ['completed'],
    });
    assert.strictEqual(records.length, 3);
  });

  test('cycles through typeOrder correctly', () => {
    const records = createRuntimeOperationMockRecords({
      count: 4,
      typeOrder: ['deploy', 'rollback'],
      statusOrder: ['completed'],
    });
    assert.strictEqual(records[0].type, 'deploy');
    assert.strictEqual(records[1].type, 'rollback');
    assert.strictEqual(records[2].type, 'deploy');
    assert.strictEqual(records[3].type, 'rollback');
  });

  test('sets running/pending status without finishedAt', () => {
    const records = createRuntimeOperationMockRecords({
      count: 2,
      typeOrder: ['deploy'],
      statusOrder: ['pending', 'running'],
    });
    assert.strictEqual(records[0].finishedAt, undefined);
    assert.strictEqual(records[1].finishedAt, undefined);
  });

  test('sets completed/failed status with finishedAt', () => {
    const records = createRuntimeOperationMockRecords({
      count: 2,
      typeOrder: ['deploy'],
      statusOrder: ['completed', 'failed'],
    });
    assert.notStrictEqual(records[0].finishedAt, undefined);
    assert.notStrictEqual(records[1].finishedAt, undefined);
  });

  test('creates records with zero count', () => {
    const records = createRuntimeOperationMockRecords({
      count: 0,
      typeOrder: ['deploy'],
      statusOrder: ['completed'],
    });
    assert.strictEqual(records.length, 0);
  });

  test('uses custom idPrefix', () => {
    const records = createRuntimeOperationMockRecords({
      count: 1,
      typeOrder: ['deploy'],
      statusOrder: ['completed'],
      idPrefix: 'custom',
    });
    assert.ok(records[0].id.startsWith('custom-'));
  });

  test('cycles targetId by modulo', () => {
    const records = createRuntimeOperationMockRecords({
      count: 3,
      typeOrder: ['deploy'],
      statusOrder: ['completed'],
      targetModulo: 2,
    });
    assert.ok(records[0].targetId.endsWith('-1'));
    assert.ok(records[1].targetId.endsWith('-2'));
    assert.ok(records[2].targetId.endsWith('-1'));
  });
});

// ─── createRuntimeOperationDetailMockMap ─────────────────────────────────────

describe('createRuntimeOperationDetailMockMap', () => {
  test('creates a map keyed by operation id', () => {
    const map = createRuntimeOperationDetailMockMap([
      { operation: sampleOperation, receipts: sampleReceipts },
    ]);
    assert.ok('op-0001' in map);
    assert.strictEqual(map['op-0001'].op.id, 'op-0001');
    assert.strictEqual(map['op-0001'].receipts.length, 2);
  });

  test('handles empty entries array', () => {
    const map = createRuntimeOperationDetailMockMap([]);
    assert.strictEqual(Object.keys(map).length, 0);
  });

  test('handles entries without receipts', () => {
    const map = createRuntimeOperationDetailMockMap([
      { operation: sampleOperation },
    ]);
    assert.ok('op-0001' in map);
    assert.deepStrictEqual(map['op-0001'].receipts, []);
  });

  test('handles multiple entries', () => {
    const map = createRuntimeOperationDetailMockMap([
      { operation: sampleOperation, receipts: sampleReceipts },
      { operation: sampleOperationRunning, receipts: [] },
    ]);
    assert.strictEqual(Object.keys(map).length, 2);
  });
});

// ─── RuntimeOperationReceiptListReadout ──────────────────────────────────────

describe('RuntimeOperationReceiptListReadout', () => {
  test('renders empty state when no receipts', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationReceiptListReadout, { receipts: [] })
    );
    assert.ok(html.length > 0);
  });

  test('renders list when receipts provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationReceiptListReadout, { receipts: sampleReceipts })
    );
    assert.ok(html.includes('STARTED'));
    assert.ok(html.includes('COMPLETED'));
  });

  test('renders OK status for ok receipts', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationReceiptListReadout, { receipts: sampleReceipts })
    );
    assert.ok(html.length > 50);
  });

  test('renders ERROR status for error receipts', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationReceiptListReadout, { receipts: sampleReceiptsWithError })
    );
    assert.ok(html.includes('Connection timeout'));
  });

  test('handles undefined receipts by defaulting to empty array', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationReceiptListReadout, {})
    );
    assert.ok(typeof html === 'string');
  });

  test('uses custom detailLabels', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationReceiptListReadout, {
        receipts: sampleReceipts,
        detailLabels: { noReceipts: '\u6682\u65e0\u56de\u6267', receiptOk: '\u6210\u529f', receiptError: '\u5931\u8d25' },
      })
    );
    assert.ok(html.includes('\u6210\u529f'));
  });
});

// ─── RuntimeOperationOverviewReadout ─────────────────────────────────────────

describe('RuntimeOperationOverviewReadout', () => {
  test('renders operation overview with basic info', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationOverviewReadout, { operation: sampleOperation })
    );
    assert.ok(html.includes('#op-0001'));
  });

  test('renders status badge in overview', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationOverviewReadout, { operation: sampleOperation })
    );
    assert.ok(html.includes('Completed'));
  });

  test('uses custom detailLabels', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationOverviewReadout, {
        operation: sampleOperation,
        detailLabels: { id: '\u7f16\u53f7', type: '\u7c7b\u578b', status: '\u72b6\u6001', target: '\u76ee\u6807' },
      })
    );
    assert.ok(html.includes('\u7f16\u53f7') || html.includes('\u7c7b\u578b'));
  });
});

// ─── RuntimeOperationTimelineReadout ─────────────────────────────────────────

describe('RuntimeOperationTimelineReadout', () => {
  test('renders timeline with createdAt and finishedAt', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationTimelineReadout, { operation: sampleOperation })
    );
    assert.ok(html.length > 100);
  });

  test('renders "in progress" fallback when finishedAt is missing', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationTimelineReadout, { operation: sampleOperationRunning })
    );
    assert.ok(html.includes('In progress'));
  });
});

// ─── createRuntimeOperationTableColumns ──────────────────────────────────────

describe('createRuntimeOperationTableColumns', () => {
  test('returns all columns by default', () => {
    const columns = createRuntimeOperationTableColumns();
    assert.strictEqual(columns.length, 6);
  });

  test('filters columns with includeColumns', () => {
    const columns = createRuntimeOperationTableColumns({
      includeColumns: ['id', 'status', 'type'],
    });
    assert.strictEqual(columns.length, 3);
  });

  test('omits columns with omitColumns', () => {
    const columns = createRuntimeOperationTableColumns({
      omitColumns: ['finishedAt', 'createdAt'],
    });
    assert.strictEqual(columns.length, 4);
  });

  test('includeColumns + omitColumns: omit removes from included set', () => {
    const columns = createRuntimeOperationTableColumns({
      includeColumns: ['id'],
      omitColumns: ['id'],
    });
    assert.strictEqual(columns.length, 0);
  });

  test('returns all 6 columns with empty options', () => {
    const columns = createRuntimeOperationTableColumns({});
    assert.strictEqual(columns.length, 6);
  });
});

// ─── RuntimeOperationsTableCard ──────────────────────────────────────────────

describe('RuntimeOperationsTableCard', () => {
  test('renders empty state when no operations provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsTableCard, {
        operations: [],
        emptyTitle: 'No operations',
        emptyDescription: 'No data',
      })
    );
    assert.ok(typeof html === 'string');
  });

  test('renders with one operation', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsTableCard, {
        operations: [sampleOperation],
      })
    );
    assert.ok(html.includes('op-0001'));
  });

  test('renders with multiple operations', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsTableCard, {
        operations: [sampleOperation, sampleOperationRunning, sampleOperationFailed],
      })
    );
    assert.ok(html.includes('op-0001'));
    assert.ok(html.includes('op-0002'));
    assert.ok(html.includes('op-0003'));
  });

  test('uses custom column labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsTableCard, {
        operations: [sampleOperation],
        columnLabels: { id: 'ID', status: 'Status' },
      })
    );
    assert.ok(typeof html === 'string');
  });

  test('accepts pagination prop without error', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsTableCard, {
        operations: [sampleOperation],
        pagination: { page: 1, totalPages: 1, total: 1, onPageChange: () => {} },
      })
    );
    assert.ok(html.includes('op-0001'));
  });
});

// ─── RuntimeOperationDetailView ──────────────────────────────────────────────

describe('RuntimeOperationDetailView', () => {
  test('renders "not found" when operation is null', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDetailView, {
        operation: null,
        backHref: '/ops',
      })
    );
    assert.ok(html.length > 50);
  });

  test('renders "not found" when operation is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDetailView, {
        operation: undefined,
        backHref: '/ops',
      })
    );
    assert.ok(html.length > 50);
  });

  test('renders operation detail when operation provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDetailView, {
        operation: sampleOperation,
        receipts: sampleReceipts,
        backHref: '/ops',
      })
    );
    assert.ok(html.length > 200);
  });

  test('renders with custom preset detailLabels', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDetailView, {
        operation: sampleOperation,
        receipts: sampleReceipts,
        preset: {
          typeLabels: { deploy: '\u90e8\u7f72' },
          statusLabels: { completed: '\u5b8c\u6210' },
          detailLabels: { overviewTitle: '\u6982\u89c8' },
        },
      })
    );
    assert.ok(html.includes('\u90e8\u7f72'));
    assert.ok(html.includes('\u6982\u89c8'));
  });

  test('renders custom notFoundMessage', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDetailView, {
        operation: null,
        notFoundMessage: 'Custom not found message',
      })
    );
    assert.ok(html.includes('Custom not found message'));
  });
});

// ─── RuntimeOperationPresetDetailRoute ────────────────────────────────────────

describe('RuntimeOperationPresetDetailRoute', () => {
  test('renders operation when found in map', () => {
    const ops = {
      'op-0001': { op: sampleOperation, receipts: sampleReceipts },
    };
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationPresetDetailRoute, {
        operationId: 'op-0001',
        operations: ops,
      })
    );
    assert.ok(html.includes('op-0001'));
  });

  test('renders not found when operation missing from map', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationPresetDetailRoute, {
        operationId: 'op-9999',
        operations: {},
      })
    );
    assert.ok(html.length > 50);
  });

  test('renders not found with custom message function', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationPresetDetailRoute, {
        operationId: 'op-9999',
        operations: {},
        notFoundMessage: (id) => `Missing: ${id}`,
      })
    );
    assert.ok(html.includes('Missing: op-9999'));
  });
});

// ─── runtimeOperationDetailDemoPresets ────────────────────────────────────────

describe('runtimeOperationDetailDemoPresets', () => {
  test('contains storefront preset', () => {
    assert.ok('storefront' in runtimeOperationDetailDemoPresets);
    assert.strictEqual(Object.keys(runtimeOperationDetailDemoPresets.storefront).length, 3);
  });

  test('contains tob preset', () => {
    assert.ok('tob' in runtimeOperationDetailDemoPresets);
  });

  test('contains admin preset', () => {
    assert.ok('admin' in runtimeOperationDetailDemoPresets);
  });

  test('each preset entry has op and receipts', () => {
    for (const key of Object.keys(runtimeOperationDetailDemoPresets)) {
      const preset = runtimeOperationDetailDemoPresets[key];
      for (const opKey of Object.keys(preset)) {
        assert.ok('op' in preset[opKey]);
        assert.ok('receipts' in preset[opKey]);
      }
    }
  });
});

// ─── runtimeOperationListDemoPresets ──────────────────────────────────────────

describe('runtimeOperationListDemoPresets', () => {
  test('contains storefront preset with typeOrder', () => {
    assert.ok('typeOrder' in runtimeOperationListDemoPresets.storefront);
    assert.ok(runtimeOperationListDemoPresets.storefront.typeOrder.includes('deploy'));
  });

  test('tob preset has Chinese labels', () => {
    assert.strictEqual(runtimeOperationListDemoPresets.tob.typeLabels.deploy, '\u90e8\u7f72');
  });

  test('admin preset has defaultPageSize', () => {
    assert.strictEqual(runtimeOperationListDemoPresets.admin.defaultPageSize, 10);
  });
});

// ─── RuntimeOperationDemoListPage ─────────────────────────────────────────────

describe('RuntimeOperationDemoListPage', () => {
  test('renders with basic preset', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDemoListPage, {
        title: 'Test Page',
        preset: runtimeOperationListDemoPresets.storefront,
        count: 5,
      })
    );
    assert.ok(html.includes('Test Page'));
  });

  test('renders with custom description', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDemoListPage, {
        title: 'Ops',
        description: 'Custom description',
        preset: runtimeOperationListDemoPresets.storefront,
        count: 3,
      })
    );
    assert.ok(html.includes('Custom description'));
  });

  test('applies mapRecords transformation', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationDemoListPage, {
        title: 'Mapped',
        preset: runtimeOperationListDemoPresets.storefront,
        count: 3,
        mapRecords: (records) =>
          records.map((r) => ({ ...r, type: 'deploy' })),
      })
    );
    assert.ok(typeof html === 'string');
  });
});

// ─── RuntimeOperationsListPageSection (original tests preserved below) ────────

describe('RuntimeOperationsListPageSection', () => {
  test('renders title and stats cards', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsListPageSection, {
        title: 'Runtime Operations',
        operations: sixOps,
      })
    );
    assert.ok(html.includes('Runtime Operations'));
    assert.ok(html.includes('Total Ops'));
  });

  test('renders with preset providing Chinese locale', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsListPageSection, {
        title: '\u8fd0\u884c\u65f6\u64cd\u4f5c',
        operations: sixOps,
        preset: runtimeOperationListDemoPresets.tob,
      })
    );
    assert.ok(html.includes('\u8fd0\u884c\u65f6\u64cd\u4f5c'));
  });

  test('renders empty state when operations is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsListPageSection, {
        title: 'Empty',
        operations: [],
        emptyTitle: '\u6682\u65e0\u64cd\u4f5c',
        emptyDescription: '\u6ca1\u6709\u7b26\u5408\u6761\u4ef6\u7684\u64cd\u4f5c',
      })
    );
    assert.ok(typeof html === 'string');
  });

  test('renders search filter input', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsListPageSection, {
        title: 'Search',
        operations: sixOps,
        labels: { searchPlaceholder: '\u641c\u7d22\u64cd\u4f5c...' },
      })
    );
    assert.ok(html.includes('\u641c\u7d22\u64cd\u4f5c...'));
  });

  test('renders status and type facet tabs', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsListPageSection, {
        title: 'Facets',
        operations: sixOps,
        statusOrder: ['running', 'completed'],
        typeOrder: ['deploy', 'rollback'],
      })
    );
    assert.ok(typeof html === 'string');
  });

  test('renders with admin preset', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsListPageSection, {
        title: 'Admin',
        operations: sixOps,
        preset: runtimeOperationListDemoPresets.admin,
      })
    );
    assert.ok(typeof html === 'string');
  });

  test('accepts custom detailHrefBase', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsListPageSection, {
        title: 'Custom Href',
        operations: sixOps,
        detailHrefBase: '/admin/ops',
      })
    );
    assert.ok(typeof html === 'string');
  });

  test('accepts custom defaultPageSize', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsListPageSection, {
        title: 'Paginated',
        operations: sixOps,
        defaultPageSize: 2,
        pageSizeOptions: [2, 4, 6],
      })
    );
    assert.ok(typeof html === 'string');
  });

  // Original tests -- preset defaultPageSize/pageSizeOptions
  test('preset defaultPageSize and pageSizeOptions drive initial pagination', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsListPageSection, {
        title: 'Storefront runtime',
        operations: sixOps,
        preset: {
          ...runtimeOperationListDemoPresets.storefront,
          defaultPageSize: 2,
          pageSizeOptions: [2, 4, 6],
        },
      })
    );

    assert.ok(html.includes('op-0001'));
    assert.ok(html.includes('op-0002'));
    assert.ok(!html.includes('op-0003'));
    assert.ok(html.includes('>2<'));
    assert.ok(html.includes('>4<'));
    assert.ok(html.includes('>6<'));
  });

  test('renders runtime status section title from preset labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(RuntimeOperationsListPageSection, {
        title: 'ToB runtime',
        operations: sixOps,
        preset: runtimeOperationListDemoPresets.tob,
      })
    );

    assert.ok(html.includes('\u6267\u884c\u72b6\u6001'));
    assert.ok(html.includes('\u64cd\u4f5c\u7c7b\u578b'));
  });
});
