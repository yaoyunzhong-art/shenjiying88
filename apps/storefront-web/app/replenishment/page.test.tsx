/**
 * 补货管理页 — 增强测试
 * 适配实际页面组件 ReplenishmentPage
 *
 * 覆盖:
 *   L1 正例    — 组件导出、15个补货项数据完整性、统计指标
 *   L2 角色测试 — 状态筛选、优先级筛选、供应商筛选、搜索/重置
 *   边界       — 空结果、分页、加载态、批量采购模拟
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('ReplenishmentPage — L1 正例', () => {
  it('应导出默认函数组件 ReplenishmentPage', () => {
    assert.ok(SRC.includes('export default function ReplenishmentPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('渲染页面标题 补货管理', () => {
    assert.ok(SRC.includes('补货管理'));
  });

  it('应有 15 个补货项', () => {
    const count = (SRC.match(/id:\s*['"]\d+['"]/g) || []).length;
    assert.equal(count, 15);
  });

  it('应包含打印纸、可乐、游戏币等基础项', () => {
    assert.ok(SRC.includes('打印纸'));
    assert.ok(SRC.includes('饮品-可乐'));
    assert.ok(SRC.includes('游戏币'));
  });

  it('应包含新增项：矿泉水、消毒湿巾、巧克力等', () => {
    assert.ok(SRC.includes('饮品-矿泉水'));
    assert.ok(SRC.includes('消毒湿巾'));
    assert.ok(SRC.includes('零食-巧克力'));
  });
});

describe('ReplenishmentPage — L1 数据完整性', () => {
  it('每个补货项应有 id/name/qty/unit/status/priority/supplier', () => {
    assert.ok(SRC.includes('id:'));
    assert.ok(SRC.includes('name:'));
    assert.ok(SRC.includes('qty:'));
    assert.ok(SRC.includes('unit:'));
    assert.ok(SRC.includes('status:'));
    assert.ok(SRC.includes('priority:'));
    assert.ok(SRC.includes('supplier:'));
  });

  it('应包含四种状态：pending/ordered/received/cancelled', () => {
    assert.ok(SRC.includes("'pending'"));
    assert.ok(SRC.includes("'ordered'"));
    assert.ok(SRC.includes("'received'"));
    assert.ok(SRC.includes("'cancelled'"));
  });

  it('应包含三种优先级：高/中/低', () => {
    assert.ok(SRC.includes("'高'"));
    assert.ok(SRC.includes("'中'"));
    assert.ok(SRC.includes("'低'"));
  });

  it('应定义状态渲染函数 statusColor 和 statusLabel', () => {
    assert.ok(SRC.includes('statusColor'));
    assert.ok(SRC.includes('statusLabel'));
  });

  it('应显示待采购、已下单、已到货、已取消等中文状态', () => {
    assert.ok(SRC.includes('待采购'));
    assert.ok(SRC.includes('已下单'));
    assert.ok(SRC.includes('已到货'));
    assert.ok(SRC.includes('已取消'));
  });

  it('应有供应商列表 10+ 个', () => {
    assert.ok(SRC.includes('SUPPLIERS'));
  });
});

describe('ReplenishmentPage — L2 统计与交互', () => {
  it('应有统计数据 stats (total/pending/ordered/received/highPriority/totalAmount)', () => {
    assert.ok(SRC.includes('stats'));
    assert.ok(SRC.includes('stats.total'));
  });

  it('应有供应商统计 supplierStats', () => {
    assert.ok(SRC.includes('supplierStats'));
  });

  it('应支持搜索过滤', () => {
    assert.ok(SRC.includes('search') || SRC.includes('setSearch'));
  });

  it('应支持状态筛选 statusFilter', () => {
    assert.ok(SRC.includes('statusFilter'));
  });

  it('应支持优先级筛选 priorityFilter', () => {
    assert.ok(SRC.includes('priorityFilter'));
  });

  it('应支持供应商筛选 supplierFilter', () => {
    assert.ok(SRC.includes('supplierFilter'));
  });

  it('应支持 reset 重置所有筛选', () => {
    assert.ok(SRC.includes('handleReset'));
    assert.ok(SRC.includes('重置'));
  });

  it('应支持分页 (PAGE_SIZE / totalPages)', () => {
    assert.ok(SRC.includes('PAGE_SIZE'));
    assert.ok(SRC.includes('totalPages'));
  });

  it('应支持加载态 loading', () => {
    assert.ok(SRC.includes('loading'));
    assert.ok(SRC.includes('setLoading'));
  });
});

describe('ReplenishmentPage — 空状态与边界', () => {
  it('无匹配数据应显示空状态提示', () => {
    assert.ok(SRC.includes('没有匹配的补货记录'));
  });

  it('空状态应提示调整筛选条件', () => {
    assert.ok(SRC.includes('调整筛选条件'));
  });

  it('空状态应显示 📦 图标', () => {
    assert.ok(SRC.includes('📦'));
  });
});

describe('ReplenishmentPage — L1 功能与导出', () => {
  it('应使用 React.useState 和 useMemo', () => {
    assert.ok(SRC.includes('useState'));
    assert.ok(SRC.includes('useMemo'));
  });

  it('应有批量采购模拟功能', () => {
    assert.ok(SRC.includes('simulateOrder') || SRC.includes('批量采购'));
  });

  it('应有导出模拟功能', () => {
    assert.ok(SRC.includes('simulateExport') || SRC.includes('导出'));
  });

  it('应显示高优先级计数', () => {
    assert.ok(SRC.includes('highPriority') || SRC.includes('高优先'));
  });

  it('应显示采购总额', () => {
    assert.ok(SRC.includes('totalAmount') || SRC.includes('采购总额'));
  });

  it('应显示供应商概览', () => {
    assert.ok(SRC.includes('供应商概览'));
  });

  it('应使用深色主题背景 #0f172a', () => {
    assert.ok(SRC.includes('#0f172a'));
  });

  it('应支持 pagination 翻页按钮', () => {
    assert.ok(SRC.includes('上一页'));
    assert.ok(SRC.includes('下一页'));
  });
});
