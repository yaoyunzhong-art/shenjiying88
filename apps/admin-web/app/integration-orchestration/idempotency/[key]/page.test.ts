/**
 * integration-orchestration/idempotency/[key]/page.test.ts — 幂等记录详情 L1 冒烟测试
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

describe('integration-orchestration/idempotency/[key] — 正例', () => {
  it('应导出一个默认 async 函数组件 IntegrationOrchestrationIdempotencyDetailPage', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default async function IntegrationOrchestrationIdempotencyDetailPage'),
      '未找到默认导出 async 组件'
    );
  });

  it('应包含 IntegrationOrchestrationIdempotencyDetailPageProps 接口', () => {
    const src = readSource();
    assert.ok(src.includes('params: Promise'), 'params 应为 Promise');
    assert.ok(src.includes('key?: string | string[]'), 'key 应为 string | string[]');
  });

  it('应包含 readIdempotencyKey 参数解析函数', () => {
    const src = readSource();
    assert.ok(src.includes('function readIdempotencyKey'), '缺少 readIdempotencyKey');
    assert.ok(
      src.includes('readIntegrationOrchestrationIdempotencyDetailParam'),
      '缺少专用参数验证'
    );
  });

  it('应使用 loadIntegrationOrchestrationIdempotencyDetail 加载数据', () => {
    const src = readSource();
    assert.ok(
      src.includes('loadIntegrationOrchestrationIdempotencyDetail'),
      '缺少数据加载函数'
    );
  });

  it('应包含 Suspense 和 LoadingSkeleton fallback', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
    assert.ok(src.includes('variant=\"card\"'), 'LoadingSkeleton variant 应为 card');
  });

  it('子组件应接收 snapshot prop', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot={snapshot}'), '缺少 snapshot prop');
  });

  it('应使用 PageShell 作为页面容器', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 title 和 subtitle', () => {
    const src = readSource();
    assert.ok(src.includes('title='), '缺少 title prop');
    assert.ok(src.includes('subtitle='), '缺少 subtitle prop');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('integration-orchestration/idempotency/[key] — 边界', () => {
  it('key 为空/null 时应传空字符串', () => {
    const src = readSource();
    assert.ok(src.includes('key ??'), 'key 应有 nullish coalescing');
  });

  it('snapshot.notFound 为 true 时应显示幂等记录不存在', () => {
    const src = readSource();
    assert.ok(src.includes("'幂等记录不存在'"), 'notFound 标题应为幂等记录不存在');
  });

  it('notFound subtitle 应描述事件已归档或未触发', () => {
    const src = readSource();
    assert.ok(
      src.includes('已归档') || src.includes('未触发') || src.includes('未出现'),
      'notFound 应包含归档/未触发提示'
    );
  });

  it('title 应 fallback 到 snapshot.key', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.key'), 'title 应有 key fallback');
  });

  it('数据加载缓存策略应为 no-store', () => {
    const src = readSource();
    assert.ok(src.includes("'no-store'"), '缓存应为 no-store');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('integration-orchestration/idempotency/[key] — 防御', () => {
  it('readIdempotencyKey 应处理 Array.isArray 情况', () => {
    const src = readSource();
    assert.ok(src.includes('Array.isArray(value)'), '缺少数组处理逻辑');
  });

  it('readIdempotencyKey 返回类型包含 null', () => {
    const src = readSource();
    assert.ok(src.includes('string | null'), 'readIdempotencyKey 返回类型包含 null');
  });

  it('应使用 no-store 防止缓存污染', () => {
    const src = readSource();
    assert.ok(src.includes("'no-store'"), '必须使用 no-store');
  });

  it('maxWidth 应为 1080', () => {
    const src = readSource();
    assert.ok(src.includes('maxWidth: 1080'), 'maxWidth 应为 1080');
  });

  it('Suspense fallback 应包含 label', () => {
    const src = readSource();
    assert.ok(src.includes('label='), 'LoadingSkeleton 缺少 label prop');
  });

  it('readIdempotencyKey 应处理 string | string[] | undefined', () => {
    const src = readSource();
    assert.ok(
      src.includes('value: string | string[] | undefined'),
      'readIdempotencyKey 参数类型应为 string | string[] | undefined'
    );
  });
});
