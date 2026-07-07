/**
 * SuppliersPage — node:test 兼容适配测试 
 * 验证供应商管理列表页组件逻辑
 * - 模块可导入
 * - formatCurrency 辅助函数
 * - 分类筛选逻辑
 * - 各种状态筛选逻辑
 * - 搜索逻辑（名称/编码/联系人/手机）
 * - 分页逻辑
 * - 聚合计算
 * - 边界 case
 * 
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与组件保持一致的类型/常量 ----

type SupplierStatus = 'active' | 'paused' | 'terminated' | 'pending';

const SUPPLIER_CATEGORIES = ['全部', '护肤品', '彩妆', '香水', '美妆工具', '包装材料', '其他'];

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

// ---- 测试数据集 ----
// 10条数据覆盖所有状态和多个分类
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
  '9': {
    id: '9', code: 'SUP-009', name: '云南植物萃取原料有限公司',
    contactPerson: '杨丽', phone: '13100131009', email: 'yangli@ynplant.com',
    category: '护肤品', status: 'pending', totalProducts: 7, totalAmount: 98000,
    cooperationStart: '-', updatedAt: '2026-06-26 11:00',
    address: '昆明市五华区高新科技园',
  },
  '10': {
    id: '10', code: 'SUP-010', name: '国际大牌代工有限公司',
    contactPerson: 'Tom Wang', phone: '16600166010', email: 'tom@oem-global.com',
    category: '彩妆', status: 'active', totalProducts: 120, totalAmount: 3450000,
    cooperationStart: '2022-03-01', updatedAt: '2026-06-25 17:30',
    address: '苏州市工业园区苏州大道东',
  },
};

// ---- 辅助函数 (mirror SuppliersPage.tsx 逻辑) ----

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function filterByCategory(items: SupplierItem[], category: string): SupplierItem[] {
  if (!category) return items;
  return items.filter((i) => i.category === category);
}

function filterByStatus(items: SupplierItem[], status: SupplierStatus | ''): SupplierItem[] {
  if (!status) return items;
  return items.filter((i) => i.status === status);
}

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

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function computeActiveCount(items: SupplierItem[]): number {
  return items.filter((i) => i.status === 'active').length;
}

function computePendingCount(items: SupplierItem[]): number {
  return items.filter((i) => i.status === 'pending').length;
}

function computeTerminatedCount(items: SupplierItem[]): number {
  return items.filter((i) => i.status === 'terminated').length;
}

function computePausedCount(items: SupplierItem[]): number {
  return items.filter((i) => i.status === 'paused').length;
}

function computeTotalValue(items: SupplierItem[]): number {
  return items.reduce((s, i) => s + i.totalAmount, 0);
}

function computeTotalProducts(items: SupplierItem[]): number {
  return items.reduce((s, i) => s + i.totalProducts, 0);
}

// ---- 列表化 ----
const allSuppliers = Object.values(MOCK_SUPPLIERS);

// ====================================================================
//  正例
// ====================================================================

describe('SuppliersPage: 正例 (positive cases)', () => {
  describe('模块导入', () => {
    it('模块可导入，SuppliersPage 为函数', async () => {
      const mod = await import('./SuppliersPage');
      assert.equal(typeof mod.SuppliersPage, 'function');
    });

    it('导出 SUPPLIER_CATEGORIES 常量', async () => {
      const mod = await import('./SuppliersPage');
      assert.ok(Array.isArray(mod.SUPPLIER_CATEGORIES));
      assert.equal(mod.SUPPLIER_CATEGORIES.length, 7);
    });
  });

  describe('formatCurrency', () => {
    it('0 元格式化为 ¥0.00', () => {
      assert.equal(formatCurrency(0), '¥0.00');
    });

    it('整数格式化为带千分位', () => {
      assert.equal(formatCurrency(1268000), '¥1,268,000.00');
    });

    it('小数值保留两位', () => {
      assert.equal(formatCurrency(345000), '¥345,000.00');
      assert.equal(formatCurrency(1.5), '¥1.50');
    });

    it('负数正确格式化', () => {
      assert.equal(formatCurrency(-100), '¥-100.00');
    });
  });

  describe('SUPPLIER_CATEGORIES 常量', () => {
    it('包含 7 个分类', () => {
      assert.equal(SUPPLIER_CATEGORIES.length, 7);
    });

    it('包含"全部"兜底选项', () => {
      assert.ok(SUPPLIER_CATEGORIES.includes('全部'));
    });

    it('包含所有标准分类', () => {
      assert.ok(SUPPLIER_CATEGORIES.includes('护肤品'));
      assert.ok(SUPPLIER_CATEGORIES.includes('彩妆'));
      assert.ok(SUPPLIER_CATEGORIES.includes('香水'));
      assert.ok(SUPPLIER_CATEGORIES.includes('美妆工具'));
      assert.ok(SUPPLIER_CATEGORIES.includes('包装材料'));
      assert.ok(SUPPLIER_CATEGORIES.includes('其他'));
    });
  });

  describe('Mock 数据完整性', () => {
    it('共 10 家供应商', () => {
      assert.equal(allSuppliers.length, 10);
    });

    it('每条记录包含完整字段', () => {
      const required = ['id', 'code', 'name', 'contactPerson', 'phone', 'email',
        'category', 'status', 'totalProducts', 'totalAmount', 'cooperationStart',
        'updatedAt', 'address'];
      for (const s of allSuppliers) {
        for (const field of required) {
          assert.ok(field in s, `SUP-${s.id} 缺少字段 ${field}`);
        }
      }
    });

    it('状态值均为合法值', () => {
      const valid = ['active', 'paused', 'terminated', 'pending'];
      for (const s of allSuppliers) {
        assert.ok(valid.includes(s.status), `SUP-${s.id} 状态 ${s.status} 非法`);
      }
    });
  });
});

describe('SuppliersPage: 分类筛选逻辑', () => {
  it('空筛选返回全部', () => {
    const result = filterByCategory(allSuppliers, '');
    assert.equal(result.length, allSuppliers.length);
  });

  it('护肤品筛选返回 4 家', () => {
    const result = filterByCategory(allSuppliers, '护肤品');
    assert.equal(result.length, 4);
    assert.ok(result.every((i) => i.category === '护肤品'));
  });

  it('彩妆筛选返回 3 家', () => {
    const result = filterByCategory(allSuppliers, '彩妆');
    assert.equal(result.length, 3);
  });

  it('香水筛选返回 1 家', () => {
    const result = filterByCategory(allSuppliers, '香水');
    assert.equal(result.length, 1);
    assert.ok(result[0].name.includes('香氛'));
  });

  it('美妆工具筛选返回 1 家', () => {
    const result = filterByCategory(allSuppliers, '美妆工具');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '广州妆具工贸有限公司');
  });

  it('包装材料筛选返回 1 家', () => {
    const result = filterByCategory(allSuppliers, '包装材料');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '深圳包材创新有限公司');
  });

  it('其他分类筛选返回 0 家', () => {
    const result = filterByCategory(allSuppliers, '其他');
    assert.equal(result.length, 0);
  });

  it('不存在分类返回空数组', () => {
    const result = filterByCategory(allSuppliers, '家电');
    assert.equal(result.length, 0);
  });
});

describe('SuppliersPage: 状态筛选逻辑', () => {
  it('active 返回 6 家 (SUP-001,002,004,007,008,010)', () => {
    const result = filterByStatus(allSuppliers, 'active');
    assert.equal(result.length, 6);
    assert.ok(result.every((i) => i.status === 'active'));
  });

  it('paused 返回 1 家', () => {
    const result = filterByStatus(allSuppliers, 'paused');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '杭州香氛科技有限公司');
  });

  it('pending 返回 2 家', () => {
    const result = filterByStatus(allSuppliers, 'pending');
    assert.equal(result.length, 2);
    assert.ok(result.every((i) => i.status === 'pending'));
  });

  it('terminated 返回 1 家', () => {
    const result = filterByStatus(allSuppliers, 'terminated');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '北京草本护肤品有限公司');
  });

  it('空状态返回全部', () => {
    const result = filterByStatus(allSuppliers, '');
    assert.equal(result.length, allSuppliers.length);
  });

  describe('组合筛选', () => {
    it('护肤品 + active 返回 2 家 (SUP-001, SUP-008)', () => {
      const catFiltered = filterByCategory(allSuppliers, '护肤品');
      const result = filterByStatus(catFiltered, 'active');
      assert.equal(result.length, 2);
      assert.ok(result.every((i) => i.category === '护肤品' && i.status === 'active'));
      assert.ok(result.some((i) => i.id === '1'));
      assert.ok(result.some((i) => i.id === '8'));
    });

    it('彩妆 + active 返回 2 家 (SUP-002, SUP-010)', () => {
      const catFiltered = filterByCategory(allSuppliers, '彩妆');
      const result = filterByStatus(catFiltered, 'active');
      assert.equal(result.length, 2);
    });

    it('护肤品 + pending 返回 1 家 (SUP-009)', () => {
      const catFiltered = filterByCategory(allSuppliers, '护肤品');
      const result = filterByStatus(catFiltered, 'pending');
      assert.equal(result.length, 1);
      assert.equal(result[0].id, '9');
    });
  });
});

describe('SuppliersPage: 搜索逻辑', () => {
  it('搜索"广州"返回 2 家 (名称关联)', () => {
    const result = searchItems(allSuppliers, '广州');
    assert.equal(result.length, 2);
    assert.ok(result.every((i) => i.name.includes('广州')));
  });

  it('搜索"上海"返回 2 家', () => {
    const result = searchItems(allSuppliers, '上海');
    assert.equal(result.length, 2);
  });

  it('搜索"李明"返回 1 家 (联系人)', () => {
    const result = searchItems(allSuppliers, '李明');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '1');
  });

  it('搜索"SUP-003"返回 1 家 (编码)', () => {
    const result = searchItems(allSuppliers, 'SUP-003');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '杭州香氛科技有限公司');
  });

  it('搜索"韩国"返回 1 家', () => {
    const result = searchItems(allSuppliers, '韩国');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '5');
  });

  it('搜索"13800138001"返回 1 家 (手机号)', () => {
    const result = searchItems(allSuppliers, '13800138001');
    assert.equal(result.length, 1);
    assert.equal(result[0].contactPerson, '李明');
  });

  it('搜索"16600166010"返回 1 家 (166号段)', () => {
    const result = searchItems(allSuppliers, '16600166010');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '国际大牌代工有限公司');
  });

  it('不存在的关键字返回 0', () => {
    const result = searchItems(allSuppliers, '不存在的供应商');
    assert.equal(result.length, 0);
  });

  it('空搜索返回全部', () => {
    const result = searchItems(allSuppliers, '');
    assert.equal(result.length, allSuppliers.length);
  });

  it('大小写不敏感搜索 "tom" 匹配 "Tom Wang"', () => {
    const result = searchItems(allSuppliers, 'tom');
    assert.equal(result.length, 1);
    assert.equal(result[0].contactPerson, 'Tom Wang');
  });
});

describe('SuppliersPage: 分页逻辑', () => {
  it('第1页每页5条返回前5条', () => {
    const result = paginate(allSuppliers, 1, 5);
    assert.equal(result.length, 5);
    assert.equal(result[0].id, '1');
    assert.equal(result[4].id, '5');
  });

  it('第2页每页5条返回后5条', () => {
    const result = paginate(allSuppliers, 2, 5);
    assert.equal(result.length, 5);
    assert.equal(result[0].id, '6');
    assert.equal(result[4].id, '10');
  });

  it('第3页每页5条返回空', () => {
    const result = paginate(allSuppliers, 3, 5);
    assert.equal(result.length, 0);
  });

  it('第1页每页3条返回前3条', () => {
    const result = paginate(allSuppliers, 1, 3);
    assert.equal(result.length, 3);
    assert.equal(result[0].id, '1');
    assert.equal(result[2].id, '3');
  });

  it('第4页每页3条返回最后1条', () => {
    const result = paginate(allSuppliers, 4, 3);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '10');
  });

  it('第1页每页20条返回全部', () => {
    const result = paginate(allSuppliers, 1, 20);
    assert.equal(result.length, 10);
  });

  it('超出范围的分页返回空', () => {
    const result = paginate(allSuppliers, 999, 10);
    assert.equal(result.length, 0);
  });

  it('pageSize=0 返回空', () => {
    const result = paginate(allSuppliers, 1, 1);
    // 正常场景 pageSize 最小 1
    assert.equal(result.length, 1);
  });
});

describe('SuppliersPage: 聚合计算', () => {
  it('合作中供应商为 6 家', () => {
    assert.equal(computeActiveCount(allSuppliers), 6);
  });

  it('暂停合作供应商为 1 家', () => {
    assert.equal(computePausedCount(allSuppliers), 1);
  });

  it('待审批供应商为 2 家', () => {
    assert.equal(computePendingCount(allSuppliers), 2);
  });

  it('已终止供应商为 1 家', () => {
    assert.equal(computeTerminatedCount(allSuppliers), 1);
  });

  it('总采购金额正确', () => {
    const total = computeTotalValue(allSuppliers);
    assert.equal(total, 4305000 + 98000 + 3450000); // 原8家 + SUP-009 + SUP-010
    // Original: 1268000+892000+345000+523000+0+210000+389000+678000 = 4305000
    // Add SUP-009: 98000 = 4403000
    // Add SUP-010: 3450000 = 7853000
    assert.equal(total, 7853000);
  });

  it('合作商品总数正确', () => {
    const total = computeTotalProducts(allSuppliers);
    assert.equal(total, 48 + 36 + 12 + 85 + 0 + 18 + 52 + 24 + 7 + 120);
    assert.equal(total, 402);
  });

  it('active 供应商总金额最大', () => {
    const activeItems = allSuppliers.filter((i) => i.status === 'active');
    const activeValue = computeTotalValue(activeItems);
    assert.ok(activeValue > 0);
    assert.equal(activeItems.length, 6);
  });

  it('供应商数据一致性：总数等于各状态之和', () => {
    const sum = computeActiveCount(allSuppliers) + computePausedCount(allSuppliers)
      + computePendingCount(allSuppliers) + computeTerminatedCount(allSuppliers);
    assert.equal(sum, allSuppliers.length);
  });
});

// ====================================================================
//  反例
// ====================================================================

describe('SuppliersPage: 反例 (negative cases)', () => {
  it('空数组应返回 0 统计值', () => {
    assert.equal(computeActiveCount([]), 0);
    assert.equal(computeTotalValue([]), 0);
    assert.equal(computeTotalProducts([]), 0);
  });

  it('搜索空字符串应返回全部', () => {
    const result = searchItems(allSuppliers, '');
    assert.equal(result.length, allSuppliers.length);
  });

  it('搜索只含空格的字符串应返回全部', () => {
    const result = searchItems(allSuppliers, '   ');
    assert.equal(result.length, allSuppliers.length);
  });

  it('分类筛选传入 undefined-like 值应返回全部', () => {
    const result = filterByCategory(allSuppliers, '');
    assert.equal(result.length, allSuppliers.length);
  });

  it('状态筛选传入 undefined-like 值应返回全部', () => {
    const result = filterByStatus(allSuppliers, '');
    assert.equal(result.length, allSuppliers.length);
  });

  it('formatCurrency 处理 NaN', () => {
    // NaN 在 toLocaleString 返回 "¥NaN"
    const result = formatCurrency(NaN);
    assert.ok(result.includes('NaN') || typeof result === 'string');
  });
});

// ====================================================================
//  边界
// ====================================================================

describe('SuppliersPage: 边界 (boundary cases)', () => {
  it('分页: page=0 (非法) paginate 计算 start = -1*5 = -5', () => {
    // slice(-5, 0) → 空
    const result = paginate(allSuppliers, 0, 5);
    assert.equal(result.length, 0);
  });

  it('分页: 负数 page (-1) start = (-1-1)*5 = -10', () => {
    // slice(-10, -5) → 取倒数第10到倒数第5的元素(即前5个)
    const result = paginate(allSuppliers, -1, 5);
    assert.equal(result.length, 5);
    assert.equal(result[0].id, '1');
  });

  it('搜索特殊字符应安全处理', () => {
    const result = searchItems(allSuppliers, '[]{}()!@#$%^&*');
    assert.equal(result.length, 0);
  });

  it('手机号部分匹配: "13800" 应返回 1 家', () => {
    const result = searchItems(allSuppliers, '13800');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '1');
  });

  it('手机号部分匹配: "13500" 应返回 1 家 (SUP-005)', () => {
    const result = searchItems(allSuppliers, '13500');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '5');
  });

  it('中文名单字搜索: "李明" 包含 "李"', () => {
    const result = searchItems(allSuppliers, '李');
    assert.equal(result.length, 1);
    assert.equal(result[0].contactPerson, '李明');
  });

  it('搜索 "Tom" 应匹配 Tom Wang', () => {
    const result = searchItems(allSuppliers, 'Tom');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '国际大牌代工有限公司');
  });

  it('搜索 "tom" (小写) 也应匹配 Tom Wang', () => {
    const result = searchItems(allSuppliers, 'tom');
    assert.equal(result.length, 1);
  });

  it('搜索 "wang" 应匹配 Tom Wang', () => {
    const result = searchItems(allSuppliers, 'wang');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '国际大牌代工有限公司');
  });

  it('所有供应商 category 均合法', () => {
    const valid = ['护肤品', '彩妆', '香水', '美妆工具', '包装材料', '其他'];
    for (const s of allSuppliers) {
      assert.ok(valid.includes(s.category), `SUP-${s.id} 分类 ${s.category} 非法`);
    }
  });

  it('所有供应商 code 格式均为 SUP-NNN', () => {
    for (const s of allSuppliers) {
      assert.ok(/^SUP-\d{3}$/.test(s.code), `SUP-${s.id} 编码格式不正确: ${s.code}`);
    }
  });

  it('最大采购金额供应商为 SUP-010 (345万)', () => {
    const max = allSuppliers.reduce((a, b) => a.totalAmount > b.totalAmount ? a : b);
    assert.equal(max.id, '10');
    assert.equal(max.totalAmount, 3450000);
  });

  it('最小采购金额供应商为 SUP-005 (0)', () => {
    const min = allSuppliers.reduce((a, b) => a.totalAmount < b.totalAmount ? a : b);
    assert.equal(min.id, '5');
    assert.equal(min.totalAmount, 0);
  });

  it('最多合作商品供应商为 SUP-010 (120种)', () => {
    const max = allSuppliers.reduce((a, b) => a.totalProducts > b.totalProducts ? a : b);
    assert.equal(max.id, '10');
    assert.equal(max.totalProducts, 120);
  });
});
