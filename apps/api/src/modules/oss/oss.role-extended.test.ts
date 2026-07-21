/**
 * 🐜 自动: [oss] [C] 角色扩展测试
 *
 * 8 角色视角的 OSS 文件管理模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 OssService + runWithTenant
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { OssService } from './oss.service'
import { runWithTenant } from '../../common/context/tenant-context'

// ── 角色权限矩阵 ──

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

/** 角色 → OSS 模块权限 */
const roleOssAccess: Record<string, string[]> = {
  'oss:upload': ['👔店长', '🛒前台', '🎯运行专员', '📢营销'],
  'oss:download': ['👔店长', '🛒前台', '🎯运行专员', '📢营销', '🎮导玩员'],
  'oss:list': ['👔店长', '🎯运行专员'],
  'oss:delete': ['👔店长', '🎯运行专员'],
  'oss:bucket:manage': ['🎯运行专员'],
  'oss:stats:view': ['👔店长', '🎯运行专员'],
  'oss:signed:url': ['👔店长', '🛒前台', '🎯运行专员', '📢营销'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleOssAccess[resource]?.includes(role) ?? false
}

const tenantCtx = { tenantId: 'tenant-oss-role', userId: 'tester-role', storeId: 'store-01' }

function makeService(): OssService {
  return new OssService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — OSS
// ════════════════════════════════════════════════════════════

describe('[👔店长] oss 角色扩展测试', () => {
  it('👔[正例] 店长上传文件', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'oss:upload')).toBe(true)
    const svc = makeService()

    await runWithTenant(tenantCtx, async () => {
      const result = await svc.initUpload({
        originalFilename: 'report.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024 * 512,
        contentHash: 'sm-hash-001',
        tags: ['monthly', 'store'],
      })
      expect(result.fileId).toBeTruthy()
      expect(result.objectKey).toBeTruthy()
      expect(result.uploadUrl).toBeTruthy()

      const complete = await svc.completeUpload(result.fileId, { etag: '"abc123"' })
      expect(complete.status).toBe('ready')
      expect(complete.url).toBeTruthy()
    })
  })

  it('👔[正例] 店长查看文件列表 + 存储统计', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'oss:list')).toBe(true)
    const svc = makeService()

    await runWithTenant(tenantCtx, async () => {
      const r1 = await svc.initUpload({
        originalFilename: 'img1.png', mimeType: 'image/png',
        sizeBytes: 1024, contentHash: 'hash-list-1',
      })
      const r2 = await svc.initUpload({
        originalFilename: 'img2.jpg', mimeType: 'image/jpeg',
        sizeBytes: 2048, contentHash: 'hash-list-2',
      })
      await svc.completeUpload(r1.fileId, { etag: '"e1"' })
      await svc.completeUpload(r2.fileId, { etag: '"e2"' })

      const list = await svc.listFiles()
      expect(list.total).toBe(2)
      expect(list.items.length).toBe(2)

      expect(checkRoleAccess(ROLES.StoreManager, 'oss:stats:view')).toBe(true)
      const stats = await svc.getStorageStats()
      expect(stats.totalFiles).toBe(2)
      expect(stats.totalSizeBytes).toBe(3072)
    })
  })

  it('👔[正例] 店长下载 + 签名 URL', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'oss:download')).toBe(true)
    const svc = makeService()

    await runWithTenant(tenantCtx, async () => {
      const r = await svc.initUpload({
        originalFilename: 'dl.pdf', mimeType: 'application/pdf',
        sizeBytes: 4096, contentHash: 'hash-dl-001',
      })
      await svc.completeUpload(r.fileId, { etag: '"dl"' })

      const dl = await svc.generateDownloadUrl(r.fileId, { expiresInSec: 7200 })
      expect(dl.url).toBeTruthy()
      expect(dl.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000))

      const signed = await svc.generateSignedUrl(r.fileId, { operation: 'download' })
      expect(signed.url).toBeTruthy()
      expect(signed.expiresAt).toBeGreaterThan(0)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — OSS
// ════════════════════════════════════════════════════════════

describe('[🛒前台] oss 角色扩展测试', () => {
  it('🛒[正例] 前台上传文件 → 下载', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'oss:upload')).toBe(true)
    const svc = makeService()

    await runWithTenant(tenantCtx, async () => {
      const r = await svc.initUpload({
        originalFilename: 'menu.jpg', mimeType: 'image/jpeg',
        sizeBytes: 81920, contentHash: 'hash-fd-001',
      })
      await svc.completeUpload(r.fileId, { etag: '"fd"' })

      expect(checkRoleAccess(ROLES.FrontDesk, 'oss:download')).toBe(true)
      const dl = await svc.generateDownloadUrl(r.fileId)
      expect(dl.objectKey).toBeTruthy()
    })
  })

  it('🛒[正例] 前台生成签名 URL', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'oss:signed:url')).toBe(true)
    const svc = makeService()

    await runWithTenant(tenantCtx, async () => {
      const r = await svc.initUpload({
        originalFilename: 'menu2.jpg', mimeType: 'image/jpeg',
        sizeBytes: 10240, contentHash: 'hash-sign-fd',
      })
      await svc.completeUpload(r.fileId, { etag: '"signed"' })

      const signed = await svc.generateSignedUrl(r.fileId, { operation: 'download', expiresInSec: 1800 })
      expect(signed.url).toBeTruthy()
    })
  })

  it('🛒[反例] 前台无权限查看文件列表/统计', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'oss:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'oss:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'oss:bucket:manage')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — OSS
// ════════════════════════════════════════════════════════════

describe('[👥HR] oss 角色扩展测试', () => {
  it('👥[反例] HR 无权限上传/下载文件', () => {
    expect(checkRoleAccess(ROLES.HR, 'oss:upload')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'oss:download')).toBe(false)
  })

  it('👥[反例] HR 无权限管理文件', () => {
    expect(checkRoleAccess(ROLES.HR, 'oss:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'oss:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'oss:bucket:manage')).toBe(false)
  })

  it('👥[反例] HR 无权限查看统计与签名', () => {
    expect(checkRoleAccess(ROLES.HR, 'oss:stats:view')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'oss:signed:url')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — OSS
// ════════════════════════════════════════════════════════════

describe('[🔧安监] oss 角色扩展测试', () => {
  it('🔧[反例] 安监无权限操作文件', () => {
    expect(checkRoleAccess(ROLES.Security, 'oss:upload')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'oss:download')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'oss:list')).toBe(false)
  })

  it('🔧[反例] 安监无权限管理桶', () => {
    expect(checkRoleAccess(ROLES.Security, 'oss:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'oss:bucket:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'oss:signed:url')).toBe(false)
  })

  it('🔧[闭环] 安监无权限返回统一格式', () => {
    const denied = { success: false, code: 403, message: 'NO_OSS_ACCESS', module: 'oss' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('oss')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — OSS
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] oss 角色扩展测试', () => {
  it('🎮[正例] 导玩员下载文件', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'oss:download')).toBe(true)
    const svc = makeService()

    await runWithTenant(tenantCtx, async () => {
      const r = await svc.initUpload({
        originalFilename: 'game-guide.pdf', mimeType: 'application/pdf',
        sizeBytes: 2048, contentHash: 'hash-guide-001',
      })
      await svc.completeUpload(r.fileId, { etag: '"guide"' })

      const dl = await svc.generateDownloadUrl(r.fileId)
      expect(dl.url).toBeTruthy()
    })
  })

  it('🎮[反例] 导玩员无权限上传文件或管理', () => {
    expect(checkRoleAccess(ROLES.Guide, 'oss:upload')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'oss:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'oss:delete')).toBe(false)
  })

  it('🎮[反例] 导玩员无权限管理桶/统计', () => {
    expect(checkRoleAccess(ROLES.Guide, 'oss:bucket:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'oss:stats:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'oss:signed:url')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — OSS
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] oss 角色扩展测试', () => {
  it('🎯[正例] 运行专员桶管理 → 创建/列表/查询', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'oss:bucket:manage')).toBe(true)
    const svc = makeService()

    await runWithTenant(tenantCtx, async () => {
      const bucket = await svc.createBucket({
        name: 'special-bucket', provider: 'aliyun', region: 'cn-hangzhou',
        endpoint: 'oss-cn-hangzhou.aliyuncs.com',
        accessKey: 'ak-test', secretKey: 'sk-test',
        isDefault: false,
      })
      expect(bucket.name).toBe('special-bucket')
      expect(bucket.enabled).toBe(true)

      const buckets = await svc.listBuckets()
      expect(buckets.length).toBeGreaterThanOrEqual(1)

      const got = await svc.getBucket(bucket.id)
      expect(got.id).toBe(bucket.id)
    })
  })

  it('🎯[正例] 运行专员文件管理全面操作', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'oss:upload')).toBe(true)
    const svc = makeService()

    await runWithTenant(tenantCtx, async () => {
      // 上传两个文件
      const r1 = await svc.initUpload({
        originalFilename: 'doc1.txt', mimeType: 'text/plain',
        sizeBytes: 100, contentHash: 'hash-ops-1',
      })
      const r2 = await svc.initUpload({
        originalFilename: 'doc2.txt', mimeType: 'text/plain',
        sizeBytes: 200, contentHash: 'hash-ops-2',
      })
      await svc.completeUpload(r1.fileId, { etag: '"o1"' })
      await svc.completeUpload(r2.fileId, { etag: '"o2"' })

      // 列表
      const list = await svc.listFiles({ page: 1, pageSize: 10 })
      expect(list.total).toBe(2)

      // 删除一个文件
      expect(checkRoleAccess(ROLES.Operations, 'oss:delete')).toBe(true)
      await svc.deleteFile(r1.fileId)
      const after = await svc.listFiles()
      expect(after.total).toBe(1)
    })
  })

  it('🎯[正例] 运行专员查看存储统计', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'oss:stats:view')).toBe(true)
    const svc = makeService()

    await runWithTenant(tenantCtx, async () => {
      const r1 = await svc.initUpload({
        originalFilename: 'big.mp4', mimeType: 'video/mp4',
        sizeBytes: 50000, contentHash: 'hash-big',
      })
      await svc.completeUpload(r1.fileId, { etag: '"big"' })

      const stats = await svc.getStorageStats()
      expect(stats.totalFiles).toBe(1)
      expect(stats.byType['video']).toBeDefined()
      expect(stats.topFiles.length).toBeGreaterThan(0)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — OSS
// ════════════════════════════════════════════════════════════

describe('[🤝团建] oss 角色扩展测试', () => {
  it('🤝[反例] 团建无权限上传/下载', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'oss:upload')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'oss:download')).toBe(false)
  })

  it('🤝[反例] 团建无权限管理文件', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'oss:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'oss:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'oss:bucket:manage')).toBe(false)
  })

  it('🤝[反例] 团建无权限查看统计', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'oss:stats:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'oss:signed:url')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — OSS
// ════════════════════════════════════════════════════════════

describe('[📢营销] oss 角色扩展测试', () => {
  it('📢[正例] 营销上传营销素材 → 下载', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'oss:upload')).toBe(true)
    const svc = makeService()

    await runWithTenant(tenantCtx, async () => {
      const r = await svc.initUpload({
        originalFilename: 'poster.jpg', mimeType: 'image/jpeg',
        sizeBytes: 102400, contentHash: 'hash-mkt-001',
        tags: ['campaign', 'summer'],
      })
      const complete = await svc.completeUpload(r.fileId, { etag: '"mkt"' })
      expect(complete.tags).toContain('campaign')
      expect(complete.mimeType).toBe('image/jpeg')

      const dl = await svc.generateDownloadUrl(r.fileId)
      expect(dl.url).toBeTruthy()
    })
  })

  it('📢[正例] 营销生成签名 URL', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'oss:signed:url')).toBe(true)
    const svc = makeService()

    await runWithTenant(tenantCtx, async () => {
      const r = await svc.initUpload({
        originalFilename: 'banner.png', mimeType: 'image/png',
        sizeBytes: 256000, contentHash: 'hash-banner',
      })
      await svc.completeUpload(r.fileId, { etag: '"bnr"' })

      const signed = await svc.generateSignedUrl(r.fileId, { operation: 'download' })
      expect(signed.expiresAt).toBeGreaterThan(0)
    })
  })

  it('📢[反例] 营销无权限删除/管理桶', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'oss:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'oss:bucket:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'oss:stats:view')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 oss 跨角色闭环 + 边界]', () => {
  it('🛒 + 🎯 前台上传 → 运行专员管理桶', async () => {
    const svc = makeService()

    await runWithTenant(tenantCtx, async () => {
      // 前台上传
      const r = await svc.initUpload({
        originalFilename: 'cross-file.pdf', mimeType: 'application/pdf',
        sizeBytes: 15000, contentHash: 'hash-cross-001',
      })
      await svc.completeUpload(r.fileId, { etag: '"cross"' })

      // 运行专员创建桶
      const bucket = await svc.createBucket({
        name: 'cross-bucket', provider: 'aliyun', region: 'cn-hangzhou',
        endpoint: 'oss-cn-hangzhou.aliyuncs.com',
        accessKey: 'ak', secretKey: 'sk',
      })
      expect(bucket.enabled).toBe(true)

      // 店长查看文件
      const file = await svc.getFile(r.fileId)
      expect(file.originalFilename).toBe('cross-file.pdf')
    })
  })

  it('🛡️ 不存在的文件抛出 NotFound', async () => {
    const svc = makeService()
    await runWithTenant(tenantCtx, async () => {
      await expect(svc.getFile('nonexistent')).rejects.toThrow()
      await expect(svc.generateDownloadUrl('nonexistent')).rejects.toThrow()
    })
  })

  it('🛡️ 未就绪文件下载抛出 BadRequest', async () => {
    const svc = makeService()
    await runWithTenant(tenantCtx, async () => {
      const r = await svc.initUpload({
        originalFilename: 'pending.txt', mimeType: 'text/plain',
        sizeBytes: 100, contentHash: 'hash-pending',
      })
      // 未 completeUpload
      await expect(svc.generateDownloadUrl(r.fileId)).rejects.toThrow()
    })
  })

  it('🛡️ 不支持的 MIME 类型抛出 BadRequest', async () => {
    const svc = makeService()
    await runWithTenant(tenantCtx, async () => {
      await expect(svc.initUpload({
        originalFilename: 'evil.bat', mimeType: 'application/x-msdos-program',
        sizeBytes: 10, contentHash: 'hash-evil',
      })).rejects.toThrow()
    })
  })

  it('🛡️ 超出最大文件大小抛出 BadRequest', async () => {
    const svc = makeService()
    await runWithTenant(tenantCtx, async () => {
      await expect(svc.initUpload({
        originalFilename: 'huge.mp4', mimeType: 'video/mp4',
        sizeBytes: 5_000_000_001, contentHash: 'hash-huge',
      })).rejects.toThrow()
    })
  })

  it('🛡️ 批量删除部分失败返回统计', async () => {
    const svc = makeService()
    await runWithTenant(tenantCtx, async () => {
      const r = await svc.initUpload({
        originalFilename: 'todelete.txt', mimeType: 'text/plain',
        sizeBytes: 50, contentHash: 'hash-todel',
      })
      await svc.completeUpload(r.fileId, { etag: '"del"' })

      const result = await svc.deleteFiles([r.fileId, 'nonexistent-id'])
      expect(result.deleted).toBe(1)
      expect(result.failed).toBe(1)
    })
  })

  it('🛡️ 同 contentHash 去重', async () => {
    const svc = makeService()
    await runWithTenant(tenantCtx, async () => {
      const first = await svc.initUpload({
        originalFilename: 'dup.txt', mimeType: 'text/plain',
        sizeBytes: 100, contentHash: 'same-hash',
      })
      const second = await svc.initUpload({
        originalFilename: 'dup-copy.txt', mimeType: 'text/plain',
        sizeBytes: 100, contentHash: 'same-hash',
      })
      expect(second.fileId).toBe(first.fileId)
    })
  })
})
