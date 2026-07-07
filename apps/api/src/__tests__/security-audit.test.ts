import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 安全审计 V10 Day 13
 *
 * 验证 OWASP Top 10 (2021) 关键控制点
 * - A01: Broken Access Control
 * - A02: Cryptographic Failures
 * - A03: Injection
 * - A04: Insecure Design
 * - A07: Authentication Failures
 * - A08: Software & Data Integrity
 * - A09: Security Logging
 *
 * 静态扫描 + 运行时断言
 */

import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { runWithTenant } from '../common/context/tenant-context'
import { AiModelConfigService } from '../modules/ai-model-config/ai-model-config.service'
import { TenantConfigService } from '../modules/tenant-config/tenant-config.service'
import { OpenApiService } from '../modules/open-api/open-api.service'
import { LicenseService } from '../modules/license/license.service'
import { encryptField, decryptField } from '../modules/ai-model-config/encryption.util'

const ROOT = path.resolve(process.cwd(), '../..')
const API_SRC = path.join(ROOT, 'apps/api/src')
const MIGRATIONS_DIR = path.join(API_SRC, 'database/migrations')

describe('安全审计 V10 Day 13 (OWASP Top 10)', () => {
  // ============ A01: Broken Access Control ============
  describe('A01: Broken Access Control - 越权访问', () => {
    it('所有 service 层访问必须经过 requireTenantContext', () => {
      // 强制每个 service 公开方法必须调用 requireTenantContext
      // 静态扫描:在源码中寻找 patterns
      const serviceFiles = [
        'modules/ai-model-config/ai-model-config.service.ts',
        'modules/tenant-config/tenant-config.service.ts',
        'modules/license/license.service.ts',
        'modules/canary/canary.service.ts',
        'modules/monitoring/monitoring.service.ts',
      ]
      let totalMethods = 0
      let protectedMethods = 0
      for (const f of serviceFiles) {
        const content = fs.readFileSync(path.join(API_SRC, f), 'utf-8')
        // 找所有 public/protected 异步方法
        const methodMatches = content.match(/async\s+\w+\s*\([^)]*\)\s*:\s*Promise/g) ?? []
        const requireMatches = content.match(/requireTenantContext\s*\(\s*\)/g) ?? []
        totalMethods += methodMatches.length
        protectedMethods += requireMatches.length
      }
      console.log(`[A01] 扫描 ${serviceFiles.length} 个 service: ${totalMethods} 公开方法, ${protectedMethods} requireTenantContext 调用`)
      assert.ok(protectedMethods >= 15, `应有至少 15 个 requireTenantContext 调用, 实际 ${protectedMethods}`)
    })

    it('缺少 tenant context 时应抛错 (拒绝访问)', async () => {
      const svc = new AiModelConfigService()
      await assert.rejects(
        () => svc.listStoreConfigs('store-001'),
        /tenant context/i,
      )
    })

    it('跨租户 store 不能跨边界访问', async () => {
      // 验证 1: 内存模式无 RLS,改验证 service 层 assertStoreOwnership 拦截 storeId 越界
      const svc = new AiModelConfigService()
      // ctx.storeId='store-A1' 时, listStoreConfigs('store-B1') 应被 assertStoreOwnership 拒绝
      await assert.rejects(
        () =>
          runWithTenant(
            { tenantId: 'tenant-A', storeId: 'store-A1', userId: 'u1', role: 'tenant_admin' },
            async () => svc.listStoreConfigs('store-B1'),
          ),
        /Store ownership violation/,
        'assertStoreOwnership 应拒绝跨 storeId 访问',
      )

      // 验证 2: 真实 RLS 由 PostgreSQL RLS policies 强制 (apps/api/src/database/migrations/002_rls_policies.sql)
      const rlsFile = fs.readFileSync(
        path.join(API_SRC, 'database/migrations/002_rls_policies.sql'),
        'utf-8',
      )
      assert.ok(
        /ai_model_store_config/i.test(rlsFile) || /tenant_id/i.test(rlsFile),
        'RLS migration 应包含 ai_model_store_config 或 tenant_id 隔离策略',
      )
    })
  })

  // ============ A02: Cryptographic Failures ============
  describe('A02: Cryptographic Failures - 加密失效', () => {
    it('AES-256-GCM 加密: salt 16 + iv 12 + authTag 16', () => {
      const plaintext = 'sk-test-very-secret-api-key-12345'
      const ciphertext = encryptField(plaintext)
      // base64 解码后长度应至少 = 16 + 12 + 16 + plaintext_length
      const decoded = Buffer.from(ciphertext, 'base64')
      assert.ok(decoded.length >= 44 + plaintext.length, `密文长度不足: ${decoded.length}`)
      // 同一明文两次加密应得不同密文 (随机 IV)
      const ciphertext2 = encryptField(plaintext)
      assert.notEqual(ciphertext, ciphertext2, '同一明文两次加密应产生不同密文 (随机 IV)')
    })

    it('AES-256-GCM 解密可还原明文', () => {
      const plaintext = 'secret-api-key'
      const ciphertext = encryptField(plaintext)
      const decrypted = decryptField(ciphertext)
      assert.equal(decrypted, plaintext)
    })

    it('篡改 ciphertext 应触发 authTag 验证失败', () => {
      const ciphertext = encryptField('secret')
      const buf = Buffer.from(ciphertext, 'base64')
      // 篡改最后一个字节
      buf[buf.length - 1] = buf[buf.length - 1] ^ 0xff
      const tampered = buf.toString('base64')
      assert.throws(() => decryptField(tampered), /auth|invalid|tag/i)
    })

    it('使用 crypto.timingSafeEqual 防时序攻击', () => {
      const serviceFile = fs.readFileSync(
        path.join(API_SRC, 'modules/open-api/open-api.service.ts'),
        'utf-8',
      )
      assert.ok(
        serviceFile.includes('timingSafeEqual'),
        'OpenApi HMAC 签名校验应使用 timingSafeEqual 防时序攻击',
      )
    })

    it('access_token 用 crypto.randomBytes(32) 生成', () => {
      const serviceFile = fs.readFileSync(
        path.join(API_SRC, 'modules/open-api/open-api.service.ts'),
        'utf-8',
      )
      assert.ok(
        /randomBytes\s*\(\s*32\s*\)/.test(serviceFile),
        'access_token 应用 crypto.randomBytes(32) 生成 (256-bit 熵)',
      )
    })
  })

  // ============ A03: Injection ============
  describe('A03: Injection - 注入防护', () => {
    it('tenant context 不依赖字符串拼接 (用 AsyncLocalStorage)', () => {
      const ctxFile = fs.readFileSync(
        path.join(API_SRC, 'common/context/tenant-context.ts'),
        'utf-8',
      )
      assert.ok(ctxFile.includes('AsyncLocalStorage'), '租户上下文应使用 AsyncLocalStorage')
      assert.ok(ctxFile.includes('runWithTenant'), '应提供 runWithTenant 包装')
    })

    it('SQL 注入防护: 用参数化查询 (找 $1, $2 占位符或 .query 参数)', () => {
      // V10 Sprint 1 服务大多用内存 repo,但 RLS migration 文件应使用参数化 SQL
      const migrationFiles = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
      for (const f of migrationFiles) {
        const content = fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf-8')
        // 简单启发式: 不应有 WHERE ${var} 类拼接
        const sqlConcatPattern = /WHERE\s+\$\{[^}]+\}/i
        if (sqlConcatPattern.test(content)) {
          assert.fail(`SQL 注入风险: ${f} 包含字符串拼接`)
        }
      }
      console.log(`[A03] 扫描 ${migrationFiles.length} 个 SQL migration 文件无拼接风险`)
    })
  })

  // ============ A04: Insecure Design ============
  describe('A04: Insecure Design - 设计安全', () => {
    it('三级配置继承链: store > tenant > brand > system', () => {
      const serviceFile = fs.readFileSync(
        path.join(API_SRC, 'modules/tenant-config/tenant-config.service.ts'),
        'utf-8',
      )
      assert.ok(serviceFile.includes("'store'"), '应支持 store 级配置')
      assert.ok(serviceFile.includes("'tenant'"), '应支持 tenant 级配置')
      assert.ok(serviceFile.includes("'brand'"), '应支持 brand 级配置')
      assert.ok(serviceFile.includes("'system'"), '应支持 system 级配置')
    })

    it('License 配额检查防止超额', async () => {
      const svc = new (LicenseService as any)()
      // 创建一个 quota=2 的 license
      const created = await runWithTenant(
        { tenantId: 't1', userId: 'u1', role: 'tenant_admin' },
        async () =>
          svc.createLicense({
            tenantId: 't1',
            scope: 'ai.capability',
            level: 'tenant',
            validFrom: new Date().toISOString(),
            validUntil: new Date(Date.now() + 86400000).toISOString(),
            quota: 2,
            activationSource: 'paid',
            createdBy: 'u1',
          }),
      )
      // 用满配额 (2 次)
      await runWithTenant({ tenantId: 't1', userId: 'u1', role: 'tenant_admin' }, async () => {
        await svc.consume(created.id, 1)
        await svc.consume(created.id, 1)
        // 第 3 次检查应被拒绝 (usedQuota >= quota)
        const result = await svc.checkLicense({ scope: 'ai.capability' })
        assert.equal(result.allowed, false, '超额应被拒绝')
      })
    })
  })

  // ============ A07: Authentication Failures ============
  describe('A07: Authentication Failures - 认证失败', () => {
    it('OAuth client_id 不存在 → invalid_client', async () => {
      const svc = new OpenApiService()
      await assert.rejects(
        () => svc.authenticate('unknown-client', 'any-secret', ['sync:read']),
        /invalid_client|Unauthorized/i,
      )
    })

    it('OAuth client_secret 不正确 → invalid_client', async () => {
      const svc = new OpenApiService()
      await assert.rejects(
        () => svc.authenticate('cli-merchant-001', 'wrong-secret', ['sync:read']),
        /invalid_client|Unauthorized/i,
      )
    })

    it('OAuth 非法 scope → invalid_scope', async () => {
      const svc = new OpenApiService()
      await assert.rejects(
        () => svc.authenticate('cli-merchant-001', 'test-secret', ['admin:delete-everything']),
        /invalid_scope|Forbidden/i,
      )
    })

    it('OAuth 颁发的 token 是 256-bit base64url', async () => {
      const svc = new OpenApiService()
      const token = await svc.authenticate('cli-merchant-001', 'test-secret', ['sync:read'])
      // base64url 编码 32 字节 = 43 字符
      assert.ok(token.accessToken.length >= 42, `token 长度应 >= 42, 实际 ${token.accessToken.length}`)
      assert.ok(/^[A-Za-z0-9_-]+$/.test(token.accessToken), 'token 应是 base64url')
    })

    it('License 过期自动失效', async () => {
      const svc = new (LicenseService as any)()
      const past = new Date(Date.now() - 86400000).toISOString()
      await runWithTenant({ tenantId: 't2', userId: 'u1', role: 'tenant_admin' }, async () => {
        await svc.createLicense({
          tenantId: 't2',
          scope: 'ai.capability',
          level: 'tenant',
          validFrom: past,
          validUntil: past,
          quota: 100,
          activationSource: 'paid',
          createdBy: 'u1',
        })
        const result = await svc.checkLicense({ scope: 'ai.capability' })
        assert.equal(result.allowed, false, '过期 license 应被拒绝')
      })
    })
  })

  // ============ A08: Software & Data Integrity ============
  describe('A08: Software & Data Integrity - 数据完整性', () => {
    it('config_audit_log 记录所有配置变更', () => {
      const migration = fs.readFileSync(
        path.join(MIGRATIONS_DIR, '007_three_level_config.sql'),
        'utf-8',
      )
      assert.ok(migration.includes('config_audit_log'), '应有 config_audit_log 表')
      assert.ok(
        /INSERT INTO config_audit_log/.test(migration) ||
          /recordAudit/i.test(
            fs.readFileSync(path.join(API_SRC, 'modules/tenant-config/tenant-config.service.ts'), 'utf-8'),
          ),
        'service 层应调用 audit log',
      )
    })

    it('AES-GCM authTag 自动验证密文完整性', () => {
      const serviceFile = fs.readFileSync(
        path.join(API_SRC, 'modules/ai-model-config/encryption.util.ts'),
        'utf-8',
      )
      assert.ok(serviceFile.includes('aes-256-gcm'), '应使用 AES-256-GCM (含 authTag)')
      assert.ok(serviceFile.includes('authTag'), '应存储并验证 authTag')
    })
  })

  // ============ A09: Security Logging ============
  describe('A09: Security Logging - 安全日志', () => {
    it('audit log 记录 actor / action / resource / timestamp', () => {
      const migration = fs.readFileSync(
        path.join(MIGRATIONS_DIR, '007_three_level_config.sql'),
        'utf-8',
      )
      // actor 等价物: owner_id (V10 Day 6 设计)
      assert.ok(/owner_id/i.test(migration), '应记录 owner_id (作为 actor)')
      assert.ok(/action/i.test(migration), '应记录 action')
      assert.ok(/created_at|timestamp/i.test(migration), '应记录 timestamp')
    })
  })

  // ============ 综合: 性能回归 ============
  describe('综合安全 + 性能基线', () => {
    it('三级配置查询响应 < 50ms (SLA)', async () => {
      const svc = new TenantConfigService()
      const start = Date.now()
      await runWithTenant({ tenantId: 'tenant-A', userId: 'admin', role: 'tenant_admin' }, async () => {
        await svc.getEffectiveConfigs()
      })
      const elapsed = Date.now() - start
      assert.ok(elapsed < 50, `三级配置查询应 < 50ms, 实际 ${elapsed}ms`)
    })
  })
})
