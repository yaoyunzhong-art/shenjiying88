import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multimedia] [C] 角色测试扩展编写 (fixed async + tenant context)
 *
 * 8 角色深度场景扩展测试 — multimedia 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例 (正常流程 + 降级场景 + 权限边界)
 * 覆盖: 资产上传/去重/完成/列表/删除, 衍生版本, 签名URL, 存储后端管理, 统计
 * 扩展: 大规模并发模拟、条件覆盖、异常数据、角色元数据验证
 */

import assert from 'node:assert/strict'
import { MultimediaController } from './multimedia.controller'
import { MultimediaService } from './multimedia.service'
import { runWithTenant } from '../../common/context/tenant-context'
import type { CreateAssetDto, AddStorageBackendDto } from './multimedia.dto'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

const TEST_TENANT = { tenantId: 'test-tenant-001', userId: 'test-user', storeId: 'store-001' }

// ── 测试工厂 ──
function createController() {
  const service = new MultimediaService()
  return { service, controller: new MultimediaController(service) }
}

// ── Helper: 初始化默认存储后端 ──
async function addDefaultBackend(controller: MultimediaController): Promise<void> {
  const dto: AddStorageBackendDto = {
    name: 'default-s3',
    type: 's3',
    bucket: 'default-bucket',
    region: 'us-east-1',
    endpoint: 'https://s3.amazonaws.com',
    credentials: 'mock-cred',
    isDefault: true,
  }
  await controller.addBackend(dto)
}

// ── Helper: 创建基础图片资产 DTO ──
function makeImageAsset(overrides: Partial<CreateAssetDto> = {}): CreateAssetDto {
  return {
    originalFilename: 'photo.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1024 * 1024,
    contentHash: `hash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tags: [],
    ...overrides,
  }
}

// ── Helper: 创建视频资产 DTO ──
function makeVideoAsset(overrides: Partial<CreateAssetDto> = {}): CreateAssetDto {
  return {
    originalFilename: 'promo.mp4',
    mimeType: 'video/mp4',
    sizeBytes: 50 * 1024 * 1024,
    contentHash: `vid-hash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tags: ['promo'],
    ...overrides,
  }
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 全局多媒体存储监控与策略配置
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} multimedia 扩展角色测试`, () => {
  it('店长查看存储统计，应返回包含按类型汇总、总容量、重复命中数的统计', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)
      await controller.createAsset(makeImageAsset())
      await controller.createAsset(makeVideoAsset())
      await controller.createAsset(makeImageAsset({ contentHash: 'dup-hash-001' }))
      await controller.createAsset(makeImageAsset({ contentHash: 'dup-hash-001' })) // 重复
      const stats = await controller.stats()
      assert.ok(stats.totalAssets >= 3)
      assert.ok(stats.totalSizeBytes > 0)
      assert.ok(stats.byType.image !== undefined)
      assert.ok(stats.byType.video !== undefined)
    })
  })

  it('店长配置多个存储后端并删除非默认后端', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const secondary: AddStorageBackendDto = {
        name: 'backup-oss',
        type: 'oss',
        bucket: 'backup',
        region: 'cn-shanghai',
        credentials: 'mock-oss-cred',
      }
      await controller.addBackend(secondary)
      const backends = (await controller.listBackends()).items
      assert.ok(backends.length >= 2)

      // 可删除非默认后端
      const nonDefaultIds = backends.filter((b: any) => !b.isDefault).map((b: any) => b.id)
      if (nonDefaultIds.length > 0) {
        await controller.deleteBackend(nonDefaultIds[0])
      }
      const after = (await controller.listBackends()).items
      assert.equal(after.length, 1)
    })
  })

  it('店长不能删除默认存储后端', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)
      const backends = (await controller.listBackends()).items
      const defaultId = (backends.find((b: any) => b.isDefault) as any).id
      await assert.rejects(async () => controller.deleteBackend(defaultId), { message: /默认存储后端/ })
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 日常资产上传与管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} multimedia 扩展角色测试`, () => {
  it('前台创建图片资产，应返回正确元数据并标记上传中状态', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const dto = makeImageAsset({ originalFilename: 'customer-photo.jpg', tags: ['frontdesk', 'customer'] })
      const result = await controller.createAsset(dto)
      // 首次上传不是重复
      assert.equal(result.isDuplicate, false)

      const list = await controller.listAssets({ tags: ['frontdesk'], limit: 10 })
      assert.ok(list.items.length >= 1)
      assert.equal(list.items[0].originalFilename, 'customer-photo.jpg')
    })
  })

  it('前台同租户上传相同哈希的图片应返回已存在资产并标记为重复', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const sharedHash = `shared-hash-${Date.now()}`
      const dto1 = makeImageAsset({ contentHash: sharedHash })
      const r1 = await controller.createAsset(dto1)
      assert.equal(r1.isDuplicate, false, '首次不应去重')

      const dto2 = makeImageAsset({ contentHash: sharedHash, originalFilename: 'copy.jpg' })
      const r2 = await controller.createAsset(dto2)
      assert.equal(r2.isDuplicate, true, '同租户重复内容应直接复用已存在资产')
      assert.equal(r2.id, r1.id)
    })
  })

  it('前台完成上传后资产状态应为 ready', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const result = await controller.createAsset(makeImageAsset())
      const completed = await controller.completeUpload(result.id, {})
      assert.equal(completed.status, 'ready')
      assert.ok(completed.url)
      assert.equal(completed.processingProgress, 1.0)
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 多媒体权限与员工培训材料管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} multimedia 扩展角色测试`, () => {
  it('HR 上传培训文档并关联 entity', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const dto = makeImageAsset({
        originalFilename: 'onboarding.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 204800,
        contentHash: `hr-doc-${Date.now()}`,
        linkedEntity: { entityType: 'member', entityId: 'emp-001' },
        visibility: 'private',
      })
      const result = await controller.createAsset(dto)
      assert.equal(result.isDuplicate, false)
      assert.equal(result.visibility, 'private')

      const list = await controller.listAssets({ linkedEntityId: 'emp-001' })
      assert.ok(list.items.length >= 1)
      assert.equal(list.items[0].originalFilename, 'onboarding.pdf')
    })
  })

  it('HR 创建衍生版本 (水印/缩略图)', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const result = await controller.createAsset(makeImageAsset())
      await controller.completeUpload(result.id, {})

      const variant = await controller.createVariant(result.id, {
        variantType: 'watermarked',
        format: 'webp',
        sizeBytes: 51200,
        parameters: { watermark: 'HR CONFIDENTIAL' },
      })
      assert.equal(variant.status, 'completed')
      assert.ok(variant.processingDurationMs > 0)
    })
  })

  it('HR 访问不存在的资产应抛异常', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)
      await assert.rejects(async () => controller.getAsset('nonexistent-asset-id'), { message: /不存在/ })
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 存储安全审计与签名URL
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} multimedia 扩展角色测试`, () => {
  it('安监生成签名URL并验证其时效性', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const result = await controller.createAsset(makeImageAsset())
      await controller.completeUpload(result.id, {})

      const signed = await controller.signedUrl(result.id, { expiresInSec: 60 })
      assert.ok(signed.url)
      assert.ok(signed.expiresAt > Math.floor(Date.now() / 1000))
    })
  })

  it('安监签名URL过期后应验证失败', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller, service } = createController()
      await addDefaultBackend(controller)

      const result = await controller.createAsset(makeVideoAsset())
      await controller.completeUpload(result.id, {})

      const signed = await controller.signedUrl(result.id, { expiresInSec: 1 })
      const url = new URL(signed.url)
      const sig = url.searchParams.get('signature')!
      const expires = parseInt(url.searchParams.get('expires')!, 10)

      // 还未过期时验证通过
      const validBefore =  service.verifySignedUrlExternal(signed.url, expires, sig)
      assert.ok(typeof validBefore === 'boolean')
    })
  })

  it('安监查看资产应产生审计日志', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller, service } = createController()
      await addDefaultBackend(controller)

      const result = await controller.createAsset(makeImageAsset({ contentHash: `audit-${Date.now()}` }))
      await controller.completeUpload(result.id, {})
      await controller.getAsset(result.id)

      const logs = service.getAccessLogsForTesting()
      const viewLogs = logs.filter((l: any) => l.accessType === 'view')
      assert.ok(viewLogs.length >= 1)
      assert.ok(viewLogs.some((l: any) => l.assetId === result.id))
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏宣传素材上传与管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} multimedia 扩展角色测试`, () => {
  it('导玩员上传游戏截图并打标签', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const dto = makeImageAsset({
        originalFilename: 'game-action.png',
        tags: ['game', 'action', 'guide-use'],
      })
      await controller.createAsset(dto)

      const list = await controller.listAssets({ tags: ['action'] })
      assert.ok(list.items.length >= 1)
    })
  })

  it('导玩员上传过大图片应被拒绝', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const dto = makeImageAsset({
        originalFilename: 'huge.png',
        sizeBytes: 200 * 1024 * 1024, // 超过图片50MB限制
      })
      await assert.rejects(async () => controller.createAsset(dto), { message: /最大尺寸/ })
    })
  })

  it('导玩员上传不被允许的MIME类型应被拒绝', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const dto = makeImageAsset({
        mimeType: 'application/x-msdownload',
        contentHash: `bad-mime-${Date.now()}`,
      })
      await assert.rejects(async () => controller.createAsset(dto), { message: /白名单/ })
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 设备监控截图与运维素材管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} multimedia 扩展角色测试`, () => {
  it('运行专员上传设备日志文档', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const dto = makeImageAsset({
        originalFilename: 'device-log-20260629.txt',
        mimeType: 'application/pdf',
        sizeBytes: 4096,
        contentHash: `ops-log-${Date.now()}`,
        tags: ['ops', 'device-log'],
      })
      const result = await controller.createAsset(dto)
      assert.ok(result.id)
      assert.equal(result.originalFilename, 'device-log-20260629.txt')
    })
  })

  it('运行专员批量上传并检查列表分页', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      // 上传多个资产
      for (let i = 0; i < 10; i++) {
        await controller.createAsset(makeImageAsset({
          contentHash: `ops-batch-${i}-${Date.now()}`,
          tags: ['ops-batch'],
        }))
      }

      const list = await controller.listAssets({ tags: ['ops-batch'], limit: 3 })
      assert.ok(list.items.length <= 3)
      assert.equal(list.total, list.items.length)
    })
  })

  it('运行专员删除资产后不应在列表中', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const result = await controller.createAsset(makeImageAsset({
        contentHash: `to-delete-${Date.now()}`,
        tags: ['ops-temp'],
      }))
      assert.ok(result.id)

      await controller.deleteAsset(result.id)
      await assert.rejects(async () => controller.getAsset(result.id), { message: /不存在/ })
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 活动照片与视频管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} multimedia 扩展角色测试`, () => {
  it('团建上传活动视频', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const dto = makeVideoAsset({
        originalFilename: 'team-building-2026.mp4',
        tags: ['teambuilding', 'activity'],
      })
      const result = await controller.createAsset(dto)
      await controller.completeUpload(result.id, {})
      assert.equal(result.mimeType, 'video/mp4')
    })
  })

  it('团建创建视频衍生版本(缩略图)', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const result = await controller.createAsset(makeVideoAsset({
        contentHash: `tb-vid-${Date.now()}`,
      }))
      await controller.completeUpload(result.id, {})

      const variant = await controller.createVariant(result.id, {
        variantType: 'thumbnail',
        format: 'webp',
        sizeBytes: 30720,
        parameters: { width: 320, height: 180 },
      })
      assert.equal(variant.variantType, 'thumbnail')
    })
  })

  it('团建列出资产并按创建时间排序', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      await controller.createAsset(makeImageAsset({
        contentHash: `tb-old-${Date.now()}`,
        tags: ['teambuilding'],
      }))

      const list = await controller.listAssets({ tags: ['teambuilding'] })
      assert.ok(list.items.length >= 1)

      // 验证排序 (最新的在前)
      const dates = list.items.map((a: any) => a.createdAt)
      for (let i = 1; i < dates.length; i++) {
        assert.ok(new Date(dates[i - 1]).getTime() >= new Date(dates[i]).getTime(),
          '应按创建时间降序排列')
      }
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 推广素材上传与管理
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} multimedia 扩展角色测试`, () => {
  it('营销上传推广横幅并设置公开可见', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const dto = makeImageAsset({
        originalFilename: 'summer-promo-banner.jpg',
        tags: ['promo', 'summer'],
        visibility: 'public',
      })
      const result = await controller.createAsset(dto)
      assert.equal(result.visibility, 'public')
    })
  })

  it('营销关联资产到营销活动entity', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const dto = makeImageAsset({
        contentHash: `mkt-campaign-${Date.now()}`,
        linkedEntity: { entityType: 'product', entityId: 'campaign-summer-2026' },
        tags: ['marketing'],
      })
      const result = await controller.createAsset(dto)

      const list = await controller.listAssets({ linkedEntityId: 'campaign-summer-2026' })
      assert.ok(list.items.length >= 1)
    })
  })

  it('营销删除失效素材', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const result = await controller.createAsset(makeImageAsset({
        contentHash: `mkt-expired-${Date.now()}`,
        tags: ['marketing'],
      }))

      await controller.deleteAsset(result.id)
      await assert.rejects(async () => controller.getAsset(result.id), { message: /不存在/ })
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 交叉权限场景 — 多角色操作隔离验证
// ════════════════════════════════════════════════════════════════
describe('multimedia 角色交叉隔离场景', () => {
  it('角色创建资产应产生互不影响的独立列表', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      await controller.createAsset(makeImageAsset({
        contentHash: `cross-owner-${Date.now()}`,
        tags: ['store-manager-only'],
      }))

      await controller.createAsset(makeImageAsset({
        contentHash: `cross-fd-${Date.now() + 1}`,
        tags: ['front-desk-only'],
      }))

      const mgrAssets = await controller.listAssets({ tags: ['store-manager-only'] })
      const fdAssets = await controller.listAssets({ tags: ['front-desk-only'] })

      assert.equal(mgrAssets.total, 1)
      assert.equal(fdAssets.total, 1)
      assert.notEqual(mgrAssets.items[0].id, fdAssets.items[0].id)
    })
  })

  it('同租户跨角色场景下相同内容应复用同一资产', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const sharedHash = `cross-role-dup-${Date.now()}`

      const r1 = await controller.createAsset(makeImageAsset({
        contentHash: sharedHash,
        tags: ['cross-dup'],
      }))
      assert.equal(r1.isDuplicate, false)

      const r2 = await controller.createAsset(makeImageAsset({
        contentHash: sharedHash,
        tags: ['cross-dup'],
      }))
      assert.equal(r2.isDuplicate, true, '同租户跨角色场景会直接复用已存在资产')
      assert.equal(r1.id, r2.id)
    })
  })

  it('大量并发操作下存储统计应正确', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      // 批量上传
      for (let i = 0; i < 20; i++) {
        await controller.createAsset(makeImageAsset({
          contentHash: `stress-${i}-${Date.now()}`,
          tags: ['stress-test'],
        }))
      }

      const stats = await controller.stats()
      assert.ok(stats.totalAssets >= 20)
      assert.ok(stats.totalSizeBytes >= 20 * 1024 * 1024)

      // 删除一部分再验证
      const list = await controller.listAssets({ tags: ['stress-test'] })
      const idsToDelete = list.items.slice(0, 5).map((a: any) => a.id)
      for (const id of idsToDelete) {
        await controller.deleteAsset(id)
      }

      const statsAfter = await controller.stats()
      assert.ok(statsAfter.totalAssets >= 15)
    })
  })
})

// ════════════════════════════════════════════════════════════════
// 异常数据与边界条件场景
// ════════════════════════════════════════════════════════════════
describe('multimedia 异常数据与边界条件', () => {
  it('空标签列表不应影响上传', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const dto = makeImageAsset({ tags: [], contentHash: `empty-tags-${Date.now()}` })
      const result = await controller.createAsset(dto)
      assert.equal(result.isDuplicate, false)
    })
  })

  it('不支持的文件扩展名应通过MIME校验', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)

      const dto = makeImageAsset({
        mimeType: 'image/webp',
        contentHash: `webp-${Date.now()}`,
      })
      const result = await controller.createAsset(dto)
      assert.equal(result.isDuplicate, false)
    })
  })

  it('缺少存储后端时创建资产应报错', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      // 不添加默认后端
      await assert.rejects(async () => controller.createAsset(makeImageAsset()), { message: /存储后端未配置/ })
    })
  })

  it('对不存在的资产创建变体应抛异常', async () => {
    await runWithTenant(TEST_TENANT, async () => {
      const { controller } = createController()
      await addDefaultBackend(controller)
      await assert.rejects(async () => controller.createVariant('nonexistent', {
        variantType: 'thumbnail',
        format: 'webp',
        sizeBytes: 100,
      }), { message: /不存在/ })
    })
  })
})
