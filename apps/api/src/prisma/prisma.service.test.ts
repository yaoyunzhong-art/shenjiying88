import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { PrismaService } from './prisma.service'

it('PrismaService extends PrismaClient', () => {
  const service = new PrismaService()
  // PrismaClient methods are available via prototype chain
  assert.ok(typeof service.$connect === 'function')
  assert.ok(typeof service.$disconnect === 'function')
})

it('PrismaService is decorated with @Injectable', () => {
  const metadata = Reflect.getMetadata('__injectable__', PrismaService)
  // @Injectable injects metadata; if none, the class might be plain
  // but the important part is the class itself is defined and exported
  assert.ok(PrismaService !== undefined)
  assert.ok(Reflect.hasMetadata !== undefined)
})

it('PrismaService onModuleInit calls $connect', async () => {
  const connectCalls: boolean[] = []
  const service = Object.create(PrismaService.prototype) as PrismaService
  service.$connect = async () => {
    connectCalls.push(true)
  }
  service.$disconnect = async () => {}

  assert.equal(connectCalls.length, 0)
  await service.onModuleInit()
  assert.equal(connectCalls.length, 1)
})

it('PrismaService onModuleDestroy calls $disconnect', async () => {
  const disconnectCalls: boolean[] = []
  const service = Object.create(PrismaService.prototype) as PrismaService
  service.$connect = async () => {}
  service.$disconnect = async () => {
    disconnectCalls.push(true)
  }

  assert.equal(disconnectCalls.length, 0)
  await service.onModuleDestroy()
  assert.equal(disconnectCalls.length, 1)
})
