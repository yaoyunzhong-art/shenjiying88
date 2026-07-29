import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const PAGE_SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
const DATA_SRC = readFileSync(
  new URL('./notification-templates-data.ts', import.meta.url),
  'utf8'
)
const CLIENT_SRC = readFileSync(
  new URL('./notification-templates-client.tsx', import.meta.url),
  'utf8'
)

describe('settings/notification-templates 页面结构固证', () => {
  it('page 为 server wrapper 并加载快照', () => {
    assert.ok(PAGE_SRC.includes('export default async function NotificationTemplatesPage'))
    assert.ok(PAGE_SRC.includes('const requestHeaders = pickForwardedRequestHeaders(await headers())'))
    assert.ok(PAGE_SRC.includes('const snapshot = await loadNotificationTemplatesSnapshot({'))
    assert.ok(PAGE_SRC.includes("export const dynamic = 'force-dynamic'"))
    assert.ok(!PAGE_SRC.includes("'use client'"))
  })

  it('page 显式展示来源态证据', () => {
    assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'))
    assert.ok(PAGE_SRC.includes('来源标签: {sourceEvidence.sourceLabel}'))
    assert.ok(PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'))
    assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'))
    assert.ok(PAGE_SRC.includes('scope: {sourceEvidence.scope}'))
    assert.ok(PAGE_SRC.includes('forwardedHeaders: {sourceEvidence.requestHeaders}'))
  })

  it('page 保留权限门禁并挂载 client renderer', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除')
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"))
    assert.ok(PAGE_SRC.includes('<NotificationTemplatesClient snapshot={snapshot} />'))
  })
})

describe('settings/notification-templates snapshot loader 固证', () => {
  it('data 文件定义 api|fallback 快照合同与来源标签', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'api' | 'fallback'"))
    assert.ok(
      DATA_SRC.includes(
        "sourceLabel: 'notification-templates-api' | 'notification-templates-fallback'"
      )
    )
    assert.ok(DATA_SRC.includes('requestContext: ServerRequestContextEvidence'))
    assert.ok(DATA_SRC.includes('export interface NotificationTemplatesSnapshotDelivery'))
    assert.ok(DATA_SRC.includes('export async function loadNotificationTemplatesSnapshot('))
  })

  it('data 文件尝试读取 notifications/templates 上游并保留真实合同字段', () => {
    assert.ok(
      DATA_SRC.includes("new URL(\n    'notifications/templates',") ||
        DATA_SRC.includes("new URL('notifications/templates', resolveNotificationTemplatesApiBaseUrl())")
    )
    assert.ok(DATA_SRC.includes('mapApiTemplate'))
    assert.ok(DATA_SRC.includes('scopeType'))
    assert.ok(DATA_SRC.includes('tenantId'))
    assert.ok(DATA_SRC.includes('locale'))
    assert.ok(DATA_SRC.includes('export const defaultNotificationTemplates'))
    assert.ok(DATA_SRC.includes('订单确认通知'))
  })

  it('fallback 场景返回错误提示并固证来源态', () => {
    assert.ok(DATA_SRC.includes("deliveryMode: 'fallback'"))
    assert.ok(DATA_SRC.includes("sourceLabel: 'notification-templates-fallback'"))
    assert.ok(DATA_SRC.includes('通知模板实时接口不可达，已切换到 fallback 样本数据。'))
    assert.ok(DATA_SRC.includes('原因: ${error.message}'))
  })
})

describe('settings/notification-templates client 固证', () => {
  it('client 文件为 client component 并使用 router.refresh()', () => {
    assert.ok(CLIENT_SRC.startsWith("'use client'"))
    assert.ok(CLIENT_SRC.includes('useRouter'))
    assert.ok(CLIENT_SRC.includes('useTransition'))
    assert.ok(CLIENT_SRC.includes('router.refresh()'))
  })

  it('client 文件保留模板表格、变量规则与错误提示渲染', () => {
    assert.ok(CLIENT_SRC.includes('snapshot.error'))
    assert.ok(CLIENT_SRC.includes('通知模板列表'))
    assert.ok(CLIENT_SRC.includes('snapshot.templates.map'))
    assert.ok(CLIENT_SRC.includes('snapshot.variableRules.map'))
    assert.ok(CLIENT_SRC.includes('template.scopeLabel'))
    assert.ok(CLIENT_SRC.includes('template.locale'))
    assert.ok(CLIENT_SRC.includes("template.version === null ? 'API未提供'"))
  })
})
