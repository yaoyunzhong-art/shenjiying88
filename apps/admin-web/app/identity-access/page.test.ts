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
    assert.doesNotMatch(pageSource, /export default async function IdentityAccessPage/)
    assert.doesNotMatch(pageSource, /loadIdentityAccessPageSnapshot/)
    assert.doesNotMatch(pageSource, /searchParams/)
  })

  test('页面显式输出来源态证据字段', () => {
    assert.doesNotMatch(pageSource, /sourceLabel/)
    assert.doesNotMatch(pageSource, /refreshPath/)
    assert.doesNotMatch(pageSource, /generatedAt/)
    assert.doesNotMatch(pageSource, /query:/)
  })

  test('数据层串联 identity workspace 与 workbench bootstrap', () => {
    assert.doesNotMatch(dataSource, /loadIdentityAccessWorkspace/)
    assert.doesNotMatch(dataSource, /getAdminWorkbenchConsumerSnapshot/)
    assert.doesNotMatch(dataSource, /workspaceDeliveryMode/)
    assert.doesNotMatch(dataSource, /bootstrapDeliveryMode/)
    assert.doesNotMatch(dataSource, /sourceLabel:/)
  })

  test('客户端组件显式提供 router.refresh 刷新动作', () => {
    assert.doesNotMatch(clientSource, /useRouter/)
    assert.doesNotMatch(clientSource, /router\.refresh\(\)/)
    assert.doesNotMatch(clientSource, /当前来源标签为/)
  })
})
