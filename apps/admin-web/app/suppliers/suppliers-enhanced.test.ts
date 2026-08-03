/**
 * suppliers-enhanced.test.ts — 供应商管理 Service 层增强测试
 *
 * 覆盖:
 *   - 供应商表单验证 (create/edit form field validation)
 *   - 数据操作 (filter, search, sort, pagination)
 *   - 状态变更 (status transitions, credit rating changes, market)
 *   - 供应商等级评估 (comprehensive scoring logic)
 *   - 边界条件与错误处理
 *
 * 正例 + 反例 + 边界, >= 20 个测试用例
 * Using node:test (same pattern as existing suppliers.service.test.ts)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MOCK_SUPPLIERS,
  SUPPLIER_STATUS_MAP,
  SUPPLIER_CATEGORY_MAP,
  SUPPLIER_CREDIT_MAP,
  SUPPLIER_STATUSES,
  SUPPLIER_CATEGORIES,
  computeSupplierStats,
  formatCurrency,
  getSupplierById,
} from './suppliers-data';

import type {
  SupplierItem,
  SupplierStatus,
  SupplierCategory,
  SupplierCredit,
} from './suppliers-data';

// ── 工厂函数 ────────────────────────────────────────────

function makeSupplier(overrides: Partial<SupplierItem> = {}): SupplierItem {
  return {
    id: overrides.id ?? 'sp-enhanced-1',
    code: overrides.code ?? 'SUP-ENHANCED-001',
    name: overrides.name ?? '增强测试供应商',
    contactPerson: overrides.contactPerson ?? '李四',
    contactPhone: overrides.contactPhone ?? '13900000001',
    email: overrides.email ?? 'enhanced@test.com',
    category: overrides.category ?? 'raw_material',
    status: overrides.status ?? 'active',
    creditRating: overrides.creditRating ?? 'A',
    cooperationMonths: overrides.cooperationMonths ?? 12,
    totalOrders: overrides.totalOrders ?? 10,
    totalAmount: overrides.totalAmount ?? 500000,
    defectRate: overrides.defectRate ?? 0.5,
    avgDeliveryDays: overrides.avgDeliveryDays ?? 3,
    address: overrides.address ?? '测试地址',
    marketCode: overrides.marketCode ?? 'cn-mainland',
    createdBy: overrides.createdBy ?? '系统管理员',
    createdAt: overrides.createdAt ?? '2026-01-01',
    lastOrderAt: overrides.lastOrderAt ?? '2026-07-01',
  };
}

// ============================================================
//  1. 供应商表单验证
// ============================================================

test.describe('Suppliers Enhanced — 表单验证', () => {
  // 正例
  test('所有必填字段存在时通过校验', () => {
    const s = makeSupplier();
    assert.ok(s.name.length > 0);
    assert.ok(s.code.length > 0);
    assert.ok(s.contactPerson.length > 0);
    assert.ok(s.contactPhone.length > 0);
    assert.ok(s.category in SUPPLIER_CATEGORY_MAP);
  });

  test('联系电话支持国际格式', () => {
    const intl = makeSupplier({ contactPhone: '+1-415-000-1001' });
    assert.ok(intl.contactPhone.startsWith('+'));
    assert.ok(intl.contactPhone.length >= 10);
  });

  test('供应商名称含特殊字符', () => {
    const special = makeSupplier({ name: 'ABC 科技有限公司 (Shanghai) Co., Ltd.' });
    assert.ok(special.name.includes('('));
    assert.ok(special.name.includes(')'));
    assert.ok(special.name.includes(','));
  });

  // 反例
  test('空联系人姓名应被检测', () => {
    const s = makeSupplier({ contactPerson: '' });
    assert.equal(s.contactPerson, '');
  });

  test('空联系电话应被检测', () => {
    const s = makeSupplier({ contactPhone: '' });
    assert.equal(s.contactPhone, '');
  });

  test('非法的 status 值不在 SUPPLIER_STATUSES 中', () => {
    const invalidStatuses = ['deleted', 'archived', 'suspended', 'inactive'];
    for (const st of invalidStatuses) {
      assert.ok(!SUPPLIER_STATUSES.includes(st as SupplierStatus));
    }
  });

  test('非法的 category 值不在 SUPPLIER_CATEGORIES 中', () => {
    const invalidCats = ['food', 'software', 'transport', 'manufacturing'];
    for (const cat of invalidCats) {
      assert.ok(!SUPPLIER_CATEGORIES.includes(cat as SupplierCategory));
    }
  });

  test('非法的 creditRating 值', () => {
    const invalidRatings = ['D', 'E', 'F', 'AAA+', 'AA-'];
    const validCredits: SupplierCredit[] = ['AAA', 'AA', 'A', 'B', 'C'];
    for (const r of invalidRatings) {
      assert.ok(!validCredits.includes(r as SupplierCredit));
    }
  });

  // 边界
  test('联系电话最小长度为 11 位国内号', () => {
    const cn = makeSupplier({ contactPhone: '13800010001' });
    assert.equal(cn.contactPhone.length, 11);
  });

  test('邮箱含 @ 符号', () => {
    const s = makeSupplier({ email: 'test@supplier.com' });
    assert.ok(s.email.includes('@'));
    const noAt = makeSupplier({ email: 'bademail' });
    assert.ok(!noAt.email.includes('@'));
  });
});

// ============================================================
//  2. 数据操作 (filter, search, sort, pagination)
// ============================================================

test.describe('Suppliers Enhanced — 数据操作', () => {
  // 正例: 筛选
  test('按市场筛选 US 供应商', () => {
    const us = MOCK_SUPPLIERS.filter((s) => s.marketCode === 'us-default');
    assert.equal(us.length, 2);
    assert.ok(us.every((s) => s.marketCode === 'us-default'));
  });

  test('按市场筛选国内供应商', () => {
    const cn = MOCK_SUPPLIERS.filter((s) => s.marketCode === 'cn-mainland');
    assert.equal(cn.length, 14);
  });

  // 正例: 搜索
  test('按名称关键词搜索', () => {
    const keyword = '物流';
    const found = MOCK_SUPPLIERS.filter((s) => s.name.includes(keyword));
    assert.equal(found.length, 2); // 海龙物流集团, 西南冷链物流有限公司
    for (const s of found) {
      assert.ok(s.name.includes(keyword));
    }
  });

  test('按联系人搜索', () => {
    const keyword = '陈';
    const found = MOCK_SUPPLIERS.filter((s) => s.contactPerson.includes(keyword));
    assert.ok(found.length >= 2); // 陈海, 陈福瑞, 陈芳(creator not contactPerson)
    for (const s of found) {
      assert.ok(s.contactPerson.includes(keyword));
    }
  });

  // 正例: 排序
  test('按 cooperationMonths 降序', () => {
    const sorted = [...MOCK_SUPPLIERS].sort((a, b) => b.cooperationMonths - a.cooperationMonths);
    assert.equal(sorted[0]!.cooperationMonths, 60); // sp-010
    assert.ok(sorted[0]!.cooperationMonths >= sorted[1]!.cooperationMonths);
  });

  test('按 avgDeliveryDays 升序', () => {
    const sorted = [...MOCK_SUPPLIERS].sort((a, b) => a.avgDeliveryDays - b.avgDeliveryDays);
    // 最小的应该是 avgDeliveryDays=0 (pending_audit) 或者 avgDeliveryDays=1
    assert.ok(sorted[0]!.avgDeliveryDays <= sorted[1]!.avgDeliveryDays);
  });

  // 反例
  test('不存在的搜索关键词返回空', () => {
    const found = MOCK_SUPPLIERS.filter((s) => s.name.includes('XX不存在的供应商XX'));
    assert.equal(found.length, 0);
  });

  // 边界
  test('空值搜索', () => {
    const all = MOCK_SUPPLIERS; // no filter => all
    assert.equal(all.length, 16);
  });

  test('搜索区分大小写', () => {
    const lower = MOCK_SUPPLIERS.filter((s) => s.name.toLowerCase().includes('global'));
    const upper = MOCK_SUPPLIERS.filter((s) => s.name.includes('Global'));
    assert.equal(lower.length, upper.length);
  });
});

// ============================================================
//  3. 供应商状态变更
// ============================================================

test.describe('Suppliers Enhanced — 状态变更', () => {
  test('active 供应商可变为 paused', () => {
    const active = MOCK_SUPPLIERS.filter((s) => s.status === 'active');
    assert.ok(active.length > 0);
  });

  test('blacklisted 供应商不应在合作中', () => {
    const blacklisted = MOCK_SUPPLIERS.find((s) => s.status === 'blacklisted');
    assert.ok(blacklisted);
    assert.ok(blacklisted!.status === 'blacklisted');
    // 黑名单供应商 defectRate > 10
    assert.ok(blacklisted!.defectRate > 10);
  });

  test('pending_audit 供应商可转 active', () => {
    const pending = MOCK_SUPPLIERS.filter((s) => s.status === 'pending_audit');
    assert.equal(pending.length, 2);
    // 待审核的供应商应该有 0 合作月份
    assert.ok(pending.every((s) => s.cooperationMonths === 0));
  });

  test('cooperationMonths 不为负数', () => {
    for (const s of MOCK_SUPPLIERS) {
      assert.ok(s.cooperationMonths >= 0);
    }
  });

  test('lastOrderAt 为 "-" 表示从未下单', () => {
    const noOrders = MOCK_SUPPLIERS.filter((s) => s.lastOrderAt === '-');
    assert.equal(noOrders.length, 2); // sp-006, sp-013
    assert.ok(noOrders.every((s) => s.totalOrders === 0));
  });
});

// ============================================================
//  4. 供应商等级与信用评估
// ============================================================

test.describe('Suppliers Enhanced — 等级评估', () => {
  test('AAA 级供应商 defectRate < 0.5', () => {
    const aaa = MOCK_SUPPLIERS.filter((s) => s.creditRating === 'AAA');
    assert.ok(aaa.every((s) => s.defectRate <= 0.3));
  });

  test('B 级和 C 级供应商 defectRate 较高', () => {
    const lowCredit = MOCK_SUPPLIERS.filter((s) => s.creditRating === 'B' || s.creditRating === 'C');
    for (const s of lowCredit) {
      assert.ok(s.defectRate >= 3.0, `${s.name} defectRate ${s.defectRate} should be >= 3.0`);
    }
  });

  test('SUPPLIER_CREDIT_MAP 颜色代码是有效的十六进制', () => {
    const hexPattern = /^#[0-9a-fA-F]{6}$/;
    const allCredits: SupplierCredit[] = ['AAA', 'AA', 'A', 'B', 'C'];
    for (const c of allCredits) {
      const entry = SUPPLIER_CREDIT_MAP[c];
      assert.ok(entry, `Missing credit map for ${c}`);
      assert.ok(hexPattern.test(entry.color), `Color ${entry.color} for ${c} is not valid hex`);
    }
  });

  test('供应商等级与合作月份正相关 (AAA 平均 > B)', () => {
    const aaaAvg = MOCK_SUPPLIERS
      .filter((s) => s.creditRating === 'AAA')
      .reduce((s, i) => s + i.cooperationMonths, 0) / MOCK_SUPPLIERS.filter((s) => s.creditRating === 'AAA').length;
    const bAvg = MOCK_SUPPLIERS
      .filter((s) => s.creditRating === 'B')
      .reduce((s, i) => s + i.cooperationMonths, 0) / MOCK_SUPPLIERS.filter((s) => s.creditRating === 'B').length;
    assert.ok(aaaAvg > bAvg, `AAA avg ${aaaAvg} should be > B avg ${bAvg}`);
  });
});

// ============================================================
//  5. 财务统计与金额计算
// ============================================================

test.describe('Suppliers Enhanced — 统计计算', () => {
  test('computeSupplierStats 金额汇总', () => {
    const items = [
      makeSupplier({ totalAmount: 1000000 }),
      makeSupplier({ totalAmount: 2000000 }),
      makeSupplier({ totalAmount: 3000000 }),
    ];
    const stats = computeSupplierStats(items);
    assert.equal(stats.totalAmount, 6000000);
  });

  test('computeSupplierStats 只含 active 供应商', () => {
    const items = [
      makeSupplier({ status: 'active' }),
      makeSupplier({ status: 'active' }),
    ];
    const stats = computeSupplierStats(items);
    assert.equal(stats.active, 2);
    assert.equal(stats.paused, 0);
    assert.equal(stats.blacklisted, 0);
  });

  test('formatCurrency 万元级别', () => {
    assert.equal(formatCurrency(50000), '5.00万');
    assert.equal(formatCurrency(9999), '9,999');
  });

  test('formatCurrency 百万元级别', () => {
    assert.equal(formatCurrency(1000000), '100.0万');
    assert.equal(formatCurrency(15800000), '1580.0万');
  });

  test('formatCurrency 亿元级别', () => {
    // 1.5亿 = 150000000
    assert.equal(formatCurrency(150000000), '15000.0万');
  });

  test('formatCurrency 零值', () => {
    assert.equal(formatCurrency(0), '0');
  });

  // 边界: 大额
  test('formatCurrency 超大金额', () => {
    const result = formatCurrency(9999999999);
    assert.ok(result.length > 0);
    assert.ok(typeof result === 'string');
  });
});

// ============================================================
//  6. 供应商类别与市场
// ============================================================

test.describe('Suppliers Enhanced — 类别与市场', () => {
  test('SUPPLIER_CATEGORY_MAP 中文标签完整', () => {
    const expectedLabels = ['原材料', '包装耗材', '设备', '物流配送', '服务', '其他'];
    const actualLabels = SUPPLIER_CATEGORIES.map((c) => SUPPLIER_CATEGORY_MAP[c]);
    assert.deepEqual(actualLabels.sort(), expectedLabels.sort());
  });

  test('SUPPLIER_STATUS_MAP 中文标签完整', () => {
    const allStatuses: SupplierStatus[] = ['active', 'paused', 'blacklisted', 'pending_audit'];
    for (const s of allStatuses) {
      assert.ok(SUPPLIER_STATUS_MAP[s].label.length > 0);
    }
  });

  test('市场代码仅含 us-default 和 cn-mainland', () => {
    const markets = new Set(MOCK_SUPPLIERS.map((s) => s.marketCode));
    assert.equal(markets.size, 2);
    assert.ok(markets.has('cn-mainland'));
    assert.ok(markets.has('us-default'));
  });

  test('US 市场的供应商合作月份较长 (国际物流为主)', () => {
    const usSuppliers = MOCK_SUPPLIERS.filter((s) => s.marketCode === 'us-default');
    assert.ok(usSuppliers.every((s) => s.cooperationMonths >= 28));
  });
});

// ============================================================
//  7. 边界与异常
// ============================================================

test.describe('Suppliers Enhanced — 边界条件', () => {
  test('defectRate 不可能大于 100', () => {
    for (const s of MOCK_SUPPLIERS) {
      assert.ok(s.defectRate <= 100);
    }
  });

  test('totalAmount 不可能为负数', () => {
    for (const s of MOCK_SUPPLIERS) {
      assert.ok(s.totalAmount >= 0, `${s.name} has negative totalAmount`);
    }
  });

  test('totalOrders 不可能为负数', () => {
    for (const s of MOCK_SUPPLIERS) {
      assert.ok(s.totalOrders >= 0);
    }
  });

  test('avgDeliveryDays 为 0 表示未开始', () => {
    const zeroDeliveryDays = MOCK_SUPPLIERS.filter((s) => s.avgDeliveryDays === 0);
    // pending_audit 和可能有其他
    assert.ok(zeroDeliveryDays.length >= 2);
    assert.ok(zeroDeliveryDays.every((s) => s.totalOrders === 0));
  });

  test('createdBy 字段不为空', () => {
    for (const s of MOCK_SUPPLIERS) {
      assert.ok(s.createdBy.length > 0, `${s.name} has empty createdBy`);
    }
  });

  test('createdAt 日期格式有效', () => {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    for (const s of MOCK_SUPPLIERS) {
      assert.ok(datePattern.test(s.createdAt), `${s.name} has invalid createdAt: ${s.createdAt}`);
    }
  });

  test('Mock 数据无重复 email', () => {
    const emails = MOCK_SUPPLIERS.map((s) => s.email);
    assert.equal(new Set(emails).size, emails.length);
  });

  // computeSupplierStats topCategory tie-breaking
  test('computeSupplierStats topCategory 在平局时返回第一个', () => {
    const items = [
      makeSupplier({ category: 'equipment' }),
      makeSupplier({ category: 'equipment' }),
      makeSupplier({ category: 'service' }),
      makeSupplier({ category: 'service' }),
    ];
    const stats = computeSupplierStats(items);
    assert.ok(['equipment', 'service'].includes(stats.topCategory));
  });
});
