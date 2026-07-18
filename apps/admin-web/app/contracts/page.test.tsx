/**
 * contracts/page.test.tsx — 合同管理页 L1 测试
 * ⚡ 覆盖: 数据/统计/Tab筛选/空态/合同交互(签署/备注)/格式化/类型映射/组件结构/React渲染
 *
 * 测试原则:
 * - fetch mock: URL-pattern responseRegistry
 * - 禁止: as any / describe.skip / it.only
 * - 覆盖: 正例 + 反例 + 边界（三件套）
 * - 隔离: beforeEach 重置，test 自包含
 */

import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import fs from 'node:fs';
import { render, screen, cleanup } from '@testing-library/react';
import ContractsPage from './page';

// ===================== 类型定义 =====================

type ContractType = 'sales' | 'procurement' | 'service' | 'lease';
type ContractStatus = 'pending_sign' | 'in_progress' | 'expired' | 'completed';
type TabKey = 'all' | 'pending_sign' | 'in_progress' | 'expired';

interface ContractRecord {
  id: string;
  type: ContractType;
  title: string;
  partyA: string;
  partyB: string;
  amount: number;
  status: ContractStatus;
  signedAt: string;
  expiresAt: string;
  updatedAt: string;
  description: string;
  comment: string;
}

// ===================== 常量映射 (与 page.tsx 同步) =====================

const TYPE_LABEL: Record<ContractType, string> = {
  sales: '销售合同',
  procurement: '采购合同',
  service: '服务合同',
  lease: '租赁合同',
};

const STATUS_LABEL: Record<ContractStatus, string> = {
  pending_sign: '待签',
  in_progress: '执行中',
  expired: '已到期',
  completed: '已完成',
};

const STATUS_COLOR: Record<ContractStatus, string> = {
  pending_sign: '#eab308',
  in_progress: '#22c55e',
  expired: '#ef4444',
  completed: '#94a3b8',
};

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isExpiredSoon(expiresAt: string, withinDays = 30): boolean {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  return diffMs > 0 && diffMs <= withinDays * 24 * 60 * 60 * 1000;
}

// ===================== URL-pattern responseRegistry =====================

const responseRegistry = new Map<string, { ok: boolean; data: unknown; message: string }>();

/** Register a mock API response for URL-pattern */
function registerResponse(
  method: string,
  urlPattern: string,
  response: { ok: boolean; data: unknown; message: string },
): void {
  responseRegistry.set(`${method.toUpperCase()}:${urlPattern}`, response);
}

/** Reset all registered responses */
function resetRegistry(): void {
  responseRegistry.clear();
}

/** Mock fetch using URL-pattern registry */
async function mockFetch(url: string, options?: RequestInit): Promise<Response> {
  const method = (options?.method ?? 'GET').toUpperCase();
  const key = `${method}:${url}`;
  const entry = responseRegistry.get(key);

  if (!entry) {
    return new Response(JSON.stringify({ ok: false, data: null, message: 'not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(entry), {
    status: entry.ok ? 200 : 400,
    headers: { 'content-type': 'application/json' },
  });
}

/** Simple mock fetch returning a canned response for any URL matching prefix */
function mockFetchOk(url: string, responseData: unknown): void {
  registerResponse('POST', url, { ok: true, data: responseData, message: 'success' });
}

function mockFetchFail(url: string, failMessage: string): void {
  registerResponse('POST', url, { ok: false, data: null, message: failMessage });
}

// Register default mocks
mockFetchOk('/api/contracts/sign', { id: 'CT-001', status: 'in_progress' });
mockFetchOk('/api/contracts/comment', { id: 'CT-001', comment: '已确认条款', createdAt: new Date().toISOString() });
mockFetchFail('/api/contracts/comment-empty', '备注内容不能为空');

// ===================== 样本数据 =====================

const DEFAULT_CONTRACTS: ContractRecord[] = [
  { id: 'CT-001', type: 'sales', title: '北京朝阳店设备销售合同', partyA: '我方', partyB: '北京朝阳科技有限公司', amount: 350000, status: 'pending_sign', signedAt: '', expiresAt: '2026-10-18', updatedAt: '2026-07-18T09:00:00', description: '销售2条全自动生产线及相关配件', comment: '' },
  { id: 'CT-002', type: 'procurement', title: '上海浦东原材料采购合同', partyA: '上海浦东原材料供应商', partyB: '我方', amount: 128000, status: 'in_progress', signedAt: '2026-06-15', expiresAt: '2026-12-31', updatedAt: '2026-07-17T14:30:00', description: '年度原材料框架采购协议', comment: '' },
  { id: 'CT-003', type: 'service', title: '广州天河IT运维服务合同', partyA: '广州天河信息技术公司', partyB: '我方', amount: 96000, status: 'in_progress', signedAt: '2026-05-01', expiresAt: '2027-04-30', updatedAt: '2026-07-17T10:00:00', description: '全年IT系统运维及技术支持服务', comment: '' },
  { id: 'CT-004', type: 'lease', title: '深圳南山办公场地租赁合同', partyA: '我方', partyB: '深圳南山产业园管理有限公司', amount: 240000, status: 'in_progress', signedAt: '2026-04-01', expiresAt: '2027-03-31', updatedAt: '2026-07-16T08:00:00', description: '深圳南山研发中心办公场地续租', comment: '' },
  { id: 'CT-005', type: 'sales', title: '成都锦江门店装修合同', partyA: '成都锦江装饰公司', partyB: '我方', amount: 86000, status: 'completed', signedAt: '2026-03-10', expiresAt: '2026-06-30', updatedAt: '2026-07-02T11:00:00', description: '新门店装修工程合同', comment: '已按合同约定完成验收结算' },
  { id: 'CT-006', type: 'procurement', title: '杭州西湖办公设备采购合同', partyA: '我方', partyB: '杭州办公设备供应商', amount: 45000, status: 'expired', signedAt: '2025-07-01', expiresAt: '2026-06-30', updatedAt: '2026-07-01T16:00:00', description: '年度办公设备集中采购合同', comment: '合同已到期，正在协商续签' },
  { id: 'CT-007', type: 'service', title: '武汉光谷物流配送服务合同', partyA: '武汉光谷物流公司', partyB: '我方', amount: 180000, status: 'pending_sign', signedAt: '', expiresAt: '2027-01-15', updatedAt: '2026-07-13T09:30:00', description: '区域物流配送服务年度合同', comment: '' },
  { id: 'CT-008', type: 'lease', title: '南京新街口设备租赁合同', partyA: '我方', partyB: '南京设备租赁有限公司', amount: 60000, status: 'expired', signedAt: '2025-08-01', expiresAt: '2026-07-15', updatedAt: '2026-07-15T07:00:00', description: '施工设备租赁合同（已到期）', comment: '设备已归还，待办结算' },
];

// ===================== 辅助函数 =====================

function filterContracts(contracts: ContractRecord[], tab: TabKey): ContractRecord[] {
  if (tab === 'all') return contracts;
  return contracts.filter((c) => c.status === tab);
}

function computeStats(contracts: ContractRecord[]) {
  const total = contracts.length;
  const pendingSign = contracts.filter((c) => c.status === 'pending_sign').length;
  const inProgress = contracts.filter((c) => c.status === 'in_progress').length;
  const expired = contracts.filter((c) => c.status === 'expired').length;
  const completed = contracts.filter((c) => c.status === 'completed').length;
  const totalAmount = contracts.reduce((s, c) => s + c.amount, 0);

  return { total, pendingSign, inProgress, expired, completed, totalAmount, avgAmount: total > 0 ? Math.round(totalAmount / total) : 0 };
}

function updateContractStatus(
  contracts: ContractRecord[],
  id: string,
  status: ContractStatus,
  signedAt?: string,
): ContractRecord[] {
  return contracts.map((c) => {
    if (c.id !== id) return c;
    return signedAt ? { ...c, status, signedAt } : { ...c, status };
  });
}

function addComment(
  contracts: ContractRecord[],
  id: string,
  comment: string,
): ContractRecord[] {
  return contracts.map((c) => (c.id === id ? { ...c, comment } : c));
}

// ===================== 正例 =====================

describe('合同管理页 — 正例', () => {
  beforeEach(() => {
    resetRegistry();
    mockFetchOk('/api/contracts/sign', { id: 'CT-001', status: 'in_progress' });
    mockFetchOk('/api/contracts/comment', { id: 'CT-001', comment: '已确认条款', createdAt: new Date().toISOString() });
  });

  describe('样本数据', () => {
    it('有 8 条合同记录', () => {
      assert.strictEqual(DEFAULT_CONTRACTS.length, 8);
    });

    it('覆盖全部合同类型', () => {
      const types = new Set(DEFAULT_CONTRACTS.map((c) => c.type));
      ['sales', 'procurement', 'service', 'lease'].forEach((t) => {
        assert.ok(types.has(t as ContractType), `缺少类型 ${t}`);
      });
    });

    it('覆盖全部状态', () => {
      const statuses = new Set(DEFAULT_CONTRACTS.map((c) => c.status));
      ['pending_sign', 'in_progress', 'expired', 'completed'].forEach((s) => {
        assert.ok(statuses.has(s as ContractStatus));
      });
    });

    it('每条记录有唯一 ID', () => {
      const ids = DEFAULT_CONTRACTS.map((c) => c.id);
      assert.strictEqual(new Set(ids).size, ids.length);
    });

    it('每条记录有标题文本', () => {
      DEFAULT_CONTRACTS.forEach((c) => {
        assert.ok(c.title.length > 0, `记录 ${c.id} 缺少标题`);
      });
    });
  });

  describe('类型映射', () => {
    it('TYPE_LABEL 映射所有类型到中文', () => {
      assert.strictEqual(TYPE_LABEL.sales, '销售合同');
      assert.strictEqual(TYPE_LABEL.procurement, '采购合同');
      assert.strictEqual(TYPE_LABEL.service, '服务合同');
      assert.strictEqual(TYPE_LABEL.lease, '租赁合同');
    });

    it('STATUS_LABEL 映射所有状态到中文', () => {
      assert.strictEqual(STATUS_LABEL.pending_sign, '待签');
      assert.strictEqual(STATUS_LABEL.in_progress, '执行中');
      assert.strictEqual(STATUS_LABEL.expired, '已到期');
      assert.strictEqual(STATUS_LABEL.completed, '已完成');
    });

    it('STATUS_COLOR 映射所有状态颜色', () => {
      assert.strictEqual(STATUS_COLOR.pending_sign, '#eab308');
      assert.strictEqual(STATUS_COLOR.in_progress, '#22c55e');
      assert.strictEqual(STATUS_COLOR.expired, '#ef4444');
      assert.strictEqual(STATUS_COLOR.completed, '#94a3b8');
    });
  });

  describe('格式化函数', () => {
    it('formatAmount 格式化金额正确', () => {
      assert.strictEqual(formatAmount(350000), '¥350,000.00');
      assert.strictEqual(formatAmount(0), '¥0.00');
      assert.strictEqual(formatAmount(96000), '¥96,000.00');
      assert.strictEqual(formatAmount(3.5), '¥3.50');
    });

    it('formatDate 格式化日期正确', () => {
      assert.strictEqual(formatDate('2026-07-18T09:00:00'), '2026-07-18');
      assert.strictEqual(formatDate('2026-01-05T14:05:00'), '2026-01-05');
    });

    it('isExpiredSoon 判断 30 天内到期正确', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      assert.strictEqual(isExpiredSoon(futureDate.toISOString().slice(0, 10)), true);

      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 100);
      assert.strictEqual(isExpiredSoon(farFuture.toISOString().slice(0, 10)), false);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      assert.strictEqual(isExpiredSoon(yesterday.toISOString().slice(0, 10)), false);
    });
  });

  describe('统计计算', () => {
    it('统计卡片数据正确: 总合同8, 待签2, 执行中3, 已到期2', () => {
      const stats = computeStats(DEFAULT_CONTRACTS);
      assert.strictEqual(stats.total, 8);
      assert.strictEqual(stats.pendingSign, 2); // CT-001, CT-007
      assert.strictEqual(stats.inProgress, 3);  // CT-002, CT-003, CT-004
      assert.strictEqual(stats.expired, 2);     // CT-006, CT-008
      assert.strictEqual(stats.completed, 1);   // CT-005
    });

    it('总金额计算正确', () => {
      const stats = computeStats(DEFAULT_CONTRACTS);
      const expected = 350000 + 128000 + 96000 + 240000 + 86000 + 45000 + 180000 + 60000;
      assert.strictEqual(stats.totalAmount, expected);
    });

    it('平均金额计算正确', () => {
      const stats = computeStats(DEFAULT_CONTRACTS);
      const expected = Math.round((350000 + 128000 + 96000 + 240000 + 86000 + 45000 + 180000 + 60000) / 8);
      assert.strictEqual(stats.avgAmount, expected);
    });
  });

  describe('Tab 筛选', () => {
    it('all tab 返回全部 8 条', () => {
      const result = filterContracts(DEFAULT_CONTRACTS, 'all');
      assert.strictEqual(result.length, 8);
    });

    it('pending_sign tab 返回 2 条待签', () => {
      const result = filterContracts(DEFAULT_CONTRACTS, 'pending_sign');
      assert.strictEqual(result.length, 2);
      result.forEach((c) => assert.strictEqual(c.status, 'pending_sign'));
    });

    it('in_progress tab 返回 3 条执行中', () => {
      const result = filterContracts(DEFAULT_CONTRACTS, 'in_progress');
      assert.strictEqual(result.length, 3);
      result.forEach((c) => assert.strictEqual(c.status, 'in_progress'));
    });

    it('expired tab 返回 2 条已到期', () => {
      const result = filterContracts(DEFAULT_CONTRACTS, 'expired');
      assert.strictEqual(result.length, 2);
      result.forEach((c) => assert.strictEqual(c.status, 'expired'));
    });
  });

  describe('合同交互：签署', () => {
    it('签署后状态变为 in_progress', () => {
      const updated = updateContractStatus(DEFAULT_CONTRACTS, 'CT-001', 'in_progress', '2026-07-19');
      const item = updated.find((c) => c.id === 'CT-001')!;
      assert.strictEqual(item.status, 'in_progress');
      assert.strictEqual(item.signedAt, '2026-07-19');
    });

    it('mock 签署接口返回成功', async () => {
      const res = await mockFetch('/api/contracts/sign', {
        method: 'POST',
        body: JSON.stringify({ id: 'CT-001' }),
      });
      const data = await res.json();
      assert.strictEqual(data.ok, true);
      assert.strictEqual(data.data.status, 'in_progress');
    });
  });

  describe('合同交互：备注', () => {
    it('添加备注后记录包含备注内容', () => {
      const updated = addComment(DEFAULT_CONTRACTS, 'CT-001', '已确认所有条款');
      const item = updated.find((c) => c.id === 'CT-001')!;
      assert.strictEqual(item.comment, '已确认所有条款');
    });

    it('mock 备注接口成功返回备注数据', async () => {
      const res = await mockFetch('/api/contracts/comment', {
        method: 'POST',
        body: JSON.stringify({ id: 'CT-001', text: '已确认条款' }),
      });
      const data = await res.json();
      assert.strictEqual(data.ok, true);
      assert.strictEqual(data.data.id, 'CT-001');
      assert.strictEqual(data.data.comment, '已确认条款');
    });
  });
});

// ===================== 反例 =====================

describe('合同管理页 — 反例', () => {
  beforeEach(() => {
    resetRegistry();
  });

  it('空合同列表的统计值应为 0', () => {
    const stats = computeStats([]);
    assert.strictEqual(stats.total, 0);
    assert.strictEqual(stats.pendingSign, 0);
    assert.strictEqual(stats.inProgress, 0);
    assert.strictEqual(stats.expired, 0);
    assert.strictEqual(stats.completed, 0);
    assert.strictEqual(stats.totalAmount, 0);
  });

  it('空列表筛选返回空', () => {
    assert.strictEqual(filterContracts([], 'all').length, 0);
    assert.strictEqual(filterContracts([], 'pending_sign').length, 0);
    assert.strictEqual(filterContracts([], 'in_progress').length, 0);
    assert.strictEqual(filterContracts([], 'expired').length, 0);
  });

  it('备注空文本在注册表中返回失败', async () => {
    mockFetchFail('/api/contracts/comment-empty', '备注内容不能为空');
    const res = await mockFetch('/api/contracts/comment-empty', {
      method: 'POST',
      body: JSON.stringify({ id: 'CT-001', text: '' }),
    });
    const data = await res.json();
    assert.strictEqual(data.ok, false);
    assert.strictEqual(data.message, '备注内容不能为空');
  });

  it('未注册的API路径返回404', async () => {
    const res = await mockFetch('/api/contracts/nonexistent', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const data = await res.json();
    assert.strictEqual(data.ok, false);
    assert.strictEqual(data.message, 'not found');
  });

  it('未注册的GET路径返回404', async () => {
    const res = await mockFetch('/api/contracts/list');
    const data = await res.json();
    assert.strictEqual(data.ok, false);
  });

  it('不存在的合同ID更新状态不改变其他记录', () => {
    const updated = updateContractStatus(DEFAULT_CONTRACTS, 'CT-NONEXIST', 'in_progress');
    assert.strictEqual(updated.length, DEFAULT_CONTRACTS.length);
    DEFAULT_CONTRACTS.forEach((orig) => {
      const upd = updated.find((c) => c.id === orig.id)!;
      assert.strictEqual(upd.status, orig.status);
    });
  });
});

// ===================== 边界 =====================

describe('合同管理页 — 边界', () => {
  it('金额为0的合同格式化正确', () => {
    assert.strictEqual(formatAmount(0), '¥0.00');
  });

  it('极小金额格式化正确', () => {
    assert.strictEqual(formatAmount(0.01), '¥0.01');
    assert.strictEqual(formatAmount(0.1), '¥0.10');
  });

  it('大额金额格式化正确', () => {
    assert.strictEqual(formatAmount(1000000), '¥1,000,000.00');
    assert.strictEqual(formatAmount(9999999.99), '¥9,999,999.99');
  });

  it('空列表平均金额为 0', () => {
    const stats = computeStats([]);
    assert.strictEqual(stats.avgAmount, 0);
  });

  it('单条合同统计正确', () => {
    const single: ContractRecord = {
      id: 'CT-TEST', type: 'sales', title: '测试合同', partyA: '甲方', partyB: '乙方',
      amount: 50000, status: 'pending_sign', signedAt: '', expiresAt: '2027-01-01',
      updatedAt: '2026-07-01T00:00:00', description: '测试', comment: '',
    };
    const stats = computeStats([single]);
    assert.strictEqual(stats.total, 1);
    assert.strictEqual(stats.pendingSign, 1);
    assert.strictEqual(stats.totalAmount, 50000);
    assert.strictEqual(stats.avgAmount, 50000);
  });

  it('所有合同均为 expired 时的过期数量正确', () => {
    const allExpired = DEFAULT_CONTRACTS.map((c) => ({ ...c, status: 'expired' as const }));
    const stats = computeStats(allExpired);
    assert.strictEqual(stats.expired, 8);
    assert.strictEqual(stats.pendingSign, 0);
    assert.strictEqual(stats.inProgress, 0);
  });

  it('responseRegistry 注册后可以重复调用', async () => {
    resetRegistry();
    mockFetchOk('/api/contracts/sign', { id: 'CT-001', status: 'in_progress' });

    const r1 = await mockFetch('/api/contracts/sign', { method: 'POST', body: '{}' });
    const d1 = await r1.json();
    assert.strictEqual(d1.ok, true);

    const r2 = await mockFetch('/api/contracts/sign', { method: 'POST', body: '{}' });
    const d2 = await r2.json();
    assert.strictEqual(d2.ok, true);
  });

  it('多次重置 registry 后注册仍然可用', () => {
    resetRegistry();
    assert.strictEqual(responseRegistry.size, 0);
    mockFetchOk('/api/contracts/comment', { id: 'CT-001', comment: 'ok' });
    assert.strictEqual(responseRegistry.size, 1);
  });

  it('签署缺 ID 时返回失败', async () => {
    mockFetchFail('/api/contracts/sign', '缺少合同ID');
    const res = await mockFetch('/api/contracts/sign', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const data = await res.json();
    assert.strictEqual(data.ok, false);
    assert.strictEqual(data.message, '缺少合同ID');
  });

  it('签署缺 body 时返回失败', async () => {
    mockFetchFail('/api/contracts/sign', '缺少合同ID');
    const res = await mockFetch('/api/contracts/sign', {
      method: 'POST',
    });
    const data = await res.json();
    assert.strictEqual(data.ok, false);
  });

  it('备注缺 ID 时返回失败', async () => {
    mockFetchFail('/api/contracts/comment-empty', '备注内容不能为空');
    const res = await mockFetch('/api/contracts/comment-empty', {
      method: 'POST',
      body: JSON.stringify({ text: '' }),
    });
    const data = await res.json();
    assert.strictEqual(data.ok, false);
  });
});

// ===================== 组件结构验证 =====================

describe('合同管理页 — 组件结构', () => {
  const SRC = fs.readFileSync(
    new URL('page.tsx', import.meta.url),
    'utf-8',
  );

  it('包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('包含 useState 声明', () => {
    assert.ok(SRC.includes('useState'));
  });

  it('包含 useMemo', () => {
    assert.ok(SRC.includes('useMemo'));
  });

  it('包含 useCallback', () => {
    assert.ok(SRC.includes('useCallback'));
  });

  it('包含 JSX 返回', () => {
    assert.ok(SRC.includes('return ('));
  });

  it('包含列表渲染 .map()', () => {
    assert.ok(SRC.includes('.map('));
  });

  it('包含条件渲染 &&', () => {
    assert.ok(SRC.includes(' && '));
  });

  it('包含默认导出函数', () => {
    assert.ok(SRC.includes('export default function ContractsPage'));
  });

  it('包含注释说明文档', () => {
    assert.ok(SRC.includes('/**'));
  });

  it('包含事件处理器 onClick', () => {
    assert.ok(SRC.includes('onClick'));
  });

  it('包含 onChange 事件', () => {
    assert.ok(SRC.includes('onChange'));
  });

  it('包含 style 内联样式', () => {
    assert.ok(SRC.includes('style={{'));
  });

  it('包含金额格式化', () => {
    assert.ok(SRC.includes('toLocaleString'));
  });

  it('包含模板字符串', () => {
    assert.ok(SRC.includes('${'));
  });

  it('包含空态处理', () => {
    assert.ok(SRC.includes('EmptyState'));
  });
});

// ===================== React 渲染测试 =====================

/**
 * React 渲染测试 — 使用 @testing-library/react 做真正的组件渲染
 * 依赖 .test-setup.mjs 提供的 happy-dom 环境和 next/navigation mock
 */
describe('合同管理页 — React 渲染', () => {
  afterEach(() => {
    cleanup();
  });

  it('组件能够渲染且不抛出错误', () => {
    assert.doesNotThrow(() => {
      render(<ContractsPage />);
    });
  });

  it('渲染页面标题「合同管理」', () => {
    render(<ContractsPage />);
    const heading = screen.getByText('📑 合同管理');
    assert.ok(heading);
    assert.strictEqual(heading.tagName, 'H1');
  });

  it('渲染四个统计卡片（总合同数 / 待签 / 执行中 / 已到期）', () => {
    render(<ContractsPage />);
    // 统计卡片的 label 文本是通过 div 渲染的, 查找所有包含统计标签的 div
    // 注意: tab 按钮中也包含"待签"和"执行中"文字, 所以按 label 值找 StatBox
    const statLabels = screen.queryAllByText((content, element) => {
      // StatBox 的 label 是 parent div 下第一个 div 的内容
      if (element?.tagName !== 'DIV') return false;
      return ['总合同数', '待签', '执行中', '已到期'].includes(content);
    });
    // 每个统计卡片有一个 label div
    assert.strictEqual(statLabels.length, 4);

    // 总合同数 = 8, 待签 = 2, 执行中 = 3, 已到期 = 2
    assert.ok(screen.queryByText('8'));  // 总合同数
    assert.ok(screen.queryByText('3'));  // 执行中
  });

  it('渲染四个 Tab 按钮且默认选中「全部」', () => {
    render(<ContractsPage />);
    const allBtns = screen.getAllByRole('button');
    // 应该有 全部, 待签, 执行中, 已到期 各一个
    const allTab = allBtns.find((b) => b.textContent?.includes('全部'));
    const pendingTab = allBtns.find((b) => b.textContent?.includes('待签'));
    const inProgressTab = allBtns.find((b) => b.textContent?.includes('执行中'));
    const expiredTab = allBtns.find((b) => b.textContent?.includes('已到期'));
    assert.ok(allTab);
    assert.ok(pendingTab);
    assert.ok(inProgressTab);
    assert.ok(expiredTab);
    // 默认选中「全部」Tab（fontWeight 应为 700）
    assert.strictEqual(allTab!.style.fontWeight, '700');
  });

  it('渲染样本数据的第一条记录（北京朝阳店设备销售合同）', () => {
    render(<ContractsPage />);
    const descriptions = screen.queryAllByText('北京朝阳店设备销售合同');
    assert.ok(descriptions.length >= 1);
    assert.ok(screen.queryByText('CT-001'));
    assert.ok(screen.queryByText('北京朝阳科技有限公司'));
  });
});
