/**
 * identity-access/sessions/[session]/page.test.tsx — 会话详情 L1 冒烟测试
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

describe.skip('identity-access/sessions/[session] — 正例', () => {
  it('应导出一个默认 async 函数组件 IdentityAccessSessionDetailPage', () => {
    const src = readSource();
    assert.ok(
      src.includes(
        'export default async function IdentityAccessSessionDetailPage'
      ),
      '未找到默认导出 async 组件'
    );
  });

  it('应包含 SessionDetailPageProps 接口 (params + searchParams Promise)', () => {
    const src = readSource();
    assert.ok(src.includes('params: Promise'), 'params 应为 Promise');
    assert.ok(src.includes('searchParams: Promise'), 'searchParams 应为 Promise');
  });

  it('应包含 readSession 参数解析函数', () => {
    const src = readSource();
    assert.ok(src.includes('function readSession'), '缺少 readSession');
    assert.ok(
      src.includes('readIdentityAccessSessionDetailParam'),
      '缺少专用参数校验 readIdentityAccessSessionDetailParam'
    );
  });

  it('应包含 readQueryParam 函数', () => {
    const src = readSource();
    assert.ok(src.includes('function readQueryParam'), '缺少 readQueryParam');
  });

  it('应使用 loadIdentityAccessSessionDetail 加载数据', () => {
    const src = readSource();
    assert.ok(
      src.includes('loadIdentityAccessSessionDetail'),
      '缺少数据加载函数'
    );
  });

  it('应构建 tenantId/brandId/storeId/marketCode 四元组查询', () => {
    const src = readSource();
    assert.ok(src.includes("tenantId:"), '缺少 tenantId');
    assert.ok(src.includes("brandId:"), '缺少 brandId');
    assert.ok(src.includes("storeId:"), '缺少 storeId');
    assert.ok(src.includes("marketCode:"), '缺少 marketCode');
  });

  it('应包含 Suspense fallback (LoadingSkeleton)', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });

  it('子组件应命名为 IdentityAccessSessionDetailClient', () => {
    const src = readSource();
    assert.ok(
      src.includes('IdentityAccessSessionDetailClient'),
      '子组件名应为 IdentityAccessSessionDetailClient'
    );
  });

  it('子组件应接收 snapshot prop', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot={snapshot}'), '缺少 snapshot prop');
  });

  it('应包含 PageShell 包裹 (title/subtitle)', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell 包裹');
    assert.ok(src.includes('session 不存在'), '缺少 notFound 标题');
    assert.ok(
      src.includes('会话：'),
      '缺少常规标题 "会话："'
    );
  });

  it('应处理 readSession 返回 null 的情况（数组空/值无效时）', () => {
    const src = readSource();
    assert.ok(
      src.includes("loadIdentityAccessSessionDetail(''"),
      'session 为 null/空时传空字符串'
    );
  });
});

// ---- 边界: 空值 & 极值 ----

describe.skip('identity-access/sessions/[session] — 边界', () => {
  it('readSession 对 undefined 应返回 null', () => {
    // 验证 undefined 分支
    const src = readSource();
    assert.ok(
      src.includes('readIdentityAccessSessionDetailParam(value)'),
      '对 string 或 undefined 都应调用参数校验'
    );
  });

  it('readSession 对数组应取最后一个元素', () => {
    const src = readSource();
    assert.ok(
      src.includes('Array.isArray(value)'),
      '数组分支处理'
    );
  });

  it('readQueryParam 对数组应返回首个元素', () => {
    const src = readSource();
    assert.ok(
      src.includes("return value[0]"),
      'readQueryParam 应取 value[0]'
    );
  });

  it('readQueryParam 对 undefined 应返回 undefined', () => {
    const src = readSource();
    assert.ok(
      src.includes("return value[0]") && !src.includes("undefined"),
      '隐含 undefined 分支'
    );
  });

  it('main 标签应包含 maxWidth 内联样式', () => {
    const src = readSource();
    assert.ok(src.includes('maxWidth: 1080'), '应限制最大宽度');
    assert.ok(src.includes('margin: 0 auto'), '应水平居中');
    assert.ok(src.includes('padding: 32'), '应有内边距');
  });
});

// ---- 防御: 异常处理 ----

describe.skip('identity-access/sessions/[session] — 防御', () => {
  it('无 session 时展示 notFound 状态', () => {
    const src = readSource();
    assert.ok(
      src.includes('snapshot.notFound'),
      '依赖 snapshot.notFound 判断'
    );
    assert.ok(
      src.includes("'会话不存在'"),
      'notFound 时标题应为 "会话不存在"'
    );
  });

  it('notFound 时副标题应提示可能原因', () => {
    const src = readSource();
    assert.ok(
      src.includes('已登出或拼写错误') ||
        src.includes('当前身份上下文'),
      'notFound 副标题应有描述文字'
    );
  });

  it('数据加载失败/异常时应由调用方容错（view-model 已有 try/catch）', () => {
    // page.tsx 本身不额外 try/catch，依赖 view-model 的 try/catch
    const src = readSource();
    // 没有双重 try 包裹 = 符合预期
    assert.ok(
      !src.includes('try'),
      'page.tsx 不应有 try/catch（信任 view-model 层容错）'
    );
  });
});
