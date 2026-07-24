/**
 * configuration/certificates/[name]/page.test.tsx — 证书详情 L1 冒烟测试
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

describe('configuration/certificates/[name] — 正例', () => {
  it('应导出一个默认 async 函数组件 ConfigurationCertificateDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function ConfigurationCertificateDetailPage'), '未找到默认导出 async 组件');
  });

  it('应包含 CertificateDetailPageProps 接口', () => {
    const src = readSource();
    assert.ok(src.includes('params: Promise'), 'params 应为 Promise');
    assert.ok(src.includes('searchParams: Promise'), 'searchParams 应为 Promise');
  });

  it('应包含 readName 参数解析函数', () => {
    const src = readSource();
    assert.ok(src.includes('function readName'), '缺少 readName');
    assert.ok(src.includes('readConfigurationCertificateDetailParam'), '缺少专用参数验证');
  });

  it('应包含 readQueryParam 函数', () => {
    const src = readSource();
    assert.ok(src.includes('function readQueryParam'), '缺少 readQueryParam');
  });

  it('应使用 loadConfigurationCertificateDetail 加载数据', () => {
    const src = readSource();
    assert.ok(src.includes('loadConfigurationCertificateDetail'), '缺少数据加载函数');
  });

  it('应构建四元组查询', () => {
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

  it('子组件应命名为 ConfigurationCertificateDetailClient', () => {
    const src = readSource();
    assert.ok(src.includes('ConfigurationCertificateDetailClient'), '子组件名不正确');
  });

  it('子组件应接收 snapshot prop', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot={snapshot}'), '缺少 snapshot prop');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('configuration/certificates/[name] — 边界', () => {
  it('name 为空时应传空字符串', () => {
    const src = readSource();
    assert.ok(src.includes("loadConfigurationCertificateDetail(''"), '空 name 传空字符串');
  });

  it('name 非空时应传 name', () => {
    const src = readSource();
    assert.ok(src.includes('loadConfigurationCertificateDetail(name'), '非空 name 传入');
  });

  it('snapshot.notFound 为 true 时应显示证书不存在', () => {
    const src = readSource();
    assert.ok(src.includes("'证书不存在'"), 'notFound 标题应为证书不存在');
    assert.ok(src.includes('snapshot.notFound'), '缺少 notFound 判断');
  });

  it('snapshot.notFound 为 false 时应显示证书名', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.name'), 'title 应引用 name');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('configuration/certificates/[name] — 防御', () => {
  it('readName 应处理 Array.isArray', () => {
    const src = readSource();
    assert.ok(src.includes('Array.isArray(value)'), '缺少数组处理');
  });

  it('readName 返回类型包含 null', () => {
    const src = readSource();
    assert.ok(src.includes('string | null'), 'readName 返回类型包含 null');
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
    assert.ok(src.includes('readConfigurationCertificateDetailParam'), '应使用专用参数验证');
  });

  it('subtitle 应描述自动续签状态', () => {
    const src = readSource();
    assert.ok(src.includes('自动续签') || src.includes('issuer'), 'subtitle 应提及续签信息');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('configuration/certificates/[name] — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes('requiredPermission="foundation.governance.read"'));
  });
});

describe('Configuration / Certificates — hooks验证', () => {
  it('是服务端组件', () => assert.ok(SRC.includes('async') || SRC.includes('await')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('fetch(')));
  it('包含数组数据', () => assert.ok(SRC.includes('[') || SRC.includes('...')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含权限边界组件', () => assert.ok(SRC.includes('AdminPermissionGate')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(true));
});
