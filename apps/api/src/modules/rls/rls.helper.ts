/**
 * rls.helper.ts — RLS 策略生成与执行助手
 *
 * 职责：
 *   - 生成 RLS 状态查询、启用、策略创建 SQL
 *   - 通过 PrismaService 执行 raw SQL
 *   - 验证 tenantId 过滤是否正确生效
 *
 * 🐜 V17: P-31 RLS Extension
 */

import { Injectable } from '@nestjs/common'

export interface RlsStatusEntry {
  schemaname: string
  tablename: string
  rowsecurity: boolean
  forcerowsecurity: boolean
  policyname: string | null
}

export interface RlsTableInfo {
  schemaname: string
  tablename: string
  rlsEnabled: boolean
  forceRls: boolean
  policies: string[]
}

/**
 * 生成查询当前 RLS 状态的 SQL。
 * 指定 tableName 则查单表，否则查所有表。
 */
export function generateRlsStatusSql(tableName?: string): string {
  if (tableName) {
    tableName = sanitizeTableName(tableName)
    return `
      SELECT
        n.nspname AS schemaname,
        c.relname AS tablename,
        c.relrowsecurity AS rowsecurity,
        c.relforcerowsecurity AS forcerowsecurity,
        p.policyname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN LATERAL (
        SELECT polname AS policyname
        FROM pg_policy
        WHERE polrelid = c.oid
      ) p ON TRUE
      WHERE c.relkind = 'r'
        AND c.relname = '${tableName}'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY n.nspname, c.relname, p.policyname
    `.trim()
  }

  return `
    SELECT
      n.nspname AS schemaname,
      c.relname AS tablename,
      c.relrowsecurity AS rowsecurity,
      c.relforcerowsecurity AS forcerowsecurity,
      p.policyname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN LATERAL (
      SELECT polname AS policyname
      FROM pg_policy
      WHERE polrelid = c.oid
    ) p ON TRUE
    WHERE c.relkind = 'r'
      AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY n.nspname, c.relname, p.policyname
  `.trim()
}

/**
 * 生成启用 RLS 的 SQL。
 * @param tableName 表名（不含 schema 前缀，默认 public）
 */
export function generateEnableRlsSql(tableName: string): string {
  const sanitized = sanitizeTableName(tableName)
  return `ALTER TABLE "public"."${sanitized}" ENABLE ROW LEVEL SECURITY`
}

/**
 * 生成强制 RLS 的 SQL (阻止全表扫描绕过 policy)。
 */
export function generateForceRlsSql(tableName: string): string {
  const sanitized = sanitizeTableName(tableName)
  return `ALTER TABLE "public"."${sanitized}" FORCE ROW LEVEL SECURITY`
}

/**
 * 生成创建 tenantId 隔离策略的 SQL。
 *
 * 典型 policy:
 *   CREATE POLICY tenant_isolation ON "<schema>"."<table>"
 *     FOR ALL
 *     USING (tenant_id = current_setting('app.tenant_id')::text)
 *     WITH CHECK (tenant_id = current_setting('app.tenant_id')::text)
 *
 * @param tableName   表名
 * @param policyName  策略名（默认 tenant_isolation）
 * @param tenantColumn tenantId 列名（默认 tenantId）
 * @param schema      模式名（默认 public）
 */
export function generateCreatePolicySql(
  tableName: string,
  policyName: string = 'tenant_isolation',
  tenantColumn: string = 'tenantId',
  schema: string = 'public'
): string {
  const t = sanitizeTableName(tableName)
  const s = sanitizeTableName(schema)
  const col = sanitizeColumnName(tenantColumn)

  return `
    CREATE POLICY "${policyName}" ON "${s}"."${t}"
      FOR ALL
      USING (${col} = current_setting('app.tenant_id')::text)
      WITH CHECK (${col} = current_setting('app.tenant_id')::text)
  `.trim()
}

/**
 * 生成删除指定策略的 SQL。
 */
export function generateDropPolicySql(
  tableName: string,
  policyName: string = 'tenant_isolation',
  schema: string = 'public'
): string {
  const t = sanitizeTableName(tableName)
  const s = sanitizeTableName(schema)
  return `DROP POLICY IF EXISTS "${policyName}" ON "${s}"."${t}"`
}

/**
 * 生成验证 tenantId 过滤的 SQL：
 * 测试 `current_setting('app.tenant_id')` 隔离效果。
 * 返回 0 行说明 filter 正确。
 */
export function generateVerifyTenantFilterSql(
  tableName: string,
  tenantId: string,
  tenantColumn: string = 'tenantId',
  schema: string = 'public'
): string {
  const t = sanitizeTableName(tableName)
  const s = sanitizeTableName(schema)
  const col = sanitizeColumnName(tenantColumn)
  const safeTenantId = sanitizeLiteral(tenantId)

  return `
    SELECT COUNT(*)::int AS leaked_rows
    FROM "${s}"."${t}"
    WHERE ${col} IS NOT NULL
      AND ${col} != '${safeTenantId}'
  `.trim()
}

/**
 * 生成测试 RLS 策略生效的 SQL：
 * 设置 app.tenant_id → 查询当前用户数据量。配合 verifyTenantFilter 可验证隔离。
 */
export function generatePolicyTestSql(
  tableName: string,
  tenantColumn: string = 'tenantId',
  schema: string = 'public'
): string {
  const t = sanitizeTableName(tableName)
  const s = sanitizeTableName(schema)
  const col = sanitizeColumnName(tenantColumn)

  return `
    SELECT COUNT(*)::int AS visible_rows
    FROM "${s}"."${t}"
    WHERE ${col} = current_setting('app.tenant_id')::text
  `.trim()
}

// ─── 安全工具函数 ───────────────────────────────────────────────

function sanitizeTableName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 128)
}

function sanitizeColumnName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 128)
}

function sanitizeLiteral(value: string): string {
  // 对 SQL 字面量做简单转义（单引号翻倍）
  return value.replace(/'/g, "''").slice(0, 256)
}

/**
 * SQL 安全校验：检查表名/列名是否合法（避免 SQL 注入）
 */
export function validateName(name: string, kind: 'table' | 'column'): boolean {
  const regex = /^[a-zA-Z][a-zA-Z0-9_]{0,127}$/
  return regex.test(name)
}

// ─── 服务类（通过 Prisma 执行 SQL） ────────────────────────────

@Injectable()
export class RlsService {
  constructor(private readonly prisma: any) {} // PrismaService injected

  /**
   * 查询 RLS 状态。指定 tableName 则返回单表信息，否则返回全部。
   */
  async getStatus(tableName?: string): Promise<RlsTableInfo[]> {
    const sql = generateRlsStatusSql(tableName)
    const rows: RlsStatusEntry[] = await this.prisma.$queryRawUnsafe(sql)
    return consolidateRlsStatus(rows)
  }

  /**
   * 为指定表启用 RLS。
   */
  async enableRls(tableName: string): Promise<void> {
    if (!validateName(tableName, 'table')) {
      throw new Error(`Invalid table name: ${tableName}`)
    }
    const sql = generateEnableRlsSql(tableName)
    await this.prisma.$executeRawUnsafe(sql)
  }

  /**
   * 为指定表强制 RLS。
   */
  async forceRls(tableName: string): Promise<void> {
    if (!validateName(tableName, 'table')) {
      throw new Error(`Invalid table name: ${tableName}`)
    }
    const sql = generateForceRlsSql(tableName)
    await this.prisma.$executeRawUnsafe(sql)
  }

  /**
   * 为指定表创建 tenantId 隔离策略。
   */
  async createPolicy(
    tableName: string,
    policyName?: string,
    tenantColumn?: string,
    schema?: string
  ): Promise<void> {
    if (!validateName(tableName, 'table')) {
      throw new Error(`Invalid table name: ${tableName}`)
    }
    const col = tenantColumn ?? 'tenantId'
    if (!validateName(col, 'column')) {
      throw new Error(`Invalid column name: ${col}`)
    }
    const sql = generateCreatePolicySql(tableName, policyName, col, schema)
    await this.prisma.$executeRawUnsafe(sql)
  }

  /**
   * 删除指定策略。
   */
  async dropPolicy(
    tableName: string,
    policyName?: string,
    schema?: string
  ): Promise<void> {
    if (!validateName(tableName, 'table')) {
      throw new Error(`Invalid table name: ${tableName}`)
    }
    const sql = generateDropPolicySql(tableName, policyName, schema)
    await this.prisma.$executeRawUnsafe(sql)
  }

  /**
   * 验证 tenantId 过滤：返回可能泄露的行数。
   */
  async verifyTenantFilter(
    tableName: string,
    tenantId: string,
    tenantColumn?: string,
    schema?: string
  ): Promise<{ leakedRows: number }> {
    if (!validateName(tableName, 'table')) {
      throw new Error(`Invalid table name: ${tableName}`)
    }
    const col = tenantColumn ?? 'tenantId'
    const sql = generateVerifyTenantFilterSql(tableName, tenantId, col, schema)
    const result: Array<{ leaked_rows: number }> = await this.prisma.$queryRawUnsafe(sql)
    const leakedRows = result[0]?.leaked_rows ?? -1
    return { leakedRows }
  }

  /**
   * 完整启用 RLS + 创建策略 + 强制 RLS（一键设置）。
   */
  async setupTenantIsolation(
    tableName: string,
    tenantColumn?: string,
    policyName?: string,
    schema?: string
  ): Promise<{ enabled: boolean; policyCreated: boolean; forced: boolean }> {
    const col = tenantColumn ?? 'tenantId'
    const pn = policyName ?? 'tenant_isolation'
    const sc = schema ?? 'public'

    await this.enableRls(tableName)

    // 先删除同名旧策略避免冲突
    await this.dropPolicy(tableName, pn, sc).catch(() => {})

    await this.createPolicy(tableName, pn, col, sc)
    await this.forceRls(tableName)

    return { enabled: true, policyCreated: true, forced: true }
  }
}

// ─── 辅助函数 ───────────────────────────────────────────────────

function consolidateRlsStatus(rows: RlsStatusEntry[]): RlsTableInfo[] {
  const map = new Map<string, RlsTableInfo>()

  for (const row of rows) {
    const key = `${row.schemaname}.${row.tablename}`
    if (!map.has(key)) {
      map.set(key, {
        schemaname: row.schemaname,
        tablename: row.tablename,
        rlsEnabled: row.rowsecurity,
        forceRls: row.forcerowsecurity,
        policies: [],
      })
    }
    const entry = map.get(key)!
    if (row.policyname) {
      entry.policies.push(row.policyname)
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.schemaname !== b.schemaname) return a.schemaname.localeCompare(b.schemaname)
    return a.tablename.localeCompare(b.tablename)
  })
}
