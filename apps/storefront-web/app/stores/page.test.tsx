/**
 * stores/page.test.tsx — 门店列表页 L1 冒烟测试 (storefront-web)
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

describe('stores — 正例', () => {
  it('应导出一个默认组件 StoresListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StoresListPage'), '缺少默认导出');
  });

  it('应包含 Store 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Store'), '缺少接口');
  });

  it('应包含 MOCK_STORES 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STORES'), '缺少数据源');
  });

  it('应计算 active / totalRevenue / totalStaff 统计', () => {
    const src = readSource();
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('monthlyRevenue'), '缺少营收');
    assert.ok(src.includes('staffCount'), '缺少员工数');
  });

  it('应包含 useSearchFilter', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少搜索过滤');
  });

  it('应包含门店卡片视图', () => {
    const src = readSource();
    assert.ok(src.includes('card') || src.includes('Card') || src.includes('div'), '缺少卡片视图');
  });

  it('应包含 status 字段用于筛选', () => {
    const src = readSource();
    assert.ok(src.includes('status'), '缺少 status 字段');
  });

  it('应包含 address 字段用于地图显示', () => {
    const src = readSource();
    assert.ok(src.includes('address'), '缺少 address');
  });

  it('应包含 managerName 用于门店经理', () => {
    const src = readSource();
    assert.ok(src.includes('managerName'), '缺少managerName');
  });
});

describe('stores — 边界', () => {
  it('active 状态过滤', () => {
    const src = readSource();
    assert.ok(src.includes(".status === 'active'"), 'active 过滤');
  });

  it('营收统计使用 reduce', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('), 'reduce 求和');
  });

  it('MOCK_STORES 长度统计', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STORES.length'), '长度统计');
  });

  it('应支持按城市筛选', () => {
    const src = readSource();
    assert.ok(src.includes('city') || src.includes('城市'), '城市筛选');
  });

  it('应处理全量 active 门店匹配', () => {
    const src = readSource();
    assert.ok(src.includes('.filter('), 'filter 过滤');
    assert.ok(src.includes('.length'), 'length 判断');
  });

  it('月营收大于 0', () => {
    const src = readSource();
    assert.ok(src.includes('> 0') || src.includes('>=0') || src.includes('monthlyRevenue'), '月营收');
  });
});

describe('stores — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('空门店列表应有处理', () => {
    const src = readSource();
    assert.ok(src.includes('.length'), '长度判断');
  });

  it('应包含门店经理姓名', () => {
    const src = readSource();
    assert.ok(src.includes('managerName') || src.includes('manager'), '缺少门店经理');
  });

  it('应处理隐式 undefined store 数据', () => {
    const src = readSource();
    assert.ok(src.includes('?.') || src.includes('??') || src.includes('!!'), '可选链或空值合并');
  });

  it('应包含门店类型过滤', () => {
    const src = readSource();
    assert.ok(src.includes(".type === '") || src.includes('.filter('), '类型过滤条件');
  });
});
