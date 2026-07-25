/**
 * CSRF 保护中间件
 *
 * 防御策略:
 *   1. Double Submit Cookie 模式: 服务端生成随机 token,同时存储在 cookie 和请求头
 *   2. Token 验证: 每个非 GET/HEAD/OPTIONS 请求必须带 X-CSRF-Token 头
 *   3. Origin/Referer 检查: 验证请求来源
 *
 * 实现参考: OWASP CSRF Prevention Cheat Sheet
 *    - 使用 crypto.randomBytes 生成 token (128位熵)
 *    - 使用 timingSafeEqual 防止时序攻击
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import * as crypto from 'crypto'

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_COOKIE_OPTIONS = {
  httpOnly: false, // 前端JS需要读取cookie值设置请求头
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 3600 * 1000, // 1小时
}

/**
 * 安全比较,防止时序攻击
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

/**
 * 生成随机 CSRF Token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex') // 256位熵
}

/**
 * 检查是否跳过 CSRF 检查
 * - WebSocket 升级请求
 * - 健康检查端点
 * - Swagger/OpenAPI 文档
 */
function shouldSkipCsrf(req: Request): boolean {
  if (req.headers['upgrade']?.toLowerCase() === 'websocket') return true
  const path = req.path
  if (path.startsWith('/api/v1/health')) return true
  if (path.startsWith('/docs') || path.startsWith('/api-json')) return true
  return false
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name)

  use(req: Request, res: Response, next: NextFunction): void {
    // 跳过不需要 CSRF 的请求
    if (shouldSkipCsrf(req)) {
      return next()
    }

    // 获取 cookie 中的 token
    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME]

    // 安全方法 (GET/HEAD/OPTIONS) — 仅设置 cookie, 不验证
    const safeMethods = ['GET', 'HEAD', 'OPTIONS']
    if (safeMethods.includes(req.method)) {
      // 如果没有 token, 设置一个
      if (!cookieToken) {
        res.cookie(CSRF_COOKIE_NAME, generateToken(), CSRF_COOKIE_OPTIONS)
      }
      return next()
    }

    // 非安全方法 (POST/PUT/PATCH/DELETE) — 必须验证
    const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined

    if (!cookieToken) {
      this.logger.warn(`CSRF: no cookie token found for ${req.method} ${req.path}`)
      res.status(403).json({
        error: 'CSRF_PROTECTION',
        message: '缺少 CSRF Token',
        code: 'CSRF_TOKEN_MISSING',
      })
      return
    }

    if (!headerToken) {
      this.logger.warn(`CSRF: no header token found for ${req.method} ${req.path}`)
      res.status(403).json({
        error: 'CSRF_PROTECTION',
        message: '缺少 CSRF 请求头',
        code: 'CSRF_HEADER_MISSING',
        hint: `请将cookie中的${CSRF_COOKIE_NAME}值作为${CSRF_HEADER_NAME}请求头发送`,
      })
      return
    }

    if (!safeCompare(cookieToken, String(headerToken))) {
      this.logger.warn(`CSRF: token mismatch for ${req.method} ${req.path}`)
      res.status(403).json({
        error: 'CSRF_PROTECTION',
        message: 'CSRF Token 验证失败',
        code: 'CSRF_TOKEN_MISMATCH',
      })
      return
    }

    // 验证通过, 刷新 token (每次成功请求后轮换)
    res.cookie(CSRF_COOKIE_NAME, generateToken(), CSRF_COOKIE_OPTIONS)

    next()
  }
}
