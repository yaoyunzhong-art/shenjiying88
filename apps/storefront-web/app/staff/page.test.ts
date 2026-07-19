/**
 * staff/page.test.ts — 员工管理页 L1 源码冒烟测试 (storefront-web)
 * 角色视角: 👔店长 / 运营主管
 * 覆盖: 员工列表 · 状态 · 班次 · 统计 · 边界 · 防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  if (!existsSync(SOURCE)) throw new Error(`Source not found: ${SOURCE}`);
  return readFileSync(SOURCE, 'utf-8');
}

// ============================================================
// 正例 — 文件 & 导出完整性
// ============================================================

describe('staff/page — 正例: 文件与导出', () => {
  it('page.tsx 文件应存在', () => {
    assert.equal(existsSync(SOURCE), true);
  });

  it('应导出默认的 StaffManagementPage 函数组件', () => {
    const src = readSource();
    assert.match(src, /export default function StaffManagementPage/);
  });

  it('应为 \'use client\' 组件', () => {
    const src = readSource();
    assert.match(src, /'use client'/);
  });

  it('应导入 PageShell', () => {
    const src = readSource();
    assert.match(src, /import.*PageShell.*from.*@m5\/ui/);
  });

  it('应导入 StatusBadge、DataTable、Pagination 等组件', () => {
    const src = readSource();
    assert.match(src, /StatusBadge/);
    assert.match(src, /DataTable/);
    assert.match(src, /Pagination/);
    assert.match(src, /SearchFilterInput/);
    assert.match(src, /usePagination/);
    assert.match(src, /useSearchFilter/);
  });

  it('应导出所有 Type 定义', () => {
    const src = readSource();
    assert.match(src, /export type StaffRole/);
    assert.match(src, /export type StaffStatus/);
    assert.match(src, /export type ShiftType/);
    assert.match(src, /export interface StaffRecord/);
  });

  it('应导出 StaffStats 接口和 computeStaffStats 函数', () => {
    const src = readSource();
    assert.match(src, /export interface StaffStats/);
    assert.match(src, /export function computeStaffStats/);
  });

  it('应导出所有常量配置', () => {
    const src = readSource();
    assert.match(src, /export const ROLE_LABELS/);
    assert.match(src, /export const STATUS_LABELS/);
    assert.match(src, /export const SHIFT_LABELS/);
    assert.match(src, /export const FILTER_TABS/);
    assert.match(src, /export const ROLE_VARIANTS/);
    assert.match(src, /export const STATUS_VARIANTS/);
  });
});

// ============================================================
// 正例 — Mock 数据完整
// ============================================================

describe('staff/page — 正例: Mock 数据', () => {
  it('MOCK_STAFF 应包含至少 10 名员工', () => {
    const src = readSource();
    const matches = src.match(/id:\s*'st-\d+'/g);
    assert.ok(matches !== null && matches.length >= 10,
      `expected ≥10 staff records, got ${matches?.length ?? 0}`);
  });

  it('Mock 数据应覆盖全部 StaffRole 枚举 (6 种角色)', () => {
    const src = readSource();
    for (const role of ['manager', 'sales', 'cashier', 'cleaner', 'guard', 'customer_service']) {
      assert.match(src, new RegExp(`role:\\s*'${role}'`), `should include role: ${role}`);
    }
  });

  it('Mock 数据应覆盖全部 StaffStatus 枚举 (5 种状态)', () => {
    const src = readSource();
    for (const status of ['active', 'on_leave', 'vacation', 'off_duty', 'resigned']) {
      assert.match(src, new RegExp(`status:\\s*'${status}'`), `should include status: ${status}`);
    }
  });

  it('Mock 数据应覆盖全部 ShiftType 枚举 (4 种班次)', () => {
    const src = readSource();
    for (const shift of ['morning', 'afternoon', 'night', 'rest']) {
      assert.match(src, new RegExp(`shift:\\s*'${shift}'`), `should include shift: ${shift}`);
    }
  });

  it('Mock 数据应包含必填字段', () => {
    const src = readSource();
    assert.match(src, /performanceScore:/);
    assert.match(src, /joinDate:/);
    assert.match(src, /storeName:/);
    assert.match(src, /department:/);
  });
});

// ============================================================
// 正例 — 常量配置完整性
// ============================================================

describe('staff/page — 正例: 常量配置', () => {
  it('ROLE_LABELS 应包含全部 6 种角色的中文标签', () => {
    const src = readSource();
    const expectedLabels = ['店长', '导购员', '收银员', '保洁', '保安', '客服'];
    for (const label of expectedLabels) {
      assert.match(src, new RegExp(label), `ROLE_LABELS should include "${label}"`);
    }
  });

  it('STATUS_LABELS 应包含全部 5 种状态的中文标签', () => {
    const src = readSource();
    const expectedLabels = ['在岗', '请假', '休假', '已下班', '已离职'];
    for (const label of expectedLabels) {
      assert.match(src, new RegExp(label), `STATUS_LABELS should include "${label}"`);
    }
  });

  it('SHIFT_LABELS 应包含全部 4 种班次描述', () => {
    const src = readSource();
    assert.match(src, /早班 08:00-16:00/);
    assert.match(src, /中班 12:00-20:00/);
    assert.match(src, /晚班 16:00-00:00/);
    assert.match(src, /休息/);
  });

  it('FILTER_TABS 应包含 5 个筛选项', () => {
    const src = readSource();
    // Count individual tab keys
    assert.match(src, /key:\s*'all'/);
    assert.match(src, /key:\s*'active'/);
    assert.match(src, /key:\s*'on_leave'/);
    assert.match(src, /key:\s*'vacation'/);
    assert.match(src, /key:\s*'resigned'/);
  });
});

// ============================================================
// 正例 — 统计计算逻辑
// ============================================================

describe('staff/page — 正例: 统计计算', () => {
  it('computeStaffStats 应被定义并导出', () => {
    const src = readSource();
    assert.match(src, /export function computeStaffStats/);
  });

  it('computeStaffStats 应计算总人数', () => {
    const src = readSource();
    assert.match(src, /records\.length/);
    assert.match(src, /total:/);
  });

  it('computeStaffStats 应按 status 分组计数', () => {
    const src = readSource();
    assert.match(src, /filter\(r => r\.status === 'active'\)/);
    assert.match(src, /filter\(r => r\.status === 'on_leave'\)/);
    assert.match(src, /filter\(r => r\.status === 'resigned'\)/);
  });

  it('computeStaffStats 应按 shift 分组计数', () => {
    const src = readSource();
    assert.match(src, /filter\(r => r\.shift === 'morning'\)/);
    assert.match(src, /filter\(r => r\.shift === 'afternoon'\)/);
    assert.match(src, /filter\(r => r\.shift === 'night'\)/);
    assert.match(src, /filter\(r => r\.shift === 'rest'\)/);
  });

  it('computeStaffStats 应返回平均绩效分', () => {
    const src = readSource();
    assert.match(src, /avgPerformance:/);
    assert.match(src, /totalScore/);
  });

  it('computeStaffStats 应计算独立部门数', () => {
    const src = readSource();
    assert.match(src, /departmentCount/);
    assert.match(src, /new Set/);
  });
});

// ============================================================
// 正例 — 页面渲染结构
// ============================================================

describe('staff/page — 正例: 页面结构', () => {
  it('应包含页面标题和描述', () => {
    const src = readSource();
    assert.match(src, /员工管理/);
    assert.match(src, /PageShell title=/);
    assert.match(src, /description=/);
  });

  it('应包含统计卡片区域', () => {
    const src = readSource();
    assert.match(src, /总员工/);
    assert.match(src, /在岗/);
    assert.match(src, /请假/);
    assert.match(src, /已离职/);
    assert.match(src, /平均绩效分/);
  });

  it('应包含班次分布摘要', () => {
    const src = readSource();
    assert.match(src, /今日班次分布/);
    assert.match(src, /早班/);
    assert.match(src, /中班/);
    assert.match(src, /晚班/);
  });

  it('应包含 SearchFilterInput', () => {
    const src = readSource();
    assert.match(src, /<SearchFilterInput/);
    assert.match(src, /搜索姓名/);
  });

  it('应包含 DataTable 组件渲染', () => {
    const src = readSource();
    assert.match(src, /<DataTable/);
    assert.match(src, /COLUMNS/);
  });

  it('应包含 Pagination 组件', () => {
    const src = readSource();
    assert.match(src, /<Pagination/);
    assert.match(src, /onPageChange/);
    assert.match(src, /onPageSizeChange/);
  });

  it('应包含空状态渲染', () => {
    const src = readSource();
    assert.match(src, /未找到匹配的员工/);
  });
});

// ============================================================
// 反例 — 防御性检查
// ============================================================

describe('staff/page — 反例: 防御', () => {
  it('不应包含 any 类型', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });

  it('不应包含 console.log 或 debugger', () => {
    const src = readSource();
    assert.equal(src.includes('console.log('), false, 'no console.log calls');
    assert.equal(src.includes('debugger'), false, 'no debugger statements');
  });

  it('不应包含危险的 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.equal(src.includes('dangerouslySetInnerHTML'), false);
  });

  it('不应包含硬编码的敏感信息（密码/token）', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:password|secret|api[_-]?key|authorization|token)/i);
  });

  it('不应包含 .only 残留', () => {
    const src = readSource();
    assert.equal(src.includes('.only'), false);
  });
});

// ============================================================
// 边界 — 极端数据场景
// ============================================================

describe('staff/page — 边界', () => {
  it('computeStaffStats 空数组应返回全零', () => {
    const src = readSource();
    // 检查空数组处理路径
    assert.match(src, /records\.length === 0/);
    assert.match(src, /total: 0/);
  });

  it('COLUMNS 应定义 6 个表头', () => {
    const src = readSource();
    const headers = ['姓名', '电话', '岗位', '状态', '班次', '部门'];
    for (const h of headers) {
      assert.match(src, new RegExp(`header:.*${h}`), `COLUMNS should contain header "${h}"`);
    }
  });

  it('statCardStyle 应定义正确的样式属性', () => {
    const src = readSource();
    assert.match(src, /borderRadius: 12/);
    assert.match(src, /minWidth: 100/);
  });

  it('FILTER_TABS 应使用 as const', () => {
    const src = readSource();
    assert.match(src, /as const/);
  });

  it('应支持角色筛选', () => {
    const src = readSource();
    assert.match(src, /roleFilter/);
  });

  it('应支持多条件筛选（状态 + 角色 + 搜索）', () => {
    const src = readSource();
    assert.match(src, /multiFiltered/);
    assert.match(src, /useMemo/);
  });
});
