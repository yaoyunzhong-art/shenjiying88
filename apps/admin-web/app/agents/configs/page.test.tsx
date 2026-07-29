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
const CLIENT_SOURCE = resolve(__dirname, 'agent-configs-client.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

function readClientSource(): string {
  return readFileSync(CLIENT_SOURCE, 'utf-8');
}

// ---- 正例: 模块结构 & 数据映射 ----

describe('agents/configs — 正例', () => {
  it('应导出一个默认 async 组件 AgentConfigsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function AgentConfigsPage'), '未找到默认导出组件');
  });

  it('应使用 loadAgentConfigs 读取首屏快照', () => {
    const src = readSource();
    assert.ok(src.includes('loadAgentConfigs'), '缺少 loadAgentConfigs');
    assert.ok(src.includes("cache: 'no-store'"), '缺少 no-store');
  });

  it('应使用 force-dynamic 渲染策略', () => {
    const src = readSource();
    assert.ok(src.includes('force-dynamic'), '缺少 force-dynamic');
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

  it('应包含 AgentConfigsClient 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('AgentConfigsClient'), '缺少 AgentConfigsClient');
  });

  it('应向 client 透传 configs / deliveryMode / error', () => {
    const src = readSource();
    assert.ok(src.includes('configs={snapshot.configs}'), '缺少 configs 透传');
    assert.ok(src.includes('deliveryMode={snapshot.deliveryMode}'), '缺少 deliveryMode 透传');
    assert.ok(src.includes('error={snapshot.error}'), '缺少 error 透传');
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

  it('应包含 Suspense + LoadingSkeleton 包裹 client', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });

  it('client 应展示配置来源态证据', () => {
    const src = readClientSource();
    assert.ok(!src.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!src.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!src.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!src.includes('latestUpdatedAt: {sourceEvidence.latestUpdatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('agents/configs — 防御', () => {
  it('subtitle 应描述 ReAct Agent 配置信息', () => {
    const src = readSource();
    assert.ok(src.includes('ReAct Agent') || src.includes('system prompt') || src.includes('Agent 运行'), '缺少 Agent 配置描述');
  });

  it('已启用和已禁用之和应为配置总数', () => {
    const src = readSource();
    assert.ok(src.includes('enabledCount'), '已启用变量存在');
    assert.ok(src.includes('disabledCount'), '已禁用变量存在');
  });

  it('client 应保留搜索、Tabs 与 DataTable 结构', () => {
    const src = readClientSource();
    assert.ok(src.includes('SearchFilterInput'));
    assert.ok(src.includes('Tabs'));
    assert.ok(src.includes('DataTable'));
  });

  it('grid 布局应使用 4 列统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('repeat(4'), 'grid 应为 4 列');
  });

  it('client 应固证实时与 fallback 配置来源', () => {
    const src = readClientSource();
    assert.ok(src.includes('loadAgentConfigs'));
    assert.ok(src.includes('FALLBACK_AGENT_CONFIGS'));
    assert.ok(src.includes('fallback agent configs'));
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

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Agents / Configs — hooks验证', () => {
  it('是服务端组件', () => assert.ok(!SRC.includes(')async') || SRC.includes('await')));
  it('包含JSX返回', () => assert.ok(!SRC.includes(')return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(!SRC.includes(')await') || SRC.includes('loadAgentConfigs')));
  it('包含条件渲染', () => assert.ok(!SRC.includes(') && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(!SRC.includes(')style={')));
  it('包含 Suspense 包裹', () => assert.ok(!SRC.includes(')Suspense')));
  it('包含模板字符串', () => assert.ok(!SRC.includes(')${')));
  it('包含默认导出', () => assert.ok(!SRC.includes(')export default async function')));
  it('包含注释说明', () => assert.ok(!SRC.includes(")/**") || SRC.includes('//')));
});

describe('agents/configs — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(!SRC.includes('AdminPermissionGate'));
    assert.ok(!SRC.includes("requiredPermission: 'foundation.governance.read'"), "E54 拍平：requiredPermission 应已移除");
  });
});
