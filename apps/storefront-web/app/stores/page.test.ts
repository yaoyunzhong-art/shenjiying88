/**
 * Stores List Page — storefront-web
 * Tests: store list logic, search, status filter, pagination, stats computation
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据类型 (与 page.tsx 一致) ──

type StoreStatus = 'active' | 'inactive' | 'maintenance';
type StoreType = 'flagship' | 'standard' | 'community' | 'popup';

interface Store {
  id: string;
  name: string;
  code: string;
  type: StoreType;
  address: string;
  city: string;
  district: string;
  phone: string;
  managerName: string;
  status: StoreStatus;
  staffCount: number;
  areaSqm: number;
  monthlyRevenue: number;
  createdAt: string;
}

const TYPE_LABELS: Record<StoreType, string> = {
  flagship: '旗舰店',
  standard: '标准店',
  community: '社区店',
  popup: '快闪店',
};

const TYPE_VARIANTS: Record<StoreType, string> = {
  flagship: 'success',
  standard: 'default',
  community: 'warning',
  popup: 'info',
};

const STATUS_LABELS: Record<StoreStatus, string> = {
  active: '营业中',
  inactive: '已关闭',
  maintenance: '维护中',
};

const STATUS_VARIANTS: Record<StoreStatus, string> = {
  active: 'success',
  inactive: 'neutral',
  maintenance: 'warning',
};

// ── Mock 数据 (与 page.tsx 一致) ──

const MOCK_STORES: Store[] = [
  { id: 's01', name: 'Demo Store 旗舰店', code: 'DS-FLAG-001', type: 'flagship', address: '上海市浦东新区陆家嘴金融中心1层', city: '上海', district: '浦东新区', phone: '021-68888888', managerName: '张明', status: 'active', staffCount: 28, areaSqm: 580, monthlyRevenue: 358000, createdAt: '2024-01-15' },
  { id: 's02', name: 'Demo Store 社区店', code: 'DS-COMM-002', type: 'community', address: '上海市静安区南京西路1688号', city: '上海', district: '静安区', phone: '021-62880001', managerName: '李芳', status: 'active', staffCount: 12, areaSqm: 220, monthlyRevenue: 128000, createdAt: '2024-03-01' },
  { id: 's03', name: 'Demo Store 标准店', code: 'DS-STD-003', type: 'standard', address: '北京市朝阳区建国路88号', city: '北京', district: '朝阳区', phone: '010-85881234', managerName: '王强', status: 'active', staffCount: 18, areaSqm: 350, monthlyRevenue: 215000, createdAt: '2024-02-20' },
  { id: 's04', name: 'Demo Store 快闪店', code: 'DS-POP-004', type: 'popup', address: '广州市天河区天河路230号', city: '广州', district: '天河区', phone: '020-38889999', managerName: '刘洋', status: 'maintenance', staffCount: 6, areaSqm: 120, monthlyRevenue: 45000, createdAt: '2025-06-01' },
  { id: 's05', name: 'Demo Store 标准店', code: 'DS-STD-005', type: 'standard', address: '深圳市南山区科技南路18号', city: '深圳', district: '南山区', phone: '0755-86660001', managerName: '陈静', status: 'active', staffCount: 15, areaSqm: 300, monthlyRevenue: 189000, createdAt: '2024-04-10' },
  { id: 's06', name: 'Demo Store 社区店', code: 'DS-COMM-006', type: 'community', address: '成都市锦江区红星路三段1号', city: '成都', district: '锦江区', phone: '028-86780001', managerName: '赵磊', status: 'inactive', staffCount: 8, areaSqm: 180, monthlyRevenue: 0, createdAt: '2024-05-01' },
  { id: 's07', name: 'Demo Store 旗舰店', code: 'DS-FLAG-007', type: 'flagship', address: '杭州市上城区延安路98号', city: '杭州', district: '上城区', phone: '0571-87070001', managerName: '孙婷', status: 'active', staffCount: 32, areaSqm: 620, monthlyRevenue: 412000, createdAt: '2024-01-20' },
  { id: 's08', name: 'Demo Store 标准店', code: 'DS-STD-008', type: 'standard', address: '武汉市江汉区解放大道686号', city: '武汉', district: '江汉区', phone: '027-85480001', managerName: '周伟', status: 'active', staffCount: 14, areaSqm: 280, monthlyRevenue: 156000, createdAt: '2024-06-15' },
  { id: 's09', name: 'Demo Store 社区店', code: 'DS-COMM-009', type: 'community', address: '重庆市渝中区解放碑八一路177号', city: '重庆', district: '渝中区', phone: '023-63830001', managerName: '吴霞', status: 'active', staffCount: 10, areaSqm: 200, monthlyRevenue: 98000, createdAt: '2024-07-01' },
  { id: 's10', name: 'Demo Store 快闪店', code: 'DS-POP-010', type: 'popup', address: '南京市秦淮区夫子庙美食街', city: '南京', district: '秦淮区', phone: '025-52250001', managerName: '郑杰', status: 'active', staffCount: 5, areaSqm: 80, monthlyRevenue: 32000, createdAt: '2025-05-15' },
  { id: 's11', name: 'Demo Store 标准店', code: 'DS-STD-011', type: 'standard', address: '苏州市姑苏区观前街100号', city: '苏州', district: '姑苏区', phone: '0512-67280001', managerName: '黄丽', status: 'active', staffCount: 16, areaSqm: 310, monthlyRevenue: 178000, createdAt: '2024-08-10' },
  { id: 's12', name: 'Demo Store 社区店', code: 'DS-COMM-012', type: 'community', address: '西安市雁塔区小寨东路88号', city: '西安', district: '雁塔区', phone: '029-85250001', managerName: '马超', status: 'maintenance', staffCount: 7, areaSqm: 160, monthlyRevenue: 55000, createdAt: '2024-09-01' },
];

// ── 纯逻辑函数 ──

function searchFilter(items: Store[], term: string, fields: (keyof Store)[]): Store[] {
  const q = term.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      return typeof val === 'string' && val.toLowerCase().includes(q);
    }),
  );
}

function statusFilter(items: Store[], status: StoreStatus | 'ALL'): Store[] {
  if (status === 'ALL') return items;
  return items.filter((item) => item.status === status);
}

function paginate(items: Store[], page: number, pageSize: number): Store[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

function computeStats(items: Store[]) {
  const active = items.filter((s) => s.status === 'active').length;
  const totalRevenue = items.reduce((sum, s) => sum + s.monthlyRevenue, 0);
  const totalStaff = items.reduce((sum, s) => sum + s.staffCount, 0);
  return { total: items.length, active, totalRevenue, totalStaff };
}

// ── 数据完整性 ──

test('MOCK_STORES 有 12 条数据', () => {
  assert.equal(MOCK_STORES.length, 12);
});

test('MOCK_STORES 所有 ID 唯一', () => {
  const ids = MOCK_STORES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('MOCK_STORES 涵盖 4 种类型 (flagship/standard/community/popup)', () => {
  const types = new Set(MOCK_STORES.map((s) => s.type));
  assert.equal(types.size, 4);
  assert.ok(types.has('flagship'));
  assert.ok(types.has('standard'));
  assert.ok(types.has('community'));
  assert.ok(types.has('popup'));
});

test('MOCK_STORES 涵盖 3 种状态', () => {
  const statuses = new Set(MOCK_STORES.map((s) => s.status));
  assert.equal(statuses.size, 3);
  assert.ok(statuses.has('active'));
  assert.ok(statuses.has('inactive'));
  assert.ok(statuses.has('maintenance'));
});

test('数据完整性: 每个字段非空', () => {
  const required: (keyof Store)[] = ['id', 'name', 'code', 'type', 'city', 'managerName', 'status'];
  for (const store of MOCK_STORES) {
    for (const field of required) {
      const val = store[field];
      assert.ok(val !== undefined && val !== null && val !== '', `${field} required for ${store.id}`);
    }
  }
});

// ── 搜索 ──

test('搜索: 空字符串返回全部', () => {
  const r = searchFilter(MOCK_STORES, '', ['name']);
  assert.equal(r.length, 12);
});

test('搜索: "旗舰店" 匹配 2 个旗舰店', () => {
  const r = searchFilter(MOCK_STORES, '旗舰店', ['name']);
  assert.equal(r.length, 2);
  assert.ok(r.every((s) => s.name.includes('旗舰店')));
});

test('搜索: "北京" 匹配城市为北京的门店', () => {
  const r = searchFilter(MOCK_STORES, '北京', ['city']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.city, '北京');
});

test('搜索: "成都" 匹配 city 或 address', () => {
  const r = searchFilter(MOCK_STORES, '成都', ['city', 'address']);
  assert.ok(r.length >= 1);
});

test('搜索: 按 managerName 搜索', () => {
  const r = searchFilter(MOCK_STORES, '张明', ['managerName']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.managerName, '张明');
});

test('搜索: 按 code 搜索', () => {
  const r = searchFilter(MOCK_STORES, 'DS-COMM', ['code']);
  assert.equal(r.length, 4);
  assert.ok(r.every((s) => s.code.startsWith('DS-COMM')));
});

test('搜索: 不存在返回空', () => {
  const r = searchFilter(MOCK_STORES, 'zzznotexist', ['name', 'city']);
  assert.equal(r.length, 0);
});

test('搜索: 大小写不敏感', () => {
  const r = searchFilter(MOCK_STORES, 'ds-flag-001', ['code']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 's01');
});

test('搜索: 跨字段匹配 phone 号码', () => {
  const r = searchFilter(MOCK_STORES, '021-6888', ['phone']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 's01');
});

// ── 状态过滤 ──

test('状态过滤: ALL 返回全部', () => {
  const r = statusFilter(MOCK_STORES, 'ALL');
  assert.equal(r.length, 12);
});

test('状态过滤: active 仅返回营业中', () => {
  const r = statusFilter(MOCK_STORES, 'active');
  assert.ok(r.length >= 8);
  assert.ok(r.every((s) => s.status === 'active'));
});

test('状态过滤: inactive 仅返回已关闭', () => {
  const r = statusFilter(MOCK_STORES, 'inactive');
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 's06');
});

test('状态过滤: maintenance 仅返回维护中', () => {
  const r = statusFilter(MOCK_STORES, 'maintenance');
  assert.equal(r.length, 2);
  assert.ok(r.every((s) => s.status === 'maintenance'));
});

// ── 组合过滤 ──

test('组合: 搜索 "社区店" + 状态 active', () => {
  const searched = searchFilter(MOCK_STORES, '社区店', ['name']);
  const filtered = statusFilter(searched, 'active');
  assert.ok(filtered.length >= 1);
  assert.ok(filtered.every((s) => s.name.includes('社区店') && s.status === 'active'));
});

test('组合: 搜索不存在 → 空 → 状态过滤仍为空', () => {
  const searched = searchFilter(MOCK_STORES, 'zzz', ['name']);
  assert.equal(searched.length, 0);
  const filtered = statusFilter(searched, 'active');
  assert.equal(filtered.length, 0);
});

// ── 分页 ──

test('分页: pageSize=10, total=12 → 2 页', () => {
  assert.equal(totalPages(12, 10), 2);
});

test('分页: pageSize=5, total=12 → 3 页', () => {
  assert.equal(totalPages(12, 5), 3);
});

test('分页: 空数组 → 1 页', () => {
  assert.equal(totalPages(0, 10), 1);
});

test('分页: 第 1 页返回前 10 条', () => {
  const r = paginate(MOCK_STORES, 1, 10);
  assert.equal(r.length, 10);
  assert.equal(r[0]!.id, 's01');
  assert.equal(r[9]!.id, 's10');
});

test('分页: 第 2 页返回后 2 条', () => {
  const r = paginate(MOCK_STORES, 2, 10);
  assert.equal(r.length, 2);
  assert.equal(r[0]!.id, 's11');
  assert.equal(r[1]!.id, 's12');
});

test('分页: 超出范围返回空', () => {
  const r = paginate(MOCK_STORES, 99, 10);
  assert.equal(r.length, 0);
});

// ── 统计 ──

test('统计: total = 12', () => {
  const stats = computeStats(MOCK_STORES);
  assert.equal(stats.total, 12);
});

test('统计: active ≥ 8', () => {
  const stats = computeStats(MOCK_STORES);
  assert.ok(stats.active >= 8);
});

test('统计: totalRevenue 为正', () => {
  const stats = computeStats(MOCK_STORES);
  assert.ok(stats.totalRevenue > 0);
});

test('统计: totalStaff = 171', () => {
  const stats = computeStats(MOCK_STORES);
  assert.equal(stats.totalStaff, 171);
});

test('统计: 空数组返回全 0', () => {
  const stats = computeStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.active, 0);
  assert.equal(stats.totalRevenue, 0);
  assert.equal(stats.totalStaff, 0);
});

// ── 映射常量 ──

test('TYPE_LABELS: 4 种类型都有中文标签', () => {
  assert.equal(Object.keys(TYPE_LABELS).length, 4);
  for (const t of ['flagship', 'standard', 'community', 'popup'] as const) {
    assert.ok(typeof TYPE_LABELS[t] === 'string' && TYPE_LABELS[t].length > 0);
  }
});

test('STATUS_LABELS: 3 种状态都有中文标签', () => {
  assert.equal(Object.keys(STATUS_LABELS).length, 3);
});

test('STATUS_VARIANTS: 状态映射正确', () => {
  assert.equal(STATUS_VARIANTS.active, 'success');
  assert.equal(STATUS_VARIANTS.inactive, 'neutral');
  assert.equal(STATUS_VARIANTS.maintenance, 'warning');
});

// ── 边缘情况 ──

test('边缘: monthlyRevenue 为 0 的已关闭门店', () => {
  const inactive = MOCK_STORES.filter((s) => s.status === 'inactive');
  assert.ok(inactive.length >= 1);
  assert.equal(inactive[0]!.monthlyRevenue, 0);
});

test('边缘: 搜索含特殊字符的 phone', () => {
  const r = searchFilter(MOCK_STORES, '6888', ['phone']);
  assert.ok(r.length >= 1);
});

test('边缘: 搜索 "Demo Store" 匹配所有门店 name', () => {
  const r = searchFilter(MOCK_STORES, 'Demo Store', ['name']);
  // All stores begin with "Demo Store"
  assert.equal(r.length, MOCK_STORES.length);
});
