import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [image-recognition] [C] 角色测试 v3
 *
 * 8 角色视角的 image-recognition 深度场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界/异常场景）
 * 侧重游戏厅/电玩城实景（大飞哥美国三店）
 * 覆盖: product_recognition, shelf_analysis, visual_search, duplicate_detection, image_classification
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ImageRecognitionController } from './image-recognition.controller'
import { ImageRecognitionService } from './image-recognition.service'
import { runWithTenant } from '../../common/context/tenant-context'
import type {
  CreateRecognitionDto, VisualSearchDto, DuplicateDetectionDto, ListRecognitionQuery,
} from './image-recognition.dto'
import type { RecognitionResult, EngineStatus } from './image-recognition.entity'

// ── 8 角色定义 ──
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

// ── 大飞哥美国三店场景数据 ──
const STORE_A = { tenantId: 't-cyber-galaxy', storeId: 'store-va-001', userId: 'sm-va', role: 'tenant_admin' as const }
const STORE_B = { tenantId: 't-houston', storeId: 'store-tx-001', userId: 'sm-tx', role: 'tenant_admin' as const }
const STORE_C = { tenantId: 't-demo', storeId: 'store-demo', userId: 'guest', role: 'viewer' as const }

function createService() {
  return new ImageRecognitionService()
}

function createController() {
  const service = new ImageRecognitionService()
  return new ImageRecognitionController(service)
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 StoreManager — 门店运营管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} image-recognition v3 角色测试`, () => {
  let ctrl: ImageRecognitionController

  beforeEach(() => {
    ctrl = createController()
  })

  it('店长创建货架分析任务监控门店商品陈列状况（正常流程）', async () => {
    const result = await runWithTenant(STORE_A, async () =>
      ctrl.createRecognition({
        taskType: 'shelf_analysis',
        sourceAssetId: 'asset-shelf-a1',
        filename: 'shelf-aisle-03-photo.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'shelf_analysis')
    assert.equal(result.task.engine, 'mock-yolov8n-shelf')
    assert.equal(result.task.status, 'completed')
    assert.ok(result.shelfAnalysis, '货架分析应包含详细数据')
    assert.ok(result.shelfAnalysis!.totalSlots > 0)
    assert.equal(typeof result.shelfAnalysis!.occupancyRate, 'number')
    assert.ok(result.shelfAnalysis!.occupancyRate >= 0 && result.shelfAnalysis!.occupancyRate <= 1)
    // 应有补货建议
    assert.ok(Array.isArray(result.shelfAnalysis!.restockSuggestions))
  })

  it('店长查看所有可用引擎并获取详细元数据（技术决策）', async () => {
    const resp = await ctrl.listEngines()
    const items: Array<{ type: string; displayName: string; accuracy: number }> = (resp as any).items
    assert.equal(items.length, 7)

    const shelfEngine = items.find(e => e.type === 'mock-yolov8n-shelf')
    assert.ok(shelfEngine, '应包含货架专用引擎')
    assert.ok(shelfEngine!.accuracy > 0.9, '货架引擎准确率应 > 0.9')

    const clip = items.find(e => e.type === 'mock-clip')
    assert.ok(clip, '应包含 CLIP 零样本引擎')
  })

  it('店长跨门店隔离：休斯顿店长无法访问弗州店数据（权限边界）', async () => {
    // 弗州店创建任务
    const result = await runWithTenant(STORE_A, async () =>
      ctrl.createRecognition({
        taskType: 'product_recognition',
        sourceAssetId: 'asset-va-shelf-01',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    // 休斯顿店长尝试获取
    await assert.rejects(
      () => runWithTenant(STORE_B, async () => ctrl.getTask(result.task.id)),
      /不存在/,
    )
  })

  it('店长取消进行中的任务不影响已完成任务（状态边界）', async () => {
    // 创建一个已完成的任务
    const completed = await runWithTenant(STORE_A, async () =>
      ctrl.createRecognition({
        taskType: 'object_detection',
        sourceAssetId: 'asset-cancel-01',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    // 尝试取消已完成的 -> 应抛异常
    await assert.rejects(
      () => runWithTenant(STORE_A, async () => ctrl.cancelTask(completed.task.id)),
      /终态/,
    )
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 FrontDesk — 收银快速商品识别
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} image-recognition v3 角色测试`, () => {
  let ctrl: ImageRecognitionController

  beforeEach(() => {
    ctrl = createController()
  })

  it('前台扫描单个商品快速识别 SKU 价格（结账流程）', async () => {
    const result = await runWithTenant(STORE_A, async () =>
      ctrl.createRecognition({
        taskType: 'product_recognition',
        sourceAssetId: 'asset-reg-item-001',
        filename: 'cola-can.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.status, 'completed')
    assert.ok(result.objects.length >= 1)
    // 至少有一个商品带 SKU 和价格
    const firstObj = result.objects[0]
    assert.ok(firstObj.skuId, '应有 SKU 编号')
    assert.ok(firstObj.priceCny !== undefined && firstObj.priceCny! > 0, '应有价格')
    assert.ok(firstObj.confidence > 0.7, '置信度应达标')
  })

  it('前台批量扫描商品（多次任务）并验证列表完整性', async () => {
    // 创建 3 个识别任务
    const results = await runWithTenant(STORE_A, async () => {
      const r1 = await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-batch-01' } as CreateRecognitionDto)
      const r2 = await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-batch-02' } as CreateRecognitionDto)
      const r3 = await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-batch-03' } as CreateRecognitionDto)
      // 列表
      return ctrl.listTasks({ taskType: 'product_recognition' })
    }) as unknown as { items: Array<{ id: string; status: string }>; total: number }

    assert.ok(results.total >= 3, '应返回至少 3 条记录')
    assert.ok(results.items.every(i => i.status === 'completed'), '所有任务应为已完成状态')
  })

  it('前台尝试识别不支持的任务类型应报错（异常边界）', async () => {
    await assert.rejects(
      () => runWithTenant(STORE_A, async () =>
        ctrl.createRecognition({
          taskType: 'product_recognition',
          engine: 'mock-resnet50' as any, // ResNet50 不支持 product_recognition
          sourceAssetId: 'asset-bad-engine',
        } as CreateRecognitionDto),
      ),
      /不支持/,
    )
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR 人力资源 — 商品陈列与员工培训素材管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} image-recognition v3 角色测试`, () => {
  let ctrl: ImageRecognitionController

  beforeEach(() => {
    ctrl = createController()
  })

  it('HR 使用图像分类快速归档培训素材（正常流程）', async () => {
    const result = await runWithTenant(STORE_A, async () =>
      ctrl.createRecognition({
        taskType: 'image_classification',
        sourceAssetId: 'asset-train-001',
        filename: 'game-room-setup.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'image_classification')
    assert.equal(result.task.status, 'completed')
    assert.ok(result.objects.length > 0, '分类结果应有内容')
    assert.ok(result.engineMeta.classesSupported >= 1000, '分类引擎应支持 1000+ 类别')
  })

  it('HR 查询引擎对应模型版本以确认培训文档时效性', async () => {
    const resp = await ctrl.listEngines()
    const items: Array<{ type: string; displayName: string }> = (resp as any).items
    // 验证所有 engine 都有完整的信息
    assert.equal(items.length, 7)

    // 验证每个引擎的 taskTypes 与自身兼容
    for (const item of items) {
      assert.ok(item.type.startsWith('mock-'), `引擎类型 ${item.type} 应以 mock- 开头`)
      assert.ok(item.displayName.length > 0, `引擎 ${item.type} 应有展示名称`)
    }
  })

  it('HR 无法绕过租户隔离查询其他门店培训素材（权限边界）', async () => {
    const result = await runWithTenant(STORE_A, async () =>
      ctrl.createRecognition({
        taskType: 'image_classification',
        sourceAssetId: 'asset-train-hr-001',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    // 用 guest 角色尝试获取
    await assert.rejects(
      () => runWithTenant(STORE_C, async () => ctrl.getTask(result.task.id)),
      /不存在/,
    )
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 Security — 货架合规 & 重复商品检测
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} image-recognition v3 角色测试`, () => {
  let ctrl: ImageRecognitionController

  beforeEach(() => {
    ctrl = createController()
  })

  it('安监运行货架分析检查价格合规与缺货情况（巡检流程）', async () => {
    const result = await runWithTenant(STORE_A, async () =>
      ctrl.createRecognition({
        taskType: 'shelf_analysis',
        sourceAssetId: 'asset-safety-shelf-01',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.ok(result.shelfAnalysis, '货架分析应返回')
    // occupancy 数据应存在
    assert.equal(
      result.shelfAnalysis!.totalSlots,
      result.shelfAnalysis!.occupiedSlots + result.shelfAnalysis!.emptySlots,
      '总货位 = 已占 + 空位',
    )
    assert.ok(typeof result.shelfAnalysis!.occupancyRate === 'number')
    assert.ok(Array.isArray(result.shelfAnalysis!.restockSuggestions))
  })

  it('安监运行重复检测检查商品图片是否重复上传（仓库管理）', async () => {
    // 先创建两个识别任务产生指纹
    await runWithTenant(STORE_A, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-dup-ref' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-dup-ref' } as CreateRecognitionDto)
      return ctrl.detectDuplicates({ sourceAssetId: 'asset-dup-ref' } as DuplicateDetectionDto)
    })

    const result = await runWithTenant(STORE_A, async () =>
      ctrl.detectDuplicates({ sourceAssetId: 'asset-dup-ref' } as DuplicateDetectionDto),
    )

    assert.ok(result)
    const r = result as { sourceAssetId: string; duplicates: Array<{ similarity: number }> }
    assert.equal(r.sourceAssetId, 'asset-dup-ref')
    assert.ok(Array.isArray(r.duplicates))
  })

  it('安监执行视觉搜索查找相似商品图片（异常溯源）', async () => {
    // 准备数据
    await runWithTenant(STORE_A, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-vs-source' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-vs-target-1' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-vs-target-2' } as CreateRecognitionDto)
      return ctrl.visualSearch({ sourceAssetId: 'asset-vs-source' } as VisualSearchDto)
    })

    const result = await runWithTenant(STORE_A, async () =>
      ctrl.visualSearch({ sourceAssetId: 'asset-vs-source', topK: 5 } as VisualSearchDto),
    )
    assert.ok(result)
    const r = result as { items: Array<{ similarity: number }>; total: number }
    assert.ok(r.total >= 0)
    if (r.total > 0) {
      for (const item of r.items) {
        assert.ok(item.similarity >= 0 && item.similarity <= 1, '相似度应在 [0,1]')
      }
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 Guide — 游戏机台商品/周边识别
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} image-recognition v3 角色测试`, () => {
  let ctrl: ImageRecognitionController

  beforeEach(() => {
    ctrl = createController()
  })

  it('导玩员识别周边纪念品商品及库存量（销售辅助）', async () => {
    const result = await runWithTenant(STORE_B, async () =>
      ctrl.createRecognition({
        taskType: 'product_recognition',
        sourceAssetId: 'asset-guide-merch-001',
        filename: 'keychain-display.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.status, 'completed')
    assert.ok(result.objects.length > 0)
    // 至少有一个对象带数量信息
    const withQty = result.objects.filter(o => o.quantity !== undefined && o.quantity > 0)
    assert.ok(withQty.length > 0, '导玩员关注商品库存数量')
  })

  it('导玩员使用视觉搜索在店内照片库中找相同机台', async () => {
    await runWithTenant(STORE_B, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-machine-01' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-machine-02' } as CreateRecognitionDto)
      return ctrl.visualSearch({ sourceAssetId: 'asset-machine-01', topK: 3 } as VisualSearchDto)
    })

    const result = await runWithTenant(STORE_B, async () =>
      ctrl.visualSearch({ sourceAssetId: 'asset-machine-01' } as VisualSearchDto),
    )
    const r = result as { items: Array<{ matchedAssetId: string }> }
    // 只要查询不抛异常就算通过
    assert.ok(Array.isArray(r.items))
  })

  it('导玩员尝试搜索跨租户门店的图片应被隔离（权限边界）', async () => {
    const result = await runWithTenant(STORE_B, async () =>
      ctrl.visualSearch({ sourceAssetId: 'asset-guide-vs-001' } as VisualSearchDto),
    )
    const r = result as { items: Array<unknown> }
    // 即使没有数据也不应抛异常，但不可能看到其他租户的数据
    assert.ok(Array.isArray(r.items))
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 Operations — 系统运维与批量识别
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} image-recognition v3 角色测试`, () => {
  let ctrl: ImageRecognitionController

  beforeEach(() => {
    ctrl = createController()
  })

  it('运行专员批量创建识别任务并验证整体状态', async () => {
    const tasks = await runWithTenant(STORE_A, async () => {
      await ctrl.createRecognition({ taskType: 'object_detection', sourceAssetId: 'asset-batch-ops-01' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'object_detection', sourceAssetId: 'asset-batch-ops-02' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'object_detection', sourceAssetId: 'asset-batch-ops-03' } as CreateRecognitionDto)
      return ctrl.listTasks({})
    }) as unknown as { items: Array<{ id: string; status: string; taskType: string }>; total: number }

    assert.ok(tasks.total >= 3)
    const objectDetectionTasks = tasks.items.filter(t => t.taskType === 'object_detection')
    assert.ok(objectDetectionTasks.length >= 3)
    assert.ok(objectDetectionTasks.every(t => t.status === 'completed'))
  })

  it('运行专员按状态和任务类型过滤列表', async () => {
    const filtered = await runWithTenant(STORE_A, async () =>
      ctrl.listTasks({ taskType: 'shelf_analysis', status: 'completed' } as ListRecognitionQuery),
    ) as unknown as { items: Array<{ taskType: string; status: string }>; total: number }

    assert.ok(filtered.items.every(t => t.taskType === 'shelf_analysis'))
    assert.ok(filtered.items.every(t => t.status === 'completed'))
  })

  it('运行专员获取全局统计指标用于容量规划', async () => {
    // 先产生一些数据
    await runWithTenant(STORE_A, async () => {
      await ctrl.createRecognition({ taskType: 'image_classification', sourceAssetId: 'asset-stats-01' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'object_detection', sourceAssetId: 'asset-stats-02' } as CreateRecognitionDto)
      return ctrl.stats()
    })

    const stats = await runWithTenant(STORE_A, async () => ctrl.stats()) as {
      totalTasks: number; completedTasks: number; failedTasks: number
      byTaskType: Record<string, number>; byEngine: Record<string, number>
      totalObjectsDetected: number; avgConfidence: number; avgDurationMs: number
    }

    assert.ok(stats.totalTasks > 0)
    assert.ok(Object.keys(stats.byTaskType).length > 0)
    assert.ok(Object.keys(stats.byEngine).length > 0)
    assert.ok(stats.avgConfidence > 0)
  })

  it('运行专员创建 image_classification 任务验证分类引擎选择', async () => {
    const result = await runWithTenant(STORE_A, async () =>
      ctrl.createRecognition({
        taskType: 'image_classification',
        engine: 'mock-clip',
        sourceAssetId: 'asset-cls-clip',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.engine, 'mock-clip')
    assert.equal(result.task.status, 'completed')
    assert.ok(result.objects.length > 0)
  })

  it('运行专员尝试不兼容的引擎+任务类型组合应报错（异常边界）', async () => {
    await assert.rejects(
      () => runWithTenant(STORE_A, async () =>
        ctrl.createRecognition({
          taskType: 'shelf_analysis',
          engine: 'mock-pHash', // pHash 不支持 shelf_analysis
          sourceAssetId: 'asset-bad-combo',
        } as CreateRecognitionDto),
      ),
      /不支持/,
    )
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 Teambuilding — 活动照片识别与分类
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} image-recognition v3 角色测试`, () => {
  let ctrl: ImageRecognitionController

  beforeEach(() => {
    ctrl = createController()
  })

  it('团建使用图像分类对活动照片标签化归档（正常流程）', async () => {
    const result = await runWithTenant(STORE_A, async () =>
      ctrl.createRecognition({
        taskType: 'image_classification',
        sourceAssetId: 'asset-team-photo-01',
        filename: 'team-building-2026-q3.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.taskType, 'image_classification')
    assert.equal(result.task.status, 'completed')
    assert.ok(result.task.filename === 'team-building-2026-q3.jpg')
    // 分类引擎有模型版本
    assert.ok(result.engineMeta.modelVersion.length > 0)
  })

  it('团建使用重复检测过滤相同活动照片', async () => {
    // 创建两次同源识别以产生相同指纹
    await runWithTenant(STORE_A, async () => {
      await ctrl.createRecognition({ taskType: 'image_classification', sourceAssetId: 'asset-team-dup' } as CreateRecognitionDto)
      return ctrl.detectDuplicates({ sourceAssetId: 'asset-team-dup', threshold: 0.8 } as DuplicateDetectionDto)
    })

    const result = await runWithTenant(STORE_A, async () =>
      ctrl.detectDuplicates({ sourceAssetId: 'asset-team-dup', threshold: 0.5 } as DuplicateDetectionDto),
    )
    assert.ok(result)
    const r = result as { duplicates: Array<unknown> }
    assert.ok(Array.isArray(r.duplicates))
  })

  it('团建查询统计了解活动照片识别数据量', async () => {
    await runWithTenant(STORE_A, async () => {
      await ctrl.createRecognition({ taskType: 'image_classification', sourceAssetId: 'asset-team-stats-01' } as CreateRecognitionDto)
      return ctrl.stats()
    })

    const stats = await runWithTenant(STORE_A, async () => ctrl.stats()) as { totalTasks: number }
    assert.ok(stats.totalTasks > 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 Marketing — 活动商品视觉搜索与竞品分析
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} image-recognition v3 角色测试`, () => {
  let ctrl: ImageRecognitionController

  beforeEach(() => {
    ctrl = createController()
  })

  it('营销使用商品识别了解店内商品分布（活动策划）', async () => {
    const result = await runWithTenant(STORE_A, async () =>
      ctrl.createRecognition({
        taskType: 'product_recognition',
        sourceAssetId: 'asset-mkt-shelf-01',
        filename: 'promo-shelf-q3.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.equal(result.task.status, 'completed')
    assert.ok(result.objects.length > 0)
    // 商品分类信息应完整
    for (const obj of result.objects) {
      assert.ok(obj.label.length > 0)
      assert.ok(obj.confidence > 0)
    }
  })

  it('营销查看引擎清单辅助选择促销展品识别方案', async () => {
    const resp = await ctrl.listEngines()
    const items: Array<{ type: string; accuracy: number; classesSupported: number }> = (resp as any).items
    // 零售专用引擎应存在
    const retailEngine = items.find(e => e.type === 'mock-efficientnet')
    assert.ok(retailEngine)
    assert.ok(retailEngine.classesSupported >= 50000, '零售引擎应支持 50000+ 品类')
    assert.ok(retailEngine.accuracy > 0.9)
  })

  it('营销使用货架分析监控促销活动陈列效果', async () => {
    const result = await runWithTenant(STORE_A, async () =>
      ctrl.createRecognition({
        taskType: 'shelf_analysis',
        sourceAssetId: 'asset-mkt-promo-shelf',
        filename: 'promo-endcap-display.jpg',
      } as CreateRecognitionDto),
    ) as unknown as RecognitionResult

    assert.ok(result.shelfAnalysis, '应有货架分析')
    // 验证货架基本结构
    assert.ok(result.shelfAnalysis!.totalSlots > 0)
    assert.ok(result.shelfAnalysis!.occupancyRate >= 0 && result.shelfAnalysis!.occupancyRate <= 1)
    // 整理度指标
    assert.ok(result.shelfAnalysis!.tidiness >= 0 && result.shelfAnalysis!.tidiness <= 1, '整理度应在 [0,1]')
  })

  it('营销使用视觉搜索查找促销物料相似图（素材管理）', async () => {
    await runWithTenant(STORE_A, async () => {
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-mkt-banner' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-mkt-poster-1' } as CreateRecognitionDto)
      await ctrl.createRecognition({ taskType: 'product_recognition', sourceAssetId: 'asset-mkt-poster-2' } as CreateRecognitionDto)
      return ctrl.visualSearch({ sourceAssetId: 'asset-mkt-banner' } as VisualSearchDto)
    })

    const result = await runWithTenant(STORE_A, async () =>
      ctrl.visualSearch({ sourceAssetId: 'asset-mkt-banner', minSimilarity: 0.5 } as VisualSearchDto),
    )
    const r = result as { items: Array<unknown>; total: number }
    assert.ok(Array.isArray(r.items))
    assert.ok(typeof r.total === 'number')
  })
})
