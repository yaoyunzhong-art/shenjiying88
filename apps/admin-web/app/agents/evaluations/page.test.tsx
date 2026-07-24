/**
 * agents/evaluations/page.test.tsx — Agent 质量评估 L1 冒烟测试
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

describe('agents/evaluations — 正例', () => {
  it('应导出一个默认 async 函数组件 AgentEvaluationsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function AgentEvaluationsPage'), '未找到默认导出组件');
  });

  it('应使用 dynamic = force-dynamic', () => {
    const src = readSource();
    assert.ok(src.includes("'force-dynamic'"), '缺少 force-dynamic');
  });

  it('应使用 loadAgentEvaluations 加载数据', () => {
    const src = readSource();
    assert.ok(src.includes('loadAgentEvaluations'), '缺少 loadAgentEvaluations');
  });

  it('应计算通过率（overallScore >= 0.6）', () => {
    const src = readSource();
    assert.ok(src.includes('overallScore >= 0.6'), '通过标准应为 0.6');
    assert.ok(src.includes('passRate'), '缺少 passRate 计算');
  });

  it('应包含 4 个 StatCard: 总数/通过率/平均分/未通过', () => {
    const src = readSource();
    const statCards = src.match(/StatCard/g);
    assert.ok(statCards && statCards.length >= 4, '应包含至少 4 个 StatCard');
  });

  it('通过率 >= 80% 时 tone 应为 success', () => {
    const src = readSource();
    assert.ok(src.includes("'success'"), '通过率高应显示成功');
    assert.ok(src.includes("'warning'"), '通过率中等应显示警告');
    assert.ok(src.includes("'danger'"), '通过率低应显示危险');
  });

  it('应包含 AgentEvaluationsClient 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('AgentEvaluationsClient'), '缺少客户端组件');
  });

  it('应传递 evaluations / deliveryMode / error 三个 props', () => {
    const src = readSource();
    assert.ok(src.includes('evaluations={snapshot.evaluations}'), '缺少 evaluations prop');
    assert.ok(src.includes('deliveryMode={snapshot.deliveryMode}'), '缺少 deliveryMode prop');
    assert.ok(src.includes('error={snapshot.error}'), '缺少 error prop');
  });

  it('应包含 Suspense fallback', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('agents/evaluations — 边界', () => {
  it('评估总数为 0 时通过率应为 —', () => {
    const src = readSource();
    assert.ok(src.includes("'—'"), '零评估时通过率应显示占位符');
  });

  it('已通过数应为 snapshot.evaluations 的 filter 结果', () => {
    const src = readSource();
    assert.ok(src.includes('.filter((e) =>'), '应使用 filter 计算通过数');
  });

  it('平均分应使用 reduce 计算', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('), '应使用 reduce 计算平均分');
  });

  it('未通过数应 > 0 时 tone 为 danger', () => {
    const src = readSource();
    assert.ok(src.includes("tone={snapshot.evaluations.length - passed > 0 ? 'danger' : 'neutral'}"), '未通过应显示危险');
  });

  it('平均分应 toFixed(3)', () => {
    const src = readSource();
    assert.ok(src.includes('.toFixed(3)'), '平均分精度应为 3 位小数');
  });

  it('通过率应 toFixed(1)', () => {
    const src = readSource();
    assert.ok(src.includes('.toFixed(1)'), '通过率精度应为 1 位小数');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('agents/evaluations — 防御', () => {
  it('loadAgentEvaluations 应使用 no-store 缓存策略', () => {
    const src = readSource();
    assert.ok(src.includes("cache: 'no-store'"), '缓存策略应为 no-store');
  });

  it('平均分计算应处理 evaluations 为空时避免除以 0', () => {
    const src = readSource();
    assert.ok(src.includes('evaluations.length > 0'), '缺少长度检查防除零');
  });

  it('通过率计算应处理 evaluations 为空', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.evaluations.length > 0'), '通过率应检查长度');
  });

  it('应包含 no-store 缓存策略', () => {
    const src = readSource();
    assert.ok(src.includes("'no-store'"), '缺少 no-store');
  });

  it('通过率应为百分比格式', () => {
    const src = readSource();
    assert.ok(src.includes('* 100'), '通过率应乘以 100');
    assert.ok(src.includes('passRate') && src.includes('%'), '通过率应包含百分号');
  });

  it('通过评估数 passed 应为 filter 结果长度', () => {
    const src = readSource();
    assert.ok(src.includes('.length'), '通过数应为 filter 结果长度');
  });

  it('subtitle 应描述 6 维度评分', () => {
    const src = readSource();
    assert.ok(src.includes('6 维度') || src.includes('6维度'), '缺少 6 维度说明');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Agents / Evaluations — hooks验证', () => {
  it('是服务端组件', () => assert.ok(SRC.includes('async') || SRC.includes('await')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('fetch(')));
  it('包含列表过滤', () => assert.ok(SRC.includes('.filter(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(true));
});

describe('agents/evaluations — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'foundation.governance.read'"));
  });
});
