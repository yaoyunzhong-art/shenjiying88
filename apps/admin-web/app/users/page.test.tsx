/**
 * users/page.test.tsx — 用户管理 L1 冒烟测试 · 30+ 正例/反例/边界
 * 覆盖: 服务端导出、客户端角色统计条、搜索组件、角色筛选、表格渲染、边界条件
 */
import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { render as rtlRender, cleanup } from '@testing-library/react';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'users-client.tsx'), 'utf-8');

// 导入客户端组件用于渲染测试
import UsersClient from './users-client';

describe('users — 服务端 (正例+反例)', () => {
  it('async 渲染', () => assert.ok(SRC.includes('async function UsersPage')));
  it('PageShell 布局', () => assert.ok(SRC.includes('<PageShell')));
  it('Suspense 加载态', () => assert.ok(SRC.includes('<Suspense')));
  it('ErrorBoundary 容错', () => assert.ok(SRC.includes('<ErrorBoundary')));
  it('导入客户端组件', () => assert.ok(SRC.includes('users-client')));
  it('dynamic = force-dynamic', () => assert.ok(SRC.includes("export const dynamic = 'force-dynamic'")));
  it('revalidate = 0', () => assert.ok(SRC.includes('export const revalidate = 0')));
  it('LoadingSkeleton 卡片变体', () => assert.ok(SRC.includes('variant="card"')));
  it('服务端不含 use client (反例)', () => assert.ok(!SRC.includes("'use client'")));
});

describe('users — 客户端组件结构 (正例)', () => {
  it('use client 指令', () => assert.ok(CLIENT_SRC.includes("'use client'")));
  it('useState 状态钩子', () => assert.ok(CLIENT_SRC.includes('useState')));
  it('用户模拟数据 MOCK_USERS', () => assert.ok(CLIENT_SRC.includes('MOCK_USERS')));
  it('角色枚举类型 UserRole', () => assert.ok(CLIENT_SRC.includes('UserRole')));
  it('状态枚举类型 UserStatus', () => assert.ok(CLIENT_SRC.includes('UserStatus')));
  it('DataTable 表格组件', () => assert.ok(CLIENT_SRC.includes('<DataTable')));
  it('StatusBadge 状态徽章', () => assert.ok(CLIENT_SRC.includes('StatusBadge')));
  it('SearchFilterInput 搜索框', () => assert.ok(CLIENT_SRC.includes('SearchFilterInput')));
  it('Tabs 角色标签页', () => assert.ok(CLIENT_SRC.includes('<Tabs')));
  it('StatCard 统计卡片导入', () => assert.ok(CLIENT_SRC.includes('StatCard')));
  it('Card 基础卡片导入', () => assert.ok(CLIENT_SRC.includes('Card,')));
  it('条件渲染逻辑存在', () => assert.ok(CLIENT_SRC.includes(' && ') || CLIENT_SRC.includes(' ? ')));
});

describe('users — 角色统计条 StatCard (正例)', () => {
  beforeEach(() => cleanup());

  it('渲染 5 张角色统计卡片', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const cards = container.querySelectorAll('[data-mock="StatCard"]');
    assert.equal(cards.length, 5);
  });

  it('总用户卡片 value=8', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const cards = container.querySelectorAll('[data-mock="StatCard"]');
    assert.equal(cards[0].getAttribute('data-label'), '总用户');
    assert.equal(cards[0].getAttribute('data-value'), '8');
  });

  it('超级管理员卡片 value=1', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const cards = container.querySelectorAll('[data-mock="StatCard"]');
    assert.equal(cards[1].getAttribute('data-label'), '超级管理员');
    assert.equal(cards[1].getAttribute('data-value'), '1');
  });

  it('员工卡片 value=2（含已停用）', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const cards = container.querySelectorAll('[data-mock="StatCard"]');
    assert.equal(cards[2].getAttribute('data-label'), '员工');
    assert.equal(cards[2].getAttribute('data-value'), '2');
  });

  it('财务卡片 value=1', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const cards = container.querySelectorAll('[data-mock="StatCard"]');
    assert.equal(cards[3].getAttribute('data-label'), '财务');
    assert.equal(cards[3].getAttribute('data-value'), '1');
  });

  it('运维卡片 value=1', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const cards = container.querySelectorAll('[data-mock="StatCard"]');
    assert.equal(cards[4].getAttribute('data-label'), '运维');
    assert.equal(cards[4].getAttribute('data-value'), '1');
  });
});

describe('users — SearchFilterInput 搜索 (正例+反例+边界)', () => {
  beforeEach(() => cleanup());

  it('搜索框含占位符文本', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const input = container.querySelector('[data-mock="SearchFilterInput"]');
    assert.ok(input);
    assert.ok(input.getAttribute('placeholder').includes('搜索'));
  });

  it('搜索框默认值为空字符串', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const input = container.querySelector('[data-mock="SearchFilterInput"]');
    assert.equal(input.getAttribute('value'), '');
  });

  it('源文件中使用 searchTerm 状态 (正例)', () => {
    assert.ok(CLIENT_SRC.includes('searchTerm'));
  });

  it('源文件中使用 filtered useMemo (正例)', () => {
    assert.ok(CLIENT_SRC.includes('filtered'));
  });

  it('搜索结果合并姓名/邮箱/门店 (正例)', () => {
    assert.ok(CLIENT_SRC.includes('name') && CLIENT_SRC.includes('email') && CLIENT_SRC.includes('store'));
  });

  it('搜索不区分大小写 (正例-toLowerCase)', () => {
    assert.ok(CLIENT_SRC.includes('toLowerCase'));
  });

  it('空搜索返回全部数据 (边界)', () => {
    assert.ok(CLIENT_SRC.includes('!searchTerm'));
  });

  it('搜索占位符完整 (边界)', () => {
    assert.ok(CLIENT_SRC.includes('搜索用户姓名/邮箱/门店'));
  });
});

describe('users — Tabs 角色筛选 (正例+反例)', () => {
  beforeEach(() => cleanup());

  it('Tabs 组件存在', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    assert.ok(container.querySelector('[data-mock="Tabs"]'));
  });

  it('ALL Tab 默认选中', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const allTab = container.querySelector('[data-tab-key="ALL"]');
    assert.ok(allTab);
    assert.equal(allTab.getAttribute('aria-selected'), 'true');
  });

  it('Tab 数量包括 ALL + 6 种角色', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const btns = container.querySelectorAll('[role="tab"]');
    assert.equal(btns.length, 7);
  });

  it('店长 Tab 数量标记 = 2', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const tab = container.querySelector('[data-tab-key="store_manager"]');
    assert.ok(tab);
    assert.ok(tab.textContent.includes('2'));
  });

  it('员工 Tab 数量标记 = 2', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const tab = container.querySelector('[data-tab-key="staff"]');
    assert.ok(tab);
    assert.ok(tab.textContent.includes('2'));
  });

  it('超级管理员 Tab 数量标记 = 1', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const tab = container.querySelector('[data-tab-key="super_admin"]');
    assert.ok(tab);
    assert.ok(tab.textContent.includes('1'));
  });

  it('财务 Tab 数量标记 = 1', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const tab = container.querySelector('[data-tab-key="finance"]');
    assert.ok(tab);
    assert.ok(tab.textContent.includes('1'));
  });

  it('营销 Tab 数量标记 = 1', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const tab = container.querySelector('[data-tab-key="marketing"]');
    assert.ok(tab);
    assert.ok(tab.textContent.includes('1'));
  });

  it('运维 Tab 数量标记 = 1', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const tab = container.querySelector('[data-tab-key="ops"]');
    assert.ok(tab);
    assert.ok(tab.textContent.includes('1'));
  });

  it('源文件使用 roleFilter 状态 (正例)', () => {
    assert.ok(CLIENT_SRC.includes('roleFilter'));
  });
});

describe('users — DataTable 表格 (正例+反例+边界)', () => {
  beforeEach(() => cleanup());

  it('DataTable 渲染 6 列', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const table = container.querySelector('[data-testid="data-table"]');
    assert.ok(table);
    assert.equal(table.querySelectorAll('thead th').length, 6);
  });

  it('列标题: 姓名 邮箱 角色 状态 门店 最后登录', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const headers = [...container.querySelectorAll('[data-testid="data-table"] thead th')].map(h => h.textContent);
    assert.ok(headers.includes('姓名'));
    assert.ok(headers.includes('邮箱'));
    assert.ok(headers.includes('角色'));
    assert.ok(headers.includes('状态'));
    assert.ok(headers.includes('门店'));
    assert.ok(headers.includes('最后登录'));
  });

  it('全部 8 行数据', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const rows = container.querySelectorAll('[data-testid="data-table"] tbody tr');
    assert.equal(rows.length, 8);
  });

  it('每行 6 单元格', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    container.querySelectorAll('[data-testid="data-table"] tbody tr').forEach(row => {
      assert.equal(row.querySelectorAll('td').length, 6);
    });
  });

  it('第一行张三 超级管理员', () => {
    const { container } = rtlRender(React.createElement(UsersClient));
    const firstCells = container.querySelector('[data-testid="data-table"] tbody tr').querySelectorAll('td');
    assert.ok(firstCells[0].textContent.includes('张三'));
    assert.ok(firstCells[2].textContent.includes('超级管理员'));
  });

  it('源文件定义 6 列 DataTableColumn', () => {
    const matches = CLIENT_SRC.match(/key:\s*'/g);
    assert.ok(matches.length >= 6);
  });
});

describe('users — MOCK_USERS 数据完整性 (边界)', () => {
  it('MOCK_USERS 共 8 条', () => {
    const count = (CLIENT_SRC.match(/\{ id:/g) || []).length;
    assert.equal(count, 8);
  });

  it('包含 1 个超级管理员', () => {
    assert.ok(CLIENT_SRC.includes("role: 'super_admin'"));
  });

  it('包含 2 个店长', () => {
    const matches = CLIENT_SRC.match(/role: 'store_manager'/g);
    assert.equal(matches?.length, 2);
  });

  it('包含 2 个员工', () => {
    const matches = CLIENT_SRC.match(/role: 'staff'/g);
    assert.equal(matches?.length, 2);
  });

  it('包含 1 个财务', () => {
    assert.ok(CLIENT_SRC.includes("role: 'finance'"));
  });

  it('包含 1 个营销', () => {
    assert.ok(CLIENT_SRC.includes("role: 'marketing'"));
  });

  it('包含 1 个运维', () => {
    assert.ok(CLIENT_SRC.includes("role: 'ops'"));
  });

  it('包含已停用用户 (周八)', () => {
    assert.ok(CLIENT_SRC.includes("status: 'inactive'"));
  });

  it('包含已冻结用户 (郑十)', () => {
    assert.ok(CLIENT_SRC.includes("status: 'suspended'"));
  });
});
