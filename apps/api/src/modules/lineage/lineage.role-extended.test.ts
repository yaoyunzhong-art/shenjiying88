import { describe, it, expect, beforeEach } from 'vitest'
import { DataLineageService } from './data-lineage.service'
import { LineageController } from './lineage.controller'

/**
 * 🐜 [lineage] 角色扩展测试
 * 覆盖数据血缘追踪的边界场景
 */

function setup() {
  const service = new DataLineageService()
  return { service }
}

describe('👔店长 lineage 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('记录数据血缘关系', () => {
    const lineage = svc.service.trackLineage('table_a', 'table_b', 'ETL')
    expect(lineage).toBeDefined()
    expect(lineage.source).toBe('table_a')
    expect(lineage.target).toBe('table_b')
  })
})

describe('🔧安监 lineage 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('查询数据来源路径', () => {
    svc.service.trackLineage('raw', 'clean', 'transform')
    svc.service.trackLineage('clean', 'agg', 'aggregate')
    const path = svc.service.getLineagePath('agg')
    expect(path.length).toBeGreaterThanOrEqual(1)
  })
})

describe('🎯运行专员 lineage 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('查询不存在表血缘返回空数组', () => {
    const path = svc.service.getLineagePath('no_such_table')
    expect(Array.isArray(path)).toBe(true)
    expect(path.length).toBe(0)
  })
})
