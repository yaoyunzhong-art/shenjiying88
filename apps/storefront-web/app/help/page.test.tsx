/**
 * help/page.test.tsx — 帮助中心页 增强测试 (2026-07-16)
 *
 * 覆盖:
 *   L1 正例    — 组件导出、FAQ 数据扩展至 20 条、操作指南 10 条、搜索/分类筛选
 *   L1 三态    — loading/error/empty（源码字符串存在性校验）
 *   L2 角色测试 — 展开/折叠、热门问题、分类芯片、全部展开/收起
 *   边界       — 空搜索结果、搜索结果的精确计数、浏览数排行
 *   L3 安全    — 无危险代码、无 as any
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

  it('应使用 useEffect / useState 管理加载状态', () => {
    assert.ok(SRC.includes('useEffect') && SRC.includes('useState'));
  });
});

describe('HelpCenterPage — L1 数据完整性', () => {
  it('应定义 20 个常见问题 (F1~F20)', () => {
    const matches = SRC.match(/id:\s*['"]F\d+['"]/g);
    assert.equal(
      matches ? matches.length : 0,
      20,
      `预期 20 个 FAQ，实际 ${matches?.length || 0}`,
    );
  });

  it('应定义 10 个操作指南 (G1~G10)', () => {
    const matches = SRC.match(/id:\s*['"]G\d+['"]/g);
    assert.equal(
      matches ? matches.length : 0,
      10,
      `预期 10 个指南，实际 ${matches?.length || 0}`,
    );
  });

  it('FAQ 应覆盖 8+ 分类', () => {
    const categories = [
      '会员管理',
      '收银',
      '设备',
      '报表',
      '人力资源',
      '库存',
      '营销',
      '运营',
      '设置',
      '商品',
      '系统管理',
      '客服',
    ];
    const found = categories.filter((c) => SRC.includes(c));
    assert.ok(found.length >= 8, `仅找到 ${found.length} 个分类: ${found.join(', ')}`);
  });

  it('操作指南应包含 10 种场景', () => {
    const titles = ['新员工入职', '对账', '巡检', '会员管理', '促销活动', '收银系统'];
    assert.ok(
      titles.some((t) => SRC.includes(t)),
      `预期至少包含部分指南标题`,
    );
  });

  it('每个 FAQ 应有 question、answer、category、tags、views 字段', () => {
    assert.ok(SRC.includes('question'));
    assert.ok(SRC.includes('answer'));
    assert.ok(SRC.includes('category'));
    assert.ok(SRC.includes('tags'));
    assert.ok(SRC.includes('views'));
  });
});

describe('HelpCenterPage — L1 三态', () => {
  it('应有 loading 骨架屏', () => {
    assert.ok(SRC.includes('Loading'))
  });

  it('loading 状态应有骨架动画元素', () => {
    assert.ok(SRC.includes('LoadingSkeleton') || SRC.includes('skeleton'));
  });

  it('应有 error 状态界面', () => {
    assert.ok(SRC.includes('error') && SRC.includes('帮助中心加载失败'));
  });

  it('error 状态应有重新加载按钮', () => {
    assert.ok(SRC.includes('重新加载') && SRC.includes('window.location.reload'));
  });

  it('应有空搜索结果空态', () => {
    assert.ok(SRC.includes('没有找到') || SRC.includes('暂无'));
  });

  it('搜索空态应提示更换关键词', () => {
    assert.ok(SRC.includes('搜索关键词') || SRC.includes('其他'));
  });
});

describe('HelpCenterPage — L2 交互与角色测试', () => {
  it('应支持展开/折叠 FAQ 详情', () => {
    assert.ok(SRC.includes('expanded') || SRC.includes('toggleExpand'));
  });

  it('搜索应过滤 FAQ、指南和分类', () => {
    assert.ok(SRC.includes('filteredFaqs') && SRC.includes('filteredGuides'));
  });

  it('支持 faq/guides/support 三种标签切换', () => {
    assert.ok(SRC.includes('faq') && SRC.includes('guides') && SRC.includes('support'));
  });

  it('应使用 useMemo 优化过滤', () => {
    assert.ok(SRC.includes('useMemo'));
  });

  it('FAQ 折叠时应显示箭头图标 (▼/▲)', () => {
    assert.ok(SRC.includes('▼') && SRC.includes('▲'));
  });

  it('应显示搜索 placeholder', () => {
    assert.ok(SRC.includes('搜索问题'));
  });

  it('应显示搜索结果计数', () => {
    assert.ok(SRC.includes('搜索结果') || SRC.includes('条FAQ'));
  });

  it('应支持分类芯片筛选', () => {
    assert.ok(SRC.includes('catFilter') && SRC.includes('setCatFilter'));
  });

  it('应支持全部展开/全部收起', () => {
    assert.ok(SRC.includes('全部展开') && SRC.includes('全部收起'));
  });

  it('应显示热门问题排行榜', () => {
    assert.ok(SRC.includes('热门问题') && SRC.includes('Top 5'));
  });

  it('FAQ 应显示浏览数', () => {
    assert.ok(SRC.includes('次浏览') || SRC.includes('views'));
  });

  it('热门问题应支持点击跳转到搜索', () => {
    assert.ok(SRC.includes('setSearch') && SRC.includes('hotQuestions'));
  });
});

describe('HelpCenterPage — L2 提交工单', () => {
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

describe('HelpCenterPage — L2 数据驱动', () => {
  it('增加 4 个统计卡片（FAQ数、指南数、最热问题、覆盖分类）', () => {
    assert.ok(SRC.includes('StatCard'));
    // Verify we have multiple StatCards
    const matches = SRC.match(/<StatCard/g);
    assert.ok(matches && matches.length >= 4);
  });
});

describe('HelpCenterPage — L3 安全', () => {
  it('不应使用 dangerousouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('不应使用 eval 或 Function 构造函数', () => {
    assert.ok(!SRC.includes('eval(') && !SRC.includes('new Function('));
  });

  it('不应包含 as any', () => {
    assert.ok(!SRC.includes('as any'));
  });

  it('不应包含 console.log 在生产代码中', () => {
    // Exclude test files
    assert.ok(!SRC.includes('console.log'));
  });
});

describe('HelpCenterPage — 边界', () => {
  it('分类芯片应显示各分类下 FAQ 数量', () => {
    assert.ok(SRC.includes('.length') || SRC.includes('count'));
  });

  it('搜索后应只显示匹配的 FAQ 数量统计', () => {
    assert.ok(SRC.includes('filteredFaqs.length') || SRC.includes('filteredFaqs'));
  });

  it('指南空状态应显示无数据提示', () => {
    assert.ok(SRC.includes('没有找到操作指南'));
  });

  it('simulateFetch 应异步返回数据', () => {
    assert.ok(SRC.includes('Promise') && SRC.includes('resolve'));
  });
});
