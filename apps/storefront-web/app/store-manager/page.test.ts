/**
 * Store Manager Page — storefront-web (源码分析模式 · 不渲染UI)
 * Tests: status mapping, stat computation, data formatting, validation, filtering
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ═══════════════════════════════════════════════
//  类型 & 常量（与 page.tsx 一致）
// ═══════════════════════════════════════════════

type StoreStatus = 'active' | 'maintenance' | 'closed';

interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  hours: string;
  status: StoreStatus;
  emergencyContact: string;
  storeCode: string;
  openDate: string;
  area: number;
}

interface DeviceStat {
  total: number;
  online: number;
  offline: number;
  warning: number;
}

interface TaskItem {
  id: string;
  title: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  description: string;
}

interface DailyMetric {
  label: string;
  value: string;
  color: string;
}

// ── 与 page.tsx 一致的常量 ──

const STATUS_CONFIG: Record<StoreStatus, { label: string; color: string; bg: string }> = {
  active: { label: '营业中', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
  maintenance: { label: '维护中', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  closed: { label: '已关闭', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

const DEFAULT_STORE: StoreInfo = {
  name: '神机营电竞乐园 · 旗舰店',
  address: '北京市朝阳区建国路88号',
  phone: '010-88886666',
  hours: '10:00-22:00',
  status: 'active',
  emergencyContact: '张经理 138-0000-0000',
  storeCode: 'BJ-CBD-001',
  openDate: '2025-06-01',
  area: 580,
};

const ALL_STATUS_KEYS: StoreStatus[] = ['active', 'maintenance', 'closed'];

// ── 工具函数（从 page.tsx 提取逻辑） ──

function renderStatusLabel(status: StoreStatus): string {
  return STATUS_CONFIG[status]?.label ?? '未知';
}

function renderStatusColor(status: StoreStatus): string {
  return STATUS_CONFIG[status]?.color ?? '#64748b';
}

function computeStoreOpenHours(hours: string): { start: number; end: number } {
  const [startStr, endStr] = hours.split('-');
  return { start: parseInt(startStr, 10), end: parseInt(endStr, 10) };
}

function formatPhone(phone: string): string {
  if (phone.length === 12 && phone[3] === '-' && phone[7] === '-') return phone;
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  }
  return phone;
}

function validateStoreInfo(data: Partial<StoreInfo>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.name?.trim()) errors.name = '门店名称不能为空';
  else if (data.name.length > 50) errors.name = '门店名称不超过50个字符';
  if (!data.phone?.trim()) errors.phone = '联系电话不能为空';
  else if (!/^\d{3}-\d{8}$/.test(data.phone) && !/^\d{11}$/.test(data.phone.replace(/-/g, '')))
    errors.phone = '联系电话格式不正确';
  if (!data.hours?.trim()) errors.hours = '营业时间不能为空';
  else if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(data.hours))
    errors.hours = '营业时间格式不正确（示例: 10:00-22:00）';
  if (data.emergencyContact && data.emergencyContact.length > 50)
    errors.emergencyContact = '紧急联系人信息不超过50个字符';
  return errors;
}

function filterTasksByPriority(tasks: TaskItem[], priority: 'high' | 'medium' | 'low'): TaskItem[] {
  return tasks.filter((t) => t.priority === priority);
}

function computeTaskStats(tasks: TaskItem[]): {
  total: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  inventoryCount: number;
  memberCount: number;
  deviceCount: number;
  orderCount: number;
  alertCount: number;
} {
  return {
    total: tasks.length,
    highCount: tasks.filter((t) => t.priority === 'high').length,
    mediumCount: tasks.filter((t) => t.priority === 'medium').length,
    lowCount: tasks.filter((t) => t.priority === 'low').length,
    inventoryCount: tasks.filter((t) => t.type === 'inventory').length,
    memberCount: tasks.filter((t) => t.type === 'member').length,
    deviceCount: tasks.filter((t) => t.type === 'device').length,
    orderCount: tasks.filter((t) => t.type === 'order').length,
    alertCount: tasks.filter((t) => t.type === 'alert').length,
  };
}

function computeDailyMetrics(metrics: {
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
  newMembers: number;
}): DailyMetric[] {
  return [
    { label: '今日营收', value: `¥${metrics.revenue.toLocaleString()}`, color: '#34d399' },
    { label: '订单数', value: `${metrics.orderCount} 单`, color: '#94a3b8' },
    { label: '客单价', value: `¥${metrics.avgOrderValue.toFixed(1)}`, color: '#94a3b8' },
    { label: '新增会员', value: `${metrics.newMembers} 人`, color: '#94a3b8' },
  ];
}

function computeDeviceStats(stats: DeviceStat): {
  onlineRate: number;
  warningRate: number;
  healthStatus: 'good' | 'warning' | 'critical';
} {
  const onlineRate = stats.total > 0 ? stats.online / stats.total : 0;
  const warningRate = stats.total > 0 ? stats.warning / stats.total : 0;
  let healthStatus: 'good' | 'warning' | 'critical';
  if (onlineRate >= 0.95) healthStatus = 'good';
  else if (onlineRate >= 0.80) healthStatus = 'warning';
  else healthStatus = 'critical';
  return { onlineRate, warningRate, healthStatus };
}

function searchQuickActions(actions: { key: string; label: string }[], query: string) {
  return actions.filter((a) => a.label.includes(query) || a.key.includes(query));
}

// ═══════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════

// ── 1. 分类标签标签化 ──

test('renderStatusLabel: 返回正确中文标签', () => {
  assert.equal(renderStatusLabel('active'), '营业中');
  assert.equal(renderStatusLabel('maintenance'), '维护中');
  assert.equal(renderStatusLabel('closed'), '已关闭');
});

test('renderStatusLabel: 未知状态返回未知', () => {
  assert.equal(renderStatusLabel('' as StoreStatus), '未知');
  assert.equal(renderStatusLabel('unknown' as StoreStatus), '未知');
});

test('renderStatusColor: 返回正确颜色', () => {
  assert.equal(renderStatusColor('active'), '#34d399');
  assert.equal(renderStatusColor('maintenance'), '#fbbf24');
  assert.equal(renderStatusColor('closed'), '#f87171');
});

test('renderStatusColor: 未知状态返回兜底色', () => {
  assert.equal(renderStatusColor('' as StoreStatus), '#64748b');
});

test('STATUS_CONFIG: 所有状态键都有对应配置', () => {
  for (const key of ALL_STATUS_KEYS) {
    const cfg = STATUS_CONFIG[key];
    assert.ok(cfg, `Missing config for ${key}`);
    assert.ok(typeof cfg.label === 'string');
    assert.ok(typeof cfg.color === 'string');
    assert.ok(typeof cfg.bg === 'string');
  }
});

// ── 2. 统计计算 ──

test('computeTaskStats: 正常数据统计正确', () => {
  const tasks: TaskItem[] = [
    { id: 't1', title: '库存不足', type: 'inventory', priority: 'high', createdAt: '10:45', description: 'd1' },
    { id: 't2', title: '会员投诉', type: 'member', priority: 'high', createdAt: '09:30', description: 'd2' },
    { id: 't3', title: '缺纸', type: 'device', priority: 'medium', createdAt: '08:15', description: 'd3' },
    { id: 't4', title: '排班', type: 'order', priority: 'medium', createdAt: '昨日', description: 'd4' },
    { id: 't5', title: '温度报警', type: 'alert', priority: 'low', createdAt: '昨日', description: 'd5' },
  ];
  const stats = computeTaskStats(tasks);
  assert.equal(stats.total, 5);
  assert.equal(stats.highCount, 2);
  assert.equal(stats.mediumCount, 2);
  assert.equal(stats.lowCount, 1);
  assert.equal(stats.inventoryCount, 1);
  assert.equal(stats.memberCount, 1);
  assert.equal(stats.deviceCount, 1);
  assert.equal(stats.orderCount, 1);
  assert.equal(stats.alertCount, 1);
});

test('computeTaskStats: 空列表边界', () => {
  const stats = computeTaskStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.highCount, 0);
  assert.equal(stats.mediumCount, 0);
  assert.equal(stats.lowCount, 0);
  assert.equal(stats.inventoryCount, 0);
  assert.equal(stats.memberCount, 0);
  assert.equal(stats.deviceCount, 0);
  assert.equal(stats.orderCount, 0);
  assert.equal(stats.alertCount, 0);
});

test('computeTaskStats: 全部 high priority', () => {
  const tasks: TaskItem[] = [
    { id: 't1', title: 'a', type: 'inventory', priority: 'high', createdAt: '', description: '' },
    { id: 't2', title: 'b', type: 'member', priority: 'high', createdAt: '', description: '' },
  ];
  const stats = computeTaskStats(tasks);
  assert.equal(stats.highCount, 2);
  assert.equal(stats.mediumCount, 0);
  assert.equal(stats.lowCount, 0);
});

test('computeDailyMetrics: 正常数据返回正确格式', () => {
  const metrics = computeDailyMetrics({ revenue: 52800, orderCount: 342, avgOrderValue: 154.4, newMembers: 12 });
  assert.equal(metrics.length, 4);
  assert.equal(metrics[0].label, '今日营收');
  assert.equal(metrics[0].value, '¥52,800');
  assert.equal(metrics[1].value, '342 单');
  assert.equal(metrics[2].value, '¥154.4');
  assert.equal(metrics[3].value, '12 人');
});

test('computeDailyMetrics: 零值边界', () => {
  const metrics = computeDailyMetrics({ revenue: 0, orderCount: 0, avgOrderValue: 0, newMembers: 0 });
  assert.equal(metrics[0].value, '¥0');
  assert.equal(metrics[1].value, '0 单');
  assert.equal(metrics[2].value, '¥0.0');
  assert.equal(metrics[3].value, '0 人');
});

test('computeDailyMetrics: 大数值格式化', () => {
  const v = computeDailyMetrics({ revenue: 1234567, orderCount: 9999, avgOrderValue: 123.45, newMembers: 888 });
  assert.ok(v[0].value.startsWith('¥'));
  assert.ok(v[0].value.includes('1234567') || v[0].value.includes('1,234,567'));
  assert.equal(v[1].label, '订单数');
  assert.ok(v[1].value.includes('9999'));
  assert.ok(v[1].value.includes('单'));
});

test('computeDeviceStats: 正常数据计算正确', () => {
  const stats = computeDeviceStats({ total: 48, online: 42, offline: 3, warning: 3 });
  assert.ok(stats.onlineRate > 0.85);
  assert.equal(stats.healthStatus, 'warning');
});

test('computeDeviceStats: 100% 在线', () => {
  const stats = computeDeviceStats({ total: 10, online: 10, offline: 0, warning: 0 });
  assert.equal(stats.onlineRate, 1);
  assert.equal(stats.healthStatus, 'good');
});

test('computeDeviceStats: 0 设备边界', () => {
  const stats = computeDeviceStats({ total: 0, online: 0, offline: 0, warning: 0 });
  assert.equal(stats.onlineRate, 0);
  assert.equal(stats.healthStatus, 'critical');
});

test('computeDeviceStats: 临界状态 (低于80%)', () => {
  const stats = computeDeviceStats({ total: 10, online: 7, offline: 2, warning: 1 });
  assert.equal(stats.healthStatus, 'critical');
});

// ── 3. 数据转换/格式化 ──

test('computeStoreOpenHours: 解析营业时间', () => {
  const { start, end } = computeStoreOpenHours('10:00-22:00');
  assert.equal(start, 10);
  assert.equal(end, 22);
});

test('computeStoreOpenHours: 跨天营业时间', () => {
  const { start, end } = computeStoreOpenHours('22:00-06:00');
  assert.equal(start, 22);
  assert.equal(end, 6);
});

test('formatPhone: 已格式化号码不变', () => {
  assert.equal(formatPhone('010-88886666'), '010-88886666');
});

test('formatPhone: 11 位手机号格式化', () => {
  assert.equal(formatPhone('13800138000'), '138-0013-8000');
});

test('formatPhone: 非标准格式原样返回', () => {
  assert.equal(formatPhone('123'), '123');
});

// ── 4. 验证函数 ──

test('validateStoreInfo: 完整合法数据通过', () => {
  const errs = validateStoreInfo(DEFAULT_STORE);
  assert.equal(Object.keys(errs).length, 0);
});

test('validateStoreInfo: 门店名称为空拒绝', () => {
  const errs = validateStoreInfo({ ...DEFAULT_STORE, name: '' });
  assert.equal(errs.name, '门店名称不能为空');
});

test('validateStoreInfo: 门店名称为空格拒绝', () => {
  const errs = validateStoreInfo({ ...DEFAULT_STORE, name: '   ' });
  assert.equal(errs.name, '门店名称不能为空');
});

test('validateStoreInfo: 门店名称超长拒绝', () => {
  const errs = validateStoreInfo({ ...DEFAULT_STORE, name: '超长门店名称'.repeat(10) });
  assert.equal(errs.name, '门店名称不超过50个字符');
});

test('validateStoreInfo: 联系电话为空拒绝', () => {
  const errs = validateStoreInfo({ ...DEFAULT_STORE, phone: '' });
  assert.equal(errs.phone, '联系电话不能为空');
});

test('validateStoreInfo: 联系电话格式错误拒绝', () => {
  const errs = validateStoreInfo({ ...DEFAULT_STORE, phone: '1234' });
  assert.equal(errs.phone, '联系电话格式不正确');
});

test('validateStoreInfo: 营业时间为空拒绝', () => {
  const errs = validateStoreInfo({ ...DEFAULT_STORE, hours: '' });
  assert.equal(errs.hours, '营业时间不能为空');
});

test('validateStoreInfo: 营业时间格式错误拒绝', () => {
  const errs = validateStoreInfo({ ...DEFAULT_STORE, hours: '1000-2200' });
  assert.ok(errs.hours?.includes('格式不正确'));
});

test('validateStoreInfo: 紧急联系人超长拒绝', () => {
  const errs = validateStoreInfo({ ...DEFAULT_STORE, emergencyContact: '联'.repeat(51) });
  assert.equal(errs.emergencyContact, '紧急联系人信息不超过50个字符');
});

test('validateStoreInfo: 紧急联系人可为空不报错', () => {
  const errs = validateStoreInfo({ ...DEFAULT_STORE, emergencyContact: '' });
  assert.equal(errs.emergencyContact, undefined);
});

// ── 5. 搜索/过滤 ──

test('filterTasksByPriority: 按优先级过滤正确', () => {
  const tasks: TaskItem[] = [
    { id: 't1', title: '高优先级', type: 'inventory', priority: 'high', createdAt: '', description: '' },
    { id: 't2', title: '中优先级', type: 'member', priority: 'medium', createdAt: '', description: '' },
    { id: 't3', title: '低优先级', type: 'alert', priority: 'low', createdAt: '', description: '' },
  ];
  assert.equal(filterTasksByPriority(tasks, 'high').length, 1);
  assert.equal(filterTasksByPriority(tasks, 'medium').length, 1);
  assert.equal(filterTasksByPriority(tasks, 'low').length, 1);
});

test('filterTasksByPriority: 空列表返回空', () => {
  assert.equal(filterTasksByPriority([], 'high').length, 0);
});

test('searchQuickActions: 按中文标签搜索', () => {
  const actions = [
    { key: 'scan', label: '📷 扫码入库' },
    { key: 'order', label: '📋 新建订单' },
    { key: 'member', label: '👤 会员查询' },
  ];
  assert.equal(searchQuickActions(actions, '扫码').length, 1);
  assert.equal(searchQuickActions(actions, '扫码')[0].key, 'scan');
});

test('searchQuickActions: 无匹配返回空', () => {
  const actions = [{ key: 'scan', label: '📷 扫码入库' }];
  assert.equal(searchQuickActions(actions, '不存在的').length, 0);
});

test('searchQuickActions: 按 key 搜索', () => {
  const actions = [
    { key: 'scan', label: '📷 扫码入库' },
    { key: 'order', label: '📋 新建订单' },
  ];
  assert.equal(searchQuickActions(actions, 'order').length, 1);
});

// ── 6. 默认数据完整性 ──

test('DEFAULT_STORE: 所有字段正确设置', () => {
  assert.equal(DEFAULT_STORE.name, '神机营电竞乐园 · 旗舰店');
  assert.equal(DEFAULT_STORE.storeCode, 'BJ-CBD-001');
  assert.equal(DEFAULT_STORE.status, 'active');
  assert.equal(DEFAULT_STORE.area, 580);
  assert.ok(DEFAULT_STORE.phone.startsWith('010'));
});
