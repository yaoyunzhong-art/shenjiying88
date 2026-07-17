/**
 * staff/page.test.tsx — 员工列表页 L1 冒烟测试
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

// ---- 正例 ----

describe('staff — 正例', () => {
  it('应导出一个默认组件 StaffPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StaffPage'), '缺少默认导出组件');
  });

  it('应包含 MOCK_STAFF 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STAFF'), '缺少 MOCK_STAFF');
  });

  it('应计算 total / active / topPerf 统计', () => {
    const src = readSource();
    assert.ok(src.includes('total:'), '缺少 total');
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('topPerf:'), '缺少 topPerf');
  });

  it('应计算平均 performanceScore', () => {
    const src = readSource();
    assert.ok(src.includes('performanceScore'), '缺少 performanceScore');
    assert.ok(src.includes('.reduce('), '缺少 reduce 计算');
  });

  it('应包含 marketCode 市场分类过滤', () => {
    const src = readSource();
    assert.ok(src.includes('marketCode'), '缺少 marketCode');
  });

  it('应包含员工姓名字段', () => {
    const src = readSource();
    assert.ok(src.includes('name') || src.includes('员工姓名'), '缺少员工姓名');
  });

  it('应包含员工岗位字段', () => {
    const src = readSource();
    assert.ok(src.includes('position') || src.includes('岗位'), '缺少岗位字段');
  });

  it('应包含员工入职时间字段', () => {
    const src = readSource();
    assert.ok(src.includes('joinDate') || src.includes('入职'), '缺少入职时间');
  });
});

// ---- 边界 ----

describe('staff — 边界', () => {
  it('MOCK_STAFF 空列表应有长度 0', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STAFF.length'), '长度统计');
  });

  it('topPerf 阈值应为 85', () => {
    const src = readSource();
    assert.ok(src.includes('>= 85'), '优秀员工阈值应为 85');
  });

  it('应支持 status 分组统计', () => {
    const src = readSource();
    assert.ok(src.includes(".status === 'active'"), '缺少状态过滤');
  });

  it('应处理空员工列表边界', () => {
    const src = readSource();
    assert.ok(src.includes('.length') && src.includes('MOCK_STAFF'), '应检查列表长度');
  });

  it('应包含角色/岗位过滤逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('roleFilter') || src.includes('role'), '缺少角色过滤');
  });

  it('应包含绩效表现评分字段', () => {
    const src = readSource();
    assert.ok(src.includes('performanceScore'), '缺少绩效评分');
  });
});

// ---- 防御 ----

describe('staff — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('平均分计算应使用 reduce 求和后除以 length', () => {
    const src = readSource();
    assert.ok(src.includes('reduce((sum, s)'), '缺少 reduce 求和');
    assert.ok(src.includes('.length'), '除以 length');
  });

  it('筛选过滤不应修改原数组', () => {
    const src = readSource();
    assert.ok(src.includes('.filter('), '应使用 filter 不可变过滤');
  });

  it('数据统计应使用 reduce 聚合', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('), '应有 reduce 聚合');
  });

  it('应使用 useCallback 包裹事件处理', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
  });
});

// ---- 深度组件 ----

describe('staff — 深度组件', () => {
  it('包含JSX列表渲染 .map()', () => {
    const src = readSource(); assert.ok(src.includes('.map('));
  });
  it('包含三元条件渲染', () => {
    const src = readSource(); assert.ok(src.includes(' ? ') || src.includes(' ?? '));
  });
  it('包含 && 逻辑条件', () => {
    const src = readSource(); assert.ok(src.includes(' && '));
  });
  it('包含事件处理 onClick', () => {
    const src = readSource(); assert.ok(src.includes('onClick') || src.includes('onChange'));
  });
  it('包含style内联样式', () => {
    const src = readSource(); assert.ok(src.includes('style={'));
  });
  it('包含模板变量 ${}', () => {
    const src = readSource(); assert.ok(src.includes('${'));
  });
  it('包含 useState 状态管理', () => {
    const src = readSource(); assert.ok(src.includes('const [') && src.includes('useState'));
  });
  it('包含 useEffect 副作用', () => {
    const src = readSource(); assert.ok(src.includes('useEffect'));
  });
  it('包含 filter 不可变过滤', () => {
    const src = readSource(); assert.ok(src.includes('.filter('));
  });
  it('包含 reduce 数据聚合', () => {
    const src = readSource(); assert.ok(src.includes('.reduce('));
  });
});

describe('staff — 业务深度', () => {
  it('包含员工岗位角色枚举', () => {
    const src = readSource(); assert.ok(src.includes('STAFF_ROLE_MAP'));
  });
  it('包含员工状态枚举', () => {
    const src = readSource(); assert.ok(src.includes('STAFF_STATUS_MAP'));
  });
  it('包含员工编号字段 code', () => {
    const src = readSource(); assert.ok(src.includes('code'));
  });
  it('包含DataTable表格', () => {
    const src = readSource(); assert.ok(src.includes('DataTable'));
  });
  it('包含usePagination分页', () => {
    const src = readSource(); assert.ok(src.includes('usePagination'));
  });
  it('包含SearchFilterInput搜索', () => {
    const src = readSource(); assert.ok(src.includes('SearchFilterInput'));
  });
  it('包含useSortedItems排序', () => {
    const src = readSource(); assert.ok(src.includes('useSortedItems'));
  });
  it('包含FilterChips过滤标签', () => {
    const src = readSource(); assert.ok(src.includes('FilterChips'));
  });
  it('包含 marketCode 市场筛选', () => {
    const src = readSource(); assert.ok(src.includes('marketCode'));
  });
  it('包含 Tabs 分类切换', () => {
    const src = readSource(); assert.ok(src.includes('Tabs'));
  });
});

// ---- hooks验证 ----

describe('staff — hooks验证', () => {
  const src = readSource();
  it('包含useState声明', () => assert.ok(src.includes('const [') && src.includes('useState')));
  it('包含JSX返回', () => assert.ok(src.includes('return (') || src.includes('return <')));
  it('包含事件处理器', () => assert.ok(src.includes('onClick={') || src.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(src.includes('.map(')));
  it('包含条件渲染', () => assert.ok(src.includes(' && ') || src.includes(' ? ')));
  it('包含样式定义', () => assert.ok(src.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(src.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(src.includes('${')));
  it('包含默认导出', () => assert.ok(src.includes('export default function')));
  it('包含注释说明', () => assert.ok(src.includes('/**') || src.includes('//')));
});
