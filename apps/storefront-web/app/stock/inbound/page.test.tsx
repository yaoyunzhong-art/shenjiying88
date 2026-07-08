/**
 * stock/inbound/page.test.tsx — 入库接收列表页 L1 冒烟测试
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PAGE_PATH = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(PAGE_PATH, 'utf-8');
}

describe('stock/inbound/page — 正例', () => {
  it('应存在 page.tsx', () => {
    assert.ok(existsSync(PAGE_PATH), '文件不存在');
  });

  it('应导出一个默认组件 InboundListPage', () => {
    const src = readSource();
    assert.match(src, /export default function InboundListPage/);
  });

  it('应使用 "use client" 指令', () => {
    const src = readSource();
    assert.match(src, /['"]use client['"]/);
  });

  it('应导入 Next.js useRouter', () => {
    const src = readSource();
    assert.match(src, /useRouter/);
  });

  it('应导入 @m5/ui 可用组件', () => {
    const src = readSource();
    assert.match(src, /PageShell/);
    assert.match(src, /SearchFilterInput/);
    assert.match(src, /FilterChips/);
    assert.match(src, /FilterBar/);
    assert.match(src, /PaginatedDataTableCard/);
    assert.match(src, /QuickStats/);
    assert.match(src, /QuickStatItem/);
    assert.match(src, /TableColumn/);
  });

  it('应使用 items 属性方式传递统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('QuickStats'), '应包含 QuickStats');
    assert.ok(src.includes('items={['), '应使用 items 属性 (数组格式)');
    assert.ok(src.includes('全部单数'), '应包含全部单数统计项');
  });

  it('应包含 MOCK_ORDERS 数据集 (>=8 条)', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_ORDERS'), '缺少 MOCK_ORDERS');
    const matches = src.match(/id:\s*'INB\d{3}'/g);
    assert.ok(matches && matches.length >= 8, `数据量不足, 应有>=8条, 实有${matches?.length ?? 0}条`);
  });

  it('应实现搜索过滤逻辑 (searchKeyword)', () => {
    const src = readSource();
    assert.match(src, /searchKeyword/);
    assert.match(src, /statusFilter/);
  });

  it('应实现分页逻辑 (page / pageSize)', () => {
    const src = readSource();
    assert.match(src, /\bpage\b/);
    assert.match(src, /\bpageSize\b/);
    assert.match(src, /totalPages/);
  });

  it('应支持按状态筛选', () => {
    const src = readSource();
    assert.match(src, /FilterChips/);
  });

  it('应支持行点击跳转到详情', () => {
    const src = readSource();
    assert.match(src, /router\.push/);
    assert.match(src, /handleRowClick/);
  });
});

describe('stock/inbound/page — 边界', () => {
  it('应处理空搜索(全量展示)', () => {
    const src = readSource();
    assert.ok(src.includes('searchKeyword'), '搜索关键词字段缺失');
  });

  it('MOCK_ORDERS 应覆盖全部 5 种状态', () => {
    const src = readSource();
    const found: string[] = [];
    ['pending', 'inspecting', 'shelving', 'completed', 'cancelled'].forEach((s) => {
      if (src.includes(`status: '${s}'`)) found.push(s);
    });
    assert.equal(found.length, 5, `缺少状态: ${['pending','inspecting','shelving','completed','cancelled'].filter(s => !found.includes(s)).join(', ')}`);
  });

  it('应有 emptyText 空态文案', () => {
    const src = readSource();
    assert.match(src, /emptyText/);
    assert.match(src, /暂无入库记录/);
  });

  it('统计卡片应展示 4 项指标', () => {
    const src = readSource();
    const labels = ['全部单数', '待验收', '进行中', '已完成'];
    labels.forEach((l) => assert.ok(src.includes(l), `缺少统计标签: ${l}`));
  });
});

describe('stock/inbound/page — 防御', () => {
  it('不应直接渲染真实 API 调用', () => {
    const src = readSource();
    assert.ok(!src.includes('fetch('), '不应有 fetch 调用');
    assert.ok(!src.includes('axios'), '不应有 axios');
  });

  it('不应包含敏感内联凭据', () => {
    const src = readSource();
    assert.ok(!src.includes('apiKey'), '不应包含 apiKey');
    assert.ok(!src.includes('token ='), '不应包含 token');
    assert.ok(!src.includes('password'), '不应包含 password');
  });

  it('不应包含调试日志 console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log'), '不应有 console.log');
  });

  it('不应包含 debugger 语句', () => {
    const src = readSource();
    assert.ok(!src.includes('debugger'), '不应有 debugger');
  });
});
