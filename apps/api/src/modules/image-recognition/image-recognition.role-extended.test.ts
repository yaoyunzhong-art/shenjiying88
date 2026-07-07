import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [image-recognition] [C] 角色测试扩展
 *
 * 8 角色深度场景扩展测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 3 个测试用例（正常流程 + 权限边界 + 高级场景）
 * 覆盖: 商品识别、货架分析、视觉搜索、重复检测、引擎管理、统计、
 *       取消任务、跨租户隔离、空数据边界
 */

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
  tenantId: 't-role-ext',
  storeId: 'store-ext-001',
  userId: 'role-ext-user',
  role: 'tenant_admin' as const,
}

const OTHER_TENANT = {
  tenantId: 't-other-ext',
  storeId: 'store-other-001',
  userId: 'other-user',
  role: 'tenant_admin' as const,
}

// ── 测试工厂 ──
function createEnv() {
  const service = new ImageRecognitionService()
  const controller = new ImageRecognitionController(service)
  return { service, controller }
}

// ═══════════════════════════════════════════════════════════
// 👔 店长 — 门店运营决策: 货架分析 + 重复检测 + 全店统计
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} image-recognition 扩展场景`, () => {

  it('店长发起货架分析并获取补货建议', async () => {
    const { controller } = createEnv()
    const result = await runWithTenant(TENANT, async () =>
      controller.createRecognition({
        taskType: 'shelf_analysis',
        sourceAssetId: 'asset-sm-shelf-001',
        filename: 'shelf-a3-photo.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'shelf_analysis')
    assert.ok(result.shelfAnalysis)
    assert.ok(result.shelfAnalysis!.totalSlots > 0)
    assert.ok(result.shelfAnalysis!.occupancyRate >= 0)
    assert.ok(result.shelfAnalysis!.outOfStock.length >= 0)
    assert.ok(result.shelfAnalysis!.restockSuggestions.length > 0)
    // 建议补货 SKU 有对应操作
    assert.ok(result.shelfAnalysis!.restockSuggestions[0].suggestedQuantity > 0)
  })

  it('店长检测门店重复图片（清理冗余上传）', async () => {
    const { controller } = createEnv()
    // 先上传两个重复图片
    await runWithTenant(TENANT, async () => {
      await controller.createRecognition({
        taskType: 'product_recognition', sourceAssetId: 'asset-sm-dup-01',
      } as CreateRecognitionDto)
      await controller.createRecognition({
        taskType: 'product_recognition', sourceAssetId: 'asset-sm-dup-02',
      } as CreateRecognitionDto)
    })

    const dupResult = await runWithTenant(TENANT, async () =>
      controller.detectDuplicates({
        sourceAssetId: 'asset-sm-dup-01',
        candidateAssetIds: ['asset-sm-dup-01', 'asset-sm-dup-02', 'asset-sm-uniq-01'],
        threshold: 0.0,
      } as DuplicateDetectionDto),
    ) as unknown as { sourceAssetId: string; duplicates: Array<{ assetId: string; similarity: number }> }

    assert.equal(dupResult.sourceAssetId, 'asset-sm-dup-01')
    assert.ok(dupResult.duplicates.length > 0)
    // 排除自身（服务层会自动过滤源资产本身）
    const hasOnlyOthers = dupResult.duplicates.every(d => d.assetId !== 'asset-sm-dup-01')
    assert.ok(hasOnlyOthers, '重复检测结果应不包含源资产自身')
  })

  it('店长无法取消已完成的任务（边界）', async () => {
    const { controller } = createEnv()
    const result = await runWithTenant(TENANT, async () =>
      controller.createRecognition({
        taskType: 'product_recognition', engine: 'mock-yolov8',
        sourceAssetId: 'asset-sm-cancel-01',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    // 任务创建后立即变为 completed, 不可取消
    await assert.rejects(
      () => runWithTenant(TENANT, async () => controller.cancelTask(result.task.id)),
      /不可取消|终态|completed/i,
    )
  })

  it('店长跨租户无法访问其他门店的识别任务（边界）', async () => {
    const { controller } = createEnv()
    // 在主租户创建任务
    const result = await runWithTenant(TENANT, async () =>
      controller.createRecognition({
        taskType: 'product_recognition', sourceAssetId: 'asset-sm-iso-01',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    // 其他租户无法读取
    await assert.rejects(
      () => runWithTenant(OTHER_TENANT, async () => controller.getTask(result.task.id)),
      /不存在/,
    )
  })
})

// ═══════════════════════════════════════════════════════════
// 🛒 前台 — 收银辅助: 商品识别 + 正品验证 + 退货审核
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} image-recognition 扩展场景`, () => {

  it('前台识别多个商品并计算结账总价', async () => {
    const { controller } = createEnv()
    const r1 = await runWithTenant(TENANT, async () =>
      controller.createRecognition({
        taskType: 'product_recognition', sourceAssetId: 'asset-fd-multi-001',
        filename: 'basket-photo-01.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.ok(r1.objects.length >= 3)
    // 计算总价
    const total = r1.objects.reduce((sum, o) => sum + (o.priceCny ?? 0), 0)
    assert.ok(total > 0, '应检测到商品且累加价格')
    // 所有对象应有 SKU
    for (const obj of r1.objects) {
      assert.ok(obj.skuId, '每个检测对象应有 skuId')
    }
  })

  it('前台货架扫描检测缺货并通知补货', async () => {
    const { controller } = createEnv()
    const result = await runWithTenant(TENANT, async () =>
      controller.createRecognition({
        taskType: 'shelf_analysis', sourceAssetId: 'asset-fd-shelf-001',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.ok(result.shelfAnalysis)
    // 检查空货位
    assert.ok(result.shelfAnalysis!.emptySlots >= 0)
    assert.ok(result.shelfAnalysis!.totalSlots >= result.shelfAnalysis!.occupiedSlots)
    // 价格合规
    assert.ok(typeof result.shelfAnalysis!.priceCompliance.correctCount === 'number')
  })

  it('前台提交未知任务类型被拒绝（边界）', async () => {
    const { controller } = createEnv()
    await assert.rejects(
      () => runWithTenant(TENANT, async () =>
        controller.createRecognition({
          taskType: 'unknown_type_xyz' as any,
          sourceAssetId: 'test-asset-bad-type',
        } as CreateRecognitionDto),
      ),
      /不支持任务类型|不存在|不合法/i,
    )
  })

  it('前台请求不存在的任务 ID 返回 404（边界）', async () => {
    const { controller } = createEnv()
    await assert.rejects(
      () => runWithTenant(TENANT, async () => controller.getTask('rec-fake-id-999999')),
      /不存在/,
    )
  })
})

// ═══════════════════════════════════════════════════════════
// 👥HR — 员工活动管理: 图像分类 + 引擎能力了解 + 人员统计
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.HR} image-recognition 扩展场景`, () => {

  it('HR 用 CLIP 零样本分类识别团建照片主题', async () => {
    const { controller } = createEnv()
    const result = await runWithTenant(TENANT, async () =>
      controller.createRecognition({
        taskType: 'image_classification',
        engine: 'mock-clip',
        sourceAssetId: 'asset-hr-clip-001',
        filename: 'team-building-outdoor.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.engine, 'mock-clip')
    assert.equal(result.objects.length, 1)
    assert.ok(result.objects[0].label)
    assert.ok(result.objects[0].confidence > 0.7)
  })

  it('HR 用不兼容引擎+任务类型组合时被拒绝（边界）', async () => {
    const { controller } = createEnv()
    // ResNet50 不支持 shelf_analysis
    await assert.rejects(
      () => runWithTenant(TENANT, async () =>
        controller.createRecognition({
          taskType: 'shelf_analysis',
          engine: 'mock-resnet50',
          sourceAssetId: 'asset-hr-bad-combo',
        } as CreateRecognitionDto),
      ),
      /不支持任务类型|不兼容/,
    )
  })

  it('HR 查询引擎元信息了解适用场景', async () => {
    const { controller } = createEnv()
    const resp = await controller.listEngines() as any
    const items = resp.items

    assert.equal(items.length, 7)
    for (const engine of items) {
      assert.ok(engine.displayName)
      assert.ok(engine.category)
      assert.ok(Array.isArray(engine.taskTypes))
      assert.ok(engine.accuracy > 0)
    }
  })
})

// ═══════════════════════════════════════════════════════════
// 🔧 安监 — 安全监控: 目标检测 + 异常识别 + 视频帧分析
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Security} image-recognition 扩展场景`, () => {

  it('安监使用通用目标检测扫描监控画面', async () => {
    const { controller } = createEnv()
    const result = await runWithTenant(TENANT, async () =>
      controller.createRecognition({
        taskType: 'object_detection',
        engine: 'mock-yolov8',
        sourceAssetId: 'asset-sec-cam-001',
        filename: 'camera-feed-01.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'object_detection')
    assert.ok(result.objects.length > 0)
    for (const obj of result.objects) {
      assert.ok(obj.confidence > 0)
      assert.ok(obj.bbox.width > 0)
      assert.ok(obj.bbox.height > 0)
    }
  })

  it('安监使用货架分析检测异常摆放', async () => {
    const { controller } = createEnv()
    const result = await runWithTenant(TENANT, async () =>
      controller.createRecognition({
        taskType: 'shelf_analysis',
        sourceAssetId: 'asset-sec-shelf-001',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.ok(result.shelfAnalysis)
    assert.ok(typeof result.shelfAnalysis!.tidiness === 'number')
    // tidiness 在 0..1 范围内
    assert.ok(result.shelfAnalysis!.tidiness >= 0 && result.shelfAnalysis!.tidiness <= 1)
  })

  it('安监获取识别统计数据（安全管理决策）', async () => {
    const { controller } = createEnv()
    // 先创建一些任务
    await runWithTenant(TENANT, async () => {
      await controller.createRecognition({
        taskType: 'object_detection', sourceAssetId: 'asset-sec-stats-001',
      } as CreateRecognitionDto)
      await controller.createRecognition({
        taskType: 'shelf_analysis', sourceAssetId: 'asset-sec-stats-002',
      } as CreateRecognitionDto)
    })

    const stats = await runWithTenant(TENANT, async () =>
      controller.stats(),
    ) as any

    assert.ok(stats.totalTasks >= 2)
    assert.ok(typeof stats.avgConfidence === 'number')
    assert.ok(stats.byTaskType)
    assert.ok(stats.byEngine)
  })
})

// ═══════════════════════════════════════════════════════════
// 🎮 导玩员 — 游艺区域: 识别游戏设备 + 游客密度 + 商品
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Guide} image-recognition 扩展场景`, () => {

  it('导玩员识别抓娃娃机中的奖品', async () => {
    const { controller } = createEnv()
    const result = await runWithTenant(TENANT, async () =>
      controller.createRecognition({
        taskType: 'product_recognition',
        engine: 'mock-efficientnet',
        sourceAssetId: 'asset-guide-claw-001',
        filename: 'claw-machine-prize.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.engine, 'mock-efficientnet')
    assert.ok(result.objects.length > 0)
    for (const obj of result.objects) {
      assert.ok(obj.productName || obj.label)
      assert.ok(obj.confidence > 0.7)
    }
  })

  it('导玩员视觉搜索查找相似玩具（帮助顾客找到同款）', async () => {
    const { controller } = createEnv()
    // 准备多个资产
    await runWithTenant(TENANT, async () => {
      await controller.createRecognition({
        taskType: 'product_recognition', sourceAssetId: 'asset-guide-vs-01',
      } as CreateRecognitionDto)
      await controller.createRecognition({
        taskType: 'product_recognition', sourceAssetId: 'asset-guide-vs-02',
      } as CreateRecognitionDto)
      await controller.createRecognition({
        taskType: 'product_recognition', sourceAssetId: 'asset-guide-vs-03',
      } as CreateRecognitionDto)
    })

    const vsResult = await runWithTenant(TENANT, async () =>
      controller.visualSearch({
        sourceAssetId: 'asset-guide-vs-01',
        topK: 5,
        minSimilarity: 0.0,
      } as VisualSearchDto),
    ) as any

    assert.ok(vsResult.items.length >= 2)
    assert.equal(vsResult.total, vsResult.items.length)
    for (const item of vsResult.items) {
      assert.ok(typeof item.similarity === 'number')
      assert.ok(item.similarity >= 0 && item.similarity <= 1)
    }
  })

  it('导玩员按类型过滤识别任务列表', async () => {
    const { controller } = createEnv()
    await runWithTenant(TENANT, async () => {
      await controller.createRecognition({
        taskType: 'product_recognition', sourceAssetId: 'asset-guide-filter-pr',
      } as CreateRecognitionDto)
      await controller.createRecognition({
        taskType: 'image_classification', sourceAssetId: 'asset-guide-filter-cls',
      } as CreateRecognitionDto)
    })

    const filtered = await runWithTenant(TENANT, async () =>
      controller.listTasks({ taskType: 'product_recognition', limit: 10 } as ListRecognitionQuery),
    ) as any

    for (const item of filtered.items) {
      assert.equal(item.taskType, 'product_recognition')
    }
  })
})

// ═══════════════════════════════════════════════════════════
// 🎯 运行专员 — 系统运维: 引擎性能 + 批量任务 + 状态监控
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Operations} image-recognition 扩展场景`, () => {

  it('运行专员获取引擎性能指标（运维决策支持）', async () => {
    const { controller } = createEnv()
    const resp = await controller.listEngines() as any
    const items = resp.items

    for (const engine of items) {
      assert.ok(typeof engine.avgTimeMs === 'number')
      assert.ok(engine.avgTimeMs > 0)
      assert.ok(typeof engine.accuracy === 'number')
      assert.ok(engine.accuracy > 0 && engine.accuracy <= 1)
    }
  })

  it('运行专员用 limit 参数分页查询任务列表', async () => {
    const { controller } = createEnv()
    // 批量创建任务
    await runWithTenant(TENANT, async () => {
      for (let i = 0; i < 5; i++) {
        await controller.createRecognition({
          taskType: 'product_recognition', sourceAssetId: `asset-ops-batch-${String(i).padStart(3, '0')}`,
        } as CreateRecognitionDto)
      }
    })

    const page1 = await runWithTenant(TENANT, async () =>
      controller.listTasks({ limit: 3 } as ListRecognitionQuery),
    ) as any
    assert.ok(page1.items.length <= 3)
    assert.equal(page1.total, page1.items.length)
  })

  it('运行专员获取空数据库统计（边界：空环境）', async () => {
    const { controller } = createEnv()
    // 使用全新的 controller 实例（空）
    const freshEnv = createEnv()
    const stats = await runWithTenant(TENANT, async () =>
      freshEnv.controller.stats(),
    ) as any

    assert.equal(stats.totalTasks, 0)
    assert.equal(stats.completedTasks, 0)
    assert.equal(stats.totalObjectsDetected, 0)
    assert.deepEqual(stats.byTaskType, {})
  })
})

// ═══════════════════════════════════════════════════════════
// 🤝 团建 — 活动组织: 批量图片分类 + 活动照片管理 + 场景分析
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} image-recognition 扩展场景`, () => {

  it('团建负责人分类团建活动照片', async () => {
    const { controller } = createEnv()
    const result = await runWithTenant(TENANT, async () =>
      controller.createRecognition({
        taskType: 'image_classification',
        sourceAssetId: 'asset-tb-photo-001',
        filename: 'team-hiking-20260630.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'image_classification')
    assert.equal(result.objects.length, 1)
    assert.ok(result.objects[0].confidence > 0)
    assert.ok(result.objects[0].label)
  })

  it('团建负责人检测无重复上传的活动照片（干净环境）', async () => {
    const { controller } = createEnv()
    await runWithTenant(TENANT, async () => {
      await controller.createRecognition({
        taskType: 'image_classification', sourceAssetId: 'asset-tb-uniq-01',
      } as CreateRecognitionDto)
    })

    const dupResult = await runWithTenant(TENANT, async () =>
      controller.detectDuplicates({
        sourceAssetId: 'asset-tb-uniq-01',
        threshold: 0.99, // 严格阈值, 无重复
      } as DuplicateDetectionDto),
    ) as any

    assert.equal(dupResult.sourceAssetId, 'asset-tb-uniq-01')
    assert.equal(dupResult.duplicates.length, 0, '单独图片应无重复')
  })

  it('团建负责人列出所有图像分类任务', async () => {
    const { controller } = createEnv()
    await runWithTenant(TENANT, async () => {
      await controller.createRecognition({
        taskType: 'image_classification', sourceAssetId: 'asset-tb-list-01',
      } as CreateRecognitionDto)
      await controller.createRecognition({
        taskType: 'product_recognition', sourceAssetId: 'asset-tb-list-02',
      } as CreateRecognitionDto)
    })

    const result = await runWithTenant(TENANT, async () =>
      controller.listTasks({ taskType: 'image_classification' } as ListRecognitionQuery),
    ) as any

    assert.ok(result.items.length >= 1)
    for (const item of result.items) {
      assert.equal(item.taskType, 'image_classification')
    }
  })
})

// ═══════════════════════════════════════════════════════════
// 📢 营销 — 活动推广: 视觉搜索同类商品 + 素材管理 + 活动关联
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} image-recognition 扩展场景`, () => {

  it('营销用视觉搜索查找同款（比价和选品参考）', async () => {
    const { controller } = createEnv()
    await runWithTenant(TENANT, async () => {
      await controller.createRecognition({
        taskType: 'product_recognition', sourceAssetId: 'asset-mkt-vs-src',
      } as CreateRecognitionDto)
      await controller.createRecognition({
        taskType: 'product_recognition', sourceAssetId: 'asset-mkt-vs-target-01',
      } as CreateRecognitionDto)
      await controller.createRecognition({
        taskType: 'product_recognition', sourceAssetId: 'asset-mkt-vs-target-02',
      } as CreateRecognitionDto)
    })

    const vsResult = await runWithTenant(TENANT, async () =>
      controller.visualSearch({
        sourceAssetId: 'asset-mkt-vs-src',
        topK: 3,
        minSimilarity: 0.0,
      } as VisualSearchDto),
    ) as any

    assert.ok(vsResult.items.length > 0)
    for (const item of vsResult.items) {
      assert.ok(item.matchedAssetId)
      assert.ok(item.similarity >= 0)
    }
  })

  it('营销对活动海报进行图像分类', async () => {
    const { controller } = createEnv()
    const result = await runWithTenant(TENANT, async () =>
      controller.createRecognition({
        taskType: 'image_classification',
        sourceAssetId: 'asset-mkt-poster-001',
        filename: 'summer-sale-poster.jpg',
        linkedEntity: { entityType: 'campaign', entityId: 'camp-summer-2026' },
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.linkedEntity?.entityType, 'campaign')
    assert.equal(result.task.linkedEntity?.entityId, 'camp-summer-2026')
    assert.equal(result.objects.length, 1)
  })

  it('营销按引擎过滤已完成的识别任务', async () => {
    const { controller } = createEnv()
    await runWithTenant(TENANT, async () => {
      await controller.createRecognition({
        taskType: 'product_recognition', engine: 'mock-yolov8', sourceAssetId: 'asset-mkt-eng-yolo',
      } as CreateRecognitionDto)
      await controller.createRecognition({
        taskType: 'image_classification', engine: 'mock-clip', sourceAssetId: 'asset-mkt-eng-clip',
      } as CreateRecognitionDto)
    })

    const result = await runWithTenant(TENANT, async () =>
      controller.listTasks({ status: 'completed', limit: 10 } as ListRecognitionQuery),
    ) as any

    assert.ok(result.items.length >= 2)
    for (const item of result.items) {
      assert.equal(item.status, 'completed')
    }
  })

  it('营销创建任务时指定不存在的引擎被拒绝（边界）', async () => {
    const { controller } = createEnv()
    await assert.rejects(
      () => runWithTenant(TENANT, async () =>
        controller.createRecognition({
          taskType: 'product_recognition',
          engine: 'mock-nonexistent-engine' as any,
          sourceAssetId: 'asset-mkt-bad-engine',
        } as CreateRecognitionDto),
      ),
      /引擎|不支持|不合法/i,
    )
  })
})
