/*!
 * device-monitoring/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for DeviceDetailPage
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

describe('DeviceDetailPage - nformal', () => {
  it('exports default DeviceDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function DeviceDetailPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useParams', () => {
    const src = readSource();
    assert.ok(src.includes('useParams'), 'missing useParams');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('uses useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), 'missing useMemo');
  });
  it('uses useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), 'missing useCallback');
  });
  it('uses useState', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), 'missing useState');
  });
  it('imports DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('imports InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('InfoRow'), 'missing InfoRow');
  });
  it('imports StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('imports Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('imports DetailActionBar', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'), 'missing DetailActionBar');
  });
  it('imports DetailClosureBar', () => {
    const src = readSource();
    assert.ok(src.includes('DetailClosureBar'), 'missing DetailClosureBar');
  });
  it('imports DescriptionList', () => {
    const src = readSource();
    assert.ok(src.includes('DescriptionList'), 'missing DescriptionList');
  });
  it('imports EmptyState', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyState'), 'missing EmptyState');
  });
  it('imports useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), 'missing useToast');
  });
  it('imports ConfirmDialog', () => {
    const src = readSource();
    assert.ok(src.includes('ConfirmDialog'), 'missing ConfirmDialog');
  });
  it('has formatSeconds function', () => {
    const src = readSource();
    assert.ok(src.includes('formatSeconds'), 'missing formatSeconds');
  });
  it('has heartbeatLabel function', () => {
    const src = readSource();
    assert.ok(src.includes('heartbeatLabel'), 'missing heartbeatLabel');
  });
  it('has uptimeLabel function', () => {
    const src = readSource();
    assert.ok(src.includes('uptimeLabel'), 'missing uptimeLabel');
  });
  it('has mock device data', () => {
    const src = readSource();
    assert.ok(src.includes('mock') || src.includes('MOCK'), 'missing mock data');
  });
});

describe('DeviceDetailPage - fanli', () => {
  it('no dangerousSetInnerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });
  it('no any type', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\\s*any\\b/);
  });
  it('no secret leak', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key)/i);
  });
  it('no raw console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), 'bare console.log');
  });
});

describe('DeviceDetailPage - bianjie', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('DeviceDetailPage - shuju', () => {
  it('includes base info section', () => {
    const src = readSource();
    assert.ok(src.includes('\u57fa\u7840\u4fe1\u606f'), 'missing base info');
  });
  it('includes device keyword', () => {
    const src = readSource();
    assert.ok(src.includes('\u8bbe\u5907'), 'missing device');
  });
  it('includes delete action', () => {
    const src = readSource();
    assert.ok(src.includes('\u5220\u9664'), 'missing delete');
  });
  it('includes cancel action', () => {
    const src = readSource();
    assert.ok(src.includes('\u53d6\u6d88'), 'missing cancel');
  });
  it('has page navigation', () => {
    const src = readSource();
    assert.ok(src.includes('router.push') || src.includes('Link'), 'missing navigation');
  });
  it('includes uptime label', () => {
    const src = readSource();
    assert.ok(src.includes('uptime'), 'missing uptime');
  });
  it('includes heartbeat label', () => {
    const src = readSource();
    assert.ok(src.includes('heartbeat'), 'missing heartbeat');
  });
  it('includes loading state', () => {
    const src = readSource();
    assert.ok(src.includes('loading'), 'missing loading');
  });
});
