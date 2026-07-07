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
