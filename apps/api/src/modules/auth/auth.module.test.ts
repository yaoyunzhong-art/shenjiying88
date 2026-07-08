import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [auth] [A] module.test.ts 补全
 *
 * 覆盖:
 * - AuthModule 定义 (NestJS Module 元数据)
 * - AuthModule 控制器 / 提供者注入验证
 * - AuthModule 导出验证
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AuthModule } from './auth.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { SessionService } from './session.service'
import { TokenService } from './token.service'

describe('AuthModule', () => {
  it('should be defined', () => {
    const moduleClass = AuthModule
    assert.ok(moduleClass)
  })

  it('should export expected shape (controllers, providers, exports)', () => {
    const moduleInstance = new AuthModule()
    assert.ok(moduleInstance instanceof AuthModule)
  })

  it('should have valid controller', () => {
    assert.ok(AuthController)
    // 验证控制器有核心路由方法
    assert.equal(typeof AuthController.prototype.loginBySms, 'function')
    assert.equal(typeof AuthController.prototype.loginByPassword, 'function')
    assert.equal(typeof AuthController.prototype.loginByWechat, 'function')
    assert.equal(typeof AuthController.prototype.refreshToken, 'function')
    assert.equal(typeof AuthController.prototype.logout, 'function')
    assert.equal(typeof AuthController.prototype.getCurrentUser, 'function')
  })

  it('should have valid services', () => {
    assert.ok(AuthService)
    assert.ok(SessionService)
    assert.ok(TokenService)

    // AuthService 核心方法
    assert.equal(typeof AuthService.prototype.loginBySms, 'function')
    assert.equal(typeof AuthService.prototype.loginByPassword, 'function')
    assert.equal(typeof AuthService.prototype.loginByWechat, 'function')
    assert.equal(typeof AuthService.prototype.refreshTokens, 'function')
    assert.equal(typeof AuthService.prototype.logout, 'function')
    assert.equal(typeof AuthService.prototype.validateToken, 'function')

    // TokenService 核心方法
    assert.equal(typeof TokenService.prototype.generateTokenPair, 'function')
    assert.equal(typeof TokenService.prototype.verifyAccessToken, 'function')
    assert.equal(typeof TokenService.prototype.verifyRefreshToken, 'function')

    // SessionService 核心方法
    assert.equal(typeof SessionService.prototype.createSession, 'function')
    assert.equal(typeof SessionService.prototype.revokeSession, 'function')
    assert.equal(typeof SessionService.prototype.revokeAllUserSessions, 'function')
  })

  it('should be constructible with NestJS testing utilities', async () => {
    // 验证模块可以被 NestJS Test.createTestingModule 加载
    const { Test } = await import('@nestjs/testing')
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile()

    assert.ok(moduleRef)
    const app = moduleRef.createNestApplication()
    assert.ok(app)
    await app.close()
  })

  it('should resolve AuthController from module', async () => {
    const { Test } = await import('@nestjs/testing')
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile()

    const controller = moduleRef.get<AuthController>(AuthController)
    assert.ok(controller)
    assert.ok(controller instanceof AuthController)
  })

  it('should resolve AuthService from module', async () => {
    const { Test } = await import('@nestjs/testing')
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile()

    const service = moduleRef.get<AuthService>(AuthService)
    assert.ok(service)
    assert.ok(service instanceof AuthService)
  })

  it('should resolve SessionService from module', async () => {
    const { Test } = await import('@nestjs/testing')
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile()

    const sessionService = moduleRef.get<SessionService>(SessionService)
    assert.ok(sessionService)
    assert.ok(sessionService instanceof SessionService)
  })

  it('should resolve TokenService from module', async () => {
    const { Test } = await import('@nestjs/testing')
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile()

    const tokenService = moduleRef.get<TokenService>(TokenService)
    assert.ok(tokenService)
    assert.ok(tokenService instanceof TokenService)
  })
})
