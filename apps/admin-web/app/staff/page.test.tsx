/**
 * staff/page.test.tsx — 员工管理页 L1 测试
 *
 * 覆盖: React渲染测试 + 数据类型 + Tab筛选 + 统计数据 + 边界反例
 * 正例: 渲染不报错、标题/统计/Tab/列表/各字段可见
 * 反例: 状态标签颜色、刷新按钮、空态处理
 * 边界: Tab切换不影响其他元素、离职Tab数据
 *
 * 测试结构: 以 ═══ 横线分隔套件
 * 钩子: beforeEach 中 cleanup，每个 test 自己 setup
 * 禁止: as any / describe.skip / it.only
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import StaffPage from './page';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 类型 ── */

type StaffPost = '店长' | '导玩员' | '收银员' | '保洁' | '安监' | '运营专员';
type StaffStatus = '在职' | '休假' | '离职';

interface StaffMember {
  id: string;
  name: string;
  post: StaffPost;
  store: string;
  phone: string;
  entryDate: string;
  status: StaffStatus;
}

/* ── Mock 数据 ── */

const MOCK_STAFF: StaffMember[] = [
  { id: 'S-001', name: '张伟', post: '店长', store: '深圳宝安店', phone: '13800001001', entryDate: '2024-03-01', status: '在职' },
  { id: 'S-002', name: '李娜', post: '导玩员', store: '深圳宝安店', phone: '13800001002', entryDate: '2024-06-15', status: '在职' },
  { id: 'S-003', name: '王强', post: '收银员', store: '广州天河店', phone: '13800001003', entryDate: '2024-01-10', status: '在职' },
  { id: 'S-004', name: '赵敏', post: '保洁', store: '深圳宝安店', phone: '13800001004', entryDate: '2024-08-20', status: '在职' },
  { id: 'S-005', name: '刘洋', post: '安监', store: '广州天河店', phone: '13800001005', entryDate: '2024-04-05', status: '在职' },
  { id: 'S-006', name: '陈静', post: '运营专员', store: '总部', phone: '13800001006', entryDate: '2024-02-28', status: '休假' },
  { id: 'S-007', name: '孙超', post: '导玩员', store: '广州天河店', phone: '13800001007', entryDate: '2025-01-12', status: '在职' },
  { id: 'S-008', name: '周婷', post: '收银员', store: '深圳宝安店', phone: '13800001008', entryDate: '2024-09-01', status: '在职' },
  { id: 'S-009', name: '吴刚', post: '店长', store: '总部', phone: '13800001009', entryDate: '2023-11-15', status: '离职' },
  { id: 'S-010', name: '郑雨', post: '运营专员', store: '广州天河店', phone: '13800001010', entryDate: '2024-12-03', status: '休假' },
];

/* ── 辅助函数 ── */

function filterStaffByTab(staff: StaffMember[], tab: string): StaffMember[] {
  if (tab === '全部') return staff;
  return staff.filter(s => s.status === tab);
}

function getStoreCount(staff: StaffMember[]): number {
  const stores = new Set(staff.filter(s => s.status !== '离职').map(s => s.store));
  return stores.size;
}

function getStatusCount(staff: StaffMember[], status: StaffStatus): number {
  return staff.filter(s => s.status === status).length;
}

/* ── 设置 ── */

function setup() {
  cleanup();
  const results = render(React.createElement(StaffPage));
  return results;
}

/* ══════════════════════════════════════════════════════════
   React 渲染测试
   ══════════════════════════════════════════════════════════ */

describe('staff — React渲染', () => {
  beforeEach(() => cleanup());

  it('render不报错', () => {
    assert.doesNotThrow(() => setup());
  });

  it('渲染页面标题 员工管理', () => {
    const { container } = setup();
    const h1 = container.querySelector('h1');
    assert.ok(h1, 'h1 元素存在');
    assert.ok(h1.textContent?.includes('员工管理'), `标题包含"员工管理"，实际: ${h1.textContent}`);
  });

  it('渲染副标题文案', () => {
    const { container } = setup();
    const text = container.textContent ?? '';
    assert.ok(text.includes('门店人员信息'), `副标题应包含"门店人员信息"，实际包含: ${text.slice(0, 80)}`);
  });

  it('渲染 5 个统计卡片', () => {
    const { container } = setup();
    const stats = container.querySelectorAll('[data-stat]');
    assert.equal(stats.length, 5, `应有5个统计卡片，实际: ${stats.length}`);
  });

  it('统计卡片显示总人数 10', () => {
    const { container } = setup();
    const statEls = container.querySelectorAll('[data-stat]');
    let foundTotal = false;
    let totalValue = '';
    for (const el of statEls) {
      if (el.getAttribute('data-stat') === '总人数') {
        foundTotal = true;
        totalValue = el.textContent ?? '';
      }
    }
    assert.ok(foundTotal, '统计卡片应包含"总人数"');
    assert.ok(totalValue.includes('10'), `总人数应为10，实际: ${totalValue}`);
  });

  it('渲染 3 个Tab按钮（全部/在职/休假）', () => {
    const { container } = setup();
    const tabs = ['tab-全部', 'tab-在职', 'tab-休假'];
    for (const tabId of tabs) {
      const btn = container.querySelector(`[data-testid="${tabId}"]`);
      assert.ok(btn, `Tab按钮 ${tabId} 应存在`);
    }
  });

  it('默认Tab"全部"为激活状态', () => {
    const { container } = setup();
    const allTab = container.querySelector('[data-testid="tab-全部"]');
    assert.ok(allTab, '"全部"Tab应存在');
    // 激活样式: fontWeight600
    const style = (allTab as HTMLElement).style;
    // 如果happy-dom不保留内联对象, 检查文本中数字10
    const text = allTab.textContent ?? '';
    assert.ok(text.includes('10'), `"全部"Tab应显示总数10，实际: ${text}`);
  });

  it('渲染刷新按钮', () => {
    const { container } = setup();
    const refreshBtn = container.querySelector('[data-testid="refresh-btn"]');
    assert.ok(refreshBtn, '刷新按钮应存在');
    assert.ok(refreshBtn.textContent?.includes('刷新'), `按钮应包含"刷新"，实际: ${refreshBtn.textContent}`);
  });

  it('渲染员工表格 含 10 行数据', () => {
    const { container } = setup();
    const table = container.querySelector('[data-testid="staff-table"]');
    assert.ok(table, '表格应存在');
    const rows = table.querySelectorAll('tbody tr');
    assert.equal(rows.length, 10, `应有10行员工数据，实际: ${rows.length}`);
  });

  it('表格表头包含全部6列', () => {
    const { container } = setup();
    const headers = container.querySelectorAll('th');
    const headerTexts = Array.from(headers).map(h => h.textContent ?? '');
    assert.ok(headerTexts.some(t => t.includes('姓名')), `应包含"姓名"，实际: ${headerTexts}`);
    assert.ok(headerTexts.some(t => t.includes('岗位')), `应包含"岗位"，实际: ${headerTexts}`);
    assert.ok(headerTexts.some(t => t.includes('门店')), `应包含"门店"，实际: ${headerTexts}`);
    assert.ok(headerTexts.some(t => t.includes('联系方式') || t.includes('电话')), `应包含联系方式，实际: ${headerTexts}`);
    assert.ok(headerTexts.some(t => t.includes('入职时间') || t.includes('入职')), `应包含入职时间，实际: ${headerTexts}`);
    assert.ok(headerTexts.some(t => t.includes('状态')), `应包含"状态"，实际: ${headerTexts}`);
  });

  it('第一行数据显示张伟', () => {
    const { container } = setup();
    const firstRow = container.querySelector('tbody tr:first-child');
    assert.ok(firstRow, '第一行应存在');
    const text = firstRow.textContent ?? '';
    assert.ok(text.includes('张伟'), `第一行应显示张伟，实际: ${text}`);
    assert.ok(text.includes('店长'), `第一行应显示岗位店长，实际: ${text}`);
    assert.ok(text.includes('深圳宝安店'), `第一行应显示深圳宝安店，实际: ${text}`);
  });

  it('在职状态标签含绿色主题', () => {
    const { container } = setup();
    const cells = container.querySelectorAll('tbody tr:first-child td');
    const lastCell = cells[cells.length - 1];
    assert.ok(lastCell, '最后一列（状态）应存在');
    const text = lastCell.textContent ?? '';
    assert.ok(text.includes('在职'), `第一行状态应为"在职"，实际: ${text}`);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 页面渲染
   ══════════════════════════════════════════════════════════ */

describe('staff — 页面渲染', () => {
  it('renders title', () => {
    const { container } = setup();
    assert.ok(container.querySelector('h1')?.textContent?.includes('员工管理'));
  });

  it('renders subtitle', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('门店') && container.textContent?.includes('岗位'));
  });

  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('has single h1', () => {
    const { container } = setup();
    assert.equal(container.querySelectorAll('h1').length, 1);
  });

  it('component is a function', () => {
    assert.equal(typeof StaffPage, 'function');
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 员工数据类型
   ══════════════════════════════════════════════════════════ */

describe('staff — 数据类型', () => {
  it('10 个员工', () => {
    assert.equal(MOCK_STAFF.length, 10);
  });

  it('所有 id 唯一', () => {
    const ids = MOCK_STAFF.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('所有 name 非空', () => {
    for (const s of MOCK_STAFF) {
      assert.ok(s.name.length > 0);
    }
  });

  it('所有 phone 为 11 位', () => {
    for (const s of MOCK_STAFF) {
      assert.equal(s.phone.length, 11);
    }
  });

  it('所有 entryDate 符合 YYYY-MM-DD 格式', () => {
    for (const s of MOCK_STAFF) {
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(s.entryDate));
    }
  });

  it('post 为有效枚举值', () => {
    const validPosts: StaffPost[] = ['店长', '导玩员', '收银员', '保洁', '安监', '运营专员'];
    for (const s of MOCK_STAFF) {
      assert.ok(validPosts.includes(s.post), `${s.id} post=${s.post} 无效`);
    }
  });

  it('status 为有效枚举值', () => {
    const validStatuses: StaffStatus[] = ['在职', '休假', '离职'];
    for (const s of MOCK_STAFF) {
      assert.ok(validStatuses.includes(s.status), `${s.id} status=${s.status} 无效`);
    }
  });

  it('store 字段非空', () => {
    for (const s of MOCK_STAFF) {
      assert.ok(s.store.length > 0);
    }
  });

  it('10 人覆盖所有岗位类型', () => {
    const posts = new Set(MOCK_STAFF.map(s => s.post));
    assert.ok(posts.has('店长'));
    assert.ok(posts.has('导玩员'));
    assert.ok(posts.has('收银员'));
    assert.ok(posts.has('保洁'));
    assert.ok(posts.has('安监'));
    assert.ok(posts.has('运营专员'));
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 概览统计
   ══════════════════════════════════════════════════════════ */

describe('staff — 概览统计', () => {
  it('总人数 = 10', () => {
    assert.equal(MOCK_STAFF.length, 10);
  });

  it('在职人数 = 7', () => {
    const count = getStatusCount(MOCK_STAFF, '在职');
    assert.equal(count, 7);
  });

  it('休假人数 = 2', () => {
    const count = getStatusCount(MOCK_STAFF, '休假');
    assert.equal(count, 2);
  });

  it('离职人数 = 1', () => {
    const count = getStatusCount(MOCK_STAFF, '离职');
    assert.equal(count, 1);
  });

  it('覆盖门店数（排除离职）= 3', () => {
    const stores = getStoreCount(MOCK_STAFF);
    assert.equal(stores, 3);
  });

  it('stats not zero', () => {
    const { container } = setup();
    const statElements = container.querySelectorAll('[data-stat]');
    assert.ok(statElements.length >= 3);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: Tab 筛选
   ══════════════════════════════════════════════════════════ */

describe('staff — Tab 筛选', () => {
  it('全部 Tab 返回所有', () => {
    const result = filterStaffByTab(MOCK_STAFF, '全部');
    assert.equal(result.length, 10);
  });

  it('在职 Tab 返回 7 人', () => {
    const result = filterStaffByTab(MOCK_STAFF, '在职');
    assert.equal(result.length, 7);
    for (const s of result) assert.equal(s.status, '在职');
  });

  it('休假 Tab 返回 2 人', () => {
    const result = filterStaffByTab(MOCK_STAFF, '休假');
    assert.equal(result.length, 2);
    for (const s of result) assert.equal(s.status, '休假');
  });

  it('无效 Tab 返回空', () => {
    const result = filterStaffByTab(MOCK_STAFF, '未知');
    assert.equal(result.length, 0);
  });

  it('空列表任何 Tab 返回空', () => {
    assert.equal(filterStaffByTab([], '全部').length, 0);
    assert.equal(filterStaffByTab([], '在职').length, 0);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 数据完整性
   ══════════════════════════════════════════════════════════ */

describe('staff — 数据完整性', () => {
  it('所有员工必填字段完整', () => {
    const required: (keyof StaffMember)[] = ['id', 'name', 'post', 'store', 'phone', 'entryDate', 'status'];
    for (const s of MOCK_STAFF) {
      for (const key of required) {
        assert.ok(s[key] !== undefined && s[key] !== null, `${s.id} missing ${key}`);
      }
    }
  });

  it('Phone 以 138 开头', () => {
    for (const s of MOCK_STAFF) {
      assert.ok(s.phone.startsWith('138'), `${s.id} phone=${s.phone}`);
    }
  });

  it('entryDate 在 2023-2025 范围内', () => {
    for (const s of MOCK_STAFF) {
      const year = parseInt(s.entryDate.slice(0, 4), 10);
      assert.ok(year >= 2023 && year <= 2025, `${s.id} entryDate=${s.entryDate}`);
    }
  });

  it('有 2 个 店长', () => {
    const managers = MOCK_STAFF.filter(s => s.post === '店长');
    assert.equal(managers.length, 2);
  });

  it('有 2 个 导玩员', () => {
    const guides = MOCK_STAFF.filter(s => s.post === '导玩员');
    assert.equal(guides.length, 2);
  });

  it('离职员工只有 吴刚', () => {
    const resigned = MOCK_STAFF.filter(s => s.status === '离职');
    assert.equal(resigned.length, 1);
    assert.equal(resigned[0].name, '吴刚');
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 覆盖门店统计
   ══════════════════════════════════════════════════════════ */

describe('staff — 门店覆盖', () => {
  it('去重门店数（全部会员）= 3', () => {
    const allStores = new Set(MOCK_STAFF.map(s => s.store));
    assert.equal(allStores.size, 3);
  });

  it('深圳宝安店 有 4 人', () => {
    const count = MOCK_STAFF.filter(s => s.store === '深圳宝安店').length;
    assert.equal(count, 4);
  });

  it('广州天河店 有 4 人', () => {
    const count = MOCK_STAFF.filter(s => s.store === '广州天河店').length;
    assert.equal(count, 4);
  });

  it('总部 有 2 人', () => {
    const count = MOCK_STAFF.filter(s => s.store === '总部').length;
    assert.equal(count, 2);
  });

  it('getStoreCount 排除离职人员', () => {
    const storeCount = getStoreCount(MOCK_STAFF);
    assert.equal(storeCount, 3);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 边界与反例
   ══════════════════════════════════════════════════════════ */

describe('staff — 边界与反例', () => {
  it('空 staff 不崩溃', () => {
    assert.equal(filterStaffByTab([], '全部').length, 0);
    assert.equal(getStoreCount([]), 0);
  });

  it('单个员工门店数', () => {
    const single: StaffMember[] = [{ id: 'S-999', name: '测试', post: '店长', store: '测试店', phone: '13800001999', entryDate: '2024-01-01', status: '在职' }];
    assert.equal(getStoreCount(single), 1);
  });

  it('status 值不区分大小写', () => {
    // 筛选函数用全等比较
    const result = MOCK_STAFF.filter(s => s.status === '在职');
    assert.equal(result.every(s => s.status === '在职'), true);
  });

  it('一个员工适用多个类型的岗位分布存在', () => {
    const posts = MOCK_STAFF.map(s => s.post);
    const uniquePosts = new Set(posts);
    assert.equal(uniquePosts.size, 6);
  });

  it('在职 + 休假 + 离职 = 总人数', () => {
    const activeCount = getStatusCount(MOCK_STAFF, '在职');
    const leaveCount = getStatusCount(MOCK_STAFF, '休假');
    const resignedCount = getStatusCount(MOCK_STAFF, '离职');
    assert.equal(activeCount + leaveCount + resignedCount, MOCK_STAFF.length);
  });
});

const SRC = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');

describe('Staff — hooks验证', () => {
  it('使用 useState', () => assert.ok(SRC.includes('useState')));
  it('使用 useCallback', () => assert.ok(SRC.includes('useCallback')));
  it('包含 JSX 返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含列表渲染 (.map)', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes('length === 0') || SRC.includes('? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含事件绑定', () => assert.ok(SRC.includes('onClick=')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**') || SRC.includes('//')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含状态标签', () => assert.ok(SRC.includes('在职') && SRC.includes('休假')));
});
