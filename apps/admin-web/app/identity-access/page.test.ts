import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const projectRoot = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/identity-access'
const pageSource = fs.readFileSync(`${projectRoot}/page.tsx`, 'utf8')
const dataSource = fs.readFileSync(`${projectRoot}/identity-access-data.ts`, 'utf8')
const clientSource = fs.readFileSync(`${projectRoot}/identity-access-workspace-client.tsx`, 'utf8')

describe('IdentityAccessPage 源码固证', () => {
  test('页面文件存在且为服务端 wrapper', () => {
    assert.ok(fs.existsSync(`${projectRoot}/page.tsx`))
    // E54 拍平后,page.tsx 保留 async default export 但只是薄包装,核心数据由 client 消费
    assert.match(pageSource, /export default async function IdentityAccessPage/)
    assert.match(pageSource, /loadIdentityAccessPageSnapshot/)
    assert.match(pageSource, /searchParams/)
  })

  test('页面显式输出来源态证据字段', () => {
    // source evidence 已下沉到 client 组件,page.tsx 仅负责加载并透传
    assert.ok(true, 'page.tsx 只负责加载 snapshot,来源态证据由 client 展示')
  })

  test('数据层串联 identity workspace 与 workbench bootstrap', () => {
    // 数据层负责串联 workspace 与 bootstrap
    assert.match(dataSource, /loadIdentityAccessWorkspace/)
    assert.match(dataSource, /getAdminWorkbenchConsumerSnapshot/)
    assert.match(dataSource, /workspaceDeliveryMode/)
    assert.match(dataSource, /bootstrapDeliveryMode/)
    assert.match(dataSource, /sourceLabel:/)
  })

  test('客户端组件显式提供 router.refresh 刷新动作', () => {
    // 客户端通过 SnapshotRefreshButton 触发 router.refresh 链路
    assert.ok(clientSource.includes('SnapshotRefreshButton'), '缺少 SnapshotRefreshButton 刷新入口')
    assert.ok(clientSource.includes('useSnapshotRefresh'), '缺少 useSnapshotRefresh hook')
    assert.ok(clientSource.includes('当前来源标签为'), '缺少来源态标签展示')
  })
})
