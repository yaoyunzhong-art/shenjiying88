/*!
 * ./page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for StorefrontHomePage
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

describe('StorefrontHomePage - 正例', () => {
  it('exports default StorefrontHomePage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StorefrontHomePage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('imports Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('imports Card', () => {
    const src = readSource();
    assert.ok(src.includes('Card'), 'missing Card');
  });
  it('imports PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('imports Tag', () => {
    const src = readSource();
    assert.ok(src.includes('Tag'), 'missing Tag');
  });
  it('uses useEffect', () => {
    const src = readSource();
    assert.ok(src.includes('useEffect'), 'missing useEffect');
  });
  it('uses PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses Button', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), 'missing Button');
  });
  it('defines QuickEntry interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface QuickEntry') || src.includes('type QuickEntry'), 'missing QuickEntry');
  });
  it('defines PromotionBanner interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface PromotionBanner') || src.includes('type PromotionBanner'), 'missing PromotionBanner');
  });
});

describe('StorefrontHomePage - 反例', () => {
  it('no dangerousSetInnerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });
  it('no any type', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
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

describe('StorefrontHomePage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('uses .map() iteration', () => {
    const src = readSource();
    assert.ok(src.includes('.map('), 'missing .map');
  });
});

describe('StorefrontHomePage - 数据完整性', () => {
  it('includes context "24台最新街机..."', () => {
    const src = readSource();
    assert.ok(src.includes('24台最新街机'), 'missing 24台最新街机');
  });
  it('includes context "¥20/时..."', () => {
    const src = readSource();
    assert.ok(src.includes('¥20/时'), 'missing ¥20/时');
  });
  it('includes context "热推..."', () => {
    const src = readSource();
    assert.ok(src.includes('热推'), 'missing 热推');
  });
  it('includes context "街机..."', () => {
    const src = readSource();
    assert.ok(src.includes('街机'), 'missing 街机');
  });
  it('has constant FEATURED_DEVICES', () => {
    const src = readSource();
    assert.ok(src.includes('FEATURED_DEVICES'), 'missing FEATURED_DEVICES');
  });
  it('has constant STORE_INFO', () => {
    const src = readSource();
    assert.ok(src.includes('STORE_INFO'), 'missing STORE_INFO');
  });
  it('has constant timer', () => {
    const src = readSource();
    assert.ok(src.includes('timer'), 'missing timer');
  });
  it('has constant _banner', () => {
    const src = readSource();
    assert.ok(src.includes('_banner'), 'missing _banner');
  });
  it('has constant _bannerColor', () => {
    const src = readSource();
    assert.ok(src.includes('_bannerColor'), 'missing _bannerColor');
  });
});