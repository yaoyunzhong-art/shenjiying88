import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'

const PRISMA_DIR = path.resolve(__dirname, '../../prisma')
const SCHEMA_PATH = path.join(PRISMA_DIR, 'schema.prisma')
const MIGRATIONS_DIR = path.join(PRISMA_DIR, 'migrations')

const REQUIRED_FINANCE_TABLES = [
  'invoice_v2',
  'finance_ledger',
  'finance_account',
  'finance_settlement',
  'finance_report',
  'finance_report_export',
] as const

function readMigrationSqlFiles(): string {
  const entries = fs.readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(MIGRATIONS_DIR, entry.name, 'migration.sql'))
    .filter((filePath) => fs.existsSync(filePath))
    .map((filePath) => fs.readFileSync(filePath, 'utf8'))
    .join('\n')
}

describe('finance prisma migration audit', () => {
  it('schema.prisma 应声明 finance 核心模型映射', () => {
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8')

    assert.match(schema, /model InvoiceV2\s*\{[\s\S]*@@map\("invoice_v2"\)/)
    assert.match(schema, /model FinanceLedger\s*\{[\s\S]*@@map\("finance_ledger"\)/)
    assert.match(schema, /model FinanceAccount\s*\{[\s\S]*@@map\("finance_account"\)/)
    assert.match(schema, /model FinanceSettlement\s*\{[\s\S]*@@map\("finance_settlement"\)/)
    assert.match(schema, /model FinanceReport\s*\{[\s\S]*@@map\("finance_report"\)/)
    assert.match(schema, /model FinanceReportExport\s*\{[\s\S]*@@map\("finance_report_export"\)/)
  })

  it('migrations 应覆盖 finance 核心表落表 SQL', () => {
    const migrationSql = readMigrationSqlFiles()

    for (const tableName of REQUIRED_FINANCE_TABLES) {
      assert.match(
        migrationSql,
        new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? "${tableName}"`),
        `missing migration SQL for table ${tableName}`,
      )
    }
  })
})
