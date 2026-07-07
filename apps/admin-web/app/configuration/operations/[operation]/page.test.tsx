/**
 * configuration/operations/[operation]/page.test.tsx — 配置操作边界 L1 冒烟测试
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

describe('configuration/operations/[operation] — 正例', () => {
  it('应导出一个默认 async 函数组件 ConfigurationOperationDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function ConfigurationOperationDetailPage'), '未找到默认导出 async 组件');
  });

  it('应包含 OperationDetailPageProps 接口', () => {
    const src = readSource();
    assert.ok(src.includes('params: Promise'), 'params 应为 Promise');
  });

  it('应包含 readOperation 参数解析函数', () => {
    const src = readSource();
    assert.ok(src.includes('function readOperation'), '缺少 readOperation');
    assert.ok(src.includes('readConfigurationOperationDetailParam'), '缺少专用参数验证');
  });

  it('应使用 loadConfigurationOperationDetail 加载数据', () => {
    const src = readSource();
    assert.ok(src.includes('loadConfigurationOperationDetail'), '缺少数据加载函数');
  });

  it('应包含 Suspense fallback', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });

  it('子组件应命名为 ConfigurationOperationDetailClient', () => {
    const src = readSource();
    assert.ok(src.includes('ConfigurationOperationDetailClient'), '子组件名不正确');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('configuration/operations/[operation] — 边界', () => {
  it('operation 为空时应传空字符串', () => {
    const src = readSource();
    assert.ok(src.includes("loadConfigurationOperationDetail(''"), '空 operation 传空字符串');
  });

  it('snapshot.notFound 为 true 时应显示操作边界不存在', () => {
    const src = readSource();
    assert.ok(src.includes("'操作边界不存在'"), 'notFound 标题应为操作边界不存在');
    assert.ok(src.includes('snapshot.notFound'), '缺少 notFound 判断');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('configuration/operations/[operation] — 防御', () => {
  it('readOperation 应处理 Array.isArray', () => {
    const src = readSource();
    assert.ok(src.includes('Array.isArray(value)'), '缺少数组处理');
  });

  it('readOperation 返回类型包含 null', () => {
    const src = readSource();
    assert.ok(src.includes('string | null'), 'readOperation 返回类型包含 null');
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
    assert.ok(src.includes('readConfigurationOperationDetailParam'), '使用专用参数验证');
  });

  it('subtitle 应描述 RBAC 和审批边界', () => {
    const src = readSource();
    assert.ok(src.includes('RBAC') || src.includes('审批'), 'subtitle 应提及 RBAC/审批');
  });

  it('此页面不包含 searchParams（特殊场景）', () => {
    const src = readSource();
    assert.ok(!src.includes('searchParams'), '该页面不应有 searchParams');
  });
});
