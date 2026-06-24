import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { PrismaModule } from './prisma.module'
import { PrismaService } from './prisma.service'

const mockPrismaService = {
  $connect: async () => {},
  $disconnect: async () => {},
}

describe('PrismaModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile()

    assert.ok(moduleRef)
  })

  test('should provide and export PrismaService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile()

    const service = moduleRef.get<typeof mockPrismaService>(PrismaService)
    assert.ok(service)
    assert.equal(service, mockPrismaService)
  })

  test('PrismaModule should be decorated with @Global()', () => {
    const metadata = Reflect.getMetadata('__module:global__', PrismaModule)
    assert.ok(metadata !== undefined)
  })
})
