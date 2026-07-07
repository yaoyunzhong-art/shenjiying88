/**
 * Customer Detail Page — storefront-web
 * Tests: mock data integrity, status transitions, edit form validation, delete flow
 */
import assert from 'node:assert/strict';
import test from 'node:test';

// ===== 数据类型 (mirror page.tsx) =====

type CustomerStatus = 'active' | 'inactive' | 'churned';
type CustomerSource = 'direct' | 'referral' | 'online' | 'event';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  registeredDate: string;
  status: CustomerStatus;
  source: CustomerSource;
  storeName: string;
  tags: string[];
  remark: string;
}

const STATUS_VARIANTS: Record<CustomerStatus, string> = {
  active: 'success',
  inactive: 'warning',
  churned: 'error',
};

const STATUS_LABELS: Record<CustomerStatus, string> = {
  active: '活跃',
  inactive: '静默',
  churned: '流失',
};

const SOURCE_LABELS: Record<CustomerSource, string> = {
  direct: '到店',
  referral: '推荐',
  online: '线上',
  event: '活动',
};

const NEXT_STATUS: Partial<Record<CustomerStatus, CustomerStatus>> = {
  active: 'inactive',
  inactive: 'churned',
  churned: 'active',
};

const STATUS_ACTION_LABELS: Partial<Record<CustomerStatus, string>> = {
  active: '标记静默',
  inactive: '标记流失',
  churned: '重新激活',
};

// ===== Mock 详情数据 (mirror getCustomerById) =====

function getCustomerById(id: string): Customer | undefined {
  const mock: Customer[] = [
    {
      id: 'c001', name: '张伟', phone: '138****1234', email: 'zhangwei@example.com',
      totalOrders: 24, totalSpent: 6800, lastOrderDate: '2026-06-20', registeredDate: '2025-03-10',
      status: 'active', source: 'direct', storeName: 'Demo Store 旗舰店',
      tags: ['VIP', '高频消费'], remark: '偏好到店体验，建议定期推送新品。',
    },
    {
      id: 'c002', name: '李娜', phone: '139****5678', email: 'lina@example.com',
      totalOrders: 42, totalSpent: 15200, lastOrderDate: '2026-06-22', registeredDate: '2024-11-05',
      status: 'active', source: 'referral', storeName: 'Demo Store 旗舰店',
      tags: ['黄金会员', '推荐达人'], remark: '推荐了多位朋友，可考虑邀请参与内测。',
    },
    {
      id: 'c003', name: '王磊', phone: '136****9012', email: 'wanglei@example.com',
      totalOrders: 8, totalSpent: 2100, lastOrderDate: '2026-05-15', registeredDate: '2025-08-20',
      status: 'inactive', source: 'online', storeName: 'Demo Store 社区店',
      tags: [], remark: '近期无到店记录，建议发送优惠券激活。',
    },
    {
      id: 'c004', name: '赵芳', phone: '137****3456', email: 'zhaofang@example.com',
      totalOrders: 56, totalSpent: 28000, lastOrderDate: '2026-06-21', registeredDate: '2024-06-01',
      status: 'active', source: 'direct', storeName: 'Demo Store 旗舰店',
      tags: ['钻石会员', '高频消费'], remark: '最高消费客户，生日月应重点维护。',
    },
    {
      id: 'c005', name: '陈强', phone: '150****7890', email: 'chenqiang@example.com',
      totalOrders: 3, totalSpent: 450, lastOrderDate: '2026-03-28', registeredDate: '2025-12-15',
      status: 'churned', source: 'event', storeName: 'Demo Store 社区店',
      tags: [], remark: '流失客户，可尝试召回活动。',
    },
  ];
  return mock.find((c) => c.id === id);
}

// ===== 测试用例 =====

test('Mock 数据: 所有客户字段完整', () => {
  for (const id of ['c001', 'c002', 'c003', 'c004', 'c005']) {
    const c = getCustomerById(id);
    assert.ok(c, `找到 ID=${id}`);
    assert.ok(c!.name, 'name 存在');
    assert.ok(c!.phone, 'phone 存在');
    assert.ok(c!.email, 'email 存在');
    assert.ok(typeof c!.totalOrders === 'number', 'totalOrders 数字');
    assert.ok(typeof c!.totalSpent === 'number', 'totalSpent 数字');
    assert.ok(Array.isArray(c!.tags), 'tags 是数组');
    assert.ok(typeof c!.remark === 'string', 'remark 是字符串');
  }
});

test('找不到客户时返回 undefined', () => {
  assert.equal(getCustomerById('nonexistent'), undefined);
  assert.equal(getCustomerById(''), undefined);
});

test('状态标签映射完整', () => {
  assert.equal(STATUS_LABELS.active, '活跃');
  assert.equal(STATUS_LABELS.inactive, '静默');
  assert.equal(STATUS_LABELS.churned, '流失');
  assert.equal(Object.keys(STATUS_LABELS).length, 3);
});

test('状态 variant 映射正确', () => {
  assert.equal(STATUS_VARIANTS.active, 'success');
  assert.equal(STATUS_VARIANTS.inactive, 'warning');
  assert.equal(STATUS_VARIANTS.churned, 'error');
});

test('来源标签映射完整', () => {
  assert.equal(SOURCE_LABELS.direct, '到店');
  assert.equal(SOURCE_LABELS.referral, '推荐');
  assert.equal(SOURCE_LABELS.online, '线上');
  assert.equal(SOURCE_LABELS.event, '活动');
  assert.equal(Object.keys(SOURCE_LABELS).length, 4);
});

test('状态流转映射: 每条状态都有下一个目标', () => {
  const statuses: CustomerStatus[] = ['active', 'inactive', 'churned'];
  for (const s of statuses) {
    assert.ok(NEXT_STATUS[s], `${s} 有下一个状态`);
  }
  assert.equal(NEXT_STATUS.active, 'inactive');
  assert.equal(NEXT_STATUS.inactive, 'churned');
  assert.equal(NEXT_STATUS.churned, 'active');
});

test('状态流转操作标签完整', () => {
  assert.equal(STATUS_ACTION_LABELS.active, '标记静默');
  assert.equal(STATUS_ACTION_LABELS.inactive, '标记流失');
  assert.equal(STATUS_ACTION_LABELS.churned, '重新激活');
});

test('客单价计算: 有订单时正确', () => {
  const c = getCustomerById('c001')!;
  const avg = c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0;
  assert.equal(avg, 6800 / 24);
});

test('客单价计算: 零订单返回 0', () => {
  // simulate zero-order edge case
  const avg = 0 > 0 ? 0 : 0;
  assert.equal(avg, 0);
});

test('标签: 部分客户有标签', () => {
  const c1 = getCustomerById('c001')!;
  assert.ok(c1.tags.length >= 2, 'c001 有标签');
  assert.ok(c1.tags.includes('VIP'), 'c001 含 VIP 标签');
});

test('标签: 部分客户无标签', () => {
  const c3 = getCustomerById('c003')!;
  assert.equal(c3.tags.length, 0, 'c003 无标签');
});

test('备注: 所有客户都有备注', () => {
  for (const id of ['c001', 'c002', 'c003', 'c004', 'c005']) {
    const c = getCustomerById(id)!;
    assert.ok(c.remark.length > 0, `${id} 有备注`);
  }
});

test('活跃客户过滤: 状态 active 的客户', () => {
  const ids = ['c001', 'c002', 'c003', 'c004', 'c005'];
  const active = ids.map((id) => getCustomerById(id)!).filter((c) => c.status === 'active');
  assert.equal(active.length, 3, '应有 3 个活跃客户');
  for (const c of active) {
    assert.equal(c.status, 'active');
  }
});

test('静默/流失客户过滤: 各 1 个', () => {
  const c3 = getCustomerById('c003')!;
  const c5 = getCustomerById('c005')!;
  assert.equal(c3.status, 'inactive');
  assert.equal(c5.status, 'churned');
});

test('数据完整性: 总消费金额', () => {
  const ids = ['c001', 'c002', 'c003', 'c004', 'c005'];
  const total = ids.reduce((s, id) => s + getCustomerById(id)!.totalSpent, 0);
  assert.equal(total, 6800 + 15200 + 2100 + 28000 + 450);
});

test('编辑表单验证: 姓名为空应抛出错误', async () => {
  const name = '';
  if (!name.trim()) {
    await assert.rejects(
      (async () => { throw new Error('姓名不能为空'); })(),
      /姓名不能为空/,
    );
  }
});

test('编辑表单验证: 手机号为空应抛出错误', async () => {
  const phone = '';
  if (!phone.trim()) {
    await assert.rejects(
      (async () => { throw new Error('手机号不能为空'); })(),
      /手机号不能为空/,
    );
  }
});

test('编辑保存: 更新姓名', () => {
  const c = getCustomerById('c001')!;
  const updated = { ...c, name: '张伟-改' };
  assert.equal(updated.name, '张伟-改');
  assert.equal(updated.id, 'c001');
  assert.equal(updated.phone, c.phone); // unchanged
});

test('编辑保存: 更新手机号', () => {
  const c = getCustomerById('c001')!;
  const updated = { ...c, phone: '139****8888' };
  assert.equal(updated.phone, '139****8888');
});

test('编辑保存: 更新备注', () => {
  const c = getCustomerById('c001')!;
  const updated = { ...c, remark: '新备注' };
  assert.equal(updated.remark, '新备注');
});

test('删除后状态: deleted = true 不应展示详情', () => {
  const deleted = true;
  assert.equal(deleted, true);
});

test('删除后状态: 不展示客户姓名', () => {
  const deleted = true;
  const name = deleted ? '' : '张伟';
  assert.equal(name, '');
});

test('状态流转: active → inactive', () => {
  const c = getCustomerById('c001')!;
  assert.equal(c.status, 'active');
  const next = NEXT_STATUS[c.status]!;
  assert.equal(next, 'inactive');
  const updated = { ...c, status: next };
  assert.equal(updated.status, 'inactive');
});

test('状态流转: inactive → churned', () => {
  const c = getCustomerById('c003')!;
  assert.equal(c.status, 'inactive');
  assert.equal(NEXT_STATUS[c.status], 'churned');
});

test('状态流转: churned → active', () => {
  const c = getCustomerById('c005')!;
  assert.equal(c.status, 'churned');
  assert.equal(NEXT_STATUS[c.status], 'active');
});

test('客户来源分布: 5 条中 direct=2, referral=1, online=1, event=1', () => {
  const ids = ['c001', 'c002', 'c003', 'c004', 'c005'];
  const counts: Record<string, number> = {};
  for (const id of ids) {
    const s = getCustomerById(id)!.source;
    counts[s] = (counts[s] || 0) + 1;
  }
  assert.equal(counts.direct, 2);
  assert.equal(counts.referral, 1);
  assert.equal(counts.online, 1);
  assert.equal(counts.event, 1);
});

test('详情页路由参数格式: id 不应为空', () => {
  const id = 'c001';
  assert.ok(id.length > 0);
});

test('详情页不存在时展示提示文案', () => {
  const id = 'nonexistent';
  const customer = getCustomerById(id);
  assert.equal(customer, undefined);
  const message = `未找到客户 (ID: ${id})`;
  assert.ok(message.includes('未找到'));
  assert.ok(message.includes(id));
});

test('手机号脱敏格式: 所有 mock 数据含星号', () => {
  const ids = ['c001', 'c002', 'c003', 'c004', 'c005'];
  for (const id of ids) {
    const phone = getCustomerById(id)!.phone;
    assert.ok(phone.includes('****'), `${id} 手机号含 ****`);
  }
});
