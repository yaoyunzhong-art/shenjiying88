/**
 * store-manager/page.test.tsx — 店长工作台页 L1 冒烟测试 (storefront-web)
 * 适配实际页面 StoreManagerPage
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('store-manager — 正例', () => {
  it('应导出一个默认函数组件 StoreManagerPage', () => {
    assert.ok(SOURCE.includes('export default function StoreManagerPage'));
  });

  it('包含页面标题"门店管理"', () => {
    assert.ok(SOURCE.includes('门店管理'));
  });

  it('包含门店名称"神机营电竞乐园"', () => {
    assert.ok(SOURCE.includes('神机营电竞乐园'));
  });

  it('包含地址信息', () => {
    assert.ok(SOURCE.includes('北京市朝阳区'));
  });

  it('包含营业时间', () => {
    assert.ok(SOURCE.includes('10:00-22:00'));
  });

  it('包含营业状态标签', () => {
    assert.ok(SOURCE.includes('营业中'));
  });

  it('包含保存修改按钮', () => {
    assert.ok(SOURCE.includes('保存修改'));
  });

  it('包含门店名称、地址、电话等编辑字段', () => {
    assert.ok(SOURCE.includes('门店名称'));
    assert.ok(SOURCE.includes('地址'));
    assert.ok(SOURCE.includes('联系电话'));
    assert.ok(SOURCE.includes('营业时间'));
  });
});

describe('store-manager — 防御', () => {
  it('JSON-LD script 应使用 type="application/ld+json"', () => {
    assert.ok(SOURCE.includes('type="application/ld+json"'));
  });

  it('JSON-LD 应包含结构化门店数据', () => {
    assert.ok(SOURCE.includes('@context'));
    assert.ok(SOURCE.includes('schema.org'));
  });

  it('不应包含危险的 innerHTML 除了 JSON-LD script', () => {
    // JSON-LD <script> 标签必须用 dangerouslySetInnerHTML 嵌入结构化数据，
    // 除此之外不应在其他地方使用
    const lines = SOURCE.split('\n');
    const innerHtmlLines = lines.filter(l => l.includes('dangerouslySetInnerHTML'));
    const allAreJsonLd = innerHtmlLines.every(l => l.includes('type="application/ld+json"'));
    assert.ok(allAreJsonLd, 'dangerouslySetInnerHTML 只能用于 JSON-LD script 标签');
  });
});
