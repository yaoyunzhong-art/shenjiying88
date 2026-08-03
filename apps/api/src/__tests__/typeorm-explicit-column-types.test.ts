import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const API_SRC_ROOT = path.resolve(process.cwd(), 'src')

const STARTUP_ENTITY_FILES = [
  'modules/cashier/cashier.entity.ts',
  'modules/session/session.entity.ts',
  'modules/auth/auth.entity.ts',
  'modules/rbac/rbac.entity.ts',
  'modules/lowcode/lowcode.entity.ts',
  'modules/lowcode/lowcode-page.entity.ts',
  'modules/ops-manual/ops-manual.entity.ts',
  'modules/license-renewal/entities/license-renewal-record.entity.ts',
  'modules/license-renewal/entities/renewal-notification.entity.ts',
  'modules/license-package/entities/license-package.entity.ts',
  'modules/content/content.entity.ts',
  'modules/audit/audit.entity.ts',
  'modules/coupon/coupon.entity.ts',
  'modules/coupon/coupon-redemption-log.entity.ts',
]

const MOUNTED_TYPEORM_ENTITY_FILES = [
  'modules/cashier/cashier.entity.ts',
  'modules/ops-manual/ops-manual.entity.ts',
  'modules/license-renewal/entities/license-renewal-record.entity.ts',
  'modules/license-renewal/entities/renewal-notification.entity.ts',
  'modules/license-package/entities/license-package.entity.ts',
  'modules/coupon/coupon.entity.ts',
  'modules/coupon/coupon-redemption-log.entity.ts',
  'modules/audit/audit.entity.ts',
]

function findRiskyColumnBlocks(source: string) {
  const columnBlocks = source.match(/@Column\(\{[\s\S]*?\}\)/g) ?? []

  return columnBlocks.filter((block) => {
    if (block.includes('type:')) {
      return false
    }

    return (
      block.includes('length:') ||
      block.includes('default:') ||
      block.includes('unique: true')
    )
  })
}

test('startup entities use explicit column types for risky TypeORM columns', () => {
  const violations: string[] = []

  for (const relativeFile of STARTUP_ENTITY_FILES) {
    const absoluteFile = path.join(API_SRC_ROOT, relativeFile)
    const source = fs.readFileSync(absoluteFile, 'utf-8')
    const riskyBlocks = findRiskyColumnBlocks(source)

    if (riskyBlocks.length > 0) {
      violations.push(`${relativeFile}\n${riskyBlocks.join('\n---\n')}`)
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Found risky @Column declarations without explicit type:\n${violations.join('\n\n')}`,
  )
})

test('mounted TypeORM entity files are covered by the startup guard list', () => {
  const missingFiles = MOUNTED_TYPEORM_ENTITY_FILES.filter(
    (file) => !STARTUP_ENTITY_FILES.includes(file),
  )

  assert.deepEqual(
    missingFiles,
    [],
    `Mounted TypeORM entity files missing from startup guard:\n${missingFiles.join('\n')}`,
  )
})
