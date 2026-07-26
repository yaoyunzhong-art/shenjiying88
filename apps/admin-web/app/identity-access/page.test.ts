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
    assert.match(pageSource, /export default async function IdentityAccessPage/)
    assert.match(pageSource, /loadIdentityAccessPageSnapshot/)
    assert.match(pageSource, /searchParams/)
  })

  test('页面显式输出来源态证据字段', () => {
    assert.match(pageSource, /sourceLabel/)
    assert.match(pageSource, /refreshPath/)
    assert.match(pageSource, /generatedAt/)
    assert.match(pageSource, /query:/)
  })

  test('数据层串联 identity workspace 与 workbench bootstrap', () => {
    assert.match(dataSource, /loadIdentityAccessWorkspace/)
    assert.match(dataSource, /getAdminWorkbenchConsumerSnapshot/)
    assert.match(dataSource, /workspaceDeliveryMode/)
    assert.match(dataSource, /bootstrapDeliveryMode/)
    assert.match(dataSource, /sourceLabel:/)
  })

  test('客户端组件显式提供 router.refresh 刷新动作', () => {
    assert.match(clientSource, /useRouter/)
    assert.match(clientSource, /router\.refresh\(\)/)
    assert.match(clientSource, /当前来源标签为/)
  })
})
