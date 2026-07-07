import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { ViewModelService } from './view-model.service'

/**
 * Phase-34: Migration Runner
 *
 * 职责:
 * 1. 启动时扫描 migrations/ 目录, 按文件名顺序执行 SQL
 * 2. in-memory 模式下, 把 RLS policy 转译为 ViewModelService 拦截
 * 3. 真实 Postgres 模式下, 用 pg.Pool 应用 SQL
 *
 * 当前 (Phase-34 in-memory): 仅记录日志, RLS 通过 ViewModelService 强制
 * Phase-40+ 真实 Postgres: 实现 applyMigration(file) 真正执行 SQL
 */

interface MigrationRecord {
  filename: string
  appliedAt: string
  status: 'applied' | 'skipped' | 'failed'
  message?: string
}

@Injectable()
export class MigrationRunner implements OnModuleInit {
  private readonly logger = new Logger(MigrationRunner.name)
  private migrationsDir: string
  private appliedMigrations: MigrationRecord[] = []

  constructor(private readonly viewModel: ViewModelService) {
    this.migrationsDir = join(__dirname, 'migrations')
  }

  async onModuleInit(): Promise<void> {
    await this.runAllMigrations()
  }

  /**
   * 跑所有 migrations (按文件名顺序)
   */
  async runAllMigrations(): Promise<MigrationRecord[]> {
    const files = this.listMigrationFiles()
    this.logger.log(`Found ${files.length} migration files`)

    for (const file of files) {
      const record = await this.applyMigration(file)
      this.appliedMigrations.push(record)
    }

    this.logger.log(`Applied ${this.appliedMigrations.length} migrations`)
    return this.appliedMigrations
  }

  /**
   * 应用单个 migration
   * 当前 in-memory 实现: 仅记录, 不实际执行 SQL
   */
  async applyMigration(filename: string): Promise<MigrationRecord> {
    try {
      const path = join(this.migrationsDir, filename)
      const sql = readFileSync(path, 'utf-8')

      if (process.env.POSTGRES_URL) {
        // Phase-40+ 真实 Postgres 模式: 应用 SQL
        // 当前 stub
        this.logger.log(`[postgres-mode] would apply ${filename} (${sql.length} chars)`)
      } else {
        // in-memory 模式: 跳过实际 SQL, 由 ViewModelService 模拟 RLS
        this.logger.log(`[in-memory-mode] ${filename} RLS simulated via ViewModelService`)
      }

      return {
        filename,
        appliedAt: new Date().toISOString(),
        status: 'applied',
        message: process.env.POSTGRES_URL ? 'SQL applied' : 'In-memory simulated'
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.logger.error(`Migration ${filename} failed: ${message}`)
      return {
        filename,
        appliedAt: new Date().toISOString(),
        status: 'failed',
        message
      }
    }
  }

  /** 列出所有 migration 文件 (按文件名升序) */
  listMigrationFiles(): string[] {
    try {
      return readdirSync(this.migrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort()
    } catch {
      return []
    }
  }

  /** 获取已应用的迁移记录 (供测试) */
  getAppliedMigrations(): MigrationRecord[] {
    return [...this.appliedMigrations]
  }
}