/**
 * ops-manager/page.test.tsx — 运营经理工作台 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('ops-manager/page — 正例', () => {
  it('应导出一个默认组件 OpsManagerPage', () => {
    const src = readSource();
    assert.match(src, /export default function OpsManagerPage/);
  });

  it('应引用 OperationsManagerDashboard 组件', () => {
    const src = readSource();
    assert.match(src, /OperationsManagerDashboard/);
  });

  it('应引用 PageShell 作为顶层容器', () => {
    const src = readSource();
    assert.match(src, /PageShell/);
  });

  it('应包含运营经理专属标题文案', () => {
    const src = readSource();
    assert.match(src, /运营经理工作台/);
  });

  it('应包含辖区名称 "北京辖区"', () => {
    const src = readSource();
    assert.match(src, /北京辖区/);
  });

  it('应包含 mock 门店概览数据 (至少 8 个门店)', () => {
    const src = readSource();
    const matches = src.match(/id: 's\d+'/g);
    assert.ok(matches && matches.length >= 8, `期望 ≥8 个门店, 实际 ${matches?.length ?? 0}`);
  });

  it('应包含 summary 指标数据', () => {
    const src = readSource();
    assert.match(src, /MOCK_DISTRICT_SUMMARY/);
    assert.match(src, /totalStores: 12/);
    assert.match(src, /operatingStores: 10/);
    assert.match(src, /avgKpiRate: 87\.3/);
  });

  it('应包含巡检任务数据', () => {
    const src = readSource();
    assert.match(src, /MOCK_INSPECTION_TASKS/);
    assert.match(src, /id: 'it1'/);
  });

  it('应包含快速操作按钮定义', () => {
    const src = readSource();
    assert.match(src, /MOCK_QUICK_ACTIONS/);
    assert.match(src, /新建巡检任务/);
    assert.match(src, /KPI看板/);
  });

  it('应包含 lastSyncAt 传递当前时间戳', () => {
    const src = readSource();
    assert.match(src, /lastSyncAt/);
    assert.match(src, /new Date\(\)\.toISOString\(\)/);
  });
});

describe('ops-manager/page — 边界用例', () => {
  it('应包含 managerName 陈晓东 prop', () => {
    const src = readSource();
    assert.match(src, /managerName=\"陈晓东\"/);
  });

  it('应包含 districtName 北京辖区 prop', () => {
    const src = readSource();
    assert.match(src, /districtName=\"北京辖区\"/);
  });
});

describe('ops-manager/page — 防御性编程', () => {
  it('应使用 PageShell 包装且不直接暴露内部实现', () => {
    const src = readSource();
    // 应该只有 PageShell + 组件，没有裸 DOM/div 包装
    const exportLine = src.split('
').find(l => l.trim().startsWith('export default'));
    assert.ok(exportLine);
  });

  it('不应包含硬编码的 token/密钥', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|token|api[_-]?key|authorization)/i);
  });

  it('不应包含危险的 innerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });
});
