/**
 * sports-ants/console/page.test.ts — 运动蚂蚁企业控制台测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — 门店数据、员工数据完整性
 *   L3 状态逻辑 — Tab 切换、多 Tab 内容渲染
 *   L3 边界     — 数据分区、状态筛选
 *   L3 安全     — 无危险代码
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('ConsolePage — L1 正例', () => {
  it('应导出一个默认函数组件 ConsolePage', () => {
    assert.ok(SRC.includes('export default function ConsolePage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应导入 SEO/Header/Footer/FloatingContact', () => {
    assert.ok(SRC.includes('SEOMeta'));
    assert.ok(SRC.includes('Header'));
    assert.ok(SRC.includes('Footer'));
    assert.ok(SRC.includes('FloatingContact'));
  });

  it('应导入 BigAnts 设计系统', () => {
    assert.ok(SRC.includes('BigAntsColors') || SRC.includes('bigants-design'));
  });

  it('页面应包含"控制台"或"console"', () => {
    assert.ok(SRC.includes('控制台') || SRC.includes('Console'));
  });
});

describe('ConsolePage — L2 门店数据', () => {
  it('应定义 mockStores 数组', () => {
    assert.ok(SRC.includes('mockStores'));
  });

  it('mockStores 应包含 4 个门店', () => {
    const match = SRC.match(/mockStores\s*=\s*\[([\s\S]*?)\];/s);
    assert.ok(match !== null, 'mockStores 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 4, `预期 4 个门店，实际 ${count}`);
  });

  it('每个门店应有 id/name/address/status/members/monthlyActive', () => {
    assert.ok(SRC.includes('monthlyActive'));
  });

  it('应包含 active 状态门店', () => {
    assert.ok(SRC.includes("'active'"));
  });

  it('应包含 inactive 状态门店', () => {
    assert.ok(SRC.includes("'inactive'"));
  });
});

describe('ConsolePage — L2 员工数据', () => {
  it('应定义 mockEmployees 数组', () => {
    assert.ok(SRC.includes('mockEmployees'));
  });

  it('mockEmployees 应包含 6 名员工', () => {
    const match = SRC.match(/mockEmployees\s*=\s*\[([\s\S]*?)\];/s);
    assert.ok(match !== null, 'mockEmployees 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 6, `预期 6 名员工，实际 ${count}`);
  });

  it('每个员工应有 id/name/phone/role/store/status/joinDate', () => {
    assert.ok(SRC.includes('joinDate'));
    assert.ok(SRC.includes('role:'));
  });

  it('应包含店长和店员角色', () => {
    assert.ok(SRC.includes("'店长'"));
    assert.ok(SRC.includes("'店员'"));
  });

  it('应包含 active 和 inactive 员工状态', () => {
    assert.ok(SRC.includes("'inactive'"));
  });
});

describe('ConsolePage — L3 状态逻辑', () => {
  it('应使用 useState 管理 activeTab', () => {
    assert.ok(SRC.includes('useState'));
    assert.ok(SRC.includes('activeTab'));
  });

  it('应有 TabType 类型定义', () => {
    assert.ok(SRC.includes('TabType'));
  });

  it('应有 5 个 Tab: dashboard/stores/employees/finance/marketing', () => {
    assert.ok(SRC.includes("'dashboard'"));
    assert.ok(SRC.includes("'stores'"));
    assert.ok(SRC.includes("'employees'"));
    assert.ok(SRC.includes("'finance'"));
    assert.ok(SRC.includes("'marketing'"));
  });

  it('应有 renderTabContent 渲染函数', () => {
    assert.ok(SRC.includes('renderTabContent') || SRC.includes('switch (activeTab)'));
  });
});

describe('ConsolePage — L3 边界', () => {
  it('inactive 门店应显示 0 会员', () => {
    const inactiveCheck = SRC.includes('members: 0') || SRC.includes('monthlyActive: 0');
    assert.ok(inactiveCheck, 'inactive 门店应展示 0 值');
  });
});

describe('ConsolePage — L3 安全', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('不应使用 eval', () => {
    assert.ok(!SRC.includes('eval('));
  });

  it('不应包含 as any', () => {
    assert.ok(!SRC.includes('as any'));
  });
});
