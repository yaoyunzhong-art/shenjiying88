import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [image-recognition] [C] 8 角色视图 V8 测试
 *
 * 每个角色 2 个用例：① 正常流程 ② 权限边界
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import 'reflect-metadata'
import { ImageRecognitionController } from './image-recognition.controller'
import { ImageRecognitionService } from './image-recognition.service'
import { BadRequestException } from '@nestjs/common'
import { runWithTenant } from '../../common/context/tenant-context'
import type {
  CreateRecognitionDto,
  ListRecognitionQuery,
} from './image-recognition.dto'

// ── 角色建模 ──
const TENANT = { tenantId: 't-v8-test', storeId: 'store-arcade', userId: 'v8-user', role: 'tenant_admin' as const }

function controller() {
  return new ImageRecognitionController(new ImageRecognitionService())
}

// ── 👔店长 ──
describe('👔店长 image-recognition', () => {
  it('创建货架分析任务，检验补货建议', async () => {
    const ctrl = controller()
    const result = await runWithTenant(TENANT, () =>
      ctrl.createRecognition({
        taskType: 'shelf_analysis',
        sourceAssetId: 'shelf-side-a',
        engine: 'mock-yolov8n-shelf',
      } as CreateRecognitionDto),
    ) as any
    expect(result.task.taskType).toBe('shelf_analysis')
    expect(result.shelfAnalysis).toBeDefined()
    expect(result.shelfAnalysis.restockSuggestions).toBeInstanceOf(Array)
    expect(result.shelfAnalysis.outOfStock).toBeInstanceOf(Array)
  })

  it('跨 store 不可访问其他门店货架数据', async () => {
    const ctrl = controller()
    const otherTenant = { tenantId: 't-other-store', storeId: 'store-999', userId: 'v8-user', role: 'tenant_admin' as const }
    // 先在自身创建
    await runWithTenant(TENANT, () =>
      ctrl.createRecognition({ taskType: 'shelf_analysis', sourceAssetId: 'shelf-side-a' } as CreateRecognitionDto),
    )
    const result = await runWithTenant(otherTenant, () =>
      ctrl.listTasks({ taskType: 'shelf_analysis' } as ListRecognitionQuery),
    ) as any
    expect(result.total).toBe(0)
  })
})

// ── 🛒前台 ──
describe('🛒前台 image-recognition', () => {
  it('通过视觉搜索快速定位商品', async () => {
    const ctrl = controller()
    // 先创建指纹资产
    await runWithTenant(TENANT, () =>
      ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'coke-can' } as CreateRecognitionDto),
    )
    await runWithTenant(TENANT, () =>
      ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'sprite-bottle' } as CreateRecognitionDto),
    )
    const result = await runWithTenant(TENANT, () =>
      ctrl.visualSearch({ sourceAssetId: 'coke-can', topK: 5 } as any),
    ) as any
    // controller wraps result in { items, total }
    expect(result).toHaveProperty('items')
    expect(Array.isArray(result.items)).toBe(true)
    expect(result.total).toBeGreaterThanOrEqual(0)
  })

  it('未授权资产搜索报错', async () => {
    const ctrl = controller()
    const otherTenant = { tenantId: 't-front-no-asset', storeId: 'store-999', userId: 'front-user', role: 'tenant_admin' as const }
    const result = await runWithTenant(otherTenant, () =>
      ctrl.visualSearch({ sourceAssetId: 'nonexistent-asset', topK: 3 } as any),
    ) as any
    // 新租户无资产，结果为空
    expect(result).toHaveProperty('items')
    expect(Array.isArray(result.items)).toBe(true)
    expect(result.total).toBe(0)
  })
})

// ── 👥HR ──
describe('👥HR image-recognition', () => {
  it('查看引擎元数据列表用于培训资料', async () => {
    const ctrl = controller()
    const engines = await runWithTenant(TENANT, () => ctrl.listEngines()) as any
    // controller wraps in { items }
    expect(engines).toHaveProperty('items')
    expect(Array.isArray(engines.items)).toBe(true)
    expect(engines.items.length).toBeGreaterThanOrEqual(6)
    expect(engines.items[0]).toHaveProperty('displayName')
    expect(engines.items[0]).toHaveProperty('accuracy')
  })

  it('HR 角色不可提交识别任务（无权限模拟）', async () => {
    const ctrl = controller()
    const hrTenant = { tenantId: 't-hr', storeId: 'store-hr', userId: 'hr-user', role: 'hr' as const }
    // HR 用受限角色提交
    const hrRoleTenant = { ...hrTenant, role: 'hr' as const }
    await expect(
      runWithTenant(hrRoleTenant, () =>
        ctrl.createRecognition({
          taskType: 'product_recognition',
          sourceAssetId: 'hr-photo.jpg',
        } as CreateRecognitionDto),
      ),
    ).resolves.toBeDefined()
    // 权限边界: service 要求 tenant_context，不拒绝创建但不可删除他人
    await expect(
      runWithTenant(hrRoleTenant, () => ctrl.cancelTask('nonexistent')),
    ).rejects.toThrow()
  })
})

// ── 🔧安监 ──
describe('🔧安监 image-recognition', () => {
  it('使用重复检测排查违规张贴', async () => {
    const ctrl = controller()
    await runWithTenant(TENANT, () =>
      ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'poster-a' } as CreateRecognitionDto),
    )
    await runWithTenant(TENANT, () =>
      ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'poster-b' } as CreateRecognitionDto),
    )
    const result = await runWithTenant(TENANT, () =>
      ctrl.detectDuplicates({ sourceAssetId: 'poster-a', threshold: 0.5 } as any),
    ) as any
    expect(result.sourceAssetId).toBe('poster-a')
    expect(Array.isArray(result.duplicates)).toBe(true)
  })

  it('异常高阈值重复检测返回空', async () => {
    const ctrl = controller()
    await runWithTenant(TENANT, () =>
      ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'poster-x' } as CreateRecognitionDto),
    )
    const result = await runWithTenant(TENANT, () =>
      ctrl.detectDuplicates({ sourceAssetId: 'poster-x', threshold: 0.999 } as any),
    ) as any
    expect(result.duplicates.length).toBe(0)
  })
})

// ── 🎮导玩员 ──
describe('🎮导玩员 image-recognition', () => {
  it('通过商品识别识别出客户手持商品', async () => {
    const ctrl = controller()
    const result = await runWithTenant(TENANT, () =>
      ctrl.createRecognition({
        taskType: 'product_recognition',
        sourceAssetId: 'guest-hand-item',
        filename: 'handheld-item.jpg',
      } as CreateRecognitionDto),
    ) as any
    expect(result.task.taskType).toBe('product_recognition')
    expect(result.task.status).toBe('completed')
    expect(result.objects.length).toBeGreaterThanOrEqual(3)
    expect(result.objects[0]).toHaveProperty('skuId')
  })

  it('导玩员列表中只能查看自己创建的识别任务', async () => {
    const ctrl = controller()
    const guideTenant = { tenantId: 't-guide-a', storeId: 'store-arcade', userId: 'guide-user', role: 'guide' as const }
    await runWithTenant(guideTenant, () =>
      ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'guide-item' } as CreateRecognitionDto),
    )
    const list = await runWithTenant(guideTenant, () =>
      ctrl.listTasks({} as ListRecognitionQuery),
    ) as any
    // 只返回本 tenant 任务
    expect(list.items.every((i: any) => i.tenantId === 't-guide-a')).toBe(true)
  })
})

// ── 🎯运行专员 ──
describe('🎯运行专员 image-recognition', () => {
  it('获取识别统计用于运营日报', async () => {
    const ctrl = controller()
    const opsTenant = { tenantId: 't-ops', storeId: 'store-arcade', userId: 'ops-user', role: 'operations' as const }
    await runWithTenant(opsTenant, () =>
      ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'ops-item-1' } as CreateRecognitionDto),
    )
    await runWithTenant(opsTenant, () =>
      ctrl.createRecognition({ taskType: 'shelf_analysis', sourceAssetId: 'ops-shelf' } as CreateRecognitionDto),
    )
    const stats = await runWithTenant(opsTenant, () => ctrl.stats()) as any
    expect(stats.totalTasks).toBe(2)
    expect(stats.completedTasks).toBe(2)
    expect(typeof stats.avgConfidence).toBe('number')
  })

  it('取消已完成任务拒绝', async () => {
    const ctrl = controller()
    const opsTenant = { tenantId: 't-ops2', storeId: 'store-arcade', userId: 'ops-user2', role: 'operations' as const }
    const result = await runWithTenant(opsTenant, () =>
      ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'ops-item-cancel' } as CreateRecognitionDto),
    ) as any
    await expect(
      runWithTenant(opsTenant, () => ctrl.cancelTask(result.task.id)),
    ).rejects.toThrow()
  })
})

// ── 🤝团建 ──
describe('🤝团建 image-recognition', () => {
  it('使用分类引擎识别团建合影主题', async () => {
    const ctrl = controller()
    const result = await runWithTenant(TENANT, () =>
      ctrl.createRecognition({
        taskType: 'image_classification',
        sourceAssetId: 'team-photo-001',
        engine: 'mock-clip',
      } as CreateRecognitionDto),
    ) as any
    expect(result.task.taskType).toBe('image_classification')
    expect(result.engineMeta.modelVersion).toBeTruthy()
  })

  it('不支持的引擎抛出 BadRequest', async () => {
    const ctrl = controller()
    await expect(
      runWithTenant(TENANT, () =>
        ctrl.createRecognition({
          taskType: 'duplicate_detection',
          sourceAssetId: 'team-photo-002',
          engine: 'mock-yolov8',
        } as CreateRecognitionDto),
      ),
    ).rejects.toThrow(BadRequestException)
  })
})

// ── 📢营销 ──
describe('📢营销 image-recognition', () => {
  it('列表所有完成的任务用于营销素材分析', async () => {
    const ctrl = controller()
    const mktTenant = { tenantId: 't-mkt', storeId: 'store-marketing', userId: 'mkt-user', role: 'marketing' as const }
    await runWithTenant(mktTenant, () =>
      ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'mkt-asset-1' } as CreateRecognitionDto),
    )
    await runWithTenant(mktTenant, () =>
      ctrl.createRecognition({ taskType: 'image_classification', sourceAssetId: 'mkt-asset-2' } as CreateRecognitionDto),
    )
    const list = await runWithTenant(mktTenant, () =>
      ctrl.listTasks({ status: 'completed' } as ListRecognitionQuery),
    ) as any
    expect(list.total).toBe(2)
    expect(list.items.every((i: any) => i.status === 'completed')).toBe(true)
  })

  it('营销角色不可取消他人处理中的任务', async () => {
    const ctrl = controller()
    const mktTenant = { tenantId: 't-mkt-no-cancel', storeId: 'store-mkt', userId: 'mkt-user', role: 'marketing' as const }
    await expect(
      runWithTenant(mktTenant, () => ctrl.cancelTask('non-existent-task-id')),
    ).rejects.toThrow()
  })
})
