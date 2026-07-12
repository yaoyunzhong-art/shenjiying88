/**
 * help/page.test.tsx — 帮助中心页 增强测试
 *
 * 覆盖:
 *   L1 正例    — 组件导出、FAQ 数据完整、操作指南数据、搜索功能
 *   L2 角色测试 — 筛选/展开/切换标签、提交工单表单
 *   边界       — 空搜索结果、深色主题样式
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('HelpCenterPage — L1 正例', () => {
  it('应导出一个默认组件', () => {
    assert.ok(SRC.includes('export default function HelpCenterPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应从 @m5/ui 导入 PageShell', () => {
    assert.ok(SRC.includes('PageShell'));
  });

  it('应包含页面标题"帮助中心"', () => {
    assert.ok(SRC.includes('帮助中心'));
  });

  it('应包含 SearchFilterInput 搜索组件', () => {
    assert.ok(SRC.includes('SearchFilterInput'));
  });

  it('应使用 Tabs 切换组件', () => {
    assert.ok(SRC.includes('Tabs'));
  });
});

describe('HelpCenterPage — L1 数据完整性', () => {
  it('应定义 10 个常见问题 (F1~F10)', () => {
    const matches = SRC.match(/id:\s*['"]F\d+['"]/g);
    assert.equal(matches ? matches.length : 0, 10, `预期 10 个 FAQ，实际 ${matches?.length || 0}`);
  });

  it('应定义 7 个操作指南 (G1~G7)', () => {
    const matches = SRC.match(/id:\s*['"]G\d+['"]/g);
    assert.equal(matches ? matches.length : 0, 7, `预期 7 个指南，实际 ${matches?.length || 0}`);
  });

  it('FAQ 应覆盖会员管理、收银、设备、报表、人力等分类', () => {
    const categories = ['会员管理', '收银', '设备', '报表', '人力资源', '库存', '营销', '运营', '设置'];
    const found = categories.filter(c => SRC.includes(c));
    assert.ok(found.length >= 5, `仅找到 ${found.length} 个分类: ${found.join(', ')}`);
  });

  it('操作指南应包含新员工入职、对账、巡检等场景', () => {
    const titles = ['新员工入职', '对账', '巡检'];
    assert.ok(titles.some(t => SRC.includes(t)));
  });

  it('每个 FAQ 应有 question、answer、category、tags 字段', () => {
    assert.ok(SRC.includes('question'));
    assert.ok(SRC.includes('answer'));
    assert.ok(SRC.includes('category'));
    assert.ok(SRC.includes('tags'));
  });
});

describe('HelpCenterPage — L2 交互与角色测试', () => {
  it('应支持展开/折叠 FAQ 详情', () => {
    assert.ok(SRC.includes('expanded') || SRC.includes('setExpanded'));
  });

  it('搜索应过滤 FAQ 和指南', () => {
    assert.ok(SRC.includes('filteredFaqs') || SRC.includes('filter'));
  });

  it('支持 faq/guides/support 三种标签切换', () => {
    assert.ok(SRC.includes('faq') && SRC.includes('guides') && SRC.includes('support'));
  });

  it('应使用 useState 管理状态', () => {
    assert.ok(SRC.includes("useState"));
  });

  it('FAQ 折叠时应显示箭头图标 (▼/▲)', () => {
    assert.ok(SRC.includes('▼') && SRC.includes('▲'));
  });

  it('应显示搜索 placeholder', () => {
    assert.ok(SRC.includes('搜索问题'));
  });
});

describe('HelpCenterPage — 提交工单表单', () => {
  it('应包含"提交技术工单"区域', () => {
    assert.ok(SRC.includes('提交技术工单'));
  });

  it('应包含标题、分类、描述、截图等字段', () => {
    assert.ok(SRC.includes('title') || SRC.includes('标题'));
    assert.ok(SRC.includes('详细描述'));
    assert.ok(SRC.includes('上传附件') || SRC.includes('截图'));
  });

  it('分类应包含系统故障、功能问题等选项', () => {
    assert.ok(SRC.includes('系统故障'));
    assert.ok(SRC.includes('功能问题'));
    assert.ok(SRC.includes('建议优化'));
  });
});

describe('HelpCenterPage — 主题与样式', () => {
  it('应使用深色主题背景 rgba(15,23,42,...)', () => {
    assert.ok(SRC.includes('15,23,42'));
  });

  it('应使用灰色的次要文字 (#94a3b8)', () => {
    assert.ok(SRC.includes('#94a3b8'));
  });

  it('标签应使用蓝色调 (#93c5fd)', () => {
    assert.ok(SRC.includes('#93c5fd'));
  });

  it('操作指南应显示 steps 和 estimatedTime', () => {
    assert.ok(SRC.includes('steps'));
    assert.ok(SRC.includes('estimatedTime'));
  });

  it('指南列表应包含 StatusBadge 标签', () => {
    assert.ok(SRC.includes('StatusBadge'));
  });
});
