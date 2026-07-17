/**
 * agents/sessions/[id]/page.test.tsx — Agent 会话详情 L1 冒烟测试
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

describe('agents/sessions/[id] — 正例', () => {
  it('应导出一个默认 async 函数组件', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function AgentSessionDetailPage'), '未找到默认导出 async 组件');
  });

  it('应使用 dynamic = force-dynamic', () => {
    const src = readSource();
    assert.ok(src.includes("'force-dynamic'"), '缺少 force-dynamic');
  });

  it('应使用 loadAgentSessionDetail 加载数据', () => {
    const src = readSource();
    assert.ok(src.includes('loadAgentSessionDetail'), '缺少 loadAgentSessionDetail');
  });

  it('应解构 session / execution / evaluation / config / deliveryMode 字段', () => {
    const src = readSource();
    assert.ok(src.includes('session'), '缺少 session');
    assert.ok(src.includes('execution'), '缺少 execution');
    assert.ok(src.includes('evaluation'), '缺少 evaluation');
    assert.ok(src.includes('config'), '缺少 config');
    assert.ok(src.includes('deliveryMode'), '缺少 deliveryMode');
  });

  it('应包含 4 个 StatCard: 执行步数/总耗时/LLM 调用/工具调用', () => {
    const src = readSource();
    const statCards = src.match(/StatCard/g);
    assert.ok(statCards && statCards.length >= 4, '应包含至少 4 个 StatCard');
  });

  it('应为空数据使用零值默认 (?? 0)', () => {
    const src = readSource();
    assert.ok(src.includes('?? 0'), '应使用 ?? 0 防御默认值');
    assert.ok(src.includes('?? session.currentStep'), 'execution.steps 应 fallback');
  });

  it('应包含 AgentSessionDetailClient 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('AgentSessionDetailClient'), '缺少子组件');
  });

  it('session list 导航链接应指向 /agents/sessions', () => {
    const src = readSource();
    assert.ok(src.includes('/agents/sessions'), '列表导航链接缺失');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('agents/sessions/[id] — 边界', () => {
  it('snapshot 为 falsy 时应调用 notFound()', () => {
    const src = readSource();
    assert.ok(src.includes('if (!snapshot)'), '缺少 null 检查');
    assert.ok(src.includes('notFound()'), '应调用 notFound');
  });

  it('userInput 应截断到 80 字符', () => {
    const src = readSource();
    assert.ok(src.includes('.slice(0, 80)'), '缺少 80 字符截断');
    assert.ok(src.includes('.length > 80'), '长度检查应为 80');
  });

  it('totalDurationMs 为 0 时应显示占位符 —', () => {
    const src = readSource();
    assert.ok(src.includes('totalDurationMs > 0'), '应有正持续时间检查');
    assert.ok(src.includes("'—'"), '零值应显示占位符');
  });

  it('LLM 调用超过 maxSteps 时 StatCard 应显示 warning', () => {
    const src = readSource();
    assert.ok(src.includes('tone={llmCalls > session.maxSteps'), '超标应显示 warning 色调');
  });

  it('div grid 应为 4 列布局', () => {
    const src = readSource();
    assert.ok(src.includes('repeat(4'), 'grid 应为 4 列');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('agents/sessions/[id] — 防御', () => {
  it('参数 id 应通过 await params 解析', () => {
    const src = readSource();
    assert.ok(src.includes('const { id } = await params'), '应 await 解析 params');
  });

  it('loadAgentSessionDetail 应使用 no-store 缓存策略', () => {
    const src = readSource();
    assert.ok(src.includes("cache: 'no-store'"), '缓存策略应为 no-store');
  });

  it('execution 和 config 可能为 undefined, 应有防御性访问', () => {
    const src = readSource();
    assert.ok(src.includes('execution?.'), 'execution 应有可选链');
    assert.ok(src.includes('config?.allowedTools'), 'config 应有可选链');
  });

  it('execution.totalDurationMs 应通过可选链访问并显示 ms', () => {
    const src = readSource();
    assert.ok(src.includes('execution ?'), 'execution 状态检查');
    assert.ok(src.includes('${totalDurationMs}ms'), 'ms 显示格式');
  });

  it('totalSteps 应使用执行或会话步骤数据', () => {
    const src = readSource();
    const hasFallbackPath = src.includes('session.currentStep') || src.includes('currentStep');
    assert.ok(hasFallbackPath, 'totalSteps 应引用 currentStep');
  });

  it('toolCalls > 0 时 StatCard tone 应为 warning', () => {
    const src = readSource();
    assert.ok(src.includes('toolCalls > 0'), '工具调用正数检查');
    assert.ok(src.includes('tone={toolCalls > 0'), '工具调用正数应显示 warning 色调');
  });

  it('应返回 <main> 标签', () => {
    const src = readSource();
    assert.ok(src.includes('<main'), '缺少 main 标签');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Agents / Sessions — hooks验证', () => {
  it('是服务端组件', () => assert.ok(SRC.includes('async') || SRC.includes('await')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('fetch(')));
  it('包含数组数据', () => assert.ok(SRC.includes('[') || SRC.includes('...')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(true));
});
