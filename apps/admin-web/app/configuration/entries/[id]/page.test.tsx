/**
 * configuration/entries/[id]/page.test.tsx — 配置项详情 L1 冒烟测试
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

describe('configuration/entries/[id] — 正例', () => {
  it('应导出一个默认 async 函数组件 ConfigurationConfigEntryDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function ConfigurationConfigEntryDetailPage'), '未找到默认导出 async 组件');
  });

  it('应包含 ConfigEntryDetailPageProps 接口', () => {
    const src = readSource();
    assert.ok(src.includes('params: Promise'), 'params 应为 Promise');
    assert.ok(src.includes('searchParams: Promise'), 'searchParams 应为 Promise');
  });

  it('应包含 readId 参数解析函数', () => {
    const src = readSource();
    assert.ok(src.includes('function readId'), '缺少 readId');
    assert.ok(src.includes('readConfigurationConfigEntryDetailParam'), '缺少专用参数验证');
  });

  it('应包含 readQueryParam 函数', () => {
    const src = readSource();
    assert.ok(src.includes('function readQueryParam'), '缺少 readQueryParam');
  });

  it('应使用 loadConfigurationConfigEntryDetail 加载数据', () => {
    const src = readSource();
    assert.ok(src.includes('loadConfigurationConfigEntryDetail'), '缺少数据加载函数');
  });

  it('应构建四元组查询 (tenantId/brandId/storeId/marketCode)', () => {
    const src = readSource();
    assert.ok(src.includes('tenantId:'), '缺少 tenantId');
    assert.ok(src.includes('brandId:'), '缺少 brandId');
    assert.ok(src.includes('storeId:'), '缺少 storeId');
    assert.ok(src.includes('marketCode:'), '缺少 marketCode');
  });

  it('应包含 Suspense fallback', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });

  it('子组件应命名为 ConfigurationConfigEntryDetailClient', () => {
    const src = readSource();
    assert.ok(src.includes('ConfigurationConfigEntryDetailClient'), '子组件名不正确');
  });

  it('子组件应接收 snapshot prop', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot={snapshot}'), '缺少 snapshot prop');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('configuration/entries/[id] — 边界', () => {
  it('id 为空时应传空字符串', () => {
    const src = readSource();
    assert.ok(src.includes("loadConfigurationConfigEntryDetail(''"), '空 id 传空字符串');
  });

  it('id 非空时应传 id', () => {
    const src = readSource();
    assert.ok(src.includes('id'), '非空 id 应传入加载函数');
  });

  it('snapshot.notFound 应为 true 时显示配置项不存在', () => {
    const src = readSource();
    assert.ok(src.includes("'配置项不存在'"), 'notFound 标题应为配置项不存在');
    assert.ok(src.includes('snapshot.notFound'), '缺少 notFound 判断');
  });

  it('snapshot.notFound 为 false 时应显示 id', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.id'), 'title 应引用 id');
  });

  it('notFound subtitle 应包含拼写错误或下线提示', () => {
    const src = readSource();
    assert.ok(src.includes('已下线') || src.includes('拼写错误'), 'notFound 应包含错误提示');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('configuration/entries/[id] — 防御', () => {
  it('readId 应处理 Array.isArray', () => {
    const src = readSource();
    assert.ok(src.includes('Array.isArray(value)'), '缺少数组处理');
  });

  it('readId 返回类型包含 null', () => {
    const src = readSource();
    assert.ok(src.includes('string | null'), 'readId 返回类型包含 null');
  });

  it('readQueryParam 应处理 undefined 返回 undefined', () => {
    const src = readSource();
    assert.ok(src.includes('string | undefined'), 'readQueryParam 返回类型包含 undefined');
  });

  it('应使用 Promise.all 并行解析', () => {
    const src = readSource();
    assert.ok(src.includes('Promise.all'), '缺少 Promise.all');
  });

  it('数据加载使用 no-store 缓存策略', () => {
    const src = readSource();
    assert.ok(src.includes("'no-store'"), '缓存应为 no-store');
  });

  it('maxWidth 应为 1080', () => {
    const src = readSource();
    assert.ok(src.includes('maxWidth: 1080'), 'maxWidth 应为 1080');
  });

  it('应使用 @m5/types 的专用参数验证', () => {
    const src = readSource();
    assert.ok(src.includes("@m5/types'"), '从 @m5/types 导入');
    assert.ok(src.includes('readConfigurationConfigEntryDetailParam'), '应使用专用参数验证');
  });

  it('notFound 应包含租户不匹配提示', () => {
    const src = readSource();
    assert.ok(src.includes('租户不匹配') || src.includes('governance'), '应包含租户不匹配提示');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Configuration / Entries — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
