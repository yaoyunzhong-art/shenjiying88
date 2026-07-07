import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [image-recognition] [C] 角色测试
 * 
 * 8 角色视角的 image-recognition 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ImageRecognitionController } from './image-recognition.controller'
import { ImageRecognitionService } from './image-recognition.service'
import { runWithTenant } from '../../common/context/tenant-context'
import type {
  CreateRecognitionDto, VisualSearchDto, DuplicateDetectionDto, ListRecognitionQuery,
} from './image-recognition.dto'
import type { RecognitionResult } from './image-recognition.entity'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

const TENANT = {
  tenantId: 't-role-test', storeId: 'store-001', userId: 'role-test-user',
  role: 'tenant_admin' as const,
}

// ── 测试数据工厂 ──
function createController() {
  const service = new ImageRecognitionService()
  return new ImageRecognitionController(service)
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} image-recognition 角色测试`, () => {
  it('店长创建商品识别任务并获取完整结果（运营管理）', async () => {
    const ctrl = createController()

    const result = await runWithTenant(TENANT, async () =>
      ctrl.createRecognition({
        taskType: 'product_recognition',
        sourceAssetId: 'asset-sm-001',
        filename: 'shelf-photo-001.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'product_recognition')
    assert.equal(result.task.status, 'completed')
    assert.ok(result.objects.length >= 3)
    assert.ok(result.objects[0].skuId)
    assert.ok(result.objects[0].confidence >= 0.75)
    assert.ok(result.avgConfidence > 0)
  })

  it('店长获取引擎列表了解门店可用的识别能力', async () => {
    const ctrl = createController()
    const resp = await ctrl.listEngines()
    const items = (resp as any).items

    assert.ok(Array.isArray(items))
    assert.equal(items.length, 7)

    const yolov8 = items.find((e: any) => e.type === 'mock-yolov8')
    assert.ok(yolov8)
    assert.equal((yolov8 as { displayName: string }).displayName.includes('YOLOv8'), true)

    const clip = items.find((e: any) => e.type === 'mock-clip')
    assert.ok(clip)
  })

  it('店长获取图像识别全局统计（管理决策辅助）', async () => {
    // 先产生一些数据
    const ctrl = createController()
    await runWithTenant(TENANT, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-sm-002' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'shelf_analysis', sourceAssetId: 'asset-sm-003' } as CreateRecognitionDto)
      return ctrl.stats()
    })

    const stats = await runWithTenant(TENANT, async () => ctrl.stats()) as {
      totalTasks: number
      completedTasks: number
      totalObjectsDetected: number
      byTaskType: Record<string, number>
      byEngine: Record<string, number>
      avgConfidence: number
      duplicatesDetected: number
    }

    assert.ok(stats.totalTasks > 0)
    assert.ok(stats.completedTasks > 0)
    assert.ok(stats.totalObjectsDetected > 0)
    assert.ok(Object.keys(stats.byTaskType).length > 0)
    assert.ok(stats.avgConfidence > 0)
  })

  it('店长跨租户无法访问非本店任务（权限隔离边界）', async () => {
    const ctrl = createController()
    const result = await runWithTenant(TENANT, async () =>
      ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-sm-iso' } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    // 用不同租户访问
    await assert.rejects(
      () => runWithTenant(
        { tenantId: 'other-tenant', storeId: 'store-999', userId: 'hacker', role: 'tenant_admin' as const },
        async () => ctrl.getTask(result.task.id),
      ),
      /不存在/,
    )
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} image-recognition 角色测试`, () => {
  it('前台通过商品识别快速扫描商品价格（结账辅助）', async () => {
    const ctrl = createController()
    const result = await runWithTenant(TENANT, async () =>
      ctrl.createRecognition({
        taskType: 'product_recognition',
        sourceAssetId: 'asset-fd-001',
        filename: 'checkout-item.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.status, 'completed')
    assert.ok(result.objects.length > 0)
    // 所有对象应有价格信息
    for (const obj of result.objects) {
      assert.ok(obj.priceCny !== undefined)
      assert.ok(obj.priceCny! > 0)
    }
  })

  it('前台列出最近识别任务了解收银台使用记录', async () => {
    const ctrl = createController()
    // 先创建数据
    await runWithTenant(TENANT, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'assets-reg-001' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'image_classification', sourceAssetId: 'assets-reg-002' } as CreateRecognitionDto)
    })

    const list = await runWithTenant(TENANT, async () =>
      ctrl.listTasks({ limit: 10 } as ListRecognitionQuery),
    ) as { items: unknown[]; total: number }

    assert.ok(Array.isArray(list.items))
    assert.ok(list.items.length > 0)
    assert.equal(list.total, list.items.length)

    const task = list.items[0] as { taskType: string; engine: string; status: string; createdAt: string }
    assert.ok(typeof task.taskType === 'string')
    assert.ok(typeof task.createdAt === 'string')
  })

  it('前台通过视觉搜索快速查找类似商品（解决顾客找货问题）', async () => {
    const ctrl = createController()
    // 准备多个商品指纹
    await runWithTenant(TENANT, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-fd-vs1' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-fd-vs2' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-fd-vs3' } as CreateRecognitionDto)
    })

    const searchResult = await runWithTenant(TENANT, async () =>
      ctrl.visualSearch({
        sourceAssetId: 'asset-fd-vs1',
        topK: 5,
        minSimilarity: 0,
      } as VisualSearchDto),
    ) as { items: unknown[]; total: number }

    assert.ok(searchResult.items.length >= 2)
    assert.equal(searchResult.items.length, searchResult.total)
  })

  it('前台请求不存在任务时得到 404（边界：输入无效 ID）', async () => {
    const ctrl = createController()
    await assert.rejects(
      () => runWithTenant(TENANT, async () => ctrl.getTask('rec-nonexistent')),
      /不存在/,
    )
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} image-recognition 角色测试`, () => {
  it('HR 通过图像分类识别员工活动照片内容', async () => {
    const ctrl = createController()
    const result = await runWithTenant(TENANT, async () =>
      ctrl.createRecognition({
        taskType: 'image_classification',
        sourceAssetId: 'asset-hr-001',
        filename: 'team-photo.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'image_classification')
    assert.equal(result.task.engine, 'mock-clip')
    assert.equal(result.objects.length, 1)
    assert.ok(result.objects[0].label)
    assert.ok(result.objects[0].confidence > 0)
  })

  it('HR 创建任务指定不支持的任务类型 + 引擎组合被拒', async () => {
    const ctrl = createController()
    await assert.rejects(
      () => runWithTenant(TENANT, async () =>
        ctrl.createRecognition({
          taskType: 'shelf_analysis',
          engine: 'mock-clip',
          sourceAssetId: 'asset-hr-err',
        } as CreateRecognitionDto),
      ),
      /不支持任务类型/,
    )
  })

  it('HR 查看引擎列表了解各引擎能力（培训选型参考）', async () => {
    const ctrl = createController()
    const resp = await ctrl.listEngines()
    const items = (resp as any).items

    assert.ok(items.length === 7)

    const efficientnet = items.find((e: any) => e.type === 'mock-efficientnet')
    assert.ok(efficientnet)
    assert.equal((efficientnet as { displayName: string }).displayName.includes('EfficientNet'), true)
    assert.ok((efficientnet as { accuracy: number }).accuracy > 0.8)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} image-recognition 角色测试`, () => {
  it('安监通过货架分析检查货架空位和安全合规', async () => {
    const ctrl = createController()
    const result = await runWithTenant(TENANT, async () =>
      ctrl.createRecognition({
        taskType: 'shelf_analysis',
        sourceAssetId: 'asset-sec-001',
        filename: 'shelf-night-check.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'shelf_analysis')
    assert.equal(result.task.engine, 'mock-yolov8n-shelf')
    assert.ok(result.shelfAnalysis)
    assert.ok(result.shelfAnalysis!.totalSlots > 0)
    assert.ok(result.shelfAnalysis!.occupancyRate >= 0)
    assert.ok(result.shelfAnalysis!.outOfStock.length > 0)
    assert.ok(result.shelfAnalysis!.restockSuggestions.length > 0)
  })

  it('安监通过重复检测发现重复敏感监控图像', async () => {
    const ctrl = createController()
    // 准备指纹
    await runWithTenant(TENANT, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-sec-dup1' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-sec-dup2' } as CreateRecognitionDto)
    })

    const result = await runWithTenant(TENANT, async () =>
      ctrl.detectDuplicates({
        sourceAssetId: 'asset-sec-dup1',
        threshold: 0.5,
      } as DuplicateDetectionDto),
    ) as { sourceAssetId: string; duplicates: unknown[] }

    assert.equal(result.sourceAssetId, 'asset-sec-dup1')
    assert.ok(Array.isArray(result.duplicates))
  })

  it('安监取消正在进行的识别任务（边界：发现错误触发时紧急停止）', async () => {
    const ctrl = createController()
    // 使用同步模拟因此直接创建 + 取消（已完成的任务应该拒绝）
    const result = await runWithTenant(TENANT, async () =>
      ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-sec-cancel' } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    // 已完成的任务不可取消
    await assert.rejects(
      () => runWithTenant(TENANT, async () => ctrl.cancelTask(result.task.id)),
      /终态/,
    )
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} image-recognition 角色测试`, () => {
  it('导玩员通过对象检测识别游乐设备上的物体', async () => {
    const ctrl = createController()
    const result = await runWithTenant(TENANT, async () =>
      ctrl.createRecognition({
        taskType: 'object_detection',
        engine: 'mock-yolov8',
        sourceAssetId: 'asset-guide-001',
        filename: 'game-machine.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'object_detection')
    assert.equal(result.task.engine, 'mock-yolov8')
    assert.ok(result.objects.length >= 3)
    for (const obj of result.objects) {
      assert.ok(obj.bbox.x >= 0)
      assert.ok(obj.bbox.width >= 50)
      assert.ok(obj.confidence >= 0.7)
    }
  })

  it('导玩员使用视觉搜索识别游客丢失物品相似度', async () => {
    const ctrl = createController()
    await runWithTenant(TENANT, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-guide-lost1' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-guide-lost2' } as CreateRecognitionDto)
    })

    const result = await runWithTenant(TENANT, async () =>
      ctrl.visualSearch({
        sourceAssetId: 'asset-guide-lost1',
        topK: 3,
        minSimilarity: 0,
      } as VisualSearchDto),
    ) as { items: { similarity: number; matchedAssetId: string }[]; total: number }

    assert.ok(result.items.length >= 1)
    for (const item of result.items) {
      assert.ok(item.similarity >= 0 && item.similarity <= 1)
      assert.ok(item.matchedAssetId)
    }
    assert.equal(result.items.length, result.total)
  })

  it('导玩员创建分类任务时返回单个对象（边界：分类只需一个标签）', async () => {
    const ctrl = createController()
    const result = await runWithTenant(TENANT, async () =>
      ctrl.createRecognition({
        taskType: 'image_classification',
        sourceAssetId: 'asset-guide-cls-001',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.objects.length, 1)
    assert.ok(result.objects[0].label)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} image-recognition 角色测试`, () => {
  it('运行专员按引擎过滤识别任务列表（运维排障）', async () => {
    const ctrl = createController()
    await runWithTenant(TENANT, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', engine: 'mock-efficientnet', sourceAssetId: 'asset-ops-001' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', engine: 'mock-efficientnet', sourceAssetId: 'asset-ops-002' } as CreateRecognitionDto)
    })

    const list = await runWithTenant(TENANT, async () =>
      ctrl.listTasks({ engine: 'mock-efficientnet' } as ListRecognitionQuery),
    ) as { items: unknown[] }

    assert.ok(list.items.length >= 2)
    for (const item of list.items) {
      assert.equal((item as { engine: string }).engine, 'mock-efficientnet')
    }
  })

  it('运行专员获取统计了解系统负载', async () => {
    const ctrl = createController()
    // 先产生数据
    await runWithTenant(TENANT, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-stats-001' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'shelf_analysis', sourceAssetId: 'asset-stats-002' } as CreateRecognitionDto)
    })

    const stats = await runWithTenant(TENANT, async () => ctrl.stats()) as {
      totalTasks: number
      completedTasks: number
      totalObjectsDetected: number
      avgConfidence: number
      avgDurationMs: number
      byEngine: Record<string, number>
      byTaskType: Record<string, number>
    }

    assert.ok(stats.totalTasks > 0)
    assert.ok(stats.completedTasks > 0)
    assert.ok(stats.totalObjectsDetected > 0)
    assert.ok(stats.avgConfidence > 0)
    assert.ok(stats.avgDurationMs > 0)
    assert.ok(typeof stats.byEngine === 'object')
    assert.ok(typeof stats.byTaskType === 'object')
  })

  it('运行专员创建任务指定不存在引擎被拒（边界：引擎名非法）', async () => {
    const ctrl = createController()
    await assert.rejects(
      () => runWithTenant(TENANT, async () =>
        ctrl.createRecognition({
          taskType: 'product_recognition',
          engine: 'mock-nonexistent-engine' as never,
          sourceAssetId: 'asset-ops-invalid',
        } as CreateRecognitionDto),
      ),
      /引擎.*不存在/,
    )
  })

  it('运行专员按状态过滤任务列表', async () => {
    const ctrl = createController()
    // 先创建数据
    await runWithTenant(TENANT, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-status-001' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-status-002' } as CreateRecognitionDto)
    })

    const list = await runWithTenant(TENANT, async () =>
      ctrl.listTasks({ status: 'completed' } as ListRecognitionQuery),
    ) as { items: { status: string }[]; total: number }

    assert.ok(list.items.length > 0)
    for (const item of list.items) {
      assert.equal(item.status, 'completed')
    }
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} image-recognition 角色测试`, () => {
  it('团建通过图像分类识别活动合影场景', async () => {
    const ctrl = createController()
    const result = await runWithTenant(TENANT, async () =>
      ctrl.createRecognition({
        taskType: 'image_classification',
        sourceAssetId: 'asset-team-001',
        filename: 'team-building-activity.jpg',
        linkedEntity: { entityType: 'campaign', entityId: 'campaign-team-01' },
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'image_classification')
    assert.ok(result.task.linkedEntity)
    assert.equal(result.task.linkedEntity!.entityType, 'campaign')
    assert.ok(result.objects[0].label)
  })

  it('团建通过货架分析检查活动物资摆放整齐度', async () => {
    const ctrl = createController()
    const result = await runWithTenant(TENANT, async () =>
      ctrl.createRecognition({
        taskType: 'shelf_analysis',
        sourceAssetId: 'asset-team-shelf',
        filename: 'team-material-shelf.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'shelf_analysis')
    assert.equal(result.task.engine, 'mock-yolov8n-shelf')
    assert.ok(result.shelfAnalysis, '货架分析结果不应为空')
    assert.ok(result.shelfAnalysis!.totalSlots > 0, '应有总货位数')
    assert.ok(result.shelfAnalysis!.tidiness > 0, '整齐度应大于0')
    assert.ok(result.shelfAnalysis!.occupancyRate >= 0, '占有率应 >= 0')
    assert.ok(result.shelfAnalysis!.emptySlots >= 0)
    assert.ok(result.shelfAnalysis!.restockSuggestions.length > 0, '应有补货建议')
    assert.ok(result.shelfAnalysis!.priceCompliance.correctCount >= 0, '价格合规检查应可用')
  })

  it('团建获取引擎能力了解哪些引擎适合活动场景', async () => {
    const ctrl = createController()
    const resp = await ctrl.listEngines()
    const items = (resp as { items: { type: string; displayName: string; category: string }[] }).items

    const detectionEngines = items.filter(e => e.category === 'detection')
    const classificationEngines = items.filter(e => e.category === 'classification')
    const embeddingEngines = items.filter(e => e.category === 'embedding')

    assert.ok(detectionEngines.length >= 2) // YOLOv8 + YOLOv8n-shelf
    assert.ok(classificationEngines.length >= 3) // ResNet50 + CLIP + EfficientNet
    assert.ok(embeddingEngines.length >= 2) // pHash + dHash
  })

  it('团建检测到指定引擎版本号正确', async () => {
    const ctrl = createController()
    const resp = await ctrl.listEngines()
    const items = (resp as any).items

    const yolov8 = items.find((e: any) => e.type === 'mock-yolov8') as { displayName: string; accuracy: number }
    assert.ok(yolov8.displayName)
    assert.ok(yolov8.accuracy > 0.8)

    const pHash = items.find((e: any) => e.type === 'mock-pHash') as { accuracy: number }
    assert.ok(pHash.accuracy >= 0.8)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} image-recognition 角色测试`, () => {
  it('营销创建商品识别分析促销陈列效果', async () => {
    const ctrl = createController()
    const result = await runWithTenant(TENANT, async () =>
      ctrl.createRecognition({
        taskType: 'product_recognition',
        sourceAssetId: 'asset-mkt-001',
        filename: 'promotion-display.jpg',
        linkedEntity: { entityType: 'campaign', entityId: 'campaign-summer-sale' },
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'product_recognition')
    assert.ok(result.task.linkedEntity)
    assert.equal(result.task.linkedEntity!.entityId, 'campaign-summer-sale')
    assert.ok(result.objects.some(o => o.skuId))
  })

  it('营销进行货架分析了解畅销品陈列情况', async () => {
    const ctrl = createController()
    const result = await runWithTenant(TENANT, async () =>
      ctrl.createRecognition({
        taskType: 'shelf_analysis',
        sourceAssetId: 'asset-mkt-shelf',
        filename: 'shelf-promo-check.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.ok(result.shelfAnalysis)
    assert.ok(result.shelfAnalysis!.restockSuggestions.length > 0)
    assert.ok(result.shelfAnalysis!.priceCompliance.issues.length >= 0)
    assert.ok(result.shelfAnalysis!.emptySlots >= 0)
  })

  it('营销通过重复检测查找营销素材中重复图片（避免重复使用）', async () => {
    const ctrl = createController()
    await runWithTenant(TENANT, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-mkt-dup-a1' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-mkt-dup-a2' } as CreateRecognitionDto)
    })

    const result = await runWithTenant(TENANT, async () =>
      ctrl.detectDuplicates({
        sourceAssetId: 'asset-mkt-dup-a1',
        threshold: 0.6,
      } as DuplicateDetectionDto),
    ) as { sourceAssetId: string; duplicates: { assetId: string; similarity: number }[] }

    assert.equal(result.sourceAssetId, 'asset-mkt-dup-a1')
    assert.ok(Array.isArray(result.duplicates))
    for (const d of result.duplicates) {
      assert.ok(d.similarity >= 0.6)
    }
  })

  it('营销按 taskType + 引擎组合过滤任务（营销活动效果分析）', async () => {
    const ctrl = createController()
    // 先创建匹配的数据
    await runWithTenant(TENANT, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', engine: 'mock-efficientnet', sourceAssetId: 'asset-mkt-filter-01' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', engine: 'mock-efficientnet', sourceAssetId: 'asset-mkt-filter-02' } as CreateRecognitionDto)
    })

    const list = await runWithTenant(TENANT, async () =>
      ctrl.listTasks({
        taskType: 'product_recognition',
        engine: 'mock-efficientnet',
      } as ListRecognitionQuery),
    ) as { items: { taskType: string; engine: string }[] }

    assert.ok(list.items.length > 0, '应有过滤后的任务')
    for (const item of list.items) {
      assert.equal(item.taskType, 'product_recognition')
      assert.equal(item.engine, 'mock-efficientnet')
    }
  })
})
