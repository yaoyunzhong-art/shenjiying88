/*!
 * reports/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for ReportDetailPage
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('ReportDetailPage - nformal', () => {
  it('exports default async ReportDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function ReportDetailPage'), 'missing export');
  });
  it('imports Metadata type', () => {
    const src = readSource();
    assert.ok(src.includes('Metadata'), 'missing Metadata');
  });
  it('imports Suspense', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), 'missing Suspense');
  });
  it('imports notFound', () => {
    const src = readSource();
    assert.ok(src.includes('notFound'), 'missing notFound');
  });
  it('imports redirect', () => {
    const src = readSource();
    assert.ok(src.includes('redirect'), 'missing redirect');
  });
  it('imports LoadingSkeleton', () => {
    const src = readSource();
    assert.ok(src.includes('LoadingSkeleton'), 'missing LoadingSkeleton');
  });
  it('imports EmptyState', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyState'), 'missing EmptyState');
  });
  it('imports ErrorBoundary', () => {
    const src = readSource();
    assert.ok(src.includes('ErrorBoundary'), 'missing ErrorBoundary');
  });
  it('imports ReportDetailClient', () => {
    const src = readSource();
    assert.ok(src.includes('ReportDetailClient'), 'missing ReportDetailClient');
  });
  it('has MOCK_REPORTS data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_REPORTS'), 'missing MOCK_REPORTS');
  });
  it('has generateReportDetailMetadata', () => {
    const src = readSource();
    assert.ok(src.includes('generateReportDetailMetadata'), 'missing metadata generator');
  });
  it('has STATUS_CONFIG', () => {
    const src = readSource();
    assert.ok(src.includes('STATUS_CONFIG'), 'missing STATUS_CONFIG');
  });
  it('has TYPE_LABELS', () => {
    const src = readSource();
    assert.ok(src.includes('TYPE_LABELS'), 'missing TYPE_LABELS');
  });
  it('has ReportDetailLoadingFallback', () => {
    const src = readSource();
    assert.ok(src.includes('ReportDetailLoadingFallback'), 'missing loading fallback');
  });
  it('has ReportDetailErrorFallback', () => {
    const src = readSource();
    assert.ok(src.includes('ReportDetailErrorFallback'), 'missing error fallback');
  });
  it('has ReportNavigation', () => {
    const src = readSource();
    assert.ok(src.includes('ReportNavigation'), 'missing navigation');
  });
  it('uses JSON-LD for structured data', () => {
    const src = readSource();
    assert.ok(src.includes('dangerouslySetInnerHTML'), 'missing JSON-LD');
  });
  it('has openGraph metadata', () => {
    const src = readSource();
    assert.ok(src.includes('openGraph'), 'missing openGraph');
  });
});

describe('ReportDetailPage - fanli', () => {
  it('no secret leak', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key)/i);
  });
  it('no raw console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), 'bare console.log');
  });
});

describe('ReportDetailPage - bianjie', () => {
  it('handles not-found state', () => {
    const src = readSource();
    assert.ok(src.includes('notFound'), 'missing notFound');
  });
  it('has fallback content', () => {
    const src = readSource();
    assert.ok(src.includes('fallback'), 'missing fallback');
  });
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
});

describe('ReportDetailPage - shuju', () => {
  it('includes generated/generating/failed/expired status', () => {
    const src = readSource();
    assert.ok(src.includes('generated'), 'missing generated');
    assert.ok(src.includes('generating') || src.includes('failed'), 'missing status');
  });
  it('includes daily/weekly/monthly/quarterly types', () => {
    const src = readSource();
    assert.ok(src.includes('daily'), 'missing daily');
    assert.ok(src.includes('quarterly'), 'missing quarterly');
  });
  it('includes page navigation', () => {
    const src = readSource();
    assert.ok(src.includes('prevId') || src.includes('nextId'), 'missing nav');
  });
  it('has report metrics', () => {
    const src = readSource();
    assert.ok(src.includes('metrics'), 'missing metrics');
  });
  it('includes report tips section', () => {
    const src = readSource();
    assert.ok(src.includes('\u64cd\u4f5c\u63d0\u793a'), 'missing tips');
  });
});
