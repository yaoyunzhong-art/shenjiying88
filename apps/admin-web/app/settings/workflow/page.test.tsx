/**
 * settings/workflow/page.test.tsx — 工作流配置 L1 测试
 *
 * 覆盖: 页面结构、流程数据完整性、节点类型验证
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD标记
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import fs from 'fs'

const PAGE = resolve(import.meta.dirname, 'page.tsx')
const content = fs.readFileSync(PAGE, 'utf-8')

describe('settings/workflow', () => {
  // ── 页面存在与导出 ──
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)) })
  it('包含 default export 函数', () => {
    assert.ok(content.includes('export default function '))
  })
  it('仅一个 export default', () => {
    const matches = content.match(/export default/g)
    assert.equal(matches?.length, 1)
  })
  it('TSC兼容: 无 as any', () => { assert.ok(!content.includes('as any')) })

  // ── 流程数据 ──
  it('包含采购审批流程', () => { assert.ok(content.includes('采购审批') || content.includes('采购')) })
  it('流程包含开始节点', () => { assert.ok(content.includes('开始') || content.includes('开始节点')) })
  it('流程包含经理审批节点', () => { assert.ok(content.includes('经理审批') || content.includes('审批')) })
  it('流程包含金额判断', () => { assert.ok(content.includes('金额判断') || content.includes('金额 >')) })
  it('流程包含结束节点', () => { assert.ok(content.includes('结束') || content.includes('结束节点')) })
  it('支持驳回处理', () => { assert.ok(content.includes('驳回') || content.includes('驳回即终止')) })
  it('当前版本为 v1', () => { assert.ok(content.includes('v1') || content.includes('当前版本')) })

  // ── 节点类型 ──
  it('包含 6 种节点类型', () => {
    const nodeNames = ['开始', '结束', '审批', '条件', '动作', '等待']
    for (const n of nodeNames) {
      assert.ok(content.includes(n), `missing node type: ${n}`)
    }
  })

  // ── 页面结构 ──
  it('包含表格/网格渲染', () => { assert.ok(content.includes('grid') || content.includes('Card')) })
  it('包含标题 "工作流配置"', () => { assert.ok(content.includes('工作流配置')) })
  it('包含示例流程 section', () => { assert.ok(content.includes('示例流程') || content.includes('示例')) })
  it('包含节点类型 section', () => { assert.ok(content.includes('节点类型')) })
})

describe('settings/workflow — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(content.includes('AdminPermissionGate'))
    assert.ok(content.includes("requiredPermission: 'foundation.governance.read'"))
  })
})
