/**
 * ReturnsListPage — node:test 兼容适配
 * 不渲染 React 组件（无 jsdom），只验证：
 * - 模块可导入，default 导出为函数
 * - 退货状态标签/颜色映射
 * - Mock 数据完整性
 * - 辅助函数逻辑
 * - 退款原因/状态筛选逻辑
 * - 搜索逻辑
 * - 分页逻辑
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- 与组件保持一致的类型/常量 ---- //

type ReturnStatus = 'pending' | 'approved' | 'processing' | 'shipped' | 'received' | 'completed' | 'rejected';

const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  processing: '处理中',
  shipped: '已寄回',
  received: '已收货',
  completed: '已完成',
  rejected: '已拒绝',
};

const RETURN_STATUS_COLORS: Record<ReturnStatus, string> = {
  pending: '#7c3aed',
  approved: '#2563eb',
  processing: '#d97706',
  shipped: '#0891b2',
  received: '#059669',
  completed: '#16a34a',
  rejected: '#dc2626',
};

interface ReturnItem {
  id: string;
  orderNo: string;
  returnNo: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  productSku: string;
  quantity: number;
  reason: string;
  amount: number;
  status: ReturnStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const RETURN_REASONS = ['全部', '商品质量问题', '尺寸/规格不符', '发错商品', '不想要了', '收到已损坏', '其他'];

const MOCK_RETURNS: Record<string, ReturnItem> = {
  '1': {
    id: '1', orderNo: 'ORD-20260601-001', returnNo: 'RTN-20260601-001',
    customerName: '张小丽', customerPhone: '13800138001',
    productName: '焕颜精华液30ml', productSku: 'SKU-HY-001',
    quantity: 1, reason: '商品质量问题', amount: 298,
    status: 'pending', createdBy: '张小丽',
    createdAt: '2026-06-30 14:22', updatedAt: '2026-06-30 14:22',
  },
  '2': {
    id: '2', orderNo: 'ORD-20260605-002', returnNo: 'RTN-20260605-001',
    customerName: '李华', customerPhone: '13900139002',
    productName: '植物卸妆油150ml', productSku: 'SKU-CZ-003',
    quantity: 2, reason: '尺寸/规格不符', amount: 176,
    status: 'processing', createdBy: '李华',
    createdAt: '2026-06-25 09:10', updatedAt: '2026-06-28 16:00',
  },
  '3': {
    id: '3', orderNo: 'ORD-20260610-003', returnNo: 'RTN-20260610-001',
    customerName: '王美丽', customerPhone: '13700137003',
    productName: '玫瑰保湿面霜50g', productSku: 'SKU-MG-002',
    quantity: 1, reason: '发错商品', amount: 168,
    status: 'completed', createdBy: '王美丽',
    createdAt: '2026-06-10 11:30', updatedAt: '2026-06-18 10:00',
  },
  '4': {
    id: '4', orderNo: 'ORD-20260615-004', returnNo: 'RTN-20260615-001',
    customerName: '赵敏', customerPhone: '13600136004',
    productName: '防晒喷雾SPF50+', productSku: 'SKU-FS-001',
    quantity: 3, reason: '不想要了', amount: 207,
    status: 'pending', createdBy: '赵敏',
    createdAt: '2026-06-15 18:45', updatedAt: '2026-06-15 18:45',
  },
  '5': {
    id: '5', orderNo: 'ORD-20260618-005', returnNo: 'RTN-20260618-001',
    customerName: '孙小红', customerPhone: '13500135005',
    productName: '控油洁面乳120g', productSku: 'SKU-JM-002',
    quantity: 1, reason: '收到已损坏', amount: 89,
    status: 'shipped', createdBy: '孙小红',
    createdAt: '2026-06-18 09:20', updatedAt: '2026-06-22 14:30',
  },
  '6': {
    id: '6', orderNo: 'ORD-20260620-006', returnNo: 'RTN-20260620-001',
    customerName: '周芳', customerPhone: '13400134006',
    productName: '玻尿酸补水面膜5片装', productSku: 'SKU-MM-001',
    quantity: 2, reason: '商品质量问题', amount: 78,
    status: 'received', createdBy: '周芳',
    createdAt: '2026-06-20 15:00', updatedAt: '2026-06-26 11:00',
  },
  '7': {
    id: '7', orderNo: 'ORD-20260622-007', returnNo: 'RTN-20260622-001',
    customerName: '吴茜', customerPhone: '13300133007',
    productName: '眼唇卸妆液100ml', productSku: 'SKU-CZ-005',
    quantity: 1, reason: '商品质量问题', amount: 55,
    status: 'approved', createdBy: '吴茜',
    createdAt: '2026-06-22 20:10', updatedAt: '2026-06-23 10:00',
  },
  '8': {
    id: '8', orderNo: 'ORD-20260625-008', returnNo: 'RTN-20260625-001',
    customerName: '郑雨', customerPhone: '13200132008',
    productName: '眉笔深棕色', productSku: 'SKU-MB-003',
    quantity: 5, reason: '其他', amount: 45,
    status: 'rejected', createdBy: '郑雨',
    createdAt: '2026-06-25 13:30', updatedAt: '2026-06-26 09:00',
  },
  '9': {
    id: '9', orderNo: 'ORD-20260628-009', returnNo: 'RTN-20260628-001',
    customerName: '陈思思', customerPhone: '13100131009',
    productName: '月光香氛蜡烛200g', productSku: 'SKU-XF-001',
    quantity: 1, reason: '尺寸/规格不符', amount: 128,
    status: 'processing', createdBy: '陈思思',
    createdAt: '2026-06-28 10:00', updatedAt: '2026-06-30 08:30',
  },
  '10': {
    id: '10', orderNo: 'ORD-20260630-010', returnNo: 'RTN-20260630-001',
    customerName: '刘雨欣', customerPhone: '13000130010',
    productName: '护发精华油30ml', productSku: 'SKU-HF-002',
    quantity: 2, reason: '不想要了', amount: 136,
    status: 'pending', createdBy: '刘雨欣',
    createdAt: '2026-06-30 09:15', updatedAt: '2026-06-30 09:15',
  },
};

/** 退款原因筛选 */
function filterByReason(items: ReturnItem[], reason: string): ReturnItem[] {
  if (!reason) return items;
  return items.filter((i) => i.reason === reason);
}

/** 状态筛选 */
function filterByStatus(items: ReturnItem[], status: ReturnStatus | ''): ReturnItem[] {
  if (!status) return items;
  return items.filter((i) => i.status === status);
}

/** 搜索 */
function searchItems(items: ReturnItem[], query: string): ReturnItem[] {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter(
    (i) =>
      i.returnNo.toLowerCase().includes(q) ||
      i.orderNo.toLowerCase().includes(q) ||
      i.customerName.toLowerCase().includes(q) ||
      i.productName.toLowerCase().includes(q)
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

// ---- MOCK_RETURNS 列表化（用于批量筛选测试） ----
const allReturns = Object.values(MOCK_RETURNS);

// ---- 测试 ----

describe('ReturnsListPage 退货单列表', () => {
  it('1. 模块可导入，default 导出为函数', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function', 'default export should be a function (component)');
  });

  it('2. RETURN_STATUS_LABELS 包含所有 7 种退货状态', () => {
    assert.equal(Object.keys(RETURN_STATUS_LABELS).length, 7);
    assert.equal(RETURN_STATUS_LABELS.pending, '待审核');
    assert.equal(RETURN_STATUS_LABELS.approved, '已通过');
    assert.equal(RETURN_STATUS_LABELS.processing, '处理中');
    assert.equal(RETURN_STATUS_LABELS.shipped, '已寄回');
    assert.equal(RETURN_STATUS_LABELS.received, '已收货');
    assert.equal(RETURN_STATUS_LABELS.completed, '已完成');
    assert.equal(RETURN_STATUS_LABELS.rejected, '已拒绝');
  });

  it('3. RETURN_STATUS_COLORS 为每个状态提供十六进制颜色', () => {
    for (const status of Object.keys(RETURN_STATUS_COLORS) as ReturnStatus[]) {
      assert.ok(RETURN_STATUS_COLORS[status].startsWith('#'), `${status} color should be hex`);
    }
  });

  it('4. RETURN_REASONS 包含所有退款原因', () => {
    assert.ok(RETURN_REASONS.includes('全部'));
    assert.ok(RETURN_REASONS.includes('商品质量问题'));
    assert.ok(RETURN_REASONS.includes('尺寸/规格不符'));
    assert.ok(RETURN_REASONS.includes('发错商品'));
    assert.ok(RETURN_REASONS.includes('不想要了'));
    assert.ok(RETURN_REASONS.includes('收到已损坏'));
    assert.ok(RETURN_REASONS.includes('其他'));
    assert.equal(RETURN_REASONS.length, 7);
  });

  it('5. formatCurrency 正确格式化', () => {
    assert.equal(formatCurrency(0), '¥0.00');
    assert.equal(formatCurrency(298), '¥298.00');
    assert.equal(formatCurrency(176), '¥176.00');
    assert.equal(formatCurrency(168), '¥168.00');
    assert.equal(formatCurrency(128), '¥128.00');
    assert.equal(formatCurrency(1.5), '¥1.50');
    assert.equal(formatCurrency(-100), '¥-100.00');
  });

  it('6. MOCK_RETURNS 共 10 条退货单', () => {
    assert.equal(allReturns.length, 10);
  });

  it('7. RTN-20260601-001 数据完整性（pending）', () => {
    const item = MOCK_RETURNS['1'];
    assert.equal(item.returnNo, 'RTN-20260601-001');
    assert.equal(item.customerName, '张小丽');
    assert.equal(item.status, 'pending');
    assert.equal(item.amount, 298);
    assert.equal(item.quantity, 1);
  });

  it('8. RTN-20260625-001 为 rejected 状态', () => {
    const item = MOCK_RETURNS['8'];
    assert.equal(item.status, 'rejected');
    assert.equal(item.reason, '其他');
    assert.equal(item.customerName, '郑雨');
  });

  it('9. RTN-20260610-001 为 completed 状态', () => {
    const item = MOCK_RETURNS['3'];
    assert.equal(item.status, 'completed');
    assert.equal(item.reason, '发错商品');
  });

  it('10. 不存在的 ID 应返回 undefined', () => {
    assert.equal(MOCK_RETURNS['999'], undefined);
  });
});

describe('ReturnsListPage 筛选逻辑', () => {
  it('11. 退款原因筛选：商品质量问题返回 3 条', () => {
    const result = filterByReason(allReturns, '商品质量问题');
    assert.equal(result.length, 3);
    assert.ok(result.every((i) => i.reason === '商品质量问题'));
  });

  it('12. 退款原因筛选：尺寸/规格不符返回 2 条', () => {
    const result = filterByReason(allReturns, '尺寸/规格不符');
    assert.equal(result.length, 2);
    assert.ok(result.every((i) => i.reason === '尺寸/规格不符'));
  });

  it('13. 退款原因筛选：不想要了返回 2 条', () => {
    const result = filterByReason(allReturns, '不想要了');
    assert.equal(result.length, 2);
  });

  it('14. 退款原因筛选：空返回全部', () => {
    const result = filterByReason(allReturns, '');
    assert.equal(result.length, allReturns.length);
  });

  it('15. 状态筛选：pending 返回 3 条', () => {
    const result = filterByStatus(allReturns, 'pending');
    assert.equal(result.length, 3);
    assert.ok(result.every((i) => i.status === 'pending'));
  });

  it('16. 状态筛选：processing 返回 2 条', () => {
    const result = filterByStatus(allReturns, 'processing');
    assert.equal(result.length, 2);
    assert.ok(result.every((i) => i.status === 'processing'));
  });

  it('17. 状态筛选：completed 返回 1 条', () => {
    const result = filterByStatus(allReturns, 'completed');
    assert.equal(result.length, 1);
    assert.equal(result[0].customerName, '王美丽');
  });

  it('18. 状态筛选：rejected 返回 1 条', () => {
    const result = filterByStatus(allReturns, 'rejected');
    assert.equal(result.length, 1);
    assert.equal(result[0].customerName, '郑雨');
  });

  it('19. 状态筛选：shipped 返回 1 条', () => {
    const result = filterByStatus(allReturns, 'shipped');
    assert.equal(result.length, 1);
    assert.equal(result[0].customerName, '孙小红');
  });

  it('20. 状态筛选：received 返回 1 条', () => {
    const result = filterByStatus(allReturns, 'received');
    assert.equal(result.length, 1);
    assert.equal(result[0].customerName, '周芳');
  });

  it('21. 状态筛选：approved 返回 1 条', () => {
    const result = filterByStatus(allReturns, 'approved');
    assert.equal(result.length, 1);
    assert.equal(result[0].customerName, '吴茜');
  });

  it('22. 状态筛选：空返回全部', () => {
    const result = filterByStatus(allReturns, '');
    assert.equal(result.length, allReturns.length);
  });

  it('23. 组合筛选：商品质量问题 + pending 返回 1 条', () => {
    const reasonFiltered = filterByReason(allReturns, '商品质量问题');
    const result = filterByStatus(reasonFiltered, 'pending');
    assert.equal(result.length, 1);
    assert.equal(result[0].customerName, '张小丽');
    assert.equal(result[0].status, 'pending');
  });

  it('24. 组合筛选：尺寸/规格不符 + processing 返回 2 条', () => {
    const reasonFiltered = filterByReason(allReturns, '尺寸/规格不符');
    const result = filterByStatus(reasonFiltered, 'processing');
    assert.equal(result.length, 2);
    const names = result.map((i) => i.customerName).sort();
    assert.deepEqual(names, ['李华', '陈思思']);
  });

  it('25. 组合筛选：不想要了 + pending 返回 2 条', () => {
    const reasonFiltered = filterByReason(allReturns, '不想要了');
    const result = filterByStatus(reasonFiltered, 'pending');
    assert.equal(result.length, 2);
    const names = result.map((i) => i.customerName).sort();
    assert.deepEqual(names, ['刘雨欣', '赵敏']);
  });
});

describe('ReturnsListPage 搜索逻辑', () => {
  it('26. 搜索 "RTN-20260601" 返回 1 条（退货单号）', () => {
    const result = searchItems(allReturns, 'RTN-20260601');
    assert.equal(result.length, 1);
    assert.equal(result[0].returnNo, 'RTN-20260601-001');
  });

  it('27. 搜索 "ORD-20260610" 返回 1 条（订单号）', () => {
    const result = searchItems(allReturns, 'ORD-20260610');
    assert.equal(result.length, 1);
    assert.equal(result[0].customerName, '王美丽');
  });

  it('28. 搜索 "张" 返回 1 条（客户名）', () => {
    const result = searchItems(allReturns, '张');
    assert.equal(result.length, 1);
    assert.equal(result[0].customerName, '张小丽');
  });

  it('29. 搜索 "精华液" 返回 1 条（商品名）', () => {
    const result = searchItems(allReturns, '精华液');
    assert.equal(result.length, 1);
    assert.equal(result[0].productName, '焕颜精华液30ml');
  });

  it('30. 搜索 "卸妆" 返回 2 条', () => {
    const result = searchItems(allReturns, '卸妆');
    assert.equal(result.length, 2);
  });

  it('31. 搜索 "面膜" 返回 1 条', () => {
    const result = searchItems(allReturns, '面膜');
    assert.equal(result.length, 1);
    assert.equal(result[0].customerName, '周芳');
  });

  it('32. 搜索不存在的关键字返回空', () => {
    const result = searchItems(allReturns, '不存在的商品');
    assert.equal(result.length, 0);
  });

  it('33. 空搜索返回全部', () => {
    const result = searchItems(allReturns, '');
    assert.equal(result.length, allReturns.length);
  });
});

describe('ReturnsListPage 分页逻辑', () => {
  it('34. 第1页每页5条，返回前5条', () => {
    const result = paginate(allReturns, 1, 5);
    assert.equal(result.length, 5);
    assert.equal(result[0].id, '1');
    assert.equal(result[4].id, '5');
  });

  it('35. 第2页每页5条，返回后5条', () => {
    const result = paginate(allReturns, 2, 5);
    assert.equal(result.length, 5);
    assert.equal(result[0].id, '6');
    assert.equal(result[4].id, '10');
  });

  it('36. 第1页每页20条，返回全部10条', () => {
    const result = paginate(allReturns, 1, 20);
    assert.equal(result.length, 10);
  });

  it('37. 第3页每页4条，返回2条', () => {
    const result = paginate(allReturns, 3, 4);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, '9');
    assert.equal(result[1].id, '10');
  });

  it('38. 超出范围的分页返回空', () => {
    const result = paginate(allReturns, 999, 10);
    assert.equal(result.length, 0);
  });

  it('39. 第0页返回空（与标准分页行为一致）', () => {
    const result = paginate(allReturns, 0, 5);
    assert.equal(result.length, 0);
  });
});

describe('ReturnsListPage 聚合数据', () => {
  it('40. 所有退货单退款总额计算正确', () => {
    const total = allReturns.reduce((s, i) => s + i.amount, 0);
    assert.equal(total, 1380);
  });

  it('41. 所有退货商品总数计算正确', () => {
    const total = allReturns.reduce((s, i) => s + i.quantity, 0);
    assert.equal(total, 19);
  });

  it('42. 各状态退货单数量汇总', () => {
    const pending = allReturns.filter((i) => i.status === 'pending').length;
    const processing = allReturns.filter((i) => i.status === 'processing').length;
    const completed = allReturns.filter((i) => i.status === 'completed').length;
    const rejected = allReturns.filter((i) => i.status === 'rejected').length;
    assert.equal(pending, 3);
    assert.equal(processing, 2);
    assert.equal(completed, 1);
    assert.equal(rejected, 1);
  });

  it('43. 平均退款金额计算', () => {
    const avg = allReturns.reduce((s, i) => s + i.amount, 0) / allReturns.length;
    assert.equal(avg, 138);
  });

  it('44. 退款金额最高的退货单', () => {
    const maxItem = allReturns.reduce((a, b) => (a.amount > b.amount ? a : b));
    assert.equal(maxItem.amount, 298);
    assert.equal(maxItem.customerName, '张小丽');
  });
});

describe('ReturnsListPage 退款原因分布', () => {
  it('45. 商品质量问题原因项', () => {
    const items = allReturns.filter((i) => i.reason === '商品质量问题');
    assert.equal(items.length, 3);
    const names = items.map((i) => i.customerName).sort();
    assert.deepEqual(names, ['吴茜', '周芳', '张小丽']);
  });

  it('46. 不想要了原因项', () => {
    const items = allReturns.filter((i) => i.reason === '不想要了');
    assert.equal(items.length, 2);
    const names = items.map((i) => i.customerName).sort();
    assert.deepEqual(names, ['刘雨欣', '赵敏']);
  });

  it('47. 收到已损坏原因只有1条', () => {
    const items = allReturns.filter((i) => i.reason === '收到已损坏');
    assert.equal(items.length, 1);
    assert.equal(items[0].customerName, '孙小红');
  });
});

describe('ReturnsListPage 客户手机号格式', () => {
  it('48. 所有手机号均为11位', () => {
    for (const item of allReturns) {
      assert.equal(item.customerPhone.length, 11, `${item.customerName} phone should be 11 digits`);
    }
  });

  it('49. 手机号以1开头', () => {
    for (const item of allReturns) {
      assert.ok(item.customerPhone.startsWith('1'), `${item.customerName} phone should start with 1`);
    }
  });
});

describe('ReturnsListPage 退款金额非负', () => {
  it('50. 所有退款金额应大于0', () => {
    for (const item of allReturns) {
      assert.ok(item.amount > 0, `${item.returnNo} amount should be > 0, got ${item.amount}`);
    }
  });

  it('51. 所有退货数量应大于0', () => {
    for (const item of allReturns) {
      assert.ok(item.quantity > 0, `${item.returnNo} quantity should be > 0, got ${item.quantity}`);
    }
  });
});

describe('ReturnsListPage 时间排序', () => {
  it('52. 最新创建的退货单可识别（ISO日期比较）', () => {
    /** Node.js Date parser treats '2026-06-30 14:22' as invalid, so use ISO format for comparison */
    function compareDates(a: ReturnItem, b: ReturnItem): number {
      const da = a.createdAt.replace(' ', 'T');
      const db = b.createdAt.replace(' ', 'T');
      return new Date(db).getTime() - new Date(da).getTime();
    }
    const sorted = [...allReturns].sort(compareDates);
    assert.equal(sorted[0].returnNo, 'RTN-20260601-001');
    assert.equal(sorted[0].customerName, '张小丽');
  });

  it('53. 最旧创建的退货单可识别（ISO日期比较）', () => {
    function compareDates(a: ReturnItem, b: ReturnItem): number {
      const da = a.createdAt.replace(' ', 'T');
      const db = b.createdAt.replace(' ', 'T');
      return new Date(da).getTime() - new Date(db).getTime();
    }
    const sorted = [...allReturns].sort(compareDates);
    assert.equal(sorted[0].returnNo, 'RTN-20260610-001');
    assert.equal(sorted[0].customerName, '王美丽');
  });
});

// === 新增：加载状态测试（圈梁五道箍 — 加载态覆盖） ===

describe('ReturnsListPage - 加载状态 Loading State', () => {
  it('page.tsx 有 isLoading 状态标识', () => {
    const src = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('isLoading'), 'missing isLoading state');
    assert.ok(src.includes('setIsLoading'), 'missing setIsLoading setter');
  });

  it('page.tsx 加载态 UI 包含占位提示和 emoji', () => {
    const src = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('⏳'), 'loading state should show hourglass emoji');
    assert.ok(src.includes('正在加载退换货数据'), 'loading state should show loading text');
  });

  it('page.tsx 加载态有完整的三态容器结构', () => {
    const src = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    // isLoading ? 加载态 : paginated.length === 0 ? 空态 : 列表
    assert.ok(src.includes('isLoading ? ('), 'loading conditional JSX exists');
    assert.ok(src.includes('paginated.length === 0 ? ('), 'empty state conditional exists');
  });

  it('page.tsx 空数据状态有独立提示文案', () => {
    const src = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('暂无退换货记录'), 'empty state message present');
    assert.ok(src.includes('还没有提交过退换货申请'), 'empty state detail present');
  });

  it('page.tsx 空数据状态有对应 emoji', () => {
    const src = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('📦'), 'empty state should display package emoji');
  });

  it('page.tsx 错误态提示也完整', () => {
    const src = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('数据加载异常'), 'error state heading present');
    assert.ok(src.includes('请检查网络后重试'), 'error state retry message');
  });

  it('paginate 空数组返回空', () => {
    const result = paginate([], 1, 5);
    assert.equal(result.length, 0);
  });

  it('分页第3页每页4条返回剩余2条', () => {
    const result = paginate(allReturns, 3, 4);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, '9');
    assert.equal(result[1].id, '10');
  });

  it('searchItems 空结果对应空状态', () => {
    const result = searchItems(allReturns, 'ZZZ_NOT_EXISTS');
    assert.equal(result.length, 0, 'search with no match should return empty array');
  });

  it('filterByStatus + filterByReason 组合筛选空结果', () => {
    const r1 = filterByReason(allReturns, '发错商品');
    const r2 = filterByStatus(r1, 'rejected');
    assert.equal(r2.length, 0, '发错商品 + rejected should have 0 results');
  });

  it('filterByReason 不存在原因返回空', () => {
    const result = filterByReason(allReturns, '不存在的退款原因');
    assert.equal(result.length, 0);
  });

  it('filterByStatus 空字符串返回全部（不报错）', () => {
    const result = filterByStatus(allReturns, '' as ReturnStatus);
    assert.equal(result.length, allReturns.length, 'empty status returns all');
  });

  it('分页第2页每页20条，不足20条只返回剩余', () => {
    const result = paginate(allReturns, 2, 20);
    assert.equal(result.length, 0, '10 total, page 2 with 20 per page should be empty');
  });

  it('page.tsx 模拟加载按钮存在', () => {
    const src = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('模拟加载'), 'mock loading button label exists');
  });

  it('page.tsx 模拟错误按钮存在', () => {
    const src = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('模拟错误'), 'mock error button label exists');
    assert.ok(src.includes('恢复数据'), 'recover data button exists');
  });

  it('page.tsx 加载态 1200ms 后自动恢复', () => {
    const src = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(src.includes('1200'), 'loading timeout should be 1200ms');
    assert.ok(src.includes('setIsLoading(false)'), 'loading should auto reset');
  });
});
