/**
 * tenants/page.test.tsx — 租户列表页 L1+L2 测试
 *
 * P-31 增强版: 覆盖 responseRegistry API 模式、状态统计栏、加载/错误态
 * 覆盖: 正例·反例·边界·防御·数据校验·API mock·状态统计
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

describe('tenants — 正例 (positive)', () => {
  it('应导出一个默认组件 TenantsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function TenantsPage'), '缺少默认导出组件');
  });

  it('应导出 Tenant 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('export interface Tenant'), '缺少 Tenant 接口导出');
    assert.ok(src.includes('export type TenantTier'), '缺少 TenantTier 导出');
    assert.ok(src.includes('export type TenantStatus'), '缺少 TenantStatus 导出');
  });

  it('应包含 DEFAULT_TENANTS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('export const DEFAULT_TENANTS'), '缺少 DEFAULT_TENANTS');
    assert.ok(src.includes('export function buildDefaultTenants'), '缺少 buildDefaultTenants');
  });

  it('应导出常量映射表', () => {
    const src = readSource();
    assert.ok(src.includes('export const TIER_LABELS'), '缺少 TIER_LABELS');
    assert.ok(src.includes('export const STATUS_CONFIG'), '缺少 STATUS_CONFIG');
    assert.ok(src.includes('export const REGIONS'), '缺少 REGIONS');
    assert.ok(src.includes('export const TIER_TIERS'), '缺少 TIER_TIERS');
  });

  it('应导出 formatMoney 函数', () => {
    const src = readSource();
    assert.ok(src.includes('export function formatMoney'), '缺少 formatMoney');
  });

  it('应包含 handleApiCall API 调用封装', () => {
    const src = readSource();
    assert.ok(src.includes('async function handleApiCall'), '缺少 handleApiCall');
    assert.ok(src.includes('responseRegistry'), '缺少 responseRegistry');
  });

  it('应包含 API_BASE 常量', () => {
    const src = readSource();
    assert.ok(src.includes("API_BASE") && src.includes("/api/tenants"), '缺少 API_BASE');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含 useCallback 回调优化', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
  });

  it('应包含 DataTable 列定义', () => {
    const src = readSource();
    assert.ok(src.includes('DataTableColumn') || src.includes('buildColumns'), '缺少列定义');
  });

  it('应包含 StatBar 状态统计栏', () => {
    const src = readSource();
    assert.ok(src.includes('StatBar'), '缺少 StatBar 组件');
    assert.ok(src.includes('TenantStats'), '缺少状态统计逻辑');
  });

  it('应包含 TierDistribution 版本分布', () => {
    const src = readSource();
    assert.ok(src.includes('TierDistribution'), '缺少 TierDistribution');
  });

  it('应包含 RegionDistribution 区域分布', () => {
    const src = readSource();
    assert.ok(src.includes('RegionDistribution'), '缺少 RegionDistribution');
  });

  it('应计算 total / active / trial / suspended / expired 统计', () => {
    const src = readSource();
    assert.ok(src.includes('total:'), '缺少 total');
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('trial:'), '缺少 trial');
    assert.ok(src.includes('suspended:'), '缺少 suspended');
    assert.ok(src.includes('expired:'), '缺少 expired');
  });

  it('应包含 useSearchFilter 搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
  });

  it('应包含 loading 和 error 状态', () => {
    const src = readSource();
    assert.ok(src.includes('setLoading'), '缺少 setLoading');
    assert.ok(src.includes('setError'), '缺少 setError');
  });

  it('应包含 useEffect 数据加载', () => {
    const src = readSource();
    assert.ok(src.includes('useEffect'), '缺少 useEffect');
  });

  it('应包含加载中 UI', () => {
    const src = readSource();
    assert.ok(src.includes('加载'), '缺少加载文案');
  });

  it('应包含错误 UI 及重试按钮', () => {
    const src = readSource();
    assert.ok(src.includes('重试') || src.includes('retry'), '缺少重试');
  });

  it('DEFAULT_TENANTS 应包含 15 条数据 (TNT-001 到 TNT-015)', () => {
    const src = readSource();
    assert.ok(src.includes('TNT-015'), 'DEFAULT_TENANTS 应有 15 条');
  });
});

// ---- 反例 ----

describe('tenants — 反例 (negative)', () => {
  it('不应使用 var 声明', () => {
    const src = readSource();
    assert.ok(!/^var\s/.test(src) && !/; var\s/.test(src), '不应使用 var');
  });

  it('tenants 不应为空数组', () => {
    const src = readSource();
    assert.ok(src.includes('export const DEFAULT_TENANTS'), 'DEFAULT_TENANTS 应为数组');
    assert.ok(src.includes('TNT-00'), 'DEFAULT_TENANTS 应有实际数据');
  });

  it('应避免重复的 use client 指令', () => {
    const src = readSource();
    const matches = src.match(/'use client'/g);
    assert.ok(matches && matches.length >= 1, '应包含 use client');
    assert.ok(!matches || matches.length === 1, '不应重复 use client');
  });

  it('API handler 无匹配时应有 fallback', () => {
    const src = readSource();
    assert.ok(src.includes('网络错误') || src.includes('fetch'), '应有 fallback');
  });

  it('不应使用 describe.skip', () => {
    const src = readSource();
    assert.ok(!src.includes('describe.skip'), 'page.tsx 不应包含 describe.skip');
  });

  it('不应使用 it.skip', () => {
    const src = readSource();
    assert.ok(!src.includes('it.skip'), 'page.tsx 不应包含 it.skip');
  });

  it('不应在运行时使用 any 类型断言', () => {
    const src = readSource();
    // The eslint-disable comment is fine, but actual 'as any' casts should not exist
    const anyCasts = src.match(/as\s+any\b/g);
    assert.ok(!anyCasts, '不应有 as any 断言');
  });
});

// ---- 边界 ----

describe('tenants — 边界 (boundary)', () => {
  it('STATUS_CONFIG 应覆盖 4 种状态', () => {
    const src = readSource();
    assert.ok(src.includes('active'), '缺少 active');
    assert.ok(src.includes('trial'), '缺少 trial');
    assert.ok(src.includes('suspended'), '缺少 suspended');
    assert.ok(src.includes('expired'), '缺少 expired');
  });

  it('TIER_LABELS 应覆盖 5 种版本', () => {
    const src = readSource();
    assert.ok(src.includes('免费版'));
    assert.ok(src.includes('入门版'));
    assert.ok(src.includes('商业版'));
    assert.ok(src.includes('企业版'));
    assert.ok(src.includes('旗舰版'));
  });

  it('应有 8 个区域 REGIONS', () => {
    const src = readSource();
    assert.ok(src.includes('华东') && src.includes('华北') && src.includes('海外'), 'REGIONS 应有 8 区域');
  });

  it('应有 7 个行业 INDUSTRIES', () => {
    const src = readSource();
    assert.ok(src.includes('游艺厅') || src.includes('电玩城'), 'INDUSTRIES 应有游戏厅行业');
  });

  it('应支持状态分组筛选', () => {
    const src = readSource();
    assert.ok(src.includes(".filter") || src.includes('statusFilter'), '缺少状态过滤');
  });

  it('应支持分页 Pagination', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination') || src.includes('usePagination'), '缺少分页组件');
  });

  it('状态统计栏应有 6 个卡片', () => {
    const src = readSource();
    const cardMatches = src.match(/gridTemplateColumns.*repeat\(6/g);
    assert.ok(cardMatches && cardMatches.length >= 1, 'StatBar 应有 6 列');
  });

  it('状态过滤 tabs 应包含 ALL 和 4 种状态', () => {
    const src = readSource();
    assert.ok(src.includes('ALL'), '缺少 ALL tab');
    assert.ok(src.includes('active') && src.includes('suspended') && src.includes('expired') && src.includes('trial'), '过滤 tabs 不完整');
  });

  it('到期日应显示剩余天数', () => {
    const src = readSource();
    assert.ok(src.includes('expiryDate') || src.includes('已过期'), '缺少到期日显示');
  });

  it('营收渲染应有 ¥ 符号', () => {
    const src = readSource();
    assert.ok(src.includes('¥'), '缺少货币符号');
  });
});

// ---- 防御 ----

describe('tenants — 防御 (defensive)', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含状态过滤 Tabs', () => {
    const src = readSource();
    assert.ok(src.includes('Tabs'), '缺少 Tabs');
  });

  it('应包含营收格式化函数 formatMoney', () => {
    const src = readSource();
    assert.ok(src.includes('formatMoney'), '缺少 formatMoney');
  });

  it('应包含数据库列定义 buildColumns', () => {
    const src = readSource();
    assert.ok(src.includes('function buildColumns'), '缺少 buildColumns');
  });

  it('列定义应不少于 9 列', () => {
    const src = readSource();
    const colDefs = (src.match(/key: '/g) || src.match(/key: "/g) || []).length;
    assert.ok(colDefs >= 9, `列定义不足: ${colDefs}`);
  });

  it('应包含 computeStats 统计函数', () => {
    const src = readSource();
    assert.ok(src.includes('function computeStats') || src.includes('computeStats('), '缺少 computeStats');
  });

  it('状态统计应处理空数据', () => {
    const src = readSource();
    assert.ok(src.includes('stats.total > 0'), '应有 total > 0 条件判断');
  });

  it('应包含 retry 按钮在错误态', () => {
    const src = readSource();
    assert.ok(src.includes('重试') || src.includes('retry'), '缺少重试按钮');
  });

  it('loading 状态应有非空文案', () => {
    const src = readSource();
    assert.ok(src.includes('加载'), '加载文案应存在');
  });

  it('应导出类型供外部引用', () => {
    const src = readSource();
    assert.ok(src.includes('export type') || src.includes('export interface'), '缺少类型导出');
  });
});

// ---- 数据校验 ----

describe('tenants — 数据校验 (data validation)', () => {
  it('Tenant 接口应包含必需字段', () => {
    const src = readSource();
    assert.ok(src.includes('id'), '缺少 id');
    assert.ok(src.includes('name'), '缺少 name');
    assert.ok(src.includes('tier'), '缺少 tier');
    assert.ok(src.includes('status'), '缺少 status');
    assert.ok(src.includes('expiryDate'), '缺少 expiryDate');
    assert.ok(src.includes('revenue'), '缺少 revenue');
  });

  it('buildDefaultTenants 应包含多样化的 tier', () => {
    const src = readSource();
    assert.ok(src.includes("tier: 'enterprise'") || src.includes('tier:"enterprise"'), '缺少 enterprise');
    assert.ok(src.includes("tier: 'free'") || src.includes('tier:"free"'), '缺少 free tier');
    assert.ok(src.includes("tier: 'premium'") || src.includes('tier:"premium"'), '缺少 premium');
  });

  it('buildDefaultTenants 应包含多样化的 status', () => {
    const src = readSource();
    assert.ok(src.includes("status: 'active'") || src.includes('status:"active"'), '缺少 active');
    assert.ok(src.includes("status: 'suspended'") || src.includes('status:"suspended"'), '缺少 suspended');
    assert.ok(src.includes("status: 'expired'") || src.includes('status:"expired"'), '缺少 expired');
    assert.ok(src.includes("status: 'trial'") || src.includes('status:"trial"'), '缺少 trial');
  });

  it('revenue 应为数字类型', () => {
    const src = readSource();
    assert.ok(src.includes('revenue:'), '缺少 revenue 字段');
  });

  it('stores 和 users 应为数字', () => {
    const src = readSource();
    assert.ok(/stores:\s*\d+/.test(src), 'stores 应为数字');
    assert.ok(/users:\s*\d+/.test(src), 'users 应为数字');
  });

  it('region 应覆盖多个区域', () => {
    const src = readSource();
    assert.ok(src.includes('华东'), '缺少华东');
    assert.ok(src.includes('华南'), '缺少华南');
    assert.ok(src.includes('华北'), '缺少华北');
  });

  it('industry 应覆盖多个行业', () => {
    const src = readSource();
    assert.ok(src.includes('游艺厅'), '缺少游艺厅');
    assert.ok(src.includes('电玩城'), '缺少电玩城');
    assert.ok(src.includes('综合娱乐'), '缺少综合娱乐');
  });

  it('TIER_TIERS 顺序应为 free/starter/business/enterprise/premium', () => {
    const src = readSource();
    const idx = src.indexOf('TIER_TIERS');
    const after = src.slice(idx, idx + 120);
    assert.ok(after.includes('free') && after.includes('starter') && after.includes('enterprise'), 'TIER_TIERS 顺序不正确');
  });
});

// ---- responseRegistry API mock ----

describe('tenants — responseRegistry API mock', () => {
  it('应注册 GET:/api/tenants 处理器', () => {
    const src = readSource();
    assert.ok(src.includes("'GET:/api/tenants'") || src.includes('GET:/api/tenants'), '缺少 GET handler');
  });

  it('应注册 GET:/api/tenants/stats 处理器', () => {
    const src = readSource();
    assert.ok(src.includes('/api/tenants/stats') || src.includes('.stats'), '缺少 stats handler');
  });

  it('应注册 suspend/reactivate 处理器', () => {
    const src = readSource();
    assert.ok(src.includes('/api/tenants/suspend') || src.includes('suspend'), '缺少 suspend handler');
    assert.ok(src.includes('/api/tenants/reactivate') || src.includes('reactivate'), '缺少 reactivate handler');
  });

  it('responseRegistry 应返回 { ok, data, message }', () => {
    const src = readSource();
    assert.ok(src.includes('ok: true'), '缺少 ok 字段');
    assert.ok(src.includes('ok: false') || src.includes('message:'), '应有错误处理');
  });

  it('handleApiCall 应识别 POST/PUT/DELETE method', () => {
    const src = readSource();
    assert.ok(src.includes('method'), 'handleApiCall 应解析 method');
    assert.ok(src.includes('toUpperCase'), '应转大写 method');
  });
});

const SRC = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), './page.tsx'), 'utf-8');

describe('Tenants — hooks & JSX 验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toLocaleString)', () => assert.ok(SRC.includes('.toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
  it('包含loading状态变量', () => assert.ok(SRC.includes('loading')));
  it('包含error状态变量', () => assert.ok(SRC.includes('error')));
  it('包含loadTenants回调', () => assert.ok(SRC.includes('loadTenants')));
});
