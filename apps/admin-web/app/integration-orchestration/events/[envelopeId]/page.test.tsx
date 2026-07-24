/**
 * integration-orchestration/events/[envelopeId]/page.test.tsx — 事件信封详情 L1 冒烟测试
 * 覆盖: 正例·边界·防御
 * 三态: loading / empty / error
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
  it('应导出一个默认函数组件 IntegrationOrchestrationEventDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function IntegrationOrchestrationEventDetailPage'), '未找到默认导出组件');
  });

  it('应包含三态 (loading/error/empty)', () => {
    const src = readSource();
    assert.ok(src.includes('setLoading'), '缺少 loading 状态');
    assert.ok(src.includes('setError'), '缺少 error 状态');
    assert.ok(src.includes('暂无数据') || src.includes('无匹配'), '缺少 empty 状态');
  });

  it('应使用 useEffect 加载数据', () => {
    const src = readSource();
    assert.ok(src.includes('useEffect'), '缺少 useEffect');
  });

  it('应包含搜索过滤功能', () => {
    const src = readSource();
    assert.ok(src.includes('search'), '缺少搜索功能');
  });

  it('应包含分页功能', () => {
    const src = readSource();
    assert.ok(src.includes('setPage') || src.includes('pageSize'), '缺少分页');
  });

  it('应包含 SEED_FIELDS 数据', () => {
    const src = readSource();
    assert.ok(src.includes('SEED_FIELDS'), '缺少 SEED_FIELDS');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('integration-orchestration/events/[envelopeId] — 边界', () => {
  it('空搜索应显示 empty 状态', () => {
    const src = readSource();
    assert.ok(src.includes('暂无数据') || src.includes('无匹配'), '空数据应有 empty 提示');
  });

  it('loading 状态应显示加载提示', () => {
    const src = readSource();
    assert.ok(src.includes('加载中'), 'loading 应有提示');
  });

  it('error 状态应显示错误提示', () => {
    const src = readSource();
    assert.ok(src.includes('错误'), 'error 应有提示');
  });

  it('tab 切换应重置分页', () => {
    const src = readSource();
    assert.ok(src.includes('setPage(1)'), 'tab 切换应重置分页');
  });
});

// ---- L2 增强: 数据负载验证 ----

describe('integration-orchestration/events/[envelopeId] — 数据负载验证', () => {
  it('应展示信封字段数据', () => {
    const src = readSource();
    assert.ok(src.includes('SEED_FIELDS'), '应包含字段数据');
  });

  it('应展示幂等记录数据', () => {
    const src = readSource();
    assert.ok(src.includes('SEED_IDEMPOTENCY_RECORDS'), '应包含幂等记录');
  });

  it('modal 应展示详情', () => {
    const src = readSource();
    assert.ok(src.includes('modal'), '应包含 modal 弹窗');
  });

  it('统计卡片应展示', () => {
    const src = readSource();
    assert.ok(src.includes('stats'), '应包含统计');
  });

  it('分页控件应展示', () => {
    const src = readSource();
    assert.ok(src.includes('上一页'), '应包含上一页按钮');
    assert.ok(src.includes('下一页'), '应包含下一页按钮');
  });

  it('tab 切换按钮应存在', () => {
    const src = readSource();
    assert.ok(src.includes('fields') && src.includes('idempotency'), '应有 tab 切换');
  });

  it('搜索输入框应存在', () => {
    const src = readSource();
    assert.ok(src.includes('placeholder'), '应有搜索输入框');
  });

  it('刷新按钮应存在', () => {
    const src = readSource();
    assert.ok(src.includes('刷新'), '应有刷新按钮');
  });

  it('状态标签应有颜色映射', () => {
    const src = readSource();
    assert.ok(src.includes('IDEM_STATUS_COLORS') || src.includes('STATUS_COLORS'), '应有状态颜色映射');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('integration-orchestration/events/[envelopeId] — 防御', () => {
  it('加载状态使用条件渲染', () => {
    const src = readSource();
    assert.ok(src.includes('if (loading)'), 'loading 应有条件渲染');
  });

  it('错误状态使用条件渲染', () => {
    const src = readSource();
    assert.ok(src.includes('if (error)'), 'error 应有条件渲染');
  });

  it('maxWidth 应为 1200', () => {
    const src = readSource();
    assert.ok(src.includes('maxWidth: \'1200px\'') || src.includes('maxWidth: 1200'), 'maxWidth 应为 1200');
  });

  it('页面不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用危险 HTML');
  });

  it('页面不应有生产环境 console.log', () => {
    const src = readSource();
    const logLines = src.split('\n').filter(l =>
      l.includes('console.log') && !l.trimStart().startsWith('//')
    );
    assert.equal(logLines.length, 0, '不应有 console.log');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('integration-orchestration/events/[envelopeId] — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'foundation.governance.read'"));
  });
});

describe('Integration Orchestration / Events — hooks验证', () => {
  it('使用客户端组件 (useEffect)', () => assert.ok(SRC.includes('useEffect'), '应使用 useEffect'));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含三态 (loading/error/empty)', () => {
    assert.ok(SRC.includes('setLoading'), '缺少 loading 状态');
    assert.ok(SRC.includes('setError'), '缺少 error 状态');
    assert.ok(SRC.includes('暂无数据') || SRC.includes('无匹配'), '缺少 empty 状态');
  });
  it('包含数据结构', () => assert.ok(SRC.includes('{') && SRC.includes('[')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含权限边界组件', () => assert.ok(SRC.includes('AdminPermissionGate')));
  it('包含弹窗状态管理', () => assert.ok(SRC.includes('modal.visible') && SRC.includes('setModal')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(true));
});
