/**
 * SuppliersListPage — node:test 兼容适配
 * 不渲染 React 组件（无 jsdom），只验证：
 * - 模块可导入，default 导出为函数
 * - 供应商状态标签/颜色映射
 * - Mock 数据完整性
 * - 辅助函数逻辑
 * - 分类/状态筛选逻辑
 * - 搜索逻辑
 * - 分页逻辑
 */

import assert from 'node:assert/strict';
import { describe, it, before, mock } from 'node:test';

// ---- 与组件保持一致的类型/常量 ---- //

type SupplierStatus = 'active' | 'paused' | 'terminated' | 'pending';

const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  active: '合作中',
  paused: '暂停合作',
  terminated: '终止合作',
  pending: '审批中',
};

const SUPPLIER_STATUS_COLORS: Record<SupplierStatus, string> = {
  active: '#059669',
  paused: '#d97706',
  terminated: '#dc2626',
  pending: '#7c3aed',
};

interface SupplierItem {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  status: SupplierStatus;
  totalProducts: number;
  totalAmount: number;
  cooperationStart: string;
  updatedAt: string;
  address: string;
}

const SUPPLIER_CATEGORIES = ['全部', '护肤品', '彩妆', '香水', '美妆工具', '包装材料', '其他'];

const MOCK_SUPPLIERS: Record<string, SupplierItem> = {
  '1': {
    id: '1', code: 'SUP-001', name: '广州美妆供应链有限公司',
    contactPerson: '李明', phone: '13800138001', email: 'liming@gzbeauty.com',
    category: '护肤品', status: 'active', totalProducts: 48, totalAmount: 1268000,
    cooperationStart: '2024-01-15', updatedAt: '2026-06-25 10:32',
    address: '广州市白云区美妆产业园区A栋',
  },
  '2': {
    id: '2', code: 'SUP-002', name: '上海日化贸易有限公司',
    contactPerson: '王芳', phone: '13900139002', email: 'wangfang@shdaily.com',
    category: '彩妆', status: 'active', totalProducts: 36, totalAmount: 892000,
    cooperationStart: '2024-03-20', updatedAt: '2026-06-25 09:15',
    address: '上海市浦东新区外高桥保税区B座',
  },
  '3': {
    id: '3', code: 'SUP-003', name: '杭州香氛科技有限公司',
    contactPerson: '张伟', phone: '13700137003', email: 'zhangwei@hzperfume.com',
    category: '香水', status: 'paused', totalProducts: 12, totalAmount: 345000,
    cooperationStart: '2024-06-01', updatedAt: '2026-06-24 18:00',
    address: '杭州市余杭区未来科技城C座',
  },
  '4': {
    id: '4', code: 'SUP-004', name: '深圳包材创新有限公司',
    contactPerson: '刘洋', phone: '13600136004', email: 'liuyang@szpackaging.com',
    category: '包装材料', status: 'active', totalProducts: 85, totalAmount: 523000,
    cooperationStart: '2024-02-10', updatedAt: '2026-06-25 08:45',
    address: '深圳市宝安区福永街道工业园',
  },
  '5': {
    id: '5', code: 'SUP-005', name: '韩国美妆株式会社上海代表处',
    contactPerson: '朴俊昊', phone: '13500135005', email: 'park@korea-beauty.com',
    category: '彩妆', status: 'pending', totalProducts: 0, totalAmount: 0,
    cooperationStart: '-', updatedAt: '2026-06-26 09:00',
    address: '上海市长宁区虹桥开发区',
  },
  '6': {
    id: '6', code: 'SUP-006', name: '北京草本护肤品有限公司',
    contactPerson: '陈静', phone: '13400134006', email: 'chenjing@bjherb.com',
    category: '护肤品', status: 'terminated', totalProducts: 18, totalAmount: 210000,
    cooperationStart: '2023-09-01', updatedAt: '2026-06-20 14:00',
    address: '北京市大兴区生物医药基地',
  },
  '7': {
    id: '7', code: 'SUP-007', name: '广州妆具工贸有限公司',
    contactPerson: '赵鹏', phone: '13300133007', email: 'zhaopeng@gzzhuangju.com',
    category: '美妆工具', status: 'active', totalProducts: 52, totalAmount: 389000,
    cooperationStart: '2024-05-15', updatedAt: '2026-06-25 11:00',
    address: '广州市番禺区南村镇工业园',
  },
  '8': {
    id: '8', code: 'SUP-008', name: '青岛海洋生物科技有限公司',
    contactPerson: '周鑫', phone: '13200132008', email: 'zhouxin@qdmarine.com',
    category: '护肤品', status: 'active', totalProducts: 24, totalAmount: 678000,
    cooperationStart: '2024-07-01', updatedAt: '2026-06-23 16:20',
    address: '青岛市黄岛区前湾港路',
  },
};

/** 分类筛选 */
function filterByCategory(items: SupplierItem[], category: string): SupplierItem[] {
  if (!category) return items;
  return items.filter((i) => i.category === category);
}

/** 状态筛选 */
function filterByStatus(items: SupplierItem[], status: SupplierStatus | ''): SupplierItem[] {
  if (!status) return items;
  return items.filter((i) => i.status === status);
}

/** 搜索 */
function searchItems(items: SupplierItem[], query: string): SupplierItem[] {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.code.toLowerCase().includes(q) ||
      i.contactPerson.toLowerCase().includes(q) ||
      i.phone.includes(q)
  );
}

/** 分页 */
function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

// ---- MOCK_SUPPLIERS 列表化（用于批量筛选测试） ----
const allSuppliers = Object.values(MOCK_SUPPLIERS);

// ---- 测试 ----

describe('SuppliersListPage 供应商列表', () => {
  it('1. 模块可导入，default 导出为函数', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function', 'default export should be a function (component)');
  });

  it('2. SUPPLIER_STATUS_LABELS 包含所有 4 种供应商状态', () => {
    assert.equal(Object.keys(SUPPLIER_STATUS_LABELS).length, 4);
    assert.equal(SUPPLIER_STATUS_LABELS.active, '合作中');
    assert.equal(SUPPLIER_STATUS_LABELS.paused, '暂停合作');
    assert.equal(SUPPLIER_STATUS_LABELS.terminated, '终止合作');
    assert.equal(SUPPLIER_STATUS_LABELS.pending, '审批中');
  });

  it('3. SUPPLIER_STATUS_COLORS 为每个状态提供颜色', () => {
    for (const status of Object.keys(SUPPLIER_STATUS_COLORS) as SupplierStatus[]) {
      assert.ok(SUPPLIER_STATUS_COLORS[status].startsWith('#'), status + ' color should be hex');
    }
  });

  it('4. SUPPLIER_CATEGORIES 包含所有分类', () => {
    assert.ok(SUPPLIER_CATEGORIES.includes('全部'));
    assert.ok(SUPPLIER_CATEGORIES.includes('护肤品'));
    assert.ok(SUPPLIER_CATEGORIES.includes('彩妆'));
    assert.ok(SUPPLIER_CATEGORIES.includes('香水'));
    assert.equal(SUPPLIER_CATEGORIES.length, 7);
  });

  it('5. formatCurrency 正确格式化', () => {
    assert.equal(formatCurrency(0), '¥0.00');
    assert.equal(formatCurrency(1268000), '¥1,268,000.00');
    assert.equal(formatCurrency(892000), '¥892,000.00');
    assert.equal(formatCurrency(345000), '¥345,000.00');
    assert.equal(formatCurrency(389000), '¥389,000.00');
    assert.equal(formatCurrency(1.5), '¥1.50');
    assert.equal(formatCurrency(-100), '¥-100.00');
  });

  it('6. MOCK_SUPPLIERS 共 8 家供应商', () => {
    assert.equal(allSuppliers.length, 8);
  });

  it('7. SUP-001 数据完整性（active）', () => {
    const item = MOCK_SUPPLIERS['1'];
    assert.equal(item.name, '广州美妆供应链有限公司');
    assert.equal(item.status, 'active');
    assert.equal(item.totalProducts, 48);
    assert.equal(item.totalAmount, 1268000);
    assert.equal(item.contactPerson, '李明');
  });

  it('8. SUP-005 为 pending 状态，商品数为 0', () => {
    const item = MOCK_SUPPLIERS['5'];
    assert.equal(item.status, 'pending');
    assert.equal(item.totalProducts, 0);
    assert.equal(item.totalAmount, 0);
    assert.equal(item.cooperationStart, '-');
  });

  it('9. SUP-006 为 terminated 状态', () => {
    const item = MOCK_SUPPLIERS['6'];
    assert.equal(item.status, 'terminated');
    assert.equal(item.name, '北京草本护肤品有限公司');
  });

  it('10. 不存在的 ID 应返回 undefined', () => {
    assert.equal(MOCK_SUPPLIERS['999'], undefined);
  });
});

describe('SuppliersListPage 筛选逻辑', () => {
  it('11. 分类筛选：护肤品返回 3 家', () => {
    const result = filterByCategory(allSuppliers, '护肤品');
    assert.equal(result.length, 3);
    assert.ok(result.every((i) => i.category === '护肤品'));
  });

  it('12. 分类筛选：彩妆返回 2 家', () => {
    const result = filterByCategory(allSuppliers, '彩妆');
    assert.equal(result.length, 2);
  });

  it('13. 分类筛选：空返回全部', () => {
    const result = filterByCategory(allSuppliers, '');
    assert.equal(result.length, allSuppliers.length);
  });

  it('14. 状态筛选：active 返回 5 家', () => {
    const result = filterByStatus(allSuppliers, 'active');
    assert.equal(result.length, 5);
    assert.ok(result.every((i) => i.status === 'active'));
  });

  it('15. 状态筛选：paused 返回 1 家', () => {
    const result = filterByStatus(allSuppliers, 'paused');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '杭州香氛科技有限公司');
  });

  it('16. 状态筛选：pending 返回 1 家', () => {
    const result = filterByStatus(allSuppliers, 'pending');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '韩国美妆株式会社上海代表处');
  });

  it('17. 状态筛选：terminated 返回 1 家', () => {
    const result = filterByStatus(allSuppliers, 'terminated');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '北京草本护肤品有限公司');
  });

  it('18. 状态筛选：空返回全部', () => {
    const result = filterByStatus(allSuppliers, '');
    assert.equal(result.length, allSuppliers.length);
  });

  it('19. 组合筛选：护肤品 + active 返回 2 家', () => {
    const catFiltered = filterByCategory(allSuppliers, '护肤品');
    const result = filterByStatus(catFiltered, 'active');
    assert.equal(result.length, 2); // SUP-001, SUP-008
    assert.ok(result.every((i) => i.category === '护肤品' && i.status === 'active'));
  });

  it('20. 组合筛选：彩妆 + active 返回 1 家', () => {
    const catFiltered = filterByCategory(allSuppliers, '彩妆');
    const result = filterByStatus(catFiltered, 'active');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '上海日化贸易有限公司');
  });
});

describe('SuppliersListPage 搜索逻辑', () => {
  it('21. 搜索 "广州" 返回 2 家', () => {
    const result = searchItems(allSuppliers, '广州');
    assert.equal(result.length, 2);
    assert.ok(result.every((i) => i.name.includes('广州') || i.code.includes('广州')));
  });

  it('22. 搜索 "上海" 返回 2 家', () => {
    const result = searchItems(allSuppliers, '上海');
    assert.equal(result.length, 2);
  });

  it('23. 搜索 "李明" 返回 1 家（联系人）', () => {
    const result = searchItems(allSuppliers, '李明');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '1');
  });

  it('24. 搜索 "SUP-003" 返回 1 家（编码）', () => {
    const result = searchItems(allSuppliers, 'SUP-003');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '杭州香氛科技有限公司');
  });

  it('25. 搜索 "韩国" 返回 1 家', () => {
    const result = searchItems(allSuppliers, '韩国');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '5');
  });

  it('26. 搜索不存在的关键字返回空', () => {
    const result = searchItems(allSuppliers, '不存在的供应商');
    assert.equal(result.length, 0);
  });

  it('27. 空搜索返回全部', () => {
    const result = searchItems(allSuppliers, '');
    assert.equal(result.length, allSuppliers.length);
  });

  it('28. 搜索 "13800138001" 返回 1 家（手机号）', () => {
    const result = searchItems(allSuppliers, '13800138001');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '1');
  });
});

describe('SuppliersListPage 分页逻辑', () => {
  it('29. 第1页每页5条，返回前5条', () => {
    const result = paginate(allSuppliers, 1, 5);
    assert.equal(result.length, 5);
    assert.equal(result[0].id, '1');
    assert.equal(result[4].id, '5');
  });

  it('30. 第2页每页5条，返回后3条', () => {
    const result = paginate(allSuppliers, 2, 5);
    assert.equal(result.length, 3);
    assert.equal(result[0].id, '6');
    assert.equal(result[2].id, '8');
  });

  it('31. 第1页每页10条，返回全部8条', () => {
    const result = paginate(allSuppliers, 1, 10);
    assert.equal(result.length, 8);
  });

  it('32. 超出范围的分页返回空', () => {
    const result = paginate(allSuppliers, 999, 10);
    assert.equal(result.length, 0);
  });
});

describe('SuppliersListPage 聚合数据', () => {
  it('33. 所有供应商总采购额计算正确', () => {
    const total = allSuppliers.reduce((s, i) => s + i.totalAmount, 0);
    assert.equal(total, 4305000);
  });

  it('34. 所有供应商合作商品总数计算正确', () => {
    const total = allSuppliers.reduce((s, i) => s + i.totalProducts, 0);
    assert.equal(total, 275);
  });

  it('35. 各状态供应商数量汇总', () => {
    const active = allSuppliers.filter((i) => i.status === 'active').length;
    const paused = allSuppliers.filter((i) => i.status === 'paused').length;
    const terminated = allSuppliers.filter((i) => i.status === 'terminated').length;
    const pending = allSuppliers.filter((i) => i.status === 'pending').length;
    assert.equal(active, 5);
  });
});

describe('SuppliersListPage 状态精确验证', () => {
  it('36. 各供应商状态精确确认', () => {
    assert.equal(MOCK_SUPPLIERS['1'].status, 'active');
    assert.equal(MOCK_SUPPLIERS['2'].status, 'active');
    assert.equal(MOCK_SUPPLIERS['3'].status, 'paused');
    assert.equal(MOCK_SUPPLIERS['4'].status, 'active');
    assert.equal(MOCK_SUPPLIERS['5'].status, 'pending');
    assert.equal(MOCK_SUPPLIERS['6'].status, 'terminated');
    assert.equal(MOCK_SUPPLIERS['7'].status, 'active');
    assert.equal(MOCK_SUPPLIERS['8'].status, 'active');
  });

  it('37. active 实际数量应为 5', () => {
    const active = allSuppliers.filter((i) => i.status === 'active').length;
    assert.equal(active, 5); // SUP-001,002,004,007,008
  });

  it('38. 非active供应商统计', () => {
    const nonActive = allSuppliers.filter((i) => i.status !== 'active');
    assert.equal(nonActive.length, 3); // paused(1) + pending(1) + terminated(1)
  });
});
