/**
 * integration-orchestration/events/[envelopeId]/page.test.tsx — 事件信封详 L1 冒烟测试
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

describe('integration-orchestration/events/[envelopeId] — 正例', () => {
  it('应导出一个默认 async 函数组件 IntegrationOrchestrationEventDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function IntegrationOrchestrationEventDetailPage'), '未找到默认导出 async 组件');
  });

  it('应包含 EventDetailPageProps 接口', () => {
    const src = readSource();
    assert.ok(src.includes('params: Promise'), 'params 应为 Promise');
  });

  it('应包含 readEnvelopeId 参数解析函数', () => {
    const src = readSource();
    assert.ok(src.includes('function readEnvelopeId'), '缺少 readEnvelopeId');
    assert.ok(src.includes('readIntegrationOrchestrationEventDetailParam'), '缺少专用参数验证');
  });

  it('应使用 loadIntegrationOrchestrationEventDetail 加载数据', () => {
    const src = readSource();
    assert.ok(src.includes('loadIntegrationOrchestrationEventDetail'), '缺少数据加载函数');
  });

  it('应包含 Suspense fallback', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });

  it('子组件应接收 snapshot prop', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot={snapshot}'), '缺少 snapshot prop');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('integration-orchestration/events/[envelopeId] — 边界', () => {
  it('envelopeId 为 null 时应传空字符串或默认值', () => {
    const src = readSource();
    assert.ok(src.includes('envelopeId ??'), 'envelopeId 应有 nullish coalescing');
  });

  it('snapshot.notFound 为 true 时应显示事件信封不存在', () => {
    const src = readSource();
    assert.ok(src.includes("'事件信封不存在'"), 'notFound 标题应为事件信封不存在');
  });

  it('notFound subtitle 应描述 ID 有误或已归档', () => {
    const src = readSource();
    assert.ok(src.includes('已归档') || src.includes('输入有误'), 'notFound 应包含归档提示');
  });

  it('title 应 fallback 到 envelopeId', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.envelopeId'), 'title 应有 envelopeId fallback');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('integration-orchestration/events/[envelopeId] — 防御', () => {
  it('readEnvelopeId 应处理 Array.isArray', () => {
    const src = readSource();
    assert.ok(src.includes('Array.isArray(value)'), '缺少数组处理');
  });

  it('readEnvelopeId 返回类型包含 null', () => {
    const src = readSource();
    assert.ok(src.includes('string | null'), 'readEnvelopeId 返回类型包含 null');
  });

  it('数据加载使用 no-store', () => {
    const src = readSource();
    assert.ok(src.includes("'no-store'"), '缓存应为 no-store');
  });

  it('maxWidth 应为 1080', () => {
    const src = readSource();
    assert.ok(src.includes('maxWidth: 1080'), 'maxWidth 应为 1080');
  });

  it('应使用 @m5/types 参数验证', () => {
    const src = readSource();
    assert.ok(src.includes("@m5/types'"), '从 @m5/types 导入');
  });

  it('subtitle 应提及 payload 和幂等记录', () => {
    const src = readSource();
    assert.ok(src.includes('payload') || src.includes('幂等'), 'subtitle 应描述 payload/幂等');
  });
});
