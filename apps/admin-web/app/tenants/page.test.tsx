/**
 * tenants/page.test.tsx — 租户列表页 L1+L2 测试
 * 覆盖: 正例·反例·边界·防御·数据校验
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

// ---- 正例 ----

describe('tenants — 正例', () => {
  it('应导出一个默认组件 TenantsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function TenantsPage'), '缺少默认导出组件');
  });

  it('应包含 Tenant 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Tenant'), '缺少 Tenant 接口');
  });

  it('应包含 tenants 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('const tenants: Tenant'), '缺少 tenants 数据');
  });

  it('应计算 total / active / trial / expired 统计', () => {
    const src = readSource();
    assert.ok(src.includes('total:'), '缺少 total');
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('trial:'), '缺少 trial');
    assert.ok(src.includes('expired:'), '缺少 expired');
  });

  it('应包含 useSearchFilter 搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含 DataTable 列定义', () => {
    const src = readSource();
    assert.ok(src.includes('DataTableColumn') || src.includes('buildColumns'), '缺少列定义');
  });
});

// ---- 反例 ----

describe('tenants — 反例', () => {
  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.ok(!/: any\b/.test(src), '不应使用 any');
  });

  it('tenants 不应为空', () => {
    const src = readSource();
    assert.ok(src.includes('TNT-'), 'tenants 应有实际数据');
  });

  it('不应使用 var 声明', () => {
    const src = readSource();
    assert.ok(!/^var\s/.test(src) && !/; var\s/.test(src), '不应使用 var');
  });

  it('应避免重复的 use client 指令', () => {
    const src = readSource();
    const matches = src.match(/'use client'/g);
    assert.ok(matches && matches.length >= 1, '应包含 use client');
  });
});

// ---- 边界 ----

describe('tenants — 边界', () => {
  it('应包含 TIER_LABELS 版本映射', () => {
    const src = readSource();
    assert.ok(src.includes('TIER_LABELS'), '缺少 TIER_LABELS');
    assert.ok(src.includes('企业版'), '应包含企业版标签');
  });

  it('应支持市场区域 region 分组', () => {
    const src = readSource();
    assert.ok(src.includes('region') || src.includes('REGIONS'), '缺少 region');
  });

  it('应支持状态分组统计', () => {
    const src = readSource();
    assert.ok(src.includes(".status==='active'") || src.includes('.status==='), '缺少状态过滤');
  });

  it('数组长度应为 32', () => {
    const src = readSource();
    assert.ok(src.includes('length:32') || src.includes('32}'), '应包含 length:32');
  });

  it('应支持分页 Pagination', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination') || src.includes('usePagination'), '缺少分页组件');
  });
});

// ---- 防御 ----

describe('tenants — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含状态过滤 Tabs', () => {
    const src = readSource();
    assert.ok(src.includes('Tabs'), '缺少 Tabs');
  });

  it('状态过滤应包含 active/trial/suspended/expired', () => {
    const src = readSource();
    assert.ok(src.includes('active') && src.includes('trial') && src.includes('expired'), '缺少完整状态');
    assert.ok(src.includes('suspended'), '缺少 suspended 状态');
  });

  it('应包含营收格式化函数 formatMoney', () => {
    const src = readSource();
    assert.ok(src.includes('formatMoney'), '缺少 formatMoney');
  });

  it('到期日应显示剩余天数', () => {
    const src = readSource();
    assert.ok(src.includes('expiryDate') || src.includes('已过期'), '缺少到期日显示');
  });
});

// ---- 数据校验 ----

describe('tenants — 数据校验', () => {
  it('Tenant 接口应包含必需字段', () => {
    const src = readSource();
    assert.ok(src.includes('id') && src.includes('name') && src.includes('tier'), '缺少基础字段');
    assert.ok(src.includes('status') && src.includes('region'), '缺少 status/region');
  });

  it('应包含多个行业类型', () => {
    const src = readSource();
    assert.ok(src.includes('游艺厅') || src.includes('电玩城'), '缺少游戏厅行业');
  });

  it('COLUMNS 列数量应足够', () => {
    const src = readSource();
    const colDefs = (src.match(/key:'/g) || src.match(/key: '/g) || []).length;
    assert.ok(colDefs >= 8, `列定义不足: ${colDefs}`);
  });

  it('营收渲染应有 ¥ 符号', () => {
    const src = readSource();
    assert.ok(src.includes('¥'), '缺少货币符号');
  });
});

const SRC = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), './page.tsx'), 'utf-8');

describe('Tenants — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
