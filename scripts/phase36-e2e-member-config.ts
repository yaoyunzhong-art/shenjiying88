#!/usr/bin/env tsx
/**
 * scripts/phase36-e2e-member-config.ts · Phase-36 T166-1 Member 配置中心 E2E
 *
 * 验证 8 项 AC (Acceptance Criteria):
 *  AC-1  MemberConfig interface 8 字段完整
 *  AC-2  配置覆盖所有决策 (D1-D5)
 *  AC-3  service 接口 (get/update/threshold/points-rate)
 *  AC-4  配置持久化 (in-memory store)
 *  AC-5  admin-web 配置界面存在
 *  AC-6  反模式库 v4 命中 (tsx-decorator + async-try-catch)
 *  AC-7  测试覆盖 ≥ 10 断言 (member-config.test.ts)
 *  AC-8  race-safe commit 友好 (R-06 防御)
 *
 * 用法:
 *   tsx scripts/phase36-e2e-member-config.ts
 *
 * 退出码: 0 = 8/8 PASS, 1 = FAIL
 */

// ─── 动态导入 ───
async function loadModules() {
  const cfg = await import('../apps/api/src/modules/member/member-config.js').catch(() =>
    import('../apps/api/src/modules/member/member-config.ts' as any)
  )
  return { cfg }
}

interface TestResult {
  ac: string
  pass: boolean
  message: string
}

const results: TestResult[] = []

function assert(ac: string, pass: boolean, message: string) {
  results.push({ ac, pass, message })
  const icon = pass ? '✅' : '❌'
  console.log(`${icon} ${ac}: ${message}`)
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Phase-36 T166-1 Member 配置中心 E2E · 8 AC Validation')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')

  const { cfg } = await loadModules()
  const { MemberConfigService, DEFAULT_MEMBER_CONFIG } = cfg

  // ─── AC-1: MemberConfig interface 8 字段完整 ───
  try {
    const requiredFields = [
      'points.earnRate', 'points.redeemRate', 'points.enabled', 'points.expiryDays',
      'levels.thresholds',
      'lifecycle.dormantDays', 'lifecycle.churnedDays',
      'phoneUniqueScope', 'crossTenantEnabled'
    ]
    const c = DEFAULT_MEMBER_CONFIG
    const present =
      c.points !== undefined &&
      c.points.earnRate !== undefined &&
      c.points.redeemRate !== undefined &&
      c.points.enabled !== undefined &&
      c.points.expiryDays !== undefined &&
      c.levels?.thresholds !== undefined &&
      c.lifecycle?.dormantDays !== undefined &&
      c.lifecycle?.churnedDays !== undefined &&
      c.phoneUniqueScope !== undefined &&
      c.crossTenantEnabled !== undefined
    assert('AC-1', present, `MemberConfig interface ${requiredFields.length} 字段完整`)
  } catch (e) {
    assert('AC-1', false, `interface 检查失败: ${(e as Error).message}`)
  }

  // ─── AC-2: 配置覆盖所有决策 (D1-D5) ───
  try {
    const svc = new MemberConfigService()
    const c = svc.getConfig()
    const checks = [
      ['D3 earnRate=1', c.points.earnRate === 1],
      ['D3 redeemRate=100', c.points.redeemRate === 100],
      ['D2 SILVER=500', c.levels.thresholds.SILVER === 500],
      ['D2 GOLD=2000', c.levels.thresholds.GOLD === 2000],
      ['D2 PLATINUM=10000', c.levels.thresholds.PLATINUM === 10000],
      ['D2 DIAMOND=50000', c.levels.thresholds.DIAMOND === 50000],
      ['D4 dormantDays=90', c.lifecycle.dormantDays === 90],
      ['D1 phoneUniqueScope=global', c.phoneUniqueScope === 'global'],
      ['D5 crossTenantEnabled=true', c.crossTenantEnabled === true]
    ]
    const allPass = checks.every(([_, p]) => p)
    const summary = checks.map(([n]) => n).join(' + ')
    assert('AC-2', allPass, `覆盖 D1-D5 决策 (${summary})`)
  } catch (e) {
    assert('AC-2', false, `D1-D5 决策检查失败: ${(e as Error).message}`)
  }

  // ─── AC-3: service 接口完整 ───
  try {
    const svc = new MemberConfigService()
    const methods = [
      typeof svc.getConfig === 'function',
      typeof svc.updateConfig === 'function',
      typeof svc.getThreshold === 'function',
      typeof svc.getPointsRate === 'function'
    ]
    assert('AC-3', methods.every(m => m), `service 4 接口完整 (getConfig/updateConfig/getThreshold/getPointsRate)`)
  } catch (e) {
    assert('AC-3', false, `service 接口检查失败: ${(e as Error).message}`)
  }

  // ─── AC-4: 配置持久化 (in-memory + 热更新) ───
  try {
    const svc = new MemberConfigService()
    // 修改前
    const before = svc.getConfig().points.earnRate
    // 热更新
    svc.updateConfig({ points: { earnRate: 5 } }, 'admin', 'test')
    // 修改后立即生效
    const after = svc.getConfig().points.earnRate
    assert('AC-4', before === 1 && after === 5, `配置热更新生效 (${before} → ${after})`)
  } catch (e) {
    assert('AC-4', false, `持久化测试失败: ${(e as Error).message}`)
  }

  // ─── AC-5: admin-web 配置界面存在 ───
  try {
    const fs = await import('fs/promises')
    const pagePath = 'apps/admin-web/app/member/config/page.tsx'
    const content = await fs.readFile(pagePath, 'utf-8')
    const hasForm = content.includes('handleSave') && content.includes('积分比例')
    const hasFields = content.includes('earnRate') && content.includes('redeemRate')
    assert('AC-5', hasForm && hasFields, `admin-web 配置界面 ${pagePath} 存在 + 表单 + 字段`)
  } catch (e) {
    assert('AC-5', false, `admin-web 界面检查失败: ${(e as Error).message}`)
  }

  // ─── AC-6: 反模式库 v4 命中 ───
  try {
    const fs = await import('fs/promises')
    const controllerContent = await fs.readFile(
      'apps/api/src/modules/member/member-config.controller.ts',
      'utf-8'
    )
    const hasNest = controllerContent.includes('@Controller') || controllerContent.includes('@Injectable')
    const hasTryCatch = controllerContent.includes('try {') && controllerContent.includes('} catch')
    assert('AC-6', hasNest && hasTryCatch, `反模式 v4 命中 (tsx-decorator: ${hasNest}, async-try-catch: ${hasTryCatch})`)
  } catch (e) {
    assert('AC-6', false, `反模式 v4 检查失败: ${(e as Error).message}`)
  }

  // ─── AC-7: 测试覆盖 ≥ 10 断言 ───
  try {
    const fs = await import('fs/promises')
    const testContent = await fs.readFile(
      'apps/api/src/modules/member/member-config.test.ts',
      'utf-8'
    )
    const testCount = (testContent.match(/^test\(/gm) || []).length
    assert('AC-7', testCount >= 10, `member-config.test.ts 有 ${testCount} 个 test() 断言 (要求 ≥10)`)
  } catch (e) {
    assert('AC-7', false, `测试覆盖检查失败: ${(e as Error).message}`)
  }

  // ─── AC-8: race-safe commit 友好 ───
  try {
    const fs = await import('fs/promises')
    // 文件大小 + 集中度 (避免 race-safe V2 auto-stash wipe)
    const files = [
      'apps/api/src/modules/member/member-config.ts',
      'apps/api/src/modules/member/member-config.controller.ts',
      'apps/api/src/modules/member/member-config.test.ts',
      'apps/admin-web/app/member/config/page.tsx'
    ]
    const stats = await Promise.all(
      files.map(async (f) => {
        try {
          const s = await fs.stat(f)
          return { file: f, size: s.size, exists: true }
        } catch {
          return { file: f, size: 0, exists: false }
        }
      })
    )
    const allExist = stats.every(s => s.exists)
    const allNonZero = stats.every(s => s.size > 0)
    assert('AC-8', allExist && allNonZero, `4 关键文件齐全非零 (${stats.map(s => `${s.file.split('/').pop()}=${s.size}B`).join(', ')})`)
  } catch (e) {
    assert('AC-8', false, `race-safe 检查失败: ${(e as Error).message}`)
  }

  // ─── 汇总 ───
  console.log('')
  console.log('═══════════════════════════════════════════════════════════')
  const passCount = results.filter(r => r.pass).length
  const failCount = results.filter(r => !r.pass).length
  console.log(`  ${passCount}/${results.length} PASS · ${failCount} FAIL`)
  console.log('═══════════════════════════════════════════════════════════')

  if (failCount > 0) {
    console.log('')
    console.log('失败项:')
    results.filter(r => !r.pass).forEach(r => console.log(`  ❌ ${r.ac}: ${r.message}`))
    process.exit(1)
  }

  console.log('')
  console.log('🎯 Phase-36 T166-1 Member 配置中心 E2E · 8/8 PASS')
  process.exit(0)
}

main().catch((err) => {
  console.error('E2E 脚本异常:', err)
  process.exit(1)
})
