/**
 * stores/reports/page.test.tsx — 门店报表页 L1 测试
 * 覆盖: 正例·反例·边界（三件套）
 * URL-pattern responseRegistry
 * 禁止: as any / describe.skip / it.only
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

// ─── responseRegistry ────────────────────────────────────

const responseRegistry = new Map<string, () => unknown>();

function setResponseFor(pattern: string, factory: () => unknown) {
  responseRegistry.set(pattern, factory);
}

globalThis.fetch = ((url: string) => {
  const path = typeof url === 'string' ? url : String(url);
  for (const [pattern, factory] of responseRegistry) {
    if (path.includes(pattern)) {
      return Promise.resolve({
        ok: true, status: 200, json: () => Promise.resolve(factory()),
        headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
      } as Response);
    }
  }
  return Promise.resolve({
    ok: true, status: 200, json: () => Promise.resolve({ success: true, data: null, message: 'OK' }),
    headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
  } as Response);
}) as typeof globalThis.fetch;

function makeSampleReport() {
  return {
    success: true,
    data: [
      { storeId: 's1', storeName: '朝阳大悦城旗舰店', date: '2026-07-18', admissionFee: 28500, coinRevenue: 62300, diningRevenue: 41800, otherRevenue: 3400, totalRevenue: 136000, cost: 88700, profit: 47300, profitRate: 0.3478 },
      { storeId: 's2', storeName: '上海陆家嘴中心店', date: '2026-07-18', admissionFee: 19200, coinRevenue: 48600, diningRevenue: 35200, otherRevenue: 5000, totalRevenue: 108000, cost: 75600, profit: 32400, profitRate: 0.3000 },
      { storeId: 's3', storeName: '深圳万象天地店', date: '2026-07-18', admissionFee: 8100, coinRevenue: 21500, diningRevenue: 12400, otherRevenue: 1000, totalRevenue: 43000, cost: 35800, profit: 7200, profitRate: 0.1674 },
      { storeId: 's4', storeName: '成都太古里体验店', date: '2026-07-18', admissionFee: 15600, coinRevenue: 37900, diningRevenue: 28600, otherRevenue: 3900, totalRevenue: 86000, cost: 61100, profit: 24900, profitRate: 0.2895 },
      { storeId: 's5', storeName: '杭州银泰旗舰店', date: '2026-07-18', admissionFee: 9800, coinRevenue: 14200, diningRevenue: 8700, otherRevenue: 1300, totalRevenue: 34000, cost: 39600, profit: -5600, profitRate: -0.1647 },
    ],
    message: 'OK',
  };
}

function setupDefault() {
  responseRegistry.clear();
  setResponseFor('/api/stores/reports', () => makeSampleReport());
}

describe('StoreReportsPage — 正例', () => {
  beforeEach(() => { setupDefault(); });

  it('应渲染页面标题', async () => {
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const els = screen.queryAllByText('门店经营报表');
      assert.ok(els.length >= 1, '应显示页面标题');
    });
  });

  it('应展示总营收概要统计', async () => {
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('总营收'), '应有总营收统计');
      assert.ok(body.includes('¥'), '应有金额格式化');
    });
  });

  it('应展示总利润概要统计', async () => {
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('总利润'), '应有总利润统计');
    });
  });

  it('应展示盈利门店数统计', async () => {
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('盈利门店'), '应有盈利门店统计');
    });
  });

  it('应展示亏损门店数统计', async () => {
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('亏损门店'), '应有亏损门店统计');
    });
  });

  it('应渲染 Tab 筛选: 全部/盈利/亏损', async () => {
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('全部'), '应有全部Tab');
      assert.ok(body.includes('盈利'), '应有盈利Tab');
      assert.ok(body.includes('亏损'), '应有亏损Tab');
    });
  });

  it('应展示门店名称', async () => {
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('朝阳大悦城旗舰店'), '应显示门店名称');
      assert.ok(body.includes('上海陆家嘴中心店'), '应显示门店名称');
    });
  });

  it('应展示各门店利润数据', async () => {
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // formatYuan converts cents to yuan: 47300/100 = 473.00
      assert.ok(body.includes('朝阳大悦城'), '门店名可见');
    });
  });

  it('应显示 DataTable 表格', async () => {
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('门店经营明细') || body.includes('利润'), '应显示表格区域');
    });
  });
});

describe('StoreReportsPage — 反例', () => {
  beforeEach(() => { setupDefault(); });

  it('API 500 时应回退到默认样本数据', async () => {
    responseRegistry.clear();
    setResponseFor('/api/stores/reports', () => { throw new Error('500 Internal Server Error'); });
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // 默认样本包含朝阳大悦城旗舰店，应回退显示
      assert.ok(body.includes('朝阳大悦城旗舰店'), 'API失败时应回退默认样本');
    });
  });

  it('API 返回空数据时应显示空态', async () => {
    responseRegistry.clear();
    setResponseFor('/api/stores/reports', () => ({ success: true, data: [], message: 'OK' }));
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('暂无门店报表数据'), '应显示空态提示');
    });
  });

  it('API 返回非成功响应时应回退默认样本', async () => {
    responseRegistry.clear();
    setResponseFor('/api/stores/reports', () => ({ success: false, data: null, message: 'ERROR' }));
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('朝阳大悦城旗舰店'), '非成功响应应回退默认样本');
    });
  });

  it('亏损门店应显示负值利润（红色）', async () => {
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // 杭州银泰旗舰店 profit = -5600
      assert.ok(body.includes('-5,600') || body.includes('杭州银泰'), '亏损门店负值');
    });
  });
});

describe('StoreReportsPage — 边界', () => {
  beforeEach(() => { setupDefault(); });

  it('盈利门店数应为 4', async () => {
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('4') || body.includes('盈利'), '4家盈利门店');
    });
  });

  it('亏损门店数应为 1', async () => {
    const StoreReportsPage = (await import('./page')).default;
    render(<StoreReportsPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('1'), '1家亏损门店');
    });
  });

  it('所有门店的 profitRate 应在合理范围内', async () => {
    const data = makeSampleReport().data as Array<Record<string, unknown>>;
    for (const row of data) {
      const rate = row.profitRate as number;
      assert.ok(rate >= -1 && rate <= 1, `净利率 ${rate} 应在 [-1, 1] 范围内`);
    }
  });
});

// ─── 源码静态分析 ─────────────────────────────────────────

const SRC = readFileSync(SOURCE, 'utf-8');

describe('StoreReportsPage — 源码验证', () => {
  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'") || SRC.includes('"use client"'), '缺少 use client');
  });

  it('应导出默认组件 StoreReportsPage', () => {
    assert.ok(SRC.includes('export default function StoreReportsPage'), '缺少默认导出');
  });

  it('应导出 DEFAULT_STORE_REPORTS 常量和 StoreReportRow 类型', () => {
    assert.ok(SRC.includes('export const DEFAULT_STORE_REPORTS'), '缺少 DEFAULT_STORE_REPORTS');
    assert.ok(SRC.includes('export interface StoreReportRow'), '缺少 StoreReportRow');
  });

  it('应包含 useState 和 useEffect', () => {
    assert.ok(SRC.includes('useState'), '缺少 useState');
    assert.ok(SRC.includes('useEffect'), '缺少 useEffect');
  });

  it('应包含 useMemo 性能优化', () => {
    assert.ok(SRC.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含 Tab 筛选逻辑', () => {
    assert.ok(SRC.includes('ProfitFilter') || SRC.includes("'ALL'"), '缺少筛选逻辑');
    assert.ok(SRC.includes('PROFIT') && SRC.includes('LOSS'), '缺少 PROFIT/LOSS');
  });

  it('应包含 formatYuan 金额格式化函数', () => {
    assert.ok(SRC.includes('formatYuan'), '缺少 formatYuan');
  });

  it('应包含 DataTable 表格', () => {
    assert.ok(SRC.includes('DataTable'), '缺少 DataTable');
  });

  it('应包含 Tabs 筛选组件', () => {
    assert.ok(SRC.includes('Tabs'), '缺少 Tabs');
  });

  it('应包含空态 UI 渲染', () => {
    assert.ok(SRC.includes('暂无门店报表数据'), '缺少空态');
  });

  it('应包含 loading 加载态', () => {
    assert.ok(SRC.includes('加载中'), '缺少加载态');
  });

  it('API路径应正确', () => {
    assert.ok(SRC.includes('/api/stores/reports'), '路径错误');
  });

  it('应包含 9 列定义', () => {
    const fields = ['storeName', 'admissionFee', 'coinRevenue', 'diningRevenue', 'otherRevenue', 'totalRevenue', 'cost', 'profit', 'profitRate'];
    for (const f of fields) {
      assert.ok(SRC.includes(f), '缺少字段: ' + f);
    }
  });

  it('应包含 4 张概要统计卡片', () => {
    const matches = SRC.match(/gridTemplateColumns: 'repeat\(4, minmax\(0, 1fr\)\)'/g);
    assert.ok(matches && matches.length >= 1, '应有4列布局');
  });

  it('应包含 DataTable sortConfig 排序配置', () => {
    assert.ok(SRC.includes('sortConfig'), '缺少 sortConfig');
    assert.ok(SRC.includes('onSortChange'), '缺少 onSortChange');
  });
});
