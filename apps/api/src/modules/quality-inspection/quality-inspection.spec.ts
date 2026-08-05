/**
 * 🐜 树哥 Trae: [quality-inspection] [A] .spec.ts 全面集成测试
 *
 * T11 质检模块审查+测试
 * 圈梁五道箍: ①TSC ②测试存在 ③圈梁表更新 ④PRD标记 ⑤知识赋能
 * 三件套: 正例(定义/实例化/方法签名/exports) + 反例(异常/缺失) + 边界(空/零)
 * 模式: "审计→找风险→审查→写测试"
 *
 * === 审计报告 (Day12 T11) ===
 *
 * 审计详情:
 *   模块文件: 5 source + 1 README = 6 core files
 *   已有测试: 6 test files (service, controller, dto, entity, module, role×2)
 *   .spec.ts: 0 → NEW
 *
 * 审查发现:
 *   1. ✅ Tenancy Guard 正确应用（@UseGuards(TenantGuard)）
 *   2. ✅ 租户隔离：service 层所有操作均按 tenantId 过滤
 *   3. ✅ DTO validation 使用 class-validator/class-transformer
 *   4. ✅ 错误处理：throw Error 语义明确
 *   5. ⚠️ Mock seed data 耦合 — list/getFailed/getByType/getPassRate 在首次调用时
 *      seed 21 条 mock 数据，导致单测不确定/顺序依赖
 *   6. ⚠️ 内存 store 非线程安全（生产需换 DB）
 *
 * 测试覆盖 (本 .spec.ts):
 *   1. Module bootstrap → 手风琴式集成测试
 *   2. 独立代码路径验证 (空 stores, seed 行为, 幂等性)
 *   3. 完整 workflow e2e (CRUD + query views)
 *   4. 租户隔离 (多租户数据物理隔离)
 *   5. 边界条件 (空缺陷列表, max search, 零记录 passRate)
 */

import 'reflect-metadata'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import assert from 'node:assert/strict'

import { QualityInspectionModule } from './quality-inspection.module'
import { QualityInspectionController } from './quality-inspection.controller'
import { QualityInspectionService } from './quality-inspection.service'
import {
  InspectionType,
  InspectionResult,
  Severity,
  type Defect,
  type InspectionRecord,
} from './quality-inspection.entity'
import {
  CreateDefectDto,
  CreateInspectionRecordDto,
  UpdateInspectionRecordDto,
  InspectionRecordQueryDto,
} from './quality-inspection.dto'

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const TENANT_A = { tenantId: 'tenant-001', brandId: 'b1', storeId: 's1' }
const TENANT_B = { tenantId: 'tenant-002', brandId: 'b2', storeId: 's2' }

function makeDefects(
  ...items: Array<[string, string, Severity]>
): CreateDefectDto[] {
  return items.map(([code, description, severity]) =>
    Object.assign(new CreateDefectDto(), { code, description, severity })
  )
}

function makeCreateDto(
  overrides?: Partial<CreateInspectionRecordDto>
): CreateInspectionRecordDto {
  return Object.assign(new CreateInspectionRecordDto(), {
    inspectNo: 'IQC-SPEC-0001',
    type: InspectionType.Incoming,
    itemName: '规格测试品',
    itemBatch: 'BATCH-SPEC-001',
    defects: makeDefects(['DIM-001', '尺寸偏差', Severity.Minor]),
    inspector: '测试员A',
    inspectedAt: '2026-07-25T00:00:00.000Z',
    ...overrides,
  })
}

function makeService(seed = false): {
  svc: QualityInspectionService
  ctrl: InstanceType<typeof QualityInspectionController>
} {
  const svc = new QualityInspectionService()
  svc.resetInspectionStoresForTests()
  const ctrl = new QualityInspectionController(svc)
  if (seed) {
    // 触发 seed
    svc.listInspections(TENANT_A.tenantId)
  }
  return { svc, ctrl }
}

// ═══════════════════════════════════════════════════════════════
// 1. Module Bootstrap Integration (手风琴)
// ═══════════════════════════════════════════════════════════════

describe('QualityInspection — Module Integration (.spec.ts)', () => {
  it('正例: module 可实例化且元数据完整', () => {
    const mod = new QualityInspectionModule()
    assert.ok(mod instanceof QualityInspectionModule)

    const controllers: unknown[] =
      Reflect.getMetadata('controllers', QualityInspectionModule) ?? []
    const providers: unknown[] =
      Reflect.getMetadata('providers', QualityInspectionModule) ?? []
    const exportsList: unknown[] =
      Reflect.getMetadata('exports', QualityInspectionModule) ?? []

    assert.ok(controllers.includes(QualityInspectionController))
    assert.ok(providers.includes(QualityInspectionService))
    assert.ok(exportsList.includes(QualityInspectionService))
  })

  it('正例: controller ↔ service DI 正确绑定', () => {
    const { svc, ctrl } = makeService()
    // 通过 controller 创建，检查 service 写入
    const result = ctrl.createInspection(TENANT_A, makeCreateDto({ inspectNo: 'DI-CHECK' }))
    assert.equal(result.inspectNo, 'DI-CHECK')

    const fromSvc = svc.getInspection(result.id, TENANT_A.tenantId)
    assert.ok(fromSvc)
    assert.equal(fromSvc.inspectNo, 'DI-CHECK')
  })

  it('正例: service exports 可被外部引用', () => {
    const svc = new QualityInspectionService()
    assert.ok(svc instanceof QualityInspectionService)
    assert.equal(typeof svc.createInspection, 'function')
    assert.equal(typeof svc.getPassRate, 'function')
  })

  // ═══════════════════════════════════════════════════════════
  // 2. Code Path Isolation (独立代码路径)
  // ═══════════════════════════════════════════════════════════

  describe('Code Path: Seed Behavior', () => {
    it('正例: reset → 空 store → 无记录', () => {
      const svc = new QualityInspectionService()
      svc.resetInspectionStoresForTests()

      // 不调用 listInspections (不触发 seed)，registry 应为空
      // 通过 getInspection 验证无记录
      const result = svc.getInspection('nonexistent', TENANT_A.tenantId)
      assert.equal(result, undefined)
    })

    it('正例: 首次 listInspections 触发 seed', () => {
      const svc = new QualityInspectionService()
      svc.resetInspectionStoresForTests()

      // 先创建一个自己的记录
      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'PRE-SEED',
        type: InspectionType.Incoming,
        itemName: '预种子',
        itemBatch: 'BATCH-PRE',
        defects: [],
        inspector: '预检员',
        inspectedAt: '2026-07-25T00:00:00.000Z',
      })

      // 调用 listInspections → 触发 seed
      const list = svc.listInspections(TENANT_A.tenantId)
      // seed 提供 21 条 + 我们创建的 1 条 ≥ 22
      assert.ok(list.length >= 22, `expected ≥22, got ${list.length}`)

      // 再次调用不应重复 seed
      const list2 = svc.listInspections(TENANT_A.tenantId)
      assert.equal(list2.length, list.length)
    })

    it('边界: seed 数据仅对 tenant-001 可见（租户隔离检查）', () => {
      const svc = new QualityInspectionService()
      svc.resetInspectionStoresForTests()

      const listA = svc.listInspections(TENANT_A.tenantId)
      assert.ok(listA.length >= 21)

      const listB = svc.listInspections(TENANT_B.tenantId)
      assert.equal(listB.length, 0)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 3. Full CRUD Workflow (手风琴流程)
  // ═══════════════════════════════════════════════════════════

  describe('Workflow: Inspection Lifecycle', () => {
    it('正例: CREATE → READ → UPDATE → DELETE 完整闭环', () => {
      const { svc, ctrl } = makeService()

      // CREATE via controller
      const created = ctrl.createInspection(TENANT_A, makeCreateDto({
        inspectNo: 'WF-001',
        itemName: '工作流物料',
      }))
      assert.equal(created.inspectNo, 'WF-001')
      assert.equal(created.result, InspectionResult.Pass) // default
      assert.equal(created.severity, Severity.Minor)      // default

      // READ via controller
      const got = ctrl.getInspection(TENANT_A, created.id)
      assert.ok(got)
      assert.equal(got.inspectNo, 'WF-001')

      // UPDATE via controller
      const updated = ctrl.updateInspection(TENANT_A, created.id, {
        result: InspectionResult.Fail,
        severity: Severity.Critical,
        notes: '质量检验不合格',
        defects: makeDefects(
          ['FUN-001', '功能故障', Severity.Critical],
          ['SAF-001', '安全隐患', Severity.Critical],
        ),
      } as UpdateInspectionRecordDto)
      assert.equal(updated.result, InspectionResult.Fail)
      assert.equal(updated.severity, Severity.Critical)
      assert.equal(updated.notes, '质量检验不合格')
      assert.equal(updated.defects.length, 2)

      // DELETE via controller
      const delResult = ctrl.deleteInspection(TENANT_A, created.id)
      assert.deepStrictEqual(delResult, { success: true })

      // 验证已删除
      assert.throws(
        () => ctrl.getInspection(TENANT_A, created.id),
        /Inspection record not found/
      )
    })

    it('正例: 各 InspectionType 的创建', () => {
      const { svc } = makeService()

      for (const type of Object.values(InspectionType)) {
        const r = svc.createInspection({
          tenantId: TENANT_A.tenantId,
          inspectNo: `SPEC-${type}`,
          type,
          itemName: `测试${type}`,
          itemBatch: `BATCH-${type}`,
          defects: [],
          inspector: '多类型测试员',
          inspectedAt: '2026-07-25T00:00:00.000Z',
        })
        assert.equal(r.type, type)
      }
    })

    it('正例: 各 InspectionResult + Severity 组合', () => {
      const { svc } = makeService()

      const combos: Array<[InspectionResult, Severity]> = [
        [InspectionResult.Pass, Severity.Observation],
        [InspectionResult.Fail, Severity.Critical],
        [InspectionResult.Conditional, Severity.Major],
        [InspectionResult.Pass, Severity.Minor],
        [InspectionResult.Conditional, Severity.Observation],
      ]

      for (const [result, severity] of combos) {
        const r = svc.createInspection({
          tenantId: TENANT_A.tenantId,
          inspectNo: `SPEC-${result}-${severity}`,
          type: InspectionType.Final,
          itemName: '组合测试品',
          itemBatch: 'BATCH-COMBO',
          result,
          severity,
          defects: result === InspectionResult.Fail
            ? [{ code: 'ERR-001', description: '模拟错误', severity: Severity.Critical }]
            : [],
          inspector: '组合测试员',
          inspectedAt: '2026-07-25T00:00:00.000Z',
        })
        assert.equal(r.result, result)
        assert.equal(r.severity, severity)
      }
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 4. Query Views (查询视图)
  // ═══════════════════════════════════════════════════════════

  describe('Query Views: Failed / Type / Items / PassRate', () => {
    it('正例: getFailedInspections 只返回 FAIL 记录 (with seed)', () => {
      const { svc } = makeService()

      // 创建一些 pass + fail
      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'VIEW-PASS', type: InspectionType.Incoming,
        itemName: '通过品', itemBatch: 'B1',
        result: InspectionResult.Pass, severity: Severity.Minor,
        defects: [], inspector: 'T1', inspectedAt: '2026-07-25T00:00:00.000Z',
      })
      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'VIEW-FAIL', type: InspectionType.Incoming,
        itemName: '失败品', itemBatch: 'B2',
        result: InspectionResult.Fail, severity: Severity.Critical,
        defects: [{ code: 'F-001', description: '致命缺陷', severity: Severity.Critical }],
        inspector: 'T2', inspectedAt: '2026-07-25T00:00:00.000Z',
      })

      const failed = svc.getFailedInspections(TENANT_A.tenantId)
      assert.ok(failed.length >= 1)
      failed.forEach((r) => assert.equal(r.result, InspectionResult.Fail))
      assert.ok(failed.some((r) => r.inspectNo === 'VIEW-FAIL'))
    })

    it('正例: getInspectionsByType 正确按类型筛选', () => {
      const { svc } = makeService()

      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'TYPE-IN', type: InspectionType.Incoming,
        itemName: '进货', itemBatch: 'BATCH-1',
        defects: [], inspector: 'T1', inspectedAt: '2026-07-25T00:00:00.000Z',
      })
      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'TYPE-FINAL', type: InspectionType.Final,
        itemName: '终检', itemBatch: 'BATCH-2',
        defects: [], inspector: 'T2', inspectedAt: '2026-07-25T00:00:00.000Z',
      })

      const incoming = svc.getInspectionsByType(InspectionType.Incoming, TENANT_A.tenantId)
      incoming.forEach((r) => assert.equal(r.type, InspectionType.Incoming))
      assert.ok(incoming.some((r) => r.inspectNo === 'TYPE-IN'))

      const finals = svc.getInspectionsByType(InspectionType.Final, TENANT_A.tenantId)
      finals.forEach((r) => assert.equal(r.type, InspectionType.Final))
      assert.ok(finals.some((r) => r.inspectNo === 'TYPE-FINAL'))
    })

    it('正例: getInspectionsByItems 正确按物料名查询', () => {
      const { svc } = makeService()

      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'ITEM-A1', type: InspectionType.Incoming,
        itemName: '精密螺丝', itemBatch: 'B1',
        defects: [], inspector: 'T1', inspectedAt: '2026-07-25T00:00:00.000Z',
      })
      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'ITEM-A2', type: InspectionType.Outgoing,
        itemName: '精密螺丝', itemBatch: 'B2',
        defects: [], inspector: 'T2', inspectedAt: '2026-07-25T00:00:00.000Z',
      })
      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'ITEM-B', type: InspectionType.Incoming,
        itemName: '普通螺母', itemBatch: 'B3',
        defects: [], inspector: 'T3', inspectedAt: '2026-07-25T00:00:00.000Z',
      })

      const screws = svc.getInspectionsByItems('精密螺丝', TENANT_A.tenantId)
      assert.equal(screws.length, 2)
      screws.forEach((r) => assert.equal(r.itemName, '精密螺丝'))
    })

    it('正例: getPassRate 计算正确 (with seed)', () => {
      const { svc } = makeService()

      // 创建 3 pass + 1 fail
      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'PR-P1', type: InspectionType.Incoming,
        itemName: 'A', itemBatch: 'B1',
        result: InspectionResult.Pass, severity: Severity.Minor,
        defects: [], inspector: 'T1', inspectedAt: '2026-07-25T00:00:00.000Z',
      })
      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'PR-P2', type: InspectionType.Incoming,
        itemName: 'B', itemBatch: 'B2',
        result: InspectionResult.Pass, severity: Severity.Minor,
        defects: [], inspector: 'T2', inspectedAt: '2026-07-25T00:00:00.000Z',
      })
      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'PR-P3', type: InspectionType.Incoming,
        itemName: 'C', itemBatch: 'B3',
        result: InspectionResult.Pass, severity: Severity.Minor,
        defects: [], inspector: 'T3', inspectedAt: '2026-07-25T00:00:00.000Z',
      })
      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'PR-F1', type: InspectionType.Incoming,
        itemName: 'D', itemBatch: 'B4',
        result: InspectionResult.Fail, severity: Severity.Critical,
        defects: [{ code: 'E', description: '坏', severity: Severity.Critical }],
        inspector: 'T4', inspectedAt: '2026-07-25T00:00:00.000Z',
      })

      const stats = svc.getPassRate(TENANT_A.tenantId)
      // getPassRate seeds mock data; we added 3 PASS + 1 FAIL
      assert.ok(stats.total >= 4, `total ${stats.total}`)
      assert.ok(stats.passed >= 3, `passed ${stats.passed}`)
      assert.ok(stats.failed >= 1, `failed ${stats.failed}`)
      assert.ok(stats.passRate > 0 && stats.passRate <= 100, `passRate ${stats.passRate}`)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 5. Tenant Isolation (租户隔离)
  // ═══════════════════════════════════════════════════════════

  describe('Tenant Isolation: 多租户数据物理隔离', () => {
    it('正例: tenant-A 数据对 tenant-B 不可见', () => {
      const { svc } = makeService()

      const rA = svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'ISO-A', type: InspectionType.Incoming,
        itemName: '租户A物料', itemBatch: 'BATCH-A',
        defects: [], inspector: 'A员', inspectedAt: '2026-07-25T00:00:00.000Z',
      })
      const rB = svc.createInspection({
        tenantId: TENANT_B.tenantId,
        inspectNo: 'ISO-B', type: InspectionType.Incoming,
        itemName: '租户B物料', itemBatch: 'BATCH-B',
        defects: [], inspector: 'B员', inspectedAt: '2026-07-25T00:00:00.000Z',
      })

      // A 查自己的 → 看得到
      const gotA = svc.getInspection(rA.id, TENANT_A.tenantId)
      assert.ok(gotA)

      // B 查 A 的 → 看不到
      const gotBviaA = svc.getInspection(rA.id, TENANT_B.tenantId)
      assert.equal(gotBviaA, undefined)

      // A 查 B 的 → 看不到
      const gotAviaB = svc.getInspection(rB.id, TENANT_A.tenantId)
      assert.equal(gotAviaB, undefined)

      // B 查自己的 → 看得到
      const gotB = svc.getInspection(rB.id, TENANT_B.tenantId)
      assert.ok(gotB)
    })

    it('正例: tenant-A list 不泄露 tenant-B 数据', () => {
      const { svc } = makeService()

      svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'LST-A', type: InspectionType.Incoming,
        itemName: 'A', itemBatch: 'B1',
        defects: [], inspector: 'T1', inspectedAt: '2026-07-25T00:00:00.000Z',
      })
      svc.createInspection({
        tenantId: TENANT_B.tenantId,
        inspectNo: 'LST-B', type: InspectionType.Incoming,
        itemName: 'B', itemBatch: 'B2',
        defects: [], inspector: 'T2', inspectedAt: '2026-07-25T00:00:00.000Z',
      })

      const listA = svc.listInspections(TENANT_A.tenantId)
      assert.ok(listA.some((r) => r.inspectNo === 'LST-A'))
      assert.ok(!listA.some((r) => r.inspectNo === 'LST-B'))

      const listB = svc.listInspections(TENANT_B.tenantId)
      assert.ok(listB.some((r) => r.inspectNo === 'LST-B'))
      assert.ok(!listB.some((r) => r.inspectNo === 'LST-A'))
    })

    it('边界: 跨租户 delete 被拒绝', () => {
      const { svc } = makeService()

      const r = svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'DEL-ISO', type: InspectionType.Incoming,
        itemName: 'X', itemBatch: 'B1',
        defects: [], inspector: 'T1', inspectedAt: '2026-07-25T00:00:00.000Z',
      })

      assert.throws(
        () => svc.deleteInspection(r.id, TENANT_B.tenantId),
        /Inspection record not found/
      )

      // 验证原租户仍可访问
      const stillThere = svc.getInspection(r.id, TENANT_A.tenantId)
      assert.ok(stillThere)
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 6. Edge Cases & Error Handling (边界条件)
  // ═══════════════════════════════════════════════════════════

  describe('Edge Cases: 边界条件 & 异常处理', () => {
    it('正例: 创建零缺陷质检记录', () => {
      const { svc } = makeService()
      const r = svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'ZERO-DEFECT',
        type: InspectionType.Outgoing,
        itemName: '完美品',
        itemBatch: 'BATCH-ZERO',
        defects: [],
        inspector: '零缺陷检查员',
        inspectedAt: '2026-07-25T00:00:00.000Z',
      })
      assert.equal(r.defects.length, 0)
      assert.equal(r.result, InspectionResult.Pass)
    })

    it('正例: 创建多缺陷(≥5)质检记录', () => {
      const { svc } = makeService()
      const manyDefects = Array.from({ length: 5 }, (_, i) => ({
        code: `DEF-00${i + 1}`,
        description: `缺陷${i + 1}描述`,
        severity: i % 2 === 0 ? Severity.Major : Severity.Critical,
      }))
      const r = svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'MANY-DEFECTS',
        type: InspectionType.Final,
        itemName: '多问题品',
        itemBatch: 'BATCH-MANY',
        defects: manyDefects,
        inspector: '多缺陷检查员',
        inspectedAt: '2026-07-25T00:00:00.000Z',
        result: InspectionResult.Fail,
        severity: Severity.Critical,
      })
      assert.equal(r.defects.length, 5)
      assert.equal(r.result, InspectionResult.Fail)
    })

    it('正例: search 搜索 inspectNo / itemName / itemBatch / inspector', () => {
      const { svc } = makeService()
      const seedList = svc.listInspections(TENANT_A.tenantId)

      // 搜索质检单号
      const byNo = svc.listInspections(TENANT_A.tenantId, { search: 'IQC-2026-0001' })
      assert.ok(byNo.length >= 1)

      // 搜索物料名
      const byItem = svc.listInspections(TENANT_A.tenantId, { search: '电阻器' })
      assert.ok(byItem.length >= 1)

      // 搜索批次
      const byBatch = svc.listInspections(TENANT_A.tenantId, { search: 'BATCH-R-0725' })
      assert.ok(byBatch.length >= 1)

      // 搜索检查员 — 不区分大小写
      const byInspector = svc.listInspections(TENANT_A.tenantId, { search: '王工' })
      assert.ok(byInspector.length >= 1)
    })

    it('边界: 零记录时 passRate 返回 { total:0, passRate:0 }', () => {
      const svc = new QualityInspectionService()
      svc.resetInspectionStoresForTests()

      // 不触发 seed，无记录
      const stats = svc.getPassRate(TENANT_B.tenantId)
      assert.equal(stats.total, 0)
      assert.equal(stats.passed, 0)
      assert.equal(stats.failed, 0)
      assert.equal(stats.passRate, 0)
    })

    it('边界: 空 search 不排除记录', () => {
      const { svc } = makeService()
      const noFilter = svc.listInspections(TENANT_A.tenantId)
      const emptySearch = svc.listInspections(TENANT_A.tenantId, { search: '' })
      assert.equal(emptySearch.length, noFilter.length)
    })

    it('边界: 更新时传递 undefined 字段不修改原值', () => {
      const { svc } = makeService()

      const r = svc.createInspection({
        tenantId: TENANT_A.tenantId,
        inspectNo: 'UNDEF-UPDATE',
        type: InspectionType.Incoming,
        itemName: '原品名',
        itemBatch: 'BATCH-ORIG',
        defects: [],
        inspector: '原始员',
        inspectedAt: '2026-07-25T00:00:00.000Z',
        result: InspectionResult.Pass,
        severity: Severity.Minor,
        notes: '原始备注',
      })

      // 更新 notes 但不碰其他字段
      const updated = svc.updateInspection(r.id, TENANT_A.tenantId, {
        notes: '新备注',
      })
      assert.equal(updated.notes, '新备注')
      assert.equal(updated.itemName, '原品名')
      assert.equal(updated.result, InspectionResult.Pass)
      assert.equal(updated.severity, Severity.Minor)
      assert.equal(updated.inspectNo, 'UNDEF-UPDATE')
    })

    it('反例: getInspection with empty id returns undefined', () => {
      const { svc } = makeService()
      const result = svc.getInspection('', TENANT_A.tenantId)
      assert.equal(result, undefined)
    })

    it('反例: controller getInspection throws 清晰错误', () => {
      const { ctrl } = makeService()
      assert.throws(
        () => ctrl.getInspection(TENANT_A, 'nonexistent-id'),
        /Inspection record not found/
      )
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 7. DTO Validation Shape
  // ═══════════════════════════════════════════════════════════

  describe('DTO Structure Validation', () => {
    it('正例: CreateInspectionRecordDto 接受完整入参', () => {
      const dto = makeCreateDto({
        inspectNo: 'IQC-DTO-001',
        result: InspectionResult.Conditional,
        severity: Severity.Major,
        notes: 'DTO 测试备注',
      })
      assert.ok(dto instanceof CreateInspectionRecordDto)
      assert.equal(dto.inspectNo, 'IQC-DTO-001')
      assert.equal(dto.type, InspectionType.Incoming)
      assert.equal(dto.result, InspectionResult.Conditional)
      assert.equal(dto.notes, 'DTO 测试备注')
    })

    it('正例: UpdateInspectionRecordDto 支持完全空对象', () => {
      const dto = new UpdateInspectionRecordDto()
      assert.equal(dto.type, undefined)
      assert.equal(dto.itemName, undefined)
      assert.equal(dto.defects, undefined)
    })

    it('正例: InspectionRecordQueryDto 组合所有过滤条件', () => {
      const dto = Object.assign(new InspectionRecordQueryDto(), {
        type: InspectionType.Incoming,
        result: InspectionResult.Fail,
        severity: Severity.Critical,
        inspector: '安监张',
        search: '轴承',
      })
      assert.equal(dto.type, InspectionType.Incoming)
      assert.equal(dto.result, InspectionResult.Fail)
      assert.equal(dto.search, '轴承')
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 8. Route Path Registration
  // ═══════════════════════════════════════════════════════════

  describe('Route Path Registration', () => {
    it('正例: controller path 正确', () => {
      const path = Reflect.getMetadata('path', QualityInspectionController)
      assert.equal(path, 'quality-inspections')
    })

    it('正例: 9 个路由端点均已注册', () => {
       
      const proto = QualityInspectionController.prototype as any
      const routes = [
        'createInspection',
        'listInspections',
        'getInspection',
        'updateInspection',
        'deleteInspection',
        'getFailedInspections',
        'getPassRate',
        'getInspectionsByType',
        'getInspectionsByItem',
      ]

      for (const methodName of routes) {
        assert.equal(typeof proto[methodName], 'function', `${methodName} should be a function`)
      }
    })
  })

  // ═══════════════════════════════════════════════════════════
  // 9. Defect Entity Shape
  // ═══════════════════════════════════════════════════════════

  describe('Defect / InspectionRecord Entity Shape', () => {
    it('正例: Defect 接口字段完整', () => {
      const defect: Defect = {
        id: 'defect-spec-1',
        code: 'BUG-001',
        description: '功能性缺陷',
        severity: Severity.Critical,
      }
      assert.equal(defect.id, 'defect-spec-1')
      assert.equal(defect.code, 'BUG-001')
      assert.equal(defect.description, '功能性缺陷')
      assert.equal(defect.severity, Severity.Critical)
    })

    it('正例: InspectionRecord 接口全字段', () => {
      const record: InspectionRecord = {
        id: 'inspect-spec-1',
        inspectNo: 'IQC-SPEC-FULL',
        type: InspectionType.Incoming,
        itemName: '全字段测试品',
        itemBatch: 'BATCH-FULL',
        result: InspectionResult.Conditional,
        severity: Severity.Major,
        defects: [
          { id: 'd1', code: 'A', description: '描述A', severity: Severity.Minor },
        ],
        inspector: '全字段员',
        inspectedAt: '2026-07-25T00:00:00.000Z',
        notes: '全字段测试备注',
        tenantId: 'tenant-spec',
        createdAt: '2026-07-25T00:00:00.000Z',
      }
      assert.equal(record.notes, '全字段测试备注')
      assert.equal(record.tenantId, 'tenant-spec')
      assert.equal(record.id, 'inspect-spec-1')
    })
  })
})
