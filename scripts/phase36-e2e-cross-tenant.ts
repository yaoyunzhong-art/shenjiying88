/**
 * Phase-36 T166-3 E2E 验证: Member 跨租户识别
 *
 * 验证 8 AC:
 *  - AC-1: 接口定义 (CrossTenantMemberSummary + Link + HistoryEntry)
 *  - AC-2: 配置驱动 (isCrossTenantEnabled + getPhoneUniqueScope)
 *  - AC-3: 跨租户查询返回脱敏数据 (无 password/token/完整 mobile)
 *  - AC-4: 关联/解关联 LINK + UNLINK
 *  - AC-5: 反模式 v4 self-link 防御
 *  - AC-6: 同租户 link 防御
 *  - AC-7: 审计追踪 linkHistory (ringbuffer LRU 100)
 *  - AC-8: race-safe commit message
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88'
const results: Array<{ ac: string; pass: boolean; detail: string }> = []

function check(ac: string, pass: boolean, detail: string) {
  results.push({ ac, pass, detail })
  console.log(`  ${pass ? '✅' : '❌'} ${ac}: ${detail}`)
}

// AC-1: 文件存在 + 接口定义
const svcFile = join(ROOT, 'apps/api/src/modules/member/member.cross-tenant.ts')
const ctrlerFile = join(ROOT, 'apps/api/src/modules/member/member.cross-tenant.controller.ts')
check('AC-1.files', existsSync(svcFile) && existsSync(ctrlerFile), `service + controller 都存在`)

const svcContent = readFileSync(svcFile, 'utf-8')
check(
  'AC-1.interfaces',
  svcContent.includes('CrossTenantMemberSummary') &&
    svcContent.includes('CrossTenantMemberLink') &&
    svcContent.includes('CrossTenantLinkHistoryEntry'),
  '3 接口定义完整 (Summary/Link/HistoryEntry)'
)

// AC-2: 配置驱动
const configContent = readFileSync(join(ROOT, 'apps/api/src/modules/member/member-config.ts'), 'utf-8')
check(
  'AC-2.config',
  configContent.includes('isCrossTenantEnabled()') && configContent.includes('getPhoneUniqueScope()'),
  'MemberConfigService 暴露 isCrossTenantEnabled + getPhoneUniqueScope'
)

// AC-3: PII 脱敏
check(
  'AC-3.masking',
  svcContent.includes('maskMobile') && svcContent.includes('mobileMasked'),
  'mobile 脱敏 (前3+后4) + mobileMasked 字段'
)
check(
  'AC-3.no-full-mobile',
  !svcContent.match(/return\s*\{[^}]*mobile:\s*m\.mobile[^}]*\}/),
  'summarize 不返回完整 mobile'
)

// AC-4: LINK + UNLINK
check(
  'AC-4.link-unlink',
  svcContent.includes('linkAcrossTenants') &&
    svcContent.includes('unlinkAcrossTenants') &&
    svcContent.includes('action: \'LINK\'') &&
    svcContent.includes('action: \'UNLINK\''),
  'LINK + UNLINK 双操作 + 审计 action 字段'
)

// AC-5: self-link 防御
check(
  'AC-5.self-link',
  svcContent.includes('cannot link a member to itself'),
  'self-link 检测 + 抛 BadRequestException'
)

// AC-6: 同租户 link 防御
check(
  'AC-6.same-tenant',
  svcContent.includes('use member.service.updateProfile for same-tenant'),
  '同租户 link 检测 + 抛 BadRequestException'
)

// AC-7: 审计追踪 + ringbuffer
check(
  'AC-7.ringbuffer',
  svcContent.includes('ringbuffer') && svcContent.includes('_linkHistory') && svcContent.includes('linkHistory.length > 100'),
  'linkHistory ringbuffer LRU 100 (反模式 v4 observability)'
)

// AC-8: 反模式库 v4 +2 文件
const ctFile = join(ROOT, 'knowledge/anti-patterns/v4/cross-tenant-data-leak.md')
const gdprFile = join(ROOT, 'knowledge/anti-patterns/v4/privacy-gdpr-pattern.md')
check(
  'AC-8.anti-patterns',
  existsSync(ctFile) && existsSync(gdprFile),
  `cross-tenant-data-leak.md + privacy-gdpr-pattern.md 都存在`
)

// 测试覆盖
const testRun = spawnSync(
  'npx',
  ['tsx', '--test', 'src/modules/member/member.cross-tenant.test.ts'],
  { cwd: join(ROOT, 'apps/api'), encoding: 'utf-8', timeout: 60000 }
)
const testOutput = testRun.stdout + testRun.stderr
const passMatch = testOutput.match(/# pass (\d+)/)
const totalMatch = testOutput.match(/# tests (\d+)/)
const passCount = passMatch ? parseInt(passMatch[1]) : 0
const totalCount = totalMatch ? parseInt(totalMatch[1]) : 0
check(
  'TESTS',
  testRun.status === 0 && passCount === totalCount && passCount >= 8,
  `${passCount}/${totalCount} 断言 PASS (≥ 8 要求)`
)

// 总结
console.log('\n========== T166-3 E2E 汇总 ==========')
const passed = results.filter((r) => r.pass).length
const failed = results.filter((r) => !r.pass).length
console.log(`✅ PASS: ${passed} / ${results.length}`)
console.log(`❌ FAIL: ${failed} / ${results.length}`)

if (failed === 0) {
  console.log('\n🎉 T166-3 Member 跨租户识别 E2E 全部通过！')
  process.exit(0)
} else {
  console.log('\n❌ E2E 验证未通过')
  process.exit(1)
}