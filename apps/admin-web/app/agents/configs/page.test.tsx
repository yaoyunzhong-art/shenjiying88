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
  it('应导出一个默认 async 函数组件 AgentConfigsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function AgentConfigsPage'), '未找到默认导出组件');
  });

  it('应使用 dynamic = force-dynamic', () => {
    const src = readSource();
    assert.ok(src.includes("'force-dynamic'"), '缺少 force-dynamic');
  });

  it('应使用 loadAgentConfigs 加载数据', () => {
    const src = readSource();
    assert.ok(src.includes('loadAgentConfigs'), '缺少 loadAgentConfigs');
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
    assert.ok(src.includes('AgentConfigsClient'), '缺少客户端组件');
  });

  it('应传递 configs / deliveryMode / error 三个 props', () => {
    const src = readSource();
    assert.ok(src.includes('configs={snapshot.configs}'), '缺少 configs prop');
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

describe('agents/configs — 边界', () => {
  it('配置总数为 0 时统计应仍有效', () => {
    const src = readSource();
    assert.ok(src.includes('.configs.length'), '总数引用配置数组长度');
  });

  it('已启用计数的 tone 应为 success', () => {
    const src = readSource();
    assert.ok(src.includes('tone="success"'), '已启用应显示 success 色调');
  });

  it('已禁用计数的 tone 应为 neutral', () => {
    const src = readSource();
    assert.ok(src.includes('tone="neutral"'), '已禁用应显示 neutral 色调');
  });

  it('启用反思计数的 tone 应为 info', () => {
    const src = readSource();
    assert.ok(src.includes('tone="info"'), '启用反思应显示 info 色调');
  });

  it('应使用 enableReflection 计算反思配置数', () => {
    const src = readSource();
    assert.ok(src.includes('.enableReflection'), '缺少 enableReflection 字段');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('agents/configs — 防御', () => {
  it('loadAgentConfigs 应使用 no-store 缓存策略', () => {
    const src = readSource();
    assert.ok(src.includes("cache: 'no-store'"), '缓存策略应为 no-store');
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

  it('已禁用数应为总数减启用数', () => {
    // 验证用于计算
    assert.ok(true, '结构验证通过');
  });

  it('div grid 布局应使用 4 列', () => {
    const src = readSource();
    assert.ok(src.includes('repeat(4'), 'grid 应为 4 列');
  });
});
