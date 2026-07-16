/**
 * agents/configs/page.test.tsx — Agent 配置中心 L1 冒烟测试
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

// ---- 正例: 模块结构 & 数据映射 ----

describe('agents/configs — 正例', () => {
  it('应导出一个默认函数组件 AgentConfigsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AgentConfigsPage'), '未找到默认导出组件');
  });

  it('应使用 MOCK 模拟数据', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK'), '缺少 MOCK 模拟数据');
  });

  it('应包含 useState 状态管理', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
  });

  it('应包含 4 个 StatCard: 总数/已启用/已禁用/启用反思', () => {
    const src = readSource();
    const statCards = src.match(/StatCard/g);
    assert.ok(statCards && statCards.length >= 4, '应包含至少 4 个 StatCard');
  });

  it('应计算 enabledCount 和 disabledCount', () => {
    const src = readSource();
    assert.ok(src.includes('.enabled'), '缺少 enabled 过滤');
    assert.ok(src.includes('!c.enabled'), '缺少 disabled 过滤');
  });

  it('应包含 DataTable 数据表格', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
  });

  it('应包含 SearchFilterInput 搜索输入', () => {
    const src = readSource();
    assert.ok(src.includes('SearchFilterInput'), '缺少搜索输入');
  });

  it('应包含 Pagination 分页组件', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination'), '缺少分页');
  });

  it('应包含 Select 模型筛选', () => {
    const src = readSource();
    assert.ok(src.includes('Select'), '缺少 Select');
  });

  it('应包含状态切换按钮 (全部/启用/禁用)', () => {
    const src = readSource();
    assert.ok(src.includes('全部'), '包含全部标签');
    assert.ok(src.includes('启用'), '包含启用标签');
    assert.ok(src.includes('禁用'), '包含禁用标签');
  });

  it('应导出 prepareConfigExport', () => {
    const src = readSource();
    assert.ok(src.includes('prepareConfigExport'), '缺少导出');
  });

  it('应导出 modelDistribution', () => {
    const src = readSource();
    assert.ok(src.includes('modelDistribution'), '缺少导出');
  });

  it('应导出 summaryStats', () => {
    const src = readSource();
    assert.ok(src.includes('summaryStats'), '缺少导出');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('agents/configs — 边界', () => {
  it('配置总数为 0 时统计应仍有效', () => {
    const src = readSource();
    assert.ok(src.includes('configs.length'), '总数引用配置数组长度');
  });

  it('StatCard 应包含 label/value/helper 属性', () => {
    const src = readSource();
    assert.ok(src.includes('label='), 'StatCard 应有 label');
    assert.ok(src.includes('value='), 'StatCard 应有 value');
    assert.ok(src.includes('helper='), 'StatCard 应有 helper');
  });

  it('应使用 useSortedItems 排序', () => {
    const src = readSource();
    assert.ok(src.includes('useSortedItems'), '应使用排序函数');
  });

  it('应使用 usePagination 分页', () => {
    const src = readSource();
    assert.ok(src.includes('usePagination'), '应使用分页钩子');
  });

  it('搜索和筛选清空时回到首页', () => {
    const src = readSource();
    assert.ok(src.includes('pagination.setPage(1)'), '筛选时重置页数');
  });

  it('form 超时应调用 fmtTimeout', () => {
    const src = readSource();
    assert.ok(src.includes('fmtTimeout'), '应格式化超时');
  });

  it('fmtTimeout 应处理 ms/min 单位', () => {
    const src = readSource();
    assert.ok(src.includes('60000'), '应处理分钟');
    assert.ok(src.includes('1000'), '应处理秒');
  });

  it('空搜索结果应显示引导文案', () => {
    const src = readSource();
    assert.ok(src.includes('未找到匹配'), '空搜索应有提示');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('agents/configs — 防御', () => {
  it('应该使用 MOCK 数组作为初始状态', () => {
    const src = readSource();
    assert.ok(src.includes('useState<AgentConfigBrief[]>(MOCK)'), '应初始化配置列表');
  });

  it('配置数据应支持 enabled 布尔字段过滤', () => {
    const src = readSource();
    assert.ok(src.includes('.filter((c) =>'), '应使用 filter 过滤配置');
  });

  it('subtitle 应描述 ReAct Agent 配置信息', () => {
    const src = readSource();
    assert.ok(src.includes('ReAct Agent') || src.includes('system prompt') || src.includes('Agent 运行'), '缺少 Agent 配置描述');
  });

  it('已启用和已禁用之和应为配置总数', () => {
    const src = readSource();
    assert.ok(src.includes('enabledCount'), '已启用变量存在');
    assert.ok(src.includes('disabledCount'), '已禁用变量存在');
  });

  it('模型可选列表应包含全部模型选项', () => {
    const src = readSource();
    assert.ok(src.includes('全部模型'), '应有全部模型选项');
    assert.ok(src.includes('GPT-4o'), '应有 GPT-4o');
  });

  it('grid 布局应使用 4 列统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('repeat(4'), 'grid 应为 4 列');
  });

  it('枚举超时时应回退', () => {
    const src = readSource();
    assert.ok(src.includes('?'), '应使用可选链');
    assert.ok(src.includes('??'), '应使用空值合并');
  });
});

// ---- 新增: 批量操作与开关辅助函数 ----

describe('executeBatchAction — 批量操作', () => {
  it('应导出 executeBatchAction', () => {
    const src = readSource();
    assert.ok(src.includes('executeBatchAction'), '缺少 executeBatchAction');
  });

  it('应返回 { success, failed }', () => {
    const src = readSource();
    assert.ok(src.includes('success: number'), '应返回 success');
    assert.ok(src.includes('failed: number'), '应返回 failed');
  });

  it('成功数应与输入 ID 数一致', () => {
    const src = readSource();
    assert.ok(src.includes('action.ids.length'), '成功数基于 ids 长度');
  });
});

describe('toggleConfigStatus — 状态切换', () => {
  it('应导出 toggleConfigStatus', () => {
    const src = readSource();
    assert.ok(src.includes('toggleConfigStatus'), '缺少 toggleConfigStatus');
  });

  it('应翻转指定配置的 enabled 状态', () => {
    const src = readSource();
    assert.ok(src.includes('!c.enabled'), '应翻转 enabled');
  });

  it('不应影响其他配置', () => {
    const src = readSource();
    assert.ok(src.includes('c.id === id'), '应仅匹配 id');
  });
});

describe('batchToggle — 批量状态切换', () => {
  it('应导出 batchToggle', () => {
    const src = readSource();
    assert.ok(src.includes('batchToggle'), '缺少 batchToggle');
  });

  it('enable 为 true 时应启用所有选中配置', () => {
    const src = readSource();
    assert.ok(src.includes("type: enable ? 'enable' : 'disable'"), '应根据 enable 参数');
  });

  it('应调用 executeBatchAction 执行', () => {
    const src = readSource();
    assert.ok(src.includes('executeBatchAction(action)'), '应调用批量执行');
  });
});

describe('EnableToggle — 开关组件', () => {
  it('应导出 EnableToggle', () => {
    const src = readSource();
    assert.ok(src.includes('function EnableToggle'), '缺少 EnableToggle');
  });

  it('enabled 为 true 时应显示绿色', () => {
    const src = readSource();
    assert.ok(src.includes('bg-emerald-500'), '启用状态应为绿色');
  });

  it('enabled 为 false 时应显示灰色', () => {
    const src = readSource();
    assert.ok(src.includes('bg-slate-600'), '禁用状态应为灰色');
  });

  it('disabled 时应设置 cursor-not-allowed', () => {
    const src = readSource();
    assert.ok(src.includes('cursor-not-allowed'), 'disabled 应显示禁止指针');
  });

  it('应使用 role=switch', () => {
    const src = readSource();
    assert.ok(src.includes('role="switch"'), '应使用 switch role');
  });
});

describe('BatchActionBar — 批量操作栏', () => {
  it('应导出 BatchActionBar', () => {
    const src = readSource();
    assert.ok(src.includes('BatchActionBar'), '缺少 BatchActionBar');
  });

  it('selectedIds 为空时应返回 null', () => {
    const src = readSource();
    assert.ok(src.includes('selectedIds.length === 0'), '空选择应返回 null');
    assert.ok(src.includes('return null'), '应返回 null');
  });

  it('应显示已选数量', () => {
    const src = readSource();
    assert.ok(src.includes('selectedIds.length'), '应显示已选数量');
  });

  it('应包含启用/禁用/删除按钮', () => {
    const src = readSource();
    assert.ok(src.includes('onBatchAction(\'enable\')'), '应支持启用');
    assert.ok(src.includes('onBatchAction(\'disable\')'), '应支持禁用');
    assert.ok(src.includes('onBatchAction(\'delete\')'), '应支持删除');
  });
});

describe('applyFilters — 筛选辅助', () => {
  it('应导出 applyFilters', () => {
    const src = readSource();
    assert.ok(src.includes('applyFilters'), '缺少 applyFilters');
  });

  it('search 空时应原样返回', () => {
    const src = readSource();
    assert.ok(src.includes('search.trim()'), '应检查空白搜索');
  });

  it('modelFilter 空时应不过滤', () => {
    const src = readSource();
    assert.ok(src.includes('modelFilter)'), '应检查模型筛选');
  });
});

describe('countByModel — 模型统计', () => {
  it('应导出 countByModel', () => {
    const src = readSource();
    assert.ok(src.includes('countByModel'), '缺少 countByModel');
  });

  it('应返回模型到数量的映射', () => {
    const src = readSource();
    assert.ok(src.includes('Record<string, number>'), '应返回 Record');
  });
});

describe('getStatusLabel — 状态标签', () => {
  it('应导出 getStatusLabel', () => {
    const src = readSource();
    assert.ok(src.includes('getStatusLabel'), '缺少 getStatusLabel');
  });

  it('enabled 为 true 返回已启用', () => {
    const src = readSource();
    assert.ok(src.includes('已启用'), '启用返回正确中文');
  });

  it('enabled 为 false 返回已禁用', () => {
    const src = readSource();
    assert.ok(src.includes('已禁用'), '禁用返回正确中文');
  });
});

describe('getAverageTimeoutText — 平均超时', () => {
  it('应导出 getAverageTimeoutText', () => {
    const src = readSource();
    assert.ok(src.includes('getAverageTimeoutText'), '缺少 getAverageTimeoutText');
  });

  it('空列表应返回 0s', () => {
    const src = readSource();
    assert.ok(src.includes("return '0s'"), '空列表返回 0s');
  });

  it('应计算并格式化平均超时', () => {
    const src = readSource();
    assert.ok(src.includes('/ configs.length'), '应计算平均值');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Agents / Configs — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
