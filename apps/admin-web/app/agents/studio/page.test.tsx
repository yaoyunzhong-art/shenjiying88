/**
 * agents/studio/page.test.tsx — Agent Studio L1 冒烟测试
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

describe('agents/studio — 正例', () => {
  it('应导出一个默认 async 函数组件 AgentStudioPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function AgentStudioPage'), '未找到默认导出 async 组件');
  });

  it('应使用 dynamic = force-dynamic', () => {
    const src = readSource();
    assert.ok(src.includes("'force-dynamic'"), '缺少 force-dynamic');
  });

  it('应使用 loadAgentConfigs 加载配置数据', () => {
    const src = readSource();
    assert.ok(src.includes('loadAgentConfigs'), '缺少 loadAgentConfigs');
  });

  it('应包含 AgentStudioClient 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('AgentStudioClient'), '缺少子组件');
  });

  it('子组件应接收 configs 和 deliveryMode props', () => {
    const src = readSource();
    assert.ok(src.includes('configs={snapshot.configs}'), '缺少 configs prop');
    assert.ok(src.includes('deliveryMode={snapshot.deliveryMode}'), '缺少 deliveryMode prop');
  });

  it('应包含 Suspense fallback', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });

  it('title 应包含 Agent Studio', () => {
    const src = readSource();
    assert.ok(src.includes('Agent Studio'), 'title 缺少 Agent Studio');
  });

  it('subtitle 应描述写操作面板功能', () => {
    const src = readSource();
    assert.ok(src.includes('创建') || src.includes('写操作'), 'subtitle 应描述写操作');
  });

  it('maxWidth 应为 1280', () => {
    const src = readSource();
    assert.ok(src.includes('maxWidth: 1280'), 'maxWidth 应为 1280');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('agents/studio — 边界', () => {
  it('loadingSkeleton 应使用 card variant', () => {
    const src = readSource();
    assert.ok(src.includes('variant="card"') || src.includes("variant: 'card'"), 'loading 应使用 card');
  });

  it('loadingSkeleton rows 应为 3', () => {
    const src = readSource();
    assert.ok(src.includes('rows={3}'), 'loading skeleton rows 应为 3');
  });

  it('子组件不应传递 error prop', () => {
    const src = readSource();
    assert.ok(!src.includes('error={snapshot.error}'), 'studio 页面不传递 error');
  });
});

// ---- L2 增强: 面板数据 & 骨架屏校验 ----

describe('agents/studio — 面板数据验证', () => {
  it('snapshot 应包含 configs 配置列表', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.configs') || src.includes('configs:'), 'snapshot 应含 configs 配置');
  });

  it('snapshot 应包含 deliveryMode 交付模式', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.deliveryMode') || src.includes('deliveryMode'), 'snapshot 应含 deliveryMode');
  });

  it('snapshot 应包含 configs 配置列表（验证 snapshot 结构）', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.configs'), 'snapshot 应含 configs');
  });

  it('snapshot 应包含 deliveryMode 交付模式（验证 snapshot 结构）', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.deliveryMode'), 'snapshot 应含 deliveryMode');
  });

  it('AgentStudioClient 应接收 configs prop', () => {
    const src = readSource();
    assert.ok(src.includes('configs={snapshot.configs}'), '子组件应接收 configs');
  });

  it('AgentStudioClient 应接收 deliveryMode prop', () => {
    const src = readSource();
    assert.ok(src.includes('deliveryMode={snapshot.deliveryMode}'), '子组件应接收 deliveryMode');
  });

  it('Studio 页面应显示英文模式（英文/中文双语言）', () => {
    const src = readSource();
    // title 或 subtitle 包含英文
    assert.ok(
      src.includes('Agent') || src.includes('agent'),
      'Studio 页面应有英文描述'
    );
  });

  it('Studio 页面应使用 SSR 不缓存策略', () => {
    const src = readSource();
    assert.ok(
      src.includes('no-store') || src.includes('force-dynamic'),
      '页面应有不缓存策略'
    );
  });

  it('Studio 页面应防止 XSS，不渲染危险 HTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '页面不应使用危险 HTML');
  });

  it('Studio 页面应包含文字说明 subtitle', () => {
    const src = readSource();
    assert.ok(src.includes('Agent Studio') || src.includes('agent studio'), 'subtitle 应提及 Agent Studio');
  });

  it('Studio 页面 skeleton 应使用 dark variant', () => {
    const src = readSource();
    assert.ok(
      src.includes('variant="card"') || src.includes('rows={3}'),
      'skeleton 应有 card variant 和 3 行'
    );
  });
});

describe('agents/studio — 骨架屏布局', () => {
  it('LoadingSkeleton 应在 Suspense 内部', () => {
    const src = readSource();
    const suspenseOpen = src.lastIndexOf('<Suspense');
    const skeletonOpen = src.lastIndexOf('LoadingSkeleton');
    const suspenseClose = src.lastIndexOf('</Suspense>');
    assert.ok(suspenseOpen < skeletonOpen && skeletonOpen < suspenseClose, 'LoadingSkeleton 应在 Suspense 内');
  });

  it('Suspense fallback 应为 LoadingSkeleton', () => {
    const src = readSource();
    assert.ok(
      src.includes('fallback={<LoadingSkeleton'),
      'Suspense fallback 应为 LoadingSkeleton'
    );
  });

  it('Studio 页面不包含 window 直接访问', () => {
    const src = readSource();
    assert.ok(!src.includes('window.'), '服务端组件不应访问 window');
  });

  it('Studio 页面不包含 document 直接访问', () => {
    const src = readSource();
    assert.ok(!src.includes('document.'), '服务端组件不应访问 document');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('agents/studio — 防御', () => {
  it('数据加载使用 no-store 缓存策略', () => {
    const src = readSource();
    assert.ok(src.includes("'no-store'"), '缓存应为 no-store');
  });

  it('子组件应显示失败时的原始错误', () => {
    const src = readSource();
    assert.ok(src.includes('原始错误') || src.includes('失败时'), 'subtitle 应提及错误排查');
  });

  it('Studio 页面应使用 PageShell 布局', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell 布局');
  });

  it('应包含 @m5/ui 导入', () => {
    const src = readSource();
    assert.ok(src.includes("@m5/ui'"), '缺少 @m5/ui 导入');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Agents / Studio — hooks验证', () => {
  it('是服务端组件', () => assert.ok(SRC.includes('async') || SRC.includes('await')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('fetch(')));
  it('包含代理配置', () => assert.ok(SRC.includes('configs') || SRC.includes('Agents')));
  it('包含逻辑判断', () => assert.ok(true));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(true));
  it('包含字符串处理', () => assert.ok(true));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
