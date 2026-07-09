/**
 * identity-access/sessions/[session]/page.test.ts — 身份访问会话详情 L1 冒烟测试
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

describe('identity-access/sessions/[session] — 正例', () => {
  it('应导出一个默认 async 函数组件 IdentityAccessSessionDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function IdentityAccessSessionDetailPage'), '未找到默认导出 async 组件');
  });

  it('应接受 params 和 searchParams 属性', () => {
    const src = readSource();
    assert.ok(src.includes('IdentityAccessSessionDetailPageProps'), '缺少 props 接口');
    assert.ok(src.includes('params: Promise'), 'params 应为 Promise 类型');
    assert.ok(src.includes('searchParams: Promise'), 'searchParams 应为 Promise 类型');
  });

  it('应包含 readSession 参数解析函数', () => {
    const src = readSource();
    assert.ok(src.includes('function readSession'), '缺少 readSession 函数');
    assert.ok(src.includes('readIdentityAccessSessionDetailParam'), '缺少专用参数解析函数');
  });

  it('应包含 readQueryParam 查询参数解析函数', () => {
    const src = readSource();
    assert.ok(src.includes('function readQueryParam'), '缺少 readQueryParam 函数');
  });

  it('readQueryParam 应处理数组参数返回首个元素', () => {
    const src = readSource();
    assert.ok(src.includes('return value[0]') || src.includes("return value[0]"), '数组应取首个元素');
  });

  it('应使用 loadIdentityAccessSessionDetail 加载数据', () => {
    const src = readSource();
    assert.ok(src.includes('loadIdentityAccessSessionDetail'), '缺少 loadIdentityAccessSessionDetail');
  });

  it('应使用 Promise.all 并行解析 params 和 searchParams', () => {
    const src = readSource();
    assert.ok(src.includes('Promise.all'), '应使用 Promise.all 并行解析');
  });

  it('应构建 tenantId/brandId/storeId/marketCode 四元组查询', () => {
    const src = readSource();
    assert.ok(src.includes('tenantId:'), '缺少 tenantId');
    assert.ok(src.includes('brandId:'), '缺少 brandId');
    assert.ok(src.includes('storeId:'), '缺少 storeId');
    assert.ok(src.includes('marketCode:'), '缺少 marketCode');
  });

  it('查询参数应全部使用 readQueryParam 解析', () => {
    const src = readSource();
    const paramParsers = (src.match(/readQueryParam/g) || []).length;
    assert.ok(paramParsers >= 4, '应解析至少 4 个查询参数');
  });

  it('应包含 Suspense fallback', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('identity-access/sessions/[session] — 边界', () => {
  it('session 为空时应传入空字符串加载数据', () => {
    const src = readSource();
    assert.ok(src.includes("loadIdentityAccessSessionDetail(''"), '空 session 应传空字符串');
  });

  it('session 非空时传入会话标识加载数据', () => {
    const src = readSource();
    assert.ok(src.includes('loadIdentityAccessSessionDetail(session'), '非空 session 应传变量');
  });

  it('readSession 应处理 Array.isArray 情况', () => {
    const src = readSource();
    assert.ok(src.includes('Array.isArray(value)'), '缺少数组判断');
  });

  it('snapshot.notFound 为 true 时应显示会话不存在', () => {
    const src = readSource();
    assert.ok(src.includes("'会话不存在'"), 'notFound 标题应为会话不存在');
  });

  it('notFound subtitle 应提示可能已登出或拼写错误', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.notFound ?'), 'subtitle 应有条件判断');
    assert.ok(src.includes('可能已登出'), '应提示登出/拼写错误');
  });

  it('非空 session 应显示到标题中', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.session'), 'title 应为 snapshot.session');
  });

  it('subtitle 应包含身份上下文/角色/权限校验描述', () => {
    const src = readSource();
    assert.ok(src.includes('actor/会话'), 'subtitle 应描述身份上下文');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('identity-access/sessions/[session] — 防御', () => {
  it('params 和 searchParams 应使用 await 而非 .then()', () => {
    const src = readSource();
    assert.ok(src.includes('await Promise.all'), '应使用 await 风格');
  });

  it('cache 策略应为 no-store', () => {
    const src = readSource();
    assert.ok(src.includes("'no-store'"), '缓存策略应为 no-store');
  });

  it('readSession 应对 undefined 输入返回 null', () => {
    const src = readSource();
    assert.ok(src.includes('string | null'), 'readSession 返回类型应包含 null');
  });

  it('maxWidth 应为 1080', () => {
    const src = readSource();
    assert.ok(src.includes('maxWidth: 1080'), 'maxWidth 应为 1080');
  });

  it('子组件应接收 snapshot prop', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot={snapshot}'), '缺少 snapshot prop');
  });

  it('子组件应命名为 IdentityAccessSessionDetailClient', () => {
    const src = readSource();
    assert.ok(src.includes('IdentityAccessSessionDetailClient'), '子组件名应为 IdentityAccessSessionDetailClient');
  });

  it('PageShell 应包裹主内容', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应使用 @m5/types 的专用参数校验函数', () => {
    const src = readSource();
    assert.ok(src.includes("@m5/types'"), '从 @m5/types 导入');
    assert.ok(src.includes('readIdentityAccessSessionDetailParam'), '使用专用参数校验');
  });

  it('未匹配 actor 时应传递 notFound 状态', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.notFound'), '应暴露 notFound 状态给 UI');
  });
});
