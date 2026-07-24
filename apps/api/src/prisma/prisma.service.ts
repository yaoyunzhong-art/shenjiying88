/**
 * prisma.service.ts — Prisma 客户端封装
 *
 * 🐜 V20: 安全基线修复 — 注册 RLS Prisma 中间件
 *   - 在 onModuleInit 中应用 createRlsExtension()
 *   - 实现数据库层 tenantId 自动注入（安全基线 #3）
 */

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { createRlsExtension } from '../modules/rls/rls.middleware-prisma'

const SHOULD_LOG_INIT_DEBUG = process.env.DEBUG_INIT_LOGS === '1'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if (SHOULD_LOG_INIT_DEBUG) {
      console.log('[debug:init] PrismaService.onModuleInit begin')
    }

    // 🐜 V20: 应用 RLS $extends 扩展 — 数据库层 tenantId 自动注入
    // Prisma v6 中 $extends 返回新 client 实例，
    // 此处将扩展 client 的所有 model 操作混入当前实例。
    try {
      const extended = this.$extends(createRlsExtension())
      this._mixinExtendedMethods(extended)
    } catch (err) {
      // 开发环境允许 $extends 失败（Prisma client 可能未生成）
      if (process.env.NODE_ENV === 'production') {
        throw err
      }
      console.warn(
        `[PrismaService] RLS extension skipped (dev mode): ${(err as Error).message}`,
      )
    }

    try {
      await this.$connect()
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        throw error
      }
      console.warn(
        `[PrismaService] dev-mode connect skipped: ${(error as Error).message}`,
      )
      return
    }
    if (SHOULD_LOG_INIT_DEBUG) {
      console.log('[debug:init] PrismaService.onModuleInit end')
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }

  /**
   * 将扩展 client 上的模型操作方法混入当前实例。
   * Prisma v6 $extends 返回新 client，为保持单例引用一致性，
   * 只替换每个模型的操作方法（findMany / create 等）。
   */
  private _mixinExtendedMethods(extended: any): void {
    for (const key of Object.keys(this)) {
      if (key.startsWith('$')) continue
      const modelDelegate = (this as Record<string, unknown>)[key]
      const extDelegate = (extended as Record<string, unknown>)[key]
      if (!modelDelegate || !extDelegate || typeof modelDelegate !== 'object' || typeof extDelegate !== 'object') continue
      const mutableDelegate = modelDelegate as Record<string, unknown>
      const sourceDelegate = extDelegate as Record<string, unknown>

      // 只替换模型操作函数
      const ops = [
        'findUnique', 'findMany', 'findFirst',
        'create', 'createMany', 'upsert',
        'update', 'updateMany',
        'delete', 'deleteMany',
        'aggregate', 'count', 'groupBy',
      ]
      for (const op of ops) {
        if (typeof sourceDelegate[op] === 'function') {
          mutableDelegate[op] = sourceDelegate[op]
        }
      }
    }
  }
}
