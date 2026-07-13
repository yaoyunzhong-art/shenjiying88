/**
 * store-manager/page.test.tsx — 店长工作台页 L1 冒烟测试 (storefront-web)
 * 适配实际页面 StoreManagerPage
 * 覆盖: 正例(渲染/数据/表单) 反例(安全/缺失) 边界(结构化数据/字段完整性)
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

  it('包含 useState 表单状态管理', () => {
    assert.ok(SOURCE.includes('useState'), '缺少 useState');
  });

  it('包含 form 或 表单提交处理', () => {
    assert.ok(SOURCE.includes('handleSubmit') || SOURCE.includes('onSubmit') || SOURCE.includes('form'), '缺少表单处理');
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
    const innerHtmlCount = (SOURCE.match(/dangerouslySetInnerHTML/g) || []).length;
    const jsonldCount = (SOURCE.match(/application\/ld\+json/g) || []).length;
    // 理论上每个 JSON-LD script 有一个 dangerouslySetInnerHTML
    assert.equal(innerHtmlCount, jsonldCount,
      '每个 dangerouslySetInnerHTML 应对应一个 JSON-LD script 标签');
  });

  it('不应包含 eval', () => {
    assert.ok(!SOURCE.includes('eval('), '不应使用 eval');
  });

  it('不应包含 document.write', () => {
    assert.ok(!SOURCE.includes('document.write'), '不应使用 document.write');
  });
});

describe('store-manager — 边界', () => {
  it('电话字段格式合理', () => {
    assert.ok(SOURCE.includes('电话') || SOURCE.includes('phone') || SOURCE.includes('Phone'), '缺少电话字段');
  });

  it('营业时间起止都有', () => {
    assert.ok(SOURCE.includes('10:00') || SOURCE.includes('09:00'), '缺少开门时间');
    assert.ok(SOURCE.includes('22:00') || SOURCE.includes('21:00'), '缺少关门时间');
  });

  it('JSON-LD 包含名称字段', () => {
    assert.ok(SOURCE.includes('"name"'), 'JSON-LD 应有名称字段');
  });

  it('JSON-LD 包含地址字段', () => {
    assert.ok(SOURCE.includes('address') || SOURCE.includes('Address'), 'JSON-LD 应有地址');
  });

  it('JSON-LD 包含电话字段', () => {
    assert.ok(SOURCE.includes('telephone') || SOURCE.includes('Telephone') || SOURCE.includes('phone'), 'JSON-LD 应有电话');
  });

  it('JSON-LD 包含营业时间字段', () => {
    assert.ok(SOURCE.includes('openingHours') || SOURCE.includes('OpeningHours'), 'JSON-LD 应有营业时间');
  });

  it('页面不应有 console.log', () => {
    const lines = SOURCE.split('\n').filter(l => l.includes('console.log') && !l.trim().startsWith('//'));
    assert.equal(lines.length, 0, '不应有 console.log 在生产代码中');
  });
});
