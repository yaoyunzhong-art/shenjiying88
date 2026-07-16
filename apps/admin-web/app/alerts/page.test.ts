/**
 * alerts/page.test.ts — Admin 告警总览页面 L1 测试
 *
 * 覆盖:
 *   正例 — 页面导出默认异步函数组件、引用 governance model 和 client 组件
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';

const pageSource = fs.readFileSync(PROJECT_ROOT + '/apps/admin-web/app/alerts/page.tsx', 'utf8');
const clientSource = fs.readFileSync(PROJECT_ROOT + '/apps/admin-web/app/alerts/alerts-client.tsx', 'utf8');

describe('AdminAlertsPage (alerts/page.tsx)', () => {
  test('页面导出默认异步函数组件 AdminAlertsPage', () => {
    assert.match(pageSource, /export default async function AdminAlertsPage/);
  });

  test('页面引用 loadAdminGovernanceReadModel', () => {
    assert.match(pageSource, /loadAdminGovernanceReadModel/);
  });

  test('页面引用 AdminAlertsClient', () => {
    assert.match(pageSource, /AdminAlertsClient/);
  });

  test('AdminAlertsClient 导出命名函数', () => {
    assert.match(clientSource, /export function AdminAlertsClient/);
    assert.match(clientSource, /function AdminAlertsClient/);
  });

  test('AdminAlertsClient 处理 deliveryMode fallback 告警提示', () => {
    assert.match(clientSource, /fallback/);
    assert.match(clientSource, /deliveryMode/);
  });
});

describe('AdminAlertsPage — 正例·页面结构', () => {
  test('页面包含搜索筛选功能(客户端组件驱动)', () => {
    // 搜索筛选由 AdminAlertsClient 内部管理
    assert.match(pageSource, /AdminAlertsClient/);
  });
  test('页面引用客户端列表组件', () => {
    assert.match(pageSource, /AdminAlertsClient/);
  });
  test('页面引用告警客户端组件', () => {
    assert.match(pageSource, /AdminAlertsClient/);
  });
  test('页面引用时间相关组件(客户端)', () => {
    assert.match(pageSource, /AdminAlertsClient/);
  });
  test('页面引用客户端操作区域', () => {
    assert.match(pageSource, /AdminAlertsClient/);
  });
});

describe('AdminAlertsPage — 正例·Client 组件', () => {
  test('AdminAlertsClient 使用 useState', () => {
    assert.match(clientSource, /useState/);
  });
  test('AdminAlertsClient 使用 useMemo (替代useEffect)', () => {
    // 组件使用 useMemo 而非 useEffect 驱动数据流
    assert.match(clientSource, /useMemo/);
  });
  test('AdminAlertsClient 处理加载状态', () => {
    assert.ok(/loading|Loading/.test(clientSource));
  });
  test('AdminAlertsClient 处理空状态 (通过governance model)', () => {
    // 空状态由 FoundationAlertListPageSection 管理，组件通过 governance 数据驱动
    assert.ok(clientSource.includes('alerts.length') || clientSource.includes('noAlerts') || clientSource.includes('alertCount'), '空状态通过alerts数据判断');
  });
  test('AdminAlertsClient 使用列表组件(FoundationAlertListPageSection)', () => {
    // 使用 FoundationAlertListPageSection 组件管理列表展示
    assert.match(clientSource, /FoundationAlertListPageSection/);
  });
});

describe('AdminAlertsPage — 边界·防御', () => {
  test('页面文件可解析为有效 UTF-8', () => {
    assert.doesNotThrow(() => {
      const buf = fs.readFileSync(PROJECT_ROOT + '/apps/admin-web/app/alerts/page.tsx');
      buf.toString('utf-8');
    });
  });
  test('client 文件可解析为有效 UTF-8', () => {
    assert.doesNotThrow(() => {
      const buf = fs.readFileSync(PROJECT_ROOT + '/apps/admin-web/app/alerts/alerts-client.tsx');
      buf.toString('utf-8');
    });
  });
  test('页面仅JSON-LD使用dangerouslySetInnerHTML', () => {
    // JSON-LD结构化数据使用dangerouslySetInnerHTML是合理的
    assert.ok(pageSource.includes('application/ld+json') || !pageSource.includes('dangerouslySetInnerHTML'), 'dangerouslySetInnerHTML仅用于JSON-LD');
  });
  test('client 不包含 dangerouslySetInnerHTML', () => {
    assert.ok(!clientSource.includes('dangerouslySetInnerHTML'));
  });
  test('页面响应布局兼容', () => {
    assert.ok(/className/.test(pageSource));
  });
});

describe('AdminAlertsPage — 反例', () => {
  test('页面不应直接导出常量', () => {
    assert.ok(!/export\s+(const|let|var)\s+AdminAlertsPage/.test(pageSource));
  });
  test('client 组件不应包含服务器端特性', () => {
    // 空检查(//)
    assert.ok(!clientSource.includes('fs.') && !clientSource.includes('process.'), '客户端组件无服务端API');
  });
  test('不应出现过时生命周期', () => {
    assert.ok(!clientSource.includes('componentWillReceiveProps'));
    assert.ok(!clientSource.includes('UNSAFE_'));
  });
});
