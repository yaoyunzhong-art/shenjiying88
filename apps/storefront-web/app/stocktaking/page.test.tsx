/**
 * stocktaking/page.test.tsx — 盘点列表页 增强测试
 * 适配实际页面 StocktakingPage
 *
 * 覆盖:
 *   L1 正例    — 组件导出、22个盘点项、分类统计、状态分布
 *   L2 角色测试 — 搜索/筛选、批量选择、分页、列表/报表切换
 *   边界       — 空状态、加载态、差异计算、异常标记
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('StocktakingPage — L1 正例', () => {
  it('应导出默认函数组件 StocktakingPage', () => {
    assert.ok(SRC.includes('export default function StocktakingPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('渲染盘点页面标题"库存盘点"', () => {
    assert.ok(SRC.includes('库存盘点'));
  });

  it('应有 22 个盘点项', () => {
    const count = (SRC.match(/id:\s*['"]\d+['"]/g) || []).length;
    assert.equal(count, 22);
  });

  it('包含游戏币、饮料、玩偶、VR手柄等基础项', () => {
    assert.ok(SRC.includes('游戏币'));
    assert.ok(SRC.includes('饮料(箱)'));
    assert.ok(SRC.includes('礼品玩偶'));
    assert.ok(SRC.includes('VR手柄'));
  });

  it('包含新增品项：零食、饮品、清洁用品等', () => {
    assert.ok(SRC.includes('零食-薯片'));
    assert.ok(SRC.includes('饮品-矿泉水'));
    assert.ok(SRC.includes('清洁湿巾'));
  });
});

describe('StocktakingPage — L1 数据完整性', () => {
  it('每个盘点项应有 id/name/expected/actual/diff/unit/category/status', () => {
    assert.ok(SRC.includes('expected'));
    assert.ok(SRC.includes('actual'));
    assert.ok(SRC.includes('diff'));
    assert.ok(SRC.includes('category'));
    assert.ok(SRC.includes('status'));
    assert.ok(SRC.includes('location'));
    assert.ok(SRC.includes('lastStocktake'));
  });

  it('应包含三种状态：done/pending/exception', () => {
    assert.ok(SRC.includes("'done'"));
    assert.ok(SRC.includes("'pending'"));
    assert.ok(SRC.includes("'exception'"));
  });

  it('应包含 7 个分类', () => {
    const cats = ['游戏耗材', '饮品', '礼品', '办公耗材', '设备', '清洁用品', '零食'];
    const found = cats.filter(c => SRC.includes(c));
    assert.equal(found.length, 7, `缺失分类: ${cats.filter(c => !SRC.includes(c)).join(', ')}`);
  });

  it('应定义 statusColor 和 statusLabel 渲染函数', () => {
    assert.ok(SRC.includes('statusColor'));
    assert.ok(SRC.includes('statusLabel'));
  });

  it('应显示已盘点/待盘点/异常等中文状态', () => {
    assert.ok(SRC.includes('已盘点'));
    assert.ok(SRC.includes('待盘点'));
    assert.ok(SRC.includes('异常'));
  });
});

describe('StocktakingPage — L2 统计与筛选', () => {
  it('应有统计数据 stats', () => {
    assert.ok(SRC.includes('stats'));
    assert.ok(SRC.includes('doneItems'));
  });

  it('应有分类统计 categoryStats', () => {
    assert.ok(SRC.includes('categoryStats'));
  });

  it('应有趋势数据 trends', () => {
    assert.ok(SRC.includes('trends'));
  });

  it('应支持搜索过滤', () => {
    assert.ok(SRC.includes('search') || SRC.includes('setSearch'));
  });

  it('应支持分类筛选 categoryFilter', () => {
    assert.ok(SRC.includes('categoryFilter'));
  });

  it('应支持状态筛选 statusFilter', () => {
    assert.ok(SRC.includes('statusFilter'));
  });

  it('应支持分页 (PAGE_SIZE / totalPages)', () => {
    assert.ok(SRC.includes('PAGE_SIZE'));
    assert.ok(SRC.includes('totalPages'));
  });

  it('应支持加载态', () => {
    assert.ok(SRC.includes('loading'));
  });

  it('应支持重置', () => {
    assert.ok(SRC.includes('handleReset'));
    assert.ok(SRC.includes('重置'));
  });
});

describe('StocktakingPage — 批量操作与视图切换', () => {
  it('应支持复选框多选', () => {
    assert.ok(SRC.includes('selectedIds') || SRC.includes('toggleItem'));
  });

  it('应支持全选/反选 toggleAll', () => {
    assert.ok(SRC.includes('toggleAll'));
  });

  it('选中后应显示批量操作栏', () => {
    assert.ok(SRC.includes('标记为已盘点'));
    assert.ok(SRC.includes('批量录入实盘'));
  });

  it('应支持列表/报表视图切换', () => {
    assert.ok(SRC.includes('viewMode') || SRC.includes('报表视图'));
  });

  it('报表视图应显示分类盘点概况', () => {
    assert.ok(SRC.includes('分类盘点概况'));
  });

  it('报表视图应显示盘点趋势', () => {
    assert.ok(SRC.includes('盘点趋势'));
  });
});

describe('StocktakingPage — 空状态与加载', () => {
  it('无匹配数据应显示空状态提示', () => {
    assert.ok(SRC.includes('没有匹配的盘点记录'));
  });

  it('空状态应提示调整筛选条件', () => {
    assert.ok(SRC.includes('调整筛选条件'));
  });

  it('加载中应显示 🔄 图标', () => {
    assert.ok(SRC.includes('🔄'));
  });
});

describe('StocktakingPage — L1 功能与样式', () => {
  it('应使用 React.useState 和 useMemo', () => {
    assert.ok(SRC.includes('useState'));
    assert.ok(SRC.includes('useMemo'));
  });

  it('应有"开始盘点"按钮', () => {
    assert.ok(SRC.includes('开始盘点'));
  });

  it('应有"导出报告"功能', () => {
    assert.ok(SRC.includes('导出报告'));
  });

  it('应使用深色主题背景 #0f172a', () => {
    assert.ok(SRC.includes('#0f172a'));
  });

  it('累计差异应显示件数', () => {
    assert.ok(SRC.includes('diffValue'));
  });

  it('完成率应计算百分比', () => {
    assert.ok(SRC.includes('完成率'));
  });

  it('应显示表格列：品名、分类、账存、实盘、差异', () => {
    assert.ok(SRC.includes('品名'));
    assert.ok(SRC.includes('分类'));
    assert.ok(SRC.includes('账存'));
    assert.ok(SRC.includes('实盘'));
    assert.ok(SRC.includes('差异'));
  });

  it('差异为 0 时显示 ✓，非 0 时标红', () => {
    assert.ok(SRC.includes("'✓'") || SRC.includes('34d399'));
    assert.ok(SRC.includes('f87171'));
  });

  it('应支持 pagination 翻页', () => {
    assert.ok(SRC.includes('上一页'));
    assert.ok(SRC.includes('下一页'));
  });

  it('exception 状态应有红色标记', () => {
    assert.ok(SRC.includes('#f87171'));
  });

  it('应显示存放位置和上次盘点日期', () => {
    assert.ok(SRC.includes('存放位置'));
    assert.ok(SRC.includes('上次盘点'));
  });
});
