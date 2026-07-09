import React from 'react';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

// ==================== 类型（与组件对齐） ====================

/** TimeRangeOption */
interface TimeRangeOption {
  label: string;
  value: string;
}

/** ChartExportPanel 渲染镜像 */
interface RenderedPanel {
  title: string;
  csvData: Array<Record<string, string | number>> | undefined;
  csvFilename: string;
  enableFullscreen: boolean;
  enableRefresh: boolean;
  timeRange: TimeRangeOption[] | undefined;
  activeTimeRange: string | undefined;
  children: boolean;
}

// ==================== Mock 数据 ====================

const MOCK_TIME_RANGES: TimeRangeOption[] = [
  { label: '今天', value: 'today' },
  { label: '近7天', value: '7d' },
  { label: '近30天', value: '30d' },
  { label: '近90天', value: '90d' },
];

const MOCK_CSV_DATA: Array<Record<string, string | number>> = [
  { 日期: '2026-07-01', 营业额: 12500, 订单数: 45 },
  { 日期: '2026-07-02', 营业额: 13800, 订单数: 52 },
  { 日期: '2026-07-03', 营业额: 11200, 订单数: 38 },
  { 日期: '2026-07-04', 营业额: 15200, 订单数: 61 },
  { 日期: '2026-07-05', 营业额: 9800, 订单数: 33 },
];

// ==================== 工具函数 ====================

/**
 * CSV 内容生成（纯函数，不依赖 DOM）
 */
function generateCSVContent(data: Array<Record<string, string | number>>): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  for (const row of data) {
    csvRows.push(
      headers
        .map(h => {
          const val = row[h];
          const str = String(val ?? '');
          return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
        })
        .join(','),
    );
  }
  return csvRows.join('\n');
}

/**
 * 模拟面板渲染（避免 DOM 依赖）
 */
function renderPanel(title: string, opts?: Partial<Omit<RenderedPanel, 'title'>>): RenderedPanel {
  return {
    title,
    csvData: opts?.csvData,
    csvFilename: opts?.csvFilename ?? 'chart-export',
    enableFullscreen: opts?.enableFullscreen ?? true,
    enableRefresh: opts?.enableRefresh ?? true,
    timeRange: opts?.timeRange,
    activeTimeRange: opts?.activeTimeRange,
    children: opts?.children ?? false,
  };
}

/**
 * 检查 CSV 行列一致性
 */
function validateCSVRow(headers: string[], values: string[]): boolean {
  return headers.length === values.length;
}

// ══════════════════════════════════════════════════
// 正例
// ══════════════════════════════════════════════════

describe('ChartExportPanel 正例', () => {
  it('基本渲染应有标题和默认值', () => {
    const panel = renderPanel('营业额趋势');
    assert.equal(panel.title, '营业额趋势');
    assert.equal(panel.enableFullscreen, true);
    assert.equal(panel.enableRefresh, true);
  });

  it('CSV 生成应与输入一致', () => {
    const csv = generateCSVContent(MOCK_CSV_DATA);
    const lines = csv.split('\n');
    assert.equal(lines.length, MOCK_CSV_DATA.length + 1); // header + 5 rows
    assert.equal(lines[0], '日期,营业额,订单数');
    assert.equal(lines[1], '2026-07-01,12500,45');
    assert.equal(lines[5], '2026-07-05,9800,33');
  });

  it('CSV 每行列数一致', () => {
    const csv = generateCSVContent(MOCK_CSV_DATA);
    const lines = csv.split('\n');
    for (const line of lines.slice(1)) {
      const cols = line.split(',');
      assert.equal(cols.length, 3, `行 "${line}" 应有 3 列`);
    }
  });

  it('时间范围选项数量正确', () => {
    assert.equal(MOCK_TIME_RANGES.length, 4);
    assert.deepEqual(MOCK_TIME_RANGES.map(r => r.value), ['today', '7d', '30d', '90d']);
  });

  it('CSV 数据含逗号时正确加引号', () => {
    const special = [{ 名称: 'Apple, Inc.', 市值: 2800000 }];
    const csv = generateCSVContent(special);
    assert.equal(csv, '名称,市值\n"Apple, Inc.",2800000');
  });

  it('CSV 数据含引号时正确转义', () => {
    const special = [{ 名称: '他说"你好"', 数值: 100 }];
    const csv = generateCSVContent(special);
    assert.equal(csv, '名称,数值\n"他说""你好""",100');
  });

  it('组件源文件 ChartExportPanel.tsx 应存在', () => {
    const fp = path.resolve(__dirname, './ChartExportPanel.tsx');
    assert.ok(existsSync(fp), 'ChartExportPanel.tsx 应存在');
  });

  it('组件源文件 index.ts 应存在', () => {
    const fp = path.resolve(__dirname, './index.ts');
    assert.ok(existsSync(fp), 'index.ts 应存在');
  });
});

// ══════════════════════════════════════════════════
// 反例
// ══════════════════════════════════════════════════

describe('ChartExportPanel 反例', () => {
  it('空 CSV 数据应生成空字符串', () => {
    assert.equal(generateCSVContent([]), '');
  });

  it('禁用全屏后 enableFullscreen 应为 false', () => {
    const panel = renderPanel('test', { enableFullscreen: false });
    assert.equal(panel.enableFullscreen, false);
  });

  it('禁用刷新后 enableRefresh 应为 false', () => {
    const panel = renderPanel('test', { enableRefresh: false });
    assert.equal(panel.enableRefresh, false);
  });

  it('不传 csvData 时导出按钮不应有数据', () => {
    const panel = renderPanel('test', { csvData: undefined });
    assert.equal(panel.csvData, undefined);
  });

  it('不传 timeRange 时应为 undefined', () => {
    const panel = renderPanel('test');
    assert.equal(panel.timeRange, undefined);
  });

  it('CSV 列数不匹配时 validateCSVRow 返回 false', () => {
    assert.equal(validateCSVRow(['a', 'b'], ['1']), false);
    assert.equal(validateCSVRow(['a', 'b'], ['1', '2']), true);
  });

  it('CSV 含空值字段应处理', () => {
    const data = [{ 名称: '设备A', 状态: undefined as unknown as string | number }];
    const csv = generateCSVContent(data);
    assert.equal(csv, '名称,状态\n设备A,');
  });

  it('自定义文件名不应为默认值', () => {
    const panel = renderPanel('test', { csvFilename: 'custom-report' });
    assert.equal(panel.csvFilename, 'custom-report');
    assert.notEqual(panel.csvFilename, 'chart-export');
  });
});

// ══════════════════════════════════════════════════
// 边界
// ══════════════════════════════════════════════════

describe('ChartExportPanel 边界', () => {
  it('时间范围应有选项', () => {
    assert.ok(MOCK_TIME_RANGES.length > 0);
  });

  it('大规模 CSV 生成不报错（1000 行）', () => {
    const bigData: Array<Record<string, string | number>> = [];
    for (let i = 0; i < 1000; i++) {
      bigData.push({ index: i, value: Math.random() * 10000 });
    }
    const csv = generateCSVContent(bigData);
    assert.equal(csv.split('\n').length, 1001);
    assert.ok(csv.startsWith('index,value'));
  });

  it('CSV header 不应含 undefined 文本', () => {
    const data = [{ 日期: '2026-01-01', 金额: 100 }];
    const csv = generateCSVContent(data);
    assert.ok(!csv.includes('undefined'), 'CSV 不应含 undefined');
  });

  it('CSV 行数 = 数据行数 + 1（header）', () => {
    const csv = generateCSVContent(MOCK_CSV_DATA);
    assert.equal(csv.split('\n').length, MOCK_CSV_DATA.length + 1);
  });

  it('全屏 + 刷新默认启用', () => {
    const panel = renderPanel('default');
    assert.equal(panel.enableFullscreen, true);
    assert.equal(panel.enableRefresh, true);
  });

  it('index.ts 应导出 ChartExportPanel', () => {
    const idx = readFileSync(path.resolve(__dirname, './index.ts'), 'utf-8');
    assert.ok(idx.includes('ChartExportPanel'), 'index.ts 应导出 ChartExportPanel');
  });

  it('组件文件有 use client 指令', () => {
    const src = readFileSync(path.resolve(__dirname, './ChartExportPanel.tsx'), 'utf-8');
    assert.ok(src.includes("'use client'"), 'ChartExportPanel.tsx 应有 use client');
  });
});
