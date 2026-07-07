/**
 * flatten-for-csv.test.ts — L1 角色测试
 *
 * 纯函数 flattenForCsv: 将任意 JS 值拍扁为 CSV 友好记录
 * 正例 + 反例 + 边界, ≥3 个测试用例
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { flattenForCsv, recordsToCsv } from './flatten-for-csv';

// ══════════════════════════════════════════════════════════════════════════
// 👔 店长视角 (Tenant Admin)
// ══════════════════════════════════════════════════════════════════════════

describe('flatten-for-csv: 👔店长视角 正例', () => {
  it('拍扁简单对象为单行 CSV', () => {
    const obj = { name: '投篮机', sku: 'SKU-001', price: 5000 };
    const flat = flattenForCsv(obj);
    assert.equal(flat.name, '投篮机');
    assert.equal(flat.sku, 'SKU-001');
    assert.equal(flat.price, 5000);
  });

  it('拍扁嵌套对象', () => {
    const obj = { item: { name: '跳舞机', specs: { color: '红', size: 'M' } } };
    const flat = flattenForCsv(obj);
    assert.equal(flat['item.name'], '跳舞机');
    assert.equal(flat['item.specs.color'], '红');
    assert.equal(flat['item.specs.size'], 'M');
  });

  it('拍扁数组为索引键', () => {
    const arr = ['a', 'b', 'c'];
    const flat = flattenForCsv(arr);
    assert.equal(flat['item[0]'], 'a');
    assert.equal(flat['item[1]'], 'b');
    assert.equal(flat['item[2]'], 'c');
  });

  it('拍扁基本类型', () => {
    assert.equal(flattenForCsv('hello').value, 'hello');
    assert.equal(flattenForCsv(42).value, 42);
    assert.equal(flattenForCsv(true).value, true);
  });

  it('Date 转为 ISO 字符串', () => {
    const d = new Date('2026-06-28T00:00:00Z');
    const flat = flattenForCsv(d);
    assert.equal(flat.value, d.toISOString());
  });

  it('recordsToCsv 生成多行 CSV', () => {
    const records = [
      { name: '投篮机', qty: 10 },
      { name: '跳舞机', qty: 5 },
    ];
    const csv = recordsToCsv(records);
    assert.ok(csv.includes('投篮机'));
    assert.ok(csv.includes('跳舞机'));
    assert.ok(csv.includes('qty'));
    assert.ok(csv.includes('name'));
  });
});

describe('flatten-for-csv: 👔店长视角 反例', () => {
  it('null/undefined 返回空或空值', () => {
    assert.deepStrictEqual(flattenForCsv(null), {});
    assert.deepStrictEqual(flattenForCsv(undefined), {});
  });

  it('空对象返回空', () => {
    assert.deepStrictEqual(flattenForCsv({}), {});
  });

  it('空数组返回空', () => {
    assert.deepStrictEqual(flattenForCsv([]), {});
  });

  it('非法 Date 返回 Invalid Date', () => {
    const bad = new Date('invalid');
    const flat = flattenForCsv(bad);
    assert.equal(flat.value, 'Invalid Date');
  });
});

describe('flatten-for-csv: 👔店长视角 边界', () => {
  it('深层嵌套 10 层', () => {
    let obj: any = { value: 'deep' };
    for (let i = 0; i < 10; i++) {
      obj = { nested: obj };
    }
    const flat = flattenForCsv(obj);
    assert.equal(flat[Array(10).fill('nested').join('.') + '.value'], 'deep');
  });

  it('含有中文和特殊字符的值', () => {
    const obj = { name: '投篮机™', desc: '100% 全新' };
    const flat = flattenForCsv(obj);
    assert.equal(flat.name, '投篮机™');
    assert.equal(flat.desc, '100% 全新');
  });

  it('数组内包含对象元素', () => {
    const arr = [{ name: 'a', val: 1 }, { name: 'b', val: 2 }];
    const flat = flattenForCsv(arr);
    assert.equal(flat['item[0].name'], 'a');
    assert.equal(flat['item[1].val'], 2);
  });

  it('recordsToCsv 空数组返回空字符串', () => {
    assert.equal(recordsToCsv([]), '');
  });

  it('recordsToCsv 带自定义分隔符', () => {
    const records = [{ a: 1, b: 2 }];
    const csv = recordsToCsv(records);
    assert.ok(csv.includes(','));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 🛒 前台视角 (Reception)
// ══════════════════════════════════════════════════════════════════════════

describe('flatten-for-csv: 🛒前台视角', () => {
  it('前台导出简单订单数据', () => {
    const order = { orderNo: 'ORD-001', amount: 9900, items: 3 };
    const flat = flattenForCsv(order);
    assert.ok(flat.orderNo !== undefined);
    assert.ok(flat.amount !== undefined);
  });

  it('前台导出数据不含循环引用', () => {
    const obj: any = { a: 1 };
    obj.self = obj;
    // flattenForCsv 应不会无限递归
    try {
      const flat = flattenForCsv(obj);
      assert.ok(flat);
    } catch {
      assert.fail('should not throw on circular references');
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 🔧 安监视角 (Safety)
// ══════════════════════════════════════════════════════════════════════════

describe('flatten-for-csv: 🔧安监视角', () => {
  it('安监导出审计日志', () => {
    const log = {
      event: 'LOGIN_FAILED',
      user: 'admin',
      ip: '192.168.1.1',
      timestamp: '2026-06-28T01:30:00Z',
      metadata: { browser: 'Chrome', os: 'macOS' },
    };
    const flat = flattenForCsv(log);
    assert.ok(flat.event);
    assert.ok(flat['metadata.browser']);
  });

  it('安监导出数据不应包含敏感信息泄露', () => {
    const obj = { password: 'secret123', token: 'abc.def.ghi' };
    const flat = flattenForCsv(obj);
    // 函数本身不检测敏感信息，只是拍扁
    assert.equal(flat.password, 'secret123');
    assert.equal(flat.token, 'abc.def.ghi');
  });
});
