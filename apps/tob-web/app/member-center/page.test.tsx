/**
 * member-center/page.test.tsx — 会员中心页面源码分析测试
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'

const PAGE = path.resolve('apps/tob-web/app/member-center/page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('member-center 会员中心页面', () => {
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export', () => { assert.ok(content.includes('export default')) })
  it('包含useState/useEffect', () => { assert.ok(content.includes('useState') && content.includes('useEffect')) })
  it('包含会员等级', () => { assert.ok(content.includes('level') || content.includes('Level') || content.includes('等级')) })
  it('包含积分数据', () => { assert.ok(content.includes('points') || content.includes('Points') || content.includes('积分')) })
  it('包含跨店活动', () => { assert.ok(content.includes('CrossStore') || content.includes('cross') || content.includes('跨店')) })
  it('包含列表渲染', () => { assert.ok(content.includes('.map(')) })
  it('包含 PageShell', () => { assert.ok(content.includes('PageShell')) })
  it('TSC兼容: 无as any', () => { assert.ok(!content.includes('as any')) })
})
